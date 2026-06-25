// run-pipeline — Pixellato's autonomous drop factory.
// Trend Scout -> Copy Crafter -> Pixel Forge -> a live product "drop".
// Triggered by pg_cron (and callable manually). Uses the service-role key that
// Supabase injects into Edge Functions, so it can write past RLS.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { discoverTrends } from "./trend-discovery.ts";
import { craftCopy } from "./copy-crafter.ts";
import { forgePixelArt } from "./pixel-forge.ts";
import type { Trend } from "./types.ts";

const BUCKET = "product-images";
const RECENT_WINDOW_HOURS = 6;
const MIN_SECONDS_BETWEEN_RUNS = 30; // throttle accidental/abusive double-fires

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "drop";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json({ ok: false, error: "Missing Supabase env in function runtime" }, 500);
  }
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Respect shop config: pause switch + lightweight throttle.
  const { data: config } = await admin
    .from("shop_config")
    .select("is_pipeline_enabled, last_run_at")
    .eq("id", 1)
    .maybeSingle();

  if (config && config.is_pipeline_enabled === false) {
    return json({ ok: true, skipped: "pipeline disabled" });
  }
  if (config?.last_run_at) {
    const elapsed = (Date.now() - new Date(config.last_run_at).getTime()) / 1000;
    if (elapsed < MIN_SECONDS_BETWEEN_RUNS) {
      return json({ ok: true, skipped: `throttled (${Math.round(elapsed)}s since last run)` });
    }
  }

  let runId: string | undefined;
  try {
    // 1) Trend Scout
    const trends = await discoverTrends();
    if (trends.length === 0) return json({ ok: false, error: "no trends discovered" }, 502);

    // Avoid re-dropping a keyword we already used recently.
    const sinceIso = new Date(Date.now() - RECENT_WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data: recent } = await admin
      .from("products")
      .select("slug")
      .gte("created_at", sinceIso);
    const recentBases = new Set((recent ?? []).map((r: { slug: string }) => r.slug.replace(/-[a-z0-9]{1,5}$/, "")));

    const chosen: Trend =
      trends.find((t) => !recentBases.has(slugify(t.keyword))) ?? trends[0];

    // Persist trends (chosen first so we can link it).
    const { data: trendRow, error: trendErr } = await admin
      .from("trends")
      .insert({
        source: chosen.source,
        term: chosen.keyword,
        score: chosen.popularityScore,
        region: "US",
        metadata: {
          title: chosen.title,
          url: chosen.url ?? null,
          category: chosen.category,
          external_id: chosen.id,
          short_context: chosen.shortContext,
        },
        fetched_at: chosen.detectedAt,
      })
      .select("id")
      .single();
    if (trendErr) throw new Error(`trend insert: ${trendErr.message}`);
    const trendId = trendRow.id as string;

    // Best-effort: store the rest of the batch for the agent console / history.
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

    await admin.from("agent_logs").insert({
      generation_run_id: runId,
      agent_name: "trend_scout",
      input: { discovered: trends.length },
      output: { chosen: { keyword: chosen.keyword, source: chosen.source, score: chosen.popularityScore } },
    });

    // 2) Copy Crafter
    const copyStart = Date.now();
    const copy = craftCopy(chosen);
    await admin.from("generation_runs").update({ status: "copy_crafter" }).eq("id", runId);
    await admin.from("agent_logs").insert({
      generation_run_id: runId,
      agent_name: "copy_crafter",
      input: { keyword: chosen.keyword },
      output: { ...copy },
      duration_ms: Date.now() - copyStart,
    });

    // 3) Pixel Forge
    const forgeStart = Date.now();
    const baseSlug = slugify(chosen.keyword);
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    const forged = forgePixelArt(chosen, copy, slug);
    await admin.from("generation_runs").update({ status: "pixel_forge" }).eq("id", runId);

    const bytes = new TextEncoder().encode(forged.svg);
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(forged.storagePath, bytes, { contentType: "image/svg+xml", upsert: true });
    if (upErr) throw new Error(`storage upload: ${upErr.message}`);
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(forged.storagePath);
    const imageUrl = pub.publicUrl;

    await admin.from("agent_logs").insert({
      generation_run_id: runId,
      agent_name: "pixel_forge",
      input: { slogan: copy.slogan, productType: copy.productType },
      output: { image_url: imageUrl, palette: forged.palette },
      duration_ms: Date.now() - forgeStart,
    });

    // 4) Publish the drop (storefront reads these columns)
    const { data: product, error: prodErr } = await admin
      .from("products")
      .insert({
        generation_run_id: runId,
        trend_id: trendId,
        slug,
        name: copy.name,
        title: copy.name,
        slogan: copy.slogan,
        description: copy.description,
        product_type: copy.productType,
        category: copy.productType,
        image_url: imageUrl,
        image_storage_path: forged.storagePath,
        pixel_palette: forged.palette,
        price_cents: copy.priceCents,
        price: Number((copy.priceCents / 100).toFixed(2)),
        currency: "USD",
        status: "live",
        featured: chosen.popularityScore >= 85,
        published_at: new Date().toISOString(),
        release_time: new Date().toISOString(),
      })
      .select("id, slug")
      .single();
    if (prodErr) throw new Error(`product insert: ${prodErr.message}`);

    await admin
      .from("generation_runs")
      .update({ status: "published", completed_at: new Date().toISOString() })
      .eq("id", runId);
    await admin.from("shop_config").update({ last_run_at: new Date().toISOString() }).eq("id", 1);

    return json({
      ok: true,
      drop: { id: product.id, slug: product.slug, name: copy.name, trend: chosen.keyword, image_url: imageUrl },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[run-pipeline] failed:", message);
    if (runId) {
      await admin
        .from("generation_runs")
        .update({ status: "failed", error_message: message, completed_at: new Date().toISOString() })
        .eq("id", runId);
    }
    return json({ ok: false, error: message }, 500);
  }
});
