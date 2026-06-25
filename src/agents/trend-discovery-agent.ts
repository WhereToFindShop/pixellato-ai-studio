/**
 * TrendDiscoveryAgent — Pixellato "Agent 1: Trend Scout".
 *
 * Pulls live tech trends from Hacker News, Lobste.rs, and a general tech-news
 * aggregator (WhatsTrending), normalizes them into the shared `Trend` shape,
 * then scores, deduplicates, safety-filters, and returns the top 10. If every
 * live source fails (or nothing survives the filters) it falls back to a
 * curated list of mock demo trends so the pipeline never starves.
 *
 * Pure module: it only returns `Trend[]`. A later adapter maps these onto the
 * Supabase `trends` table before Copy Crafter / Pixel Forge run.
 */

import type { Trend, TrendCategory } from "@/agents/types";

const HN_ENDPOINT =
  "https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points>50";
// Lobste.rs exposes JSON for any page — no key/auth. Hottest = front page.
const LOBSTERS_ENDPOINT = "https://lobste.rs/hottest.json";
// WhatsTrending: free, no-auth aggregator of 20+ mainstream tech outlets
// (TechCrunch, The Verge, Ars Technica, ...), deduped + categorized.
const TECHNEWS_ENDPOINT = "https://whatstrending.ai/api/articles?limit=50";

const RESULT_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 8000;

// Reference ceilings for log-scaled scoring (roughly the high end we expect per
// source). They only need to be in the right ballpark to keep cross-source
// sorting fair — not exact.
const SCORE_REFERENCE = {
  hackernews: 1000, // HN points
  lobsters: 100, // Lobste.rs upvote score
  technews: 3, // WhatsTrending "coverage" = outlets running the story (usually 1-5)
} as const;

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "for", "nor", "so", "yet", "of", "to",
  "in", "on", "at", "by", "with", "from", "as", "is", "are", "was", "were",
  "be", "been", "being", "this", "that", "these", "those", "it", "its", "we",
  "you", "your", "our", "their", "they", "i", "me", "my", "he", "she", "his",
  "her", "how", "what", "why", "when", "where", "who", "which", "can", "will",
  "just", "new", "now", "get", "got", "make", "made", "using", "use", "used",
  "via", "into", "out", "up", "down", "more", "most", "than", "then", "about",
  "after", "before", "over", "under", "show", "hn", "ask", "vs", "your", "build",
  "building", "best", "guide", "introducing", "intro", "first", "free", "open",
]);

// Curated terms that should win keyword extraction when present.
const PRIORITY_TERMS = new Set([
  "ai", "llm", "llms", "gpt", "agent", "agents", "agentic", "ml", "rag",
  "transformer", "diffusion", "embeddings", "rust", "go", "golang", "zig",
  "python", "typescript", "javascript", "wasm", "webassembly", "react",
  "nextjs", "svelte", "vue", "kubernetes", "docker", "postgres", "sqlite",
  "edge", "serverless", "database", "compiler", "kernel", "linux", "gpu",
  "cpu", "chip", "quantum", "robot", "robotaxi", "drone", "vr", "ar",
  "spatial", "local-first", "vibe", "self-hosted", "opensource", "framework",
  "api", "cli", "terminal", "browser", "search", "vector", "graphql",
]);

const CATEGORY_KEYWORDS: Record<TrendCategory, string[]> = {
  ai: [
    "ai", "llm", "gpt", "model", "models", "agent", "agentic", "ml",
    "machine learning", "neural", "rag", "diffusion", "transformer",
    "embedding", "inference", "openai", "anthropic", "deepseek", "gemini",
  ],
  hardware: [
    "chip", "gpu", "cpu", "robot", "robotaxi", "device", "quantum", "sensor",
    "hardware", "silicon", "wafer", "drone", "raspberry", "fpga", "soc",
    "battery", "wearable",
  ],
  startup: [
    "startup", "funding", "raises", "raised", "seed round", "series a",
    "launch", "launches", "yc", "y combinator", "founder", "founders",
    "acquired", "acquisition", "ipo", "valuation",
  ],
  "internet-culture": [
    "meme", "viral", "vibe", "trend", "trending", "drama", "internet",
    "tiktok", "reddit", "twitter", "discord", "shitpost", "lore",
  ],
  developer: [], // default bucket
};

// Substrings that make a trend a bad fit for automated merch. Kept broad on
// purpose — we would rather drop a borderline trend than print something risky.
const UNSAFE_PATTERNS: RegExp[] = [
  // politics / war / tragedy
  /\b(politic|election|president|senate|parliament|government|war|invasion|military|missile|bomb|terror|shooting|massacre|genocide|killed|dead|death|disaster|earthquake|hostage)\b/i,
  // adult content
  /\b(porn|nsfw|sex|sexual|nude|nudity|onlyfans|escort|fetish)\b/i,
  // hate / harassment
  /\b(racist|racism|nazi|slur|hate|harass|bully)\b/i,
  // medical claims
  /\b(cure|cancer|covid|vaccine|disease|diagnos|symptom|medication|clinical)\b/i,
  // financial advice / scams
  /\b(invest|stock tip|get rich|trading signal|forex|ponzi|pump and dump)\b/i,
  // crypto scams
  /\b(crypto|bitcoin|ethereum|nft|memecoin|airdrop|token presale|web3 scam|rug pull)\b/i,
  // celebrities / copyrighted characters
  /\b(celebrity|kardashian|taylor swift|elon musk|trump|disney|marvel|pokemon|nintendo|mickey mouse|star wars|harry potter)\b/i,
];

type FetchOk<T> = { ok: true; value: T };
type FetchErr = { ok: false };

export class TrendDiscoveryAgent {
  async discoverTrends(): Promise<Trend[]> {
    const settled = await Promise.allSettled([
      this.fetchHackerNewsTrends(),
      this.fetchLobstersTrends(),
      this.fetchTechNewsTrends(),
    ]);

    const sourceNames = ["hackernews", "lobsters", "technews"] as const;
    const collected: Trend[] = [];

    settled.forEach((result, i) => {
      const source = sourceNames[i];
      if (result.status === "fulfilled") {
        if (result.value.length === 0) {
          console.warn(`[TrendDiscoveryAgent] source ${source} returned nothing useful.`);
        }
        collected.push(...result.value);
      } else {
        console.warn(`[TrendDiscoveryAgent] source ${source} failed:`, result.reason);
      }
    });

    const live = this.finalize(collected);
    if (live.length > 0) return live;

    console.warn("[TrendDiscoveryAgent] all live sources empty — using mock trends.");
    return this.finalize(this.getMockTrends());
  }

  /** Shared post-processing: safety filter → dedupe → diverse select → sort. */
  private finalize(trends: Trend[]): Trend[] {
    const clean = this.dedupeTrends(trends.filter((t) => this.isSafeTrend(t)));
    return this.selectDiverse(clean, RESULT_LIMIT).sort(
      (a, b) => b.popularityScore - a.popularityScore,
    );
  }

  /**
   * Pick up to `limit` trends with source diversity. HN/Lobsters carry far
   * richer engagement signals than general tech news, so a pure score sort would
   * crowd out mainstream news entirely. Round-robin across sources (each bucket
   * pre-sorted by score) guarantees every working source is represented, then
   * the caller re-sorts the chosen set by score.
   */
  private selectDiverse(trends: Trend[], limit: number): Trend[] {
    const buckets = new Map<Trend["source"], Trend[]>();
    for (const t of trends) {
      const bucket = buckets.get(t.source) ?? [];
      bucket.push(t);
      buckets.set(t.source, bucket);
    }
    for (const bucket of buckets.values()) {
      bucket.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    const selected: Trend[] = [];
    let added = true;
    while (selected.length < limit && added) {
      added = false;
      for (const bucket of buckets.values()) {
        const next = bucket.shift();
        if (next) {
          selected.push(next);
          added = true;
          if (selected.length >= limit) break;
        }
      }
    }
    return selected;
  }

  private async fetchHackerNewsTrends(): Promise<Trend[]> {
    const data = await this.getJson<{ hits?: HnHit[] }>(HN_ENDPOINT);
    if (!data.ok) throw new Error("Hacker News request failed");

    const hits = data.value.hits ?? [];
    return hits
      .filter((h) => typeof h.title === "string" && h.title.trim().length > 0)
      .map((h) => {
        const title = h.title.trim();
        const points = h.points ?? 0;
        return this.buildTrend({
          id: `hn-${h.objectID}`,
          title,
          source: "hackernews",
          url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
          rawEngagement: points,
          detectedAt: this.parseDate(h.created_at),
          context: `Hacker News · ${points} points`,
        });
      });
  }

  private async fetchLobstersTrends(): Promise<Trend[]> {
    const data = await this.getJson<LobstersStory[]>(LOBSTERS_ENDPOINT, {
      "User-Agent": "pixellato-trend-agent",
    });
    if (!data.ok) throw new Error("Lobste.rs request failed");

    const stories = Array.isArray(data.value) ? data.value : [];
    return stories
      .filter((s) => typeof s.title === "string" && s.title.trim().length > 0)
      .map((s) => {
        const score = s.score ?? 0;
        const tags = (s.tags ?? []).join(" ");
        return this.buildTrend({
          id: `lobsters-${s.short_id}`,
          title: s.title.trim(),
          // Lobste.rs tags (e.g. "rust", "ai", "hardware") sharpen keyword + category.
          keywordSource: `${s.title} ${tags}`,
          source: "lobsters",
          url: s.url || s.short_id_url,
          rawEngagement: score,
          detectedAt: this.parseDate(s.created_at),
          context: `Lobste.rs · ${score} points`,
        });
      });
  }

  private async fetchTechNewsTrends(): Promise<Trend[]> {
    const data = await this.getJson<{ data?: TechNewsArticle[] }>(TECHNEWS_ENDPOINT);
    if (!data.ok) throw new Error("Tech news request failed");

    const articles = data.value.data ?? [];
    return articles
      .filter((a) => typeof a.title === "string" && a.title.trim().length > 0)
      .map((a, i) => {
        // "coverage" = how many outlets ran the story; the strongest trend signal here.
        const coverage = a.coverage ?? a.trendScore ?? 1;
        const outlet = a.source ?? "tech news";
        return this.buildTrend({
          id: `technews-${a.slug ?? i}`,
          title: a.title.trim(),
          keywordSource: `${a.title} ${a.summary ?? ""}`,
          source: "technews",
          url: a.link,
          rawEngagement: coverage,
          detectedAt: this.parseDate(a.date),
          context: `${outlet} · ${coverage}x coverage`,
        });
      });
  }

  private extractKeyword(text: string): string {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\- ]/g, " ")
      .split(/\s+/)
      .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ""))
      .filter((t) => t.length > 1 && !STOPWORDS.has(t));

    if (tokens.length === 0) return "trend";

    const priority = tokens.filter((t) => PRIORITY_TERMS.has(t));
    const ordered = [...new Set([...priority, ...tokens])];
    return ordered.slice(0, 3).join(" ");
  }

  private categorize(text: string): TrendCategory {
    const haystack = text.toLowerCase();
    for (const category of ["ai", "hardware", "startup", "internet-culture"] as const) {
      if (CATEGORY_KEYWORDS[category].some((kw) => haystack.includes(kw))) {
        return category;
      }
    }
    return "developer";
  }

  private isSafeTrend(trend: Trend): boolean {
    const haystack = `${trend.title} ${trend.keyword} ${trend.shortContext}`;
    return !UNSAFE_PATTERNS.some((pattern) => pattern.test(haystack));
  }

  private dedupeTrends(trends: Trend[]): Trend[] {
    const byKeyword = new Map<string, Trend>();
    for (const trend of trends) {
      const key = trend.keyword.toLowerCase().trim();
      const existing = byKeyword.get(key);
      if (!existing || trend.popularityScore > existing.popularityScore) {
        byKeyword.set(key, trend);
      }
    }
    return [...byKeyword.values()];
  }

  private getMockTrends(): Trend[] {
    const now = new Date().toISOString();
    const seeds: Array<Pick<Trend, "keyword" | "title" | "category"> & { score: number }> = [
      { keyword: "ai agents", title: "AI agents", category: "ai", score: 98 },
      { keyword: "vibe coding", title: "Vibe coding", category: "developer", score: 95 },
      { keyword: "rust rewrite", title: "Rust rewrite", category: "developer", score: 92 },
      { keyword: "edge ai", title: "Edge AI", category: "ai", score: 89 },
      { keyword: "spatial computing", title: "Spatial computing", category: "hardware", score: 86 },
      { keyword: "quantum chips", title: "Quantum chips", category: "hardware", score: 83 },
      { keyword: "open-source llms", title: "Open-source LLMs", category: "ai", score: 80 },
      { keyword: "robotaxis", title: "Robotaxis", category: "hardware", score: 77 },
      { keyword: "serverless databases", title: "Serverless databases", category: "developer", score: 74 },
      { keyword: "local-first apps", title: "Local-first apps", category: "developer", score: 71 },
    ];

    return seeds.map((seed, i) => ({
      id: `mock-${i + 1}`,
      keyword: seed.keyword,
      title: seed.title,
      source: "mock",
      category: seed.category,
      popularityScore: seed.score,
      detectedAt: now,
      shortContext: `Mock demo trend · ${seed.category}`,
    }));
  }

  // --- internal helpers ---------------------------------------------------

  private buildTrend(input: {
    id: string;
    title: string;
    keywordSource?: string;
    source: Trend["source"];
    url?: string;
    rawEngagement: number;
    detectedAt: string;
    context: string;
  }): Trend {
    const keyword = this.extractKeyword(input.keywordSource ?? input.title);
    const category = this.categorize(`${input.title} ${keyword}`);
    const popularityScore = this.scoreEngagement(input.source, input.rawEngagement);
    return {
      id: input.id,
      keyword,
      title: input.title,
      source: input.source,
      url: input.url,
      category,
      popularityScore,
      detectedAt: input.detectedAt,
      shortContext: `${input.context} · ${category}`,
    };
  }

  /**
   * Different sources report engagement on wildly different scales, so map each
   * onto a shared 0–100 log curve. Log keeps a 5k-star repo from dwarfing a
   * 300-point HN story while still rewarding the genuine breakouts.
   */
  private scoreEngagement(source: Trend["source"], raw: number): number {
    const reference =
      source in SCORE_REFERENCE
        ? SCORE_REFERENCE[source as keyof typeof SCORE_REFERENCE]
        : 1000;
    const score = (Math.log10(Math.max(0, raw) + 1) / Math.log10(reference + 1)) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /** Coerce assorted date strings (RFC 822 / ISO) into ISO 8601, fallback to now. */
  private parseDate(raw?: string): string {
    if (!raw) return new Date().toISOString();
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  private async getJson<T>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<FetchOk<T> | FetchErr> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      }
      return { ok: true, value: (await res.json()) as T };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// --- source response shapes (only the fields we read) ---------------------

type HnHit = {
  objectID: string;
  title: string;
  url?: string | null;
  points?: number;
  created_at?: string;
};

type LobstersStory = {
  short_id: string;
  short_id_url: string;
  title: string;
  url?: string;
  score?: number;
  tags?: string[];
  created_at?: string;
};

type TechNewsArticle = {
  slug?: string;
  title: string;
  link: string;
  source?: string;
  summary?: string;
  date?: string;
  coverage?: number;
  trendScore?: number;
};

// --- example / test runner ------------------------------------------------

async function main(): Promise<void> {
  const agent = new TrendDiscoveryAgent();
  const trends = await agent.discoverTrends();

  console.log(`\nDiscovered ${trends.length} trends:\n`);
  console.table(
    trends.map((t) => ({
      keyword: t.keyword,
      source: t.source,
      category: t.category,
      score: t.popularityScore,
    })),
  );
  console.log("\nFull objects:\n", JSON.stringify(trends, null, 2));
}

// Only run when executed directly (e.g. `bun run trends`), not when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[TrendDiscoveryAgent] fatal error:", err);
    process.exit(1);
  });
}
