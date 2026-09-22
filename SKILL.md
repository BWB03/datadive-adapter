---
name: datadive-adapter
description: >
  Universal adapter for DataDive Amazon analytics. Pulls keyword data,
  rank tracking, competitor intelligence, and niche research into a
  standardized schema any agent can consume.
version: 1.0.0
author: Voartex
category: amazon-tools
---

# DataDive Adapter

SkillCrate adapter that wraps the DataDive REST API and normalizes responses into a universal agent-readable JSON schema.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DATADIVE_API_KEY` | Yes | Your DataDive API key |
| `DATADIVE_RATE_LIMIT_RPS` | No | Requests per second (default: 1) |
| `DATADIVE_RATE_LIMIT_BURST` | No | Burst limit (default: 5) |
| `DATADIVE_TIMEOUT_MS` | No | Request timeout in ms (default: 30000) |

## Capabilities

### datadive_list_niches
List all niches configured in DataDive.
- **Inputs**: `page` (optional), `page_size` (optional)
- **Returns**: `niche_summary[]` — niche IDs, hero keywords, labels, marketplace

### datadive_get_keywords
Get the master keyword list for a niche.
- **Inputs**: `niche_id` (required)
- **Returns**: `keyword_ranking[]` — search volume, relevancy, organic/sponsored ranks

### datadive_get_competitors
Get competitor ASINs and niche statistics.
- **Inputs**: `niche_id` (required)
- **Returns**: `competitor` data

### datadive_get_ranking_juices
Get ranking factor analysis for a niche.
- **Inputs**: `niche_id` (required)
- **Returns**: `ranking_juice` data

### datadive_get_keyword_roots
Get keyword root groupings for a niche.
- **Inputs**: `niche_id` (required)
- **Returns**: `keyword_root` data

### datadive_list_rank_radars
List all Rank Radar keyword trackers.
- **Inputs**: `page` (optional), `page_size` (optional)
- **Returns**: `rank_tracker[]` — ASIN, keyword counts, top 10/50 metrics

### datadive_get_rank_radar
Get all keyword ranking pages for a specific Rank Radar tracker automatically.
- **Inputs**: `rank_radar_id` (required), `start_date`, `end_date`, `page_size` (optional; default 20, max 100)
- **Returns**: `keyword_rank_history` — complete historical rank positions and search volume
- Dates default to the last 30 days. Use the dedicated tools below for PPC/SQP metrics.

### datadive_get_rank_radar_ppc
Get per-keyword PPC metrics from the dedicated PPC endpoint.
- **Inputs**: `rank_radar_id` (required), `start_date`, `end_date`, `include_campaigns` (optional)
- **Returns**: `rank_radar_ppc[]` — native DataDive metric fields and optional campaign breakdowns

### datadive_get_rank_radar_sqp
Get per-keyword Search Query Performance metrics from the dedicated SQP endpoint.
- **Inputs**: `rank_radar_id` (required), `start_date`, `end_date` (optional)
- **Returns**: `rank_radar_sqp[]` — native DataDive impressions, clicks, purchases, shares, and query volume

Both metric tools default to the last 30 days. Join their `id` with ranking
history's `keyword_id`; PPC/SQP metrics are no longer part of keyword detail responses.

### datadive_get_dive_status
Check the status of a Niche Dive research job.
- **Inputs**: `dive_id` (required)
- **Returns**: `dive_status` data

## Universal Output Schema

All responses use the standard envelope:

```json
{
  "source": "datadive",
  "adapter_version": "1.0.0",
  "data_type": "<type>",
  "marketplace": "com",
  "retrieved_at": "2026-03-14T08:30:00Z",
  "pagination": { ... },
  "data": [ ... ]
}
```

## Usage

### As MCP Server
```bash
DATADIVE_API_KEY=xxx npx datadive-adapter
```

### As OpenClaw Skill
```typescript
import { DataDiveSkill } from "datadive-adapter";

const skill = new DataDiveSkill(apiKey);
const niches = await skill.listNiches();
```
