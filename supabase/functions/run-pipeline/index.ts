// run-pipeline — Pixellato's autonomous drop factory.
// One run = one trend branded across 4 items (tee, tote, mug, cap) = one drop.
// Each new drop hard-replaces the previous drop's products + their Storage images.
// Triggered by pg_cron (and callable manually).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { discoverTrends } from "./trend-discovery.ts";
import { craftDropCopy } from "./copy-crafter.ts";
import { forgePixelArt } from "./pixel-forge.ts";
import { forgeDesign } from "./design-forge.ts";
import { compositeOnMockup } from "./mockup-forge.ts";
import type { ProductType, Trend } from "./types.ts";

const BUCKET = "product-images";
const MIN_SECONDS_BETWEEN_RUNS = 30;

const ITEMS: Array<{ type: ProductType; label: string; priceCents: number }> = [
  { type: "tshirt", label: "Tee", priceCents: 2499 },
  { type: "tote", label: "Tote", priceCents: 2299 },
  { type: "mug", label: "Mug", priceCents: 1999 },
  { type: "cap", label: "Cap", priceCents: 2199 },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "drop";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ ok: false, error: "Missing Supabase env in function runtime" }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: config } = await admin
    .from("shop_config")
    .select("is_pipeline_enabled, last_run_at")
    .eq("id", 1)
    .maybeSingle();

  if (config && config.is_pipeline_enabled === false) return json({ ok: true, skipped: "pipeline disabled" });
  if (config?.last_run_at) {
    const elapsed = (Date.now() - new Date(config.last_run_at).getTime()) / 1000;
    if (elapsed < MIN_SECONDS_BETWEEN_RUNS) return json({ ok: true, skipped: `throttled (${Math.round(elapsed)}s)` });
  }

  let runId: string | undefined;
  try {
    // 1) Trend Scout — pick a trend, skipping recently used terms (not just the last one).
    const trends = await discoverTrends();
    if (trends.length === 0) return json({ ok: false, error: "no trends discovered" }, 502);

    const RECENT_DROP_LIMIT = 8;
    const { data: recentRuns } = await admin
      .from("generation_runs")
      .select("trend_id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(RECENT_DROP_LIMIT);

    const recentTerms = new Set<string>();
    if (recentRuns?.length) {
      const trendIds = [...new Set(recentRuns.map((r) => r.trend_id).filter(Boolean))] as string[];
      if (trendIds.length > 0) {
        const { data: recentTrendRows } = await admin.from("trends").select("term").in("id", trendIds);
        for (const row of recentTrendRows ?? []) recentTerms.add(row.term);
      }
    }

    const eligible = trends.filter((t) => !recentTerms.has(t.keyword));
    const pool = eligible.length > 0 ? eligible : trends;
    // Random pick among the top few eligible trends — avoids ping-pong between two sticky headlines.
    const chosen: Trend = pool[Math.floor(Math.random() * Math.min(4, pool.length))] ?? pool[0];

    const { data: trendRow, error: trendErr } = await admin
      .from("trends")
      .insert({
        source: chosen.source,
        term: chosen.keyword,
        score: chosen.popularityScore,
        region: "US",
        metadata: { title: chosen.title, url: chosen.url ?? null, category: chosen.category, external_id: chosen.id, short_context: chosen.shortContext },
        fetched_at: chosen.detectedAt,
      })
      .select("id")
      .single();
    if (trendErr) throw new Error(`trend insert: ${trendErr.message}`);
    const trendId = trendRow.id as string;

    const others = trends.filter((t) => t.id !== chosen.id).slice(0, 9);
    if (others.length > 0) {
      await admin.from("trends").insert(
        others.map((t) => ({
          source: t.source,
          term: t.keyword,
          score: t.popularityScore,
          region: "US",
          metadata: { title: t.title, url: t.url ?? null, category: t.category, external_id: t.id },
          fetched_at: t.detectedAt,
        })),
      );
    }

    const { data: runRow, error: runErr } = await admin
      .from("generation_runs")
      .insert({ trend_id: trendId, status: "trend_scout" })
      .select("id")
      .single();
    if (runErr) throw new Error(`run insert: ${runErr.message}`);
    runId = runRow.id as string;
    const dropSeed = `${runId}-${Date.now().toString(36).slice(-4)}`;

    await admin.from("agent_logs").insert({
      generation_run_id: runId,
      agent_name: "trend_scout",
      input: { discovered: trends.length },
      output: { chosen: { keyword: chosen.keyword, source: chosen.source, score: chosen.popularityScore } },
    });

    // 2) Copy Crafter — one shared theme for the whole drop.
    const copyStart = Date.now();
    const copy = craftDropCopy(chosen, dropSeed);
    await admin.from("generation_runs").update({ status: "copy_crafter" }).eq("id", runId);
    await admin.from("agent_logs").insert({
      generation_run_id: runId,
      agent_name: "copy_crafter",
      input: { keyword: chosen.keyword },
      output: { ...copy },
      duration_ms: Date.now() - copyStart,
    });

    // 3) Pixel Forge — one SVG per item; upload all; build product rows.
    const forgeStart = Date.now();
    await admin.from("generation_runs").update({ status: "pixel_forge" }).eq("id", runId);
    const base = slugify(chosen.keyword);
    const suffix = Date.now().toString(36).slice(-4);

    const design = await forgeDesign(chosen, copy, dropSeed);
    const forgePath = design ? "gemini" : "svg-fallback";

    const rows: Record<string, unknown>[] = [];
    const images: string[] = [];
    for (const item of ITEMS) {
      const slug = `${base}-${item.type}-${suffix}`;

      let bytes: Uint8Array;
      let contentType: string;
      let storagePath: string;
      let palette: string[] = [];

      let composed = false;
      if (design) {
        try {
          const m = await compositeOnMockup(design.bytes, item.type, slug);
          bytes = m.bytes;
          contentType = m.contentType;
          storagePath = m.storagePath;
          composed = true;
        } catch (e) {
          console.error(`[run-pipeline] composite (${item.type}) failed, SVG fallback:`, e instanceof Error ? e.message : e);
        }
      }
      if (!composed) {
        const forged = forgePixelArt(chosen, copy.slogan, item.type, slug, dropSeed);
        bytes = new TextEncoder().encode(forged.svg);
        contentType = "image/svg+xml";
        storagePath = forged.storagePath;
        palette = forged.palette;
      }

      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(storagePath!, bytes!, { contentType: contentType!, upsert: true });
      if (upErr) throw new Error(`storage upload (${item.type}): ${upErr.message}`);
      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(storagePath!);
      images.push(pub.publicUrl);
      rows.push({
        generation_run_id: runId,
        trend_id: trendId,
        slug,
        name: `${copy.theme} ${item.label}`,
        title: `${copy.theme} ${item.label}`,
        slogan: copy.slogan,
        description: copy.description,
        product_type: item.type,
        category: item.type,
        image_url: pub.publicUrl,
        image_storage_path: storagePath!,
        pixel_palette: palette,
        price_cents: item.priceCents,
        price: Number((item.priceCents / 100).toFixed(2)),
        currency: "USD",
        status: "live",
        featured: item.type === "tshirt",
        published_at: new Date().toISOString(),
        release_time: new Date().toISOString(),
      });
    }

    const { data: inserted, error: prodErr } = await admin.from("products").insert(rows).select("id, slug");
    if (prodErr) throw new Error(`product insert: ${prodErr.message}`);

    await admin.from("agent_logs").insert({
      generation_run_id: runId,
      agent_name: "pixel_forge",
      input: { items: ITEMS.map((i) => i.type) },
      output: { images, path: forgePath, design_model: design ? "gemini-2.5-flash-image" : null },
      duration_ms: Date.now() - forgeStart,
    });

    // 4) Evict the previous drop — delete its products + Storage images (best effort).
    let evicted = 0;
    try {
      const { data: olds } = await admin
        .from("products")
        .select("id, image_storage_path")
        .or(`generation_run_id.is.null,generation_run_id.neq.${runId}`);
      const oldRows = olds ?? [];
      const paths = oldRows.map((o: { image_storage_path: string | null }) => o.image_storage_path).filter(Boolean) as string[];
      if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);
      const ids = oldRows.map((o: { id: string }) => o.id);
      if (ids.length > 0) {
        await admin.from("products").delete().in("id", ids);
        evicted = ids.length;
      }
    } catch (evErr) {
      console.error("[run-pipeline] eviction warning:", evErr instanceof Error ? evErr.message : evErr);
    }

    await admin.from("generation_runs").update({ status: "published", completed_at: new Date().toISOString() }).eq("id", runId);
    await admin.from("shop_config").update({ last_run_at: new Date().toISOString() }).eq("id", 1);

    return json({
      ok: true,
      drop: { trend: chosen.keyword, theme: copy.theme, items: (inserted ?? []).map((p: { slug: string }) => p.slug), evicted },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[run-pipeline] failed:", message);
    if (runId) {
      await admin.from("generation_runs").update({ status: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", runId);
    }
    return json({ ok: false, error: message }, 500);
  }
});
