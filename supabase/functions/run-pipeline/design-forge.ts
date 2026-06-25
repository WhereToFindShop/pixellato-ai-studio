// Design Forge — generates ONE branded graphic per drop via the Higgsfield API.
// Async queue: submit -> poll status until completed. Returns a design image URL, or
// null on any failure (missing keys, no credits, timeout, nsfw) so the caller can fall
// back to the procedural SVG generator and never break the autonomous loop.

import type { DropCopy, Trend } from "./types.ts";

const BASE = "https://platform.higgsfield.ai";
const MODEL = "higgsfield-ai/soul/standard"; // flagship text-to-image
const POLL_MS = 3000;
const TIMEOUT_MS = 110_000; // stay under the edge function wall-clock limit

export async function forgeDesign(trend: Trend, copy: DropCopy): Promise<{ url: string } | null> {
  const key = Deno.env.get("HIGGSFIELD_API_KEY");
  const secret = Deno.env.get("HIGGSFIELD_API_SECRET");
  if (!key || !secret) {
    console.warn("[design-forge] missing HIGGSFIELD_API_KEY/SECRET — using SVG fallback");
    return null;
  }
  const auth = `Key ${key}:${secret}`; // Higgsfield auth format: Key <id>:<secret>

  const prompt =
    `Bold retro pixel-art emblem inspired by "${trend.keyword}", featuring the phrase ` +
    `"${copy.slogan}". Centered sticker-style graphic on a plain flat neutral background, ` +
    `high contrast, crisp pixel edges, no mockup, no product, no people.`;

  let submit: Response;
  try {
    submit = await fetch(`${BASE}/${MODEL}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ prompt, aspect_ratio: "1:1", resolution: "1080p" }),
    });
  } catch (e) {
    console.error("[design-forge] submit error:", e instanceof Error ? e.message : e);
    return null;
  }
  if (!submit.ok) {
    console.error("[design-forge] submit failed:", submit.status, await submit.text().catch(() => ""));
    return null; // 403 not_enough_credits lands here -> SVG fallback
  }
  const { request_id } = await submit.json().catch(() => ({}));
  if (!request_id) {
    console.error("[design-forge] no request_id in submit response");
    return null;
  }

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const s = await fetch(`${BASE}/requests/${request_id}/status`, {
      headers: { Authorization: auth, Accept: "application/json" },
    }).catch(() => null);
    if (!s || !s.ok) continue;
    const data = await s.json().catch(() => ({}));
    if (data.status === "completed") {
      const url = data.images?.[0]?.url;
      if (typeof url === "string") return { url };
      console.error("[design-forge] completed but no image url");
      return null;
    }
    if (data.status === "failed" || data.status === "nsfw") {
      console.error("[design-forge] generation", data.status);
      return null;
    }
    // queued | in_progress -> keep polling
  }
  console.error("[design-forge] timed out after", TIMEOUT_MS, "ms");
  return null;
}
