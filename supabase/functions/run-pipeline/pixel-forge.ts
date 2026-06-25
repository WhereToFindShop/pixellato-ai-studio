// Pixel Forge (Agent 3) — renders an on-brand pixel-art SVG for a drop.
// Procedural + deterministic (seeded by keyword), so it always succeeds with no
// external image API. The brand IS pixel art, so this reads as intentional.

import type { Copy, Trend } from "./types.ts";

// Pico-8-ish brand palette from CONCEPT.md.
const BG = "#0D0D0D";
const PALETTE = ["#FF004D", "#00B543", "#29ADFF", "#FFEC27", "#FF77A8", "#E8E8E8"];

const SIZE = 800;
const GRID = 16; // 16x16 sprite, left half mirrored for symmetry
const PAD = 120;

export type ForgeResult = { svg: string; palette: string[]; storagePath: string };

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "drop";
}

export function forgePixelArt(trend: Trend, copy: Copy, slug: string): ForgeResult {
  const rng = mulberry32(hashString(trend.keyword + copy.name));
  const cell = (SIZE - PAD * 2) / GRID;

  // Two accent colors for this drop, deterministic from the seed.
  const cA = PALETTE[Math.floor(rng() * PALETTE.length)];
  let cB = PALETTE[Math.floor(rng() * PALETTE.length)];
  if (cB === cA) cB = PALETTE[(PALETTE.indexOf(cA) + 2) % PALETTE.length];

  // Symmetric sprite: decide the left half, mirror to the right.
  const rects: string[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID / 2; x++) {
      const r = rng();
      if (r < 0.42) continue; // empty cell
      const color = r < 0.62 ? cA : cB;
      const px = PAD + x * cell;
      const py = PAD + y * cell;
      const mx = PAD + (GRID - 1 - x) * cell;
      rects.push(
        `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="${color}"/>`,
      );
      rects.push(
        `<rect x="${mx.toFixed(1)}" y="${py.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="${color}"/>`,
      );
    }
  }

  // Subtle CRT scanlines.
  const scanlines: string[] = [];
  for (let y = 0; y < SIZE; y += 6) {
    scanlines.push(`<rect x="0" y="${y}" width="${SIZE}" height="3" fill="#000000" opacity="0.10"/>`);
  }

  const kw = escapeXml(trend.keyword.toUpperCase());
  const slogan = escapeXml(copy.slogan);
  const tag = escapeXml(`${copy.productType.toUpperCase()} · ${trend.source}`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <rect x="20" y="20" width="${SIZE - 40}" height="${SIZE - 40}" fill="none" stroke="${cA}" stroke-width="4"/>
  <text x="${SIZE / 2}" y="86" fill="#E8E8E8" font-family="'Courier New',monospace" font-size="34" font-weight="bold" letter-spacing="6" text-anchor="middle">${kw}</text>
  <g>${rects.join("")}</g>
  <text x="${SIZE / 2}" y="${SIZE - 120}" fill="${cB}" font-family="'Courier New',monospace" font-size="40" font-weight="bold" text-anchor="middle">${slogan}</text>
  <text x="${SIZE / 2}" y="${SIZE - 60}" fill="#9b9b9b" font-family="'Courier New',monospace" font-size="20" letter-spacing="4" text-anchor="middle">${tag}</text>
  <g>${scanlines.join("")}</g>
</svg>`;

  return {
    svg,
    palette: [cA, cB],
    storagePath: `${slugify(slug)}-${Date.now().toString(36)}.svg`,
  };
}
