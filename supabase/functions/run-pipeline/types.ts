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

export type ProductType = "tshirt" | "mug" | "sticker" | "poster";

export type Copy = {
  name: string;
  slogan: string;
  description: string;
  productType: ProductType;
  priceCents: number;
};
