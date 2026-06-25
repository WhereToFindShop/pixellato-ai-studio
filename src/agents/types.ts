/**
 * Shared types for the Pixellato agent pipeline.
 *
 * `Trend` is the contract between Agent 1 (Trend Scout / TrendDiscoveryAgent)
 * and downstream agents (Copy Crafter, Pixel Forge). Keep this stable so a
 * later adapter can map a Trend straight onto the Supabase `trends` table.
 */

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
