# `src/agents` — autonomous pipeline

Home for our autonomous agents (the "brain" of Pixellato), kept separate from
the Lovable-generated storefront UI. Each agent is a plain TypeScript module
that returns typed data — no UI, no framework coupling — so it can run from an
edge function, a cron job, or a local script.

## Pipeline

```
Trend Scout ──▶ Copy Crafter ──▶ Pixel Forge ──▶ products (live drop)
```

| Agent | File | Status | Input → Output |
|-------|------|--------|----------------|
| Trend Scout | `trend-discovery-agent.ts` (here) · `supabase/functions/run-pipeline/trend-discovery.ts` (Deno) | done | live feeds → `Trend[]` |
| Copy Crafter | `supabase/functions/run-pipeline/copy-crafter.ts` | done | `Trend` → name + slogan + description |
| Pixel Forge | `supabase/functions/run-pipeline/pixel-forge.ts` | done | copy → on-brand pixel-art SVG |

Shared contracts live in `types.ts`.

## Live autonomy

The full loop is deployed on Supabase and runs unattended:

- **`run-pipeline` Edge Function** (`supabase/functions/run-pipeline/`) orchestrates
  Trend Scout → Copy Crafter → Pixel Forge, uploads the SVG to the
  `product-images` storage bucket, and publishes a `live` row in `products`.
- **`pg_cron`** invokes the function every 5 minutes (the demo cadence;
  `shop_config.generation_interval_minutes` holds the production value), so new
  drops appear on the storefront on their own.
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
