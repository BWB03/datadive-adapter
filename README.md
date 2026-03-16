# DataDive Adapter

SkillCrate adapter that wraps the [DataDive](https://datadive.tools) REST API and normalizes responses into a universal agent-readable JSON schema. Any bot or agent can consume the standardized output identically regardless of which tool generated it.

**Dual target:** MCP Server (for Claude, ChatGPT, any MCP client) + OpenClaw Skill (for autonomous bot workflows).

## Quick Start

### Install

```bash
git clone https://github.com/BWB03/datadive-adapter.git
cd datadive-adapter
npm install
npm run build
```

### Use as MCP Server (Claude Desktop)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "datadive": {
      "command": "node",
      "args": ["/path/to/datadive-adapter/dist/index.js"],
      "env": {
        "DATADIVE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. You'll see 8 DataDive tools available.

### Use as OpenClaw Skill

```typescript
import { DataDiveSkill } from "datadive-adapter";

const skill = new DataDiveSkill("your_api_key");

// List all niches
const niches = await skill.listNiches();

// Get keywords for a niche
const keywords = await skill.getKeywords("nicheId");

// Get competitor analysis
const competitors = await skill.getCompetitors("nicheId");
```

## Available Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `datadive_list_niches` | List all niches configured in DataDive | `page?`, `page_size?` |
| `datadive_get_keywords` | Master keyword list with search volume, relevancy, organic ranks | `niche_id` |
| `datadive_get_competitors` | Competitor ASINs, sales, revenue, ranking juice, niche statistics | `niche_id` |
| `datadive_get_ranking_juices` | Ranking factor analysis (current vs optimized listing) | `niche_id` |
| `datadive_get_keyword_roots` | Keyword root groupings with competing products | `niche_id` |
| `datadive_list_rank_radars` | List all Rank Radar keyword trackers | `page?`, `page_size?` |
| `datadive_get_rank_radar` | Keyword ranking data with historical positions | `rank_radar_id` |
| `datadive_get_dive_status` | Check status of a Niche Dive research job | `dive_id` |

## Universal Output Schema

Every response uses a standardized envelope:

```json
{
  "source": "datadive",
  "adapter_version": "1.0.0",
  "data_type": "keyword_ranking",
  "marketplace": "com",
  "retrieved_at": "2026-03-15T08:30:00Z",
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 50,
    "has_more": false
  },
  "data": [...]
}
```

All fields use `snake_case`, full words (not abbreviations), null for missing data, and ISO 8601 dates.

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `DATADIVE_API_KEY` | Yes | — | Your DataDive API key |
| `DATADIVE_RATE_LIMIT_RPS` | No | `1` | Requests per second |
| `DATADIVE_RATE_LIMIT_BURST` | No | `5` | Burst limit |
| `DATADIVE_TIMEOUT_MS` | No | `30000` | Request timeout (ms) |

## Development

```bash
# Run unit tests
npm test

# Run integration tests (requires API key)
DATADIVE_API_KEY=xxx npm run test:integration

# Build
npm run build

# Run discovery script (captures raw API responses)
DATADIVE_API_KEY=xxx npm run discover
```

## Architecture

```
Agent/Bot ──► DataDive Adapter ──► DataDive REST API
                │
                ▼
         Universal Schema
         (standardized JSON)
```

The adapter pattern established here is the template for future adapters (Pacvue, Helium 10, Jungle Scout, etc.). Same universal schema, different source APIs.

## License

Private — Voartex
