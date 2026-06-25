// Copy Crafter (Agent 2) — turns a Trend into merch copy.
// Deterministic, key-free: deadpan internet humor selected by a seeded PRNG so
// output is varied but reproducible. Swap in an LLM later behind the same API.

import type { Copy, ProductType, Trend } from "./types.ts";

const PRICE_BY_TYPE: Record<ProductType, number> = {
  tshirt: 2499,
  mug: 1999,
  poster: 1499,
  sticker: 499,
};

const PRODUCT_TYPES: ProductType[] = ["tshirt", "mug", "sticker", "poster"];

const NAME_TEMPLATES = [
  (k: string) => `I Survived ${title(k)}`,
  (k: string) => `${title(k)} Enjoyer`,
  (k: string) => `Powered by ${title(k)}`,
  (k: string) => `${title(k)} Maximalist`,
  (k: string) => `Ask Me About ${title(k)}`,
  (k: string) => `Certified ${title(k)} Believer`,
];

const SLOGAN_TEMPLATES = [
  (k: string) => `${title(k)}. Allegedly.`,
  (k: string) => `It's a ${k.toLowerCase()} thing.`,
  (k: string) => `Touch grass. Then ${k.toLowerCase()}.`,
  (k: string) => `${title(k)} or go home.`,
  (k: string) => `Trust me, it's ${k.toLowerCase()}.`,
  (k: string) => `Yes, it's ${k.toLowerCase()} again.`,
  (k: string) => `Shipped on vibes and ${k.toLowerCase()}.`,
];

const DESC_OPENERS = [
  (k: string) => `The internet decided ${k.toLowerCase()} matters today, so here's the merch.`,
  (k: string) => `Born from a trending feed at an ungodly hour, this drop is all about ${k.toLowerCase()}.`,
  (k: string) => `Nobody asked for ${k.toLowerCase()} merch. We made it anyway.`,
  (k: string) => `Freshly pixelated from today's zeitgeist: ${k.toLowerCase()}.`,
];

const DESC_CLOSERS = [
  "Limited drop. Gone when the next trend hits.",
  "Wear it ironically. Or don't. We're not your manager.",
  "Self-aware merch for self-aware people.",
  "Made by robots, judged by humans.",
];

function title(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function craftCopy(trend: Trend): Copy {
  const rng = mulberry32(hashString(trend.keyword + trend.id));
  const keyword = trend.keyword;
  const productType = pick(PRODUCT_TYPES, rng);
  const name = pick(NAME_TEMPLATES, rng)(keyword);
  const slogan = pick(SLOGAN_TEMPLATES, rng)(keyword);
  const description = `${pick(DESC_OPENERS, rng)(keyword)} ${pick(DESC_CLOSERS, rng)}`;
  return {
    name,
    slogan,
    description,
    productType,
    priceCents: PRICE_BY_TYPE[productType],
  };
}
