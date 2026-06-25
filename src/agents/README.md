# `src/agents` — autonomous pipeline

Home for our autonomous agents (the "brain" of Pixellato), kept separate from
the Lovable-generated storefront UI. Each agent is a plain TypeScript module
that returns typed data — no UI, no framework coupling — so it can run from an
edge function, a cron job, or a local script.

## Pipeline

```
Trend Scout ──▶ Copy Crafter ──▶ Pixel Forge ──▶ 4-item drop (replaces the last one)
```

| Agent | File | Status | Input → Output |
|-------|------|--------|----------------|
| Trend Scout | `trend-discovery-agent.ts` (here) · `supabase/functions/run-pipeline/trend-discovery.ts` (Deno) | done | live feeds → `Trend[]` |
| Copy Crafter | `supabase/functions/run-pipeline/copy-crafter.ts` | done | `Trend` → shared drop theme + slogan + description |
| Pixel Forge | `supabase/functions/run-pipeline/pixel-forge.ts` | done | trend → on-brand pixel-art SVG per item |

Shared contracts live in `types.ts`.

## Live autonomy

The full loop is deployed on Supabase and runs unattended:

- **A drop = one trend branded across four items** — a tee, a mug, a water bottle
  and a cap — sharing one theme/slogan but each with its own pixel-art SVG.
- **`run-pipeline` Edge Function** (`supabase/functions/run-pipeline/`) orchestrates
  Trend Scout → Copy Crafter → Pixel Forge, uploads each SVG to the
  `product-images` bucket, publishes the four `live` rows, then **hard-evicts the
  previous drop** — deleting its `products` rows *and* their Storage images so only
  the current drop ever exists.
- **`pg_cron`** invokes the function every 5 minutes (`shop_config.generation_interval_minutes`),
  so the storefront overwrites itself with a fresh drop on its own. The home page
  shows only the current drop; `/drops` counts down to the next one.
- Every step is recorded in `generation_runs` + `agent_logs` for an audit trail,
  and `shop_config.is_pipeline_enabled` is a kill switch.

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
