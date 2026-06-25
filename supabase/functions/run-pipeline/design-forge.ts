// Design Forge — generates ONE branded graphic per drop via the Gemini image API
// (gemini-2.5-flash-image, aka "Nano Banana"). Exactly one generation per drop; that
// single design is composited onto all four product baselines downstream. Returns the
// raw image bytes, or null on any failure (missing key, quota, safety block) so the
// caller can fall back to the procedural SVG generator and never break the loop.

import type { DropCopy, Trend } from "./types.ts";

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

export async function forgeDesign(
  trend: Trend,
  copy: DropCopy,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) {
    console.warn("[design-forge] missing GEMINI_API_KEY — using SVG fallback");
    return null;
  }

  const prompt =
    `Die-cut sticker emblem inspired by "${trend.keyword}", featuring the bold phrase ` +
    `"${copy.slogan}". Retro pixel-art style, vivid high-contrast colors, thick clean ` +
    `outline, centered composition. Place it on a flat, perfectly uniform solid-color ` +
    `background — no texture, no gradient, no drop shadow, no product, no people, no mockup. ` +
    `Square image.`;

  let res: Response;
  try {
    res = await fetch(ENDPOINT(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
  } catch (e) {
    console.error("[design-forge] request error:", e instanceof Error ? e.message : e);
    return null;
  }
  if (!res.ok) {
    console.error("[design-forge] gemini failed:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p?.inlineData ?? p?.inline_data;
    if (inline?.data) {
      try {
        return {
          bytes: decodeBase64(inline.data),
          contentType: inline.mimeType ?? inline.mime_type ?? "image/png",
        };
      } catch (e) {
        console.error("[design-forge] base64 decode failed:", e instanceof Error ? e.message : e);
        return null;
      }
    }
  }
  console.error("[design-forge] no image in gemini response");
  return null;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
