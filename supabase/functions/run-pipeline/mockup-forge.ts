// Mockup Forge — composites the generated design onto a real product baseline photo.
// Pure-WASM ImageScript so it runs in the Deno edge runtime (sharp does NOT).
// Flat overlay only: looks right on flat surfaces (tote, cap), acceptably flat on the
// curved/draped ones (mug, tee). Upgrade path: per-item Higgsfield image-edit for warp.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import type { ProductType } from "./types.ts";

// Print area per product, as fractions of the baseline image (x, y = top-left).
// ponytail: eyeball-tuned starting values — adjust after the first real render.
type Box = { x: number; y: number; w: number; h: number };
const PRINT_BOX: Record<ProductType, Box> = {
  tshirt: { x: 0.37, y: 0.33, w: 0.26, h: 0.27 }, // chest
  tote: { x: 0.32, y: 0.44, w: 0.40, h: 0.32 }, // front panel (flattest)
  mug: { x: 0.39, y: 0.40, w: 0.19, h: 0.20 }, // front face, clear of the handle (curved)
  cap: { x: 0.40, y: 0.28, w: 0.22, h: 0.17 }, // front panel
};

export type MockupResult = { bytes: Uint8Array; contentType: string; storagePath: string };

export async function compositeOnMockup(
  designUrl: string,
  productType: ProductType,
  slug: string,
): Promise<MockupResult> {
  const baseBytes = await Deno.readFile(new URL(`./baseline/${productType}.png`, import.meta.url));
  const base = await Image.decode(baseBytes);

  const res = await fetch(designUrl);
  if (!res.ok) throw new Error(`design fetch ${res.status}`);
  const design = await Image.decode(new Uint8Array(await res.arrayBuffer()));

  const box = PRINT_BOX[productType];
  const tw = Math.max(1, Math.round(base.width * box.w));
  const th = Math.max(1, Math.round(base.height * box.h));
  design.resize(tw, th, Image.RESIZE_NEAREST_NEIGHBOR); // keep pixel-art edges crisp

  const x = Math.round(base.width * box.x);
  const y = Math.round(base.height * box.y);
  base.composite(design, x, y);

  const bytes = await base.encode(); // PNG
  return { bytes, contentType: "image/png", storagePath: `${slug}.png` };
}
