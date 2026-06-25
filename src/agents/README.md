# `src/agents` — autonomous pipeline

Home for our autonomous agents (the "brain" of Pixellato), kept separate from
the storefront UI. Each agent is a plain TypeScript module that returns typed
data — no UI, no framework coupling — so it can run from an edge function, a
cron job, or a local script.

## Pipeline

```
Trend Scout ──▶ Copy Crafter ──▶ Design Forge ──▶ Mockup Forge ──▶ 4-item drop (replaces the last one)
                                      │                │
                                      └─ SVG fallback ─┘ (pixel-forge.ts, if Gemini fails)
```

| Agent | File | Status | Input → Output |
|-------|------|--------|----------------|
| Trend Scout | `trend-discovery-agent.ts` (here) · `supabase/functions/run-pipeline/trend-discovery.ts` (Deno) | done | live feeds → `Trend[]` |
| Copy Crafter | `supabase/functions/run-pipeline/copy-crafter.ts` | done | `Trend` → shared drop theme + slogan + description |
| Design Forge | `supabase/functions/run-pipeline/design-forge.ts` | done | `Trend` + copy → one Gemini graphic (bytes) |
| Mockup Forge | `supabase/functions/run-pipeline/mockup-forge.ts` | done | design bytes + baseline photo → composited PNG |
| Pixel Forge | `supabase/functions/run-pipeline/pixel-forge.ts` | fallback | trend → procedural SVG per item |

Shared contracts live in `types.ts` (local) and `supabase/functions/run-pipeline/types.ts` (Deno).

## Live autonomy

The full loop is deployed on Supabase and runs unattended:

- **A drop = one trend branded across four items** — tee, tote, mug, cap — sharing
  one theme/slogan and one AI-generated design composited onto each baseline mockup.
- **`run-pipeline` Edge Function** orchestrates the agents, uploads PNGs to the
  `product-images` bucket, publishes four `live` rows, then **hard-evicts the
  previous drop** — deleting its `products` rows and Storage images.
- **`pg_cron`** invokes the function every 2 minutes (`shop_config.generation_interval_minutes`).
  The home page shows only the current drop; `/drops` counts down to the next one.
- Baseline product photos live in the public **`baseline-mockups`** Storage bucket
  (not bundled in the edge function).
- Every step is recorded in `generation_runs` + `agent_logs`; `shop_config.is_pipeline_enabled`
  is a kill switch.

## TrendDiscoveryAgent

Discovers current tech trends and returns clean, merch-worthy `Trend` objects.

- **Sources** (all keyless, resilient via `Promise.allSettled`):
  - Hacker News (Algolia)
  - Lobste.rs hottest
  - WhatsTrending
- Normalizes, extracts keywords, categorizes, log-scores engagement, deduplicates,
  safety-filters, and returns the top 10 with source diversity.
- Falls back to curated mock trends if every live source fails.

```ts
import { TrendDiscoveryAgent } from "@/agents/trend-discovery-agent";

const trends = await new TrendDiscoveryAgent().discoverTrends();
```

Run the built-in demo:

```bash
bun run trends
```
