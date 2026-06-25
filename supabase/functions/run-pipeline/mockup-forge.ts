// Mockup Forge — composites the generated design onto a real product baseline photo.
// Pure-WASM ImageScript so it runs in the Deno edge runtime (sharp does NOT).
// Baselines live in the public `baseline-mockups` Storage bucket (fetched by URL) so
// the function can be deployed without bundling binaries.
// The design comes back from Gemini on a flat solid background; we flood-fill that
// background to transparent (die-cut key) before compositing so the print sits cleanly
// on the garment instead of as an opaque rectangle.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import type { ProductType } from "./types.ts";

const BASELINE_BUCKET = "baseline-mockups";

// Print area per product, as fractions of the baseline image (x, y = top-left).
// Eyeball-tuned starting values — adjust after the first real render.
type Box = { x: number; y: number; w: number; h: number };
const PRINT_BOX: Record<ProductType, Box> = {
  tshirt: { x: 0.37, y: 0.33, w: 0.26, h: 0.27 }, // chest
  tote: { x: 0.32, y: 0.44, w: 0.40, h: 0.32 }, // front panel (flattest)
  mug: { x: 0.39, y: 0.40, w: 0.19, h: 0.20 }, // front face, clear of the handle
  cap: { x: 0.40, y: 0.28, w: 0.22, h: 0.17 }, // front panel
};

export type MockupResult = { bytes: Uint8Array; contentType: string; storagePath: string };

export async function compositeOnMockup(
  designBytes: Uint8Array,
  productType: ProductType,
  slug: string,
): Promise<MockupResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL not set");
  const baselineUrl = `${supabaseUrl}/storage/v1/object/public/${BASELINE_BUCKET}/${productType}.png`;
  const baseRes = await fetch(baselineUrl);
  if (!baseRes.ok) throw new Error(`baseline fetch ${baseRes.status} for ${productType}`);
  const base = await Image.decode(new Uint8Array(await baseRes.arrayBuffer()));

  const design = await Image.decode(designBytes);
  knockOutBackground(design);

  const box = PRINT_BOX[productType];
  const tw = Math.max(1, Math.round(base.width * box.w));
  const th = Math.max(1, Math.round(base.height * box.h));
  design.resize(tw, th, Image.RESIZE_NEAREST_NEIGHBOR); // crisp pixel edges, no halo

  const x = Math.round(base.width * box.x);
  const y = Math.round(base.height * box.y);
  base.composite(design, x, y);

  const bytes = await base.encode(); // PNG
  return { bytes, contentType: "image/png", storagePath: `${slug}.png` };
}

// Flood-fill from the borders, turning every pixel connected to the edge whose color is
// within `tol` of the (averaged) corner color fully transparent. Edge-seeded so the
// sticker's interior white outline survives — only the surrounding background is removed.
function knockOutBackground(img: Image, tol = 42): void {
  const w = img.width;
  const h = img.height;
  const data = img.bitmap; // Uint8ClampedArray, RGBA row-major
  const at = (x: number, y: number) => (y * w + x) * 4;

  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  let r = 0, g = 0, b = 0;
  for (const c of corners) {
    r += data[c];
    g += data[c + 1];
    b += data[c + 2];
  }
  r = Math.round(r / 4);
  g = Math.round(g / 4);
  b = Math.round(b / 4);

  const tol2 = tol * tol * 3;
  const isBg = (i: number) => {
    const dr = data[i] - r, dg = data[i + 1] - g, db = data[i + 2] - b;
    return dr * dr + dg * dg + db * db <= tol2;
  };

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const seed = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isBg(p * 4)) stack.push(p);
  };
  for (let x = 0; x < w; x++) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop() as number;
    data[p * 4 + 3] = 0; // transparent
    const x = p % w;
    const y = (p / w) | 0;
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }
}
