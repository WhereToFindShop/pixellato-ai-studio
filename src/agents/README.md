# `src/agents` — autonomous pipeline

Home for our autonomous agents (the "brain" of Pixellato), kept separate from
the Lovable-generated storefront UI. Each agent is a plain TypeScript module
that returns typed data — no UI, no framework coupling — so it can run from an
edge function, a cron job, or a local script.

## Pipeline

```
Trend Scout ──▶ Copy Crafter ──▶ Pixel Forge ──▶ products (live)
(this folder)
```

| Agent | File | Status | Input → Output |
|-------|------|--------|----------------|
| Trend Scout | `trend-discovery-agent.ts` | done | live feeds → `Trend[]` |
| Copy Crafter | `copy-crafter-agent.ts` | planned | `Trend` → name + slogan + description |
| Pixel Forge | `pixel-forge-agent.ts` | planned | copy → pixel-art product image |

Shared contracts live in `types.ts`.

## TrendDiscoveryAgent

Discovers current tech trends and returns clean, merch-worthy `Trend` objects.

- **Sources** (all keyless, resilient via `Promise.allSettled`):
  - Hacker News (Algolia) — `points`
  - Lobste.rs hottest — `score` + tags
  - WhatsTrending — aggregated mainstream tech news, `coverage`
- Normalizes, extracts keywords, categorizes, log-scores engagement,
  deduplicates by keyword, safety-filters unsuitable topics, and returns the
  top 10 with source diversity.
- Falls back to curated mock trends if every live source fails.

```ts
import { TrendDiscoveryAgent } from "@/agents/trend-discovery-agent";

const trends = await new TrendDiscoveryAgent().discoverTrends();
```

Run the built-in demo:

```bash
bun run trends
```

> Pure module: it only returns `Trend[]`. A later adapter maps these onto the
> Supabase `trends` table before the downstream agents run.
