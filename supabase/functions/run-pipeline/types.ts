// Shared types for the run-pipeline Edge Function (Deno runtime).

export type TrendSource = "hackernews" | "lobsters" | "technews" | "mock";

export type TrendCategory =
  | "ai"
  | "developer"
  | "startup"
  | "hardware"
  | "internet-culture";

export type Trend = {
  id: string;
  keyword: string;
  title: string;
  source: TrendSource;
  url?: string;
  category: TrendCategory;
  popularityScore: number;
  detectedAt: string;
  shortContext: string;
};

// A drop = one trend branded across these four items.
export type ProductType = "tshirt" | "mug" | "bottle" | "hat";

// Drop-level copy, shared by all four items in the drop.
export type DropCopy = {
  theme: string;
  slogan: string;
  description: string;
};
