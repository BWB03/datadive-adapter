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

### Install Via Claude Desktop MCPB

The easiest Claude Desktop install path is the `.mcpb` bundle from GitHub Releases.

1. Download `datadive-adapter-vX.Y.Z.mcpb` from the latest release.
2. Open the `.mcpb` file with Claude Desktop.
3. Enter your DataDive API key when Claude asks for `DataDive API Key`.
4. Enable or restart the extension if Claude Desktop prompts you.
5. Start a new Claude chat and confirm the DataDive tools are available.

The bundle passes your key to the local MCP server as `DATADIVE_API_KEY`. Optional rate-limit and timeout settings remain available for manual MCP installs.

### Build A Local MCPB

```bash
npm install
npm run mcpb:validate
npm run mcpb:pack
```

The packaged bundle is written to:

```bash
release/datadive-adapter-v1.0.1.mcpb
```

### Use as MCP Server (Claude Desktop)

If you prefer manual JSON config instead of the `.mcpb` installer, add this server to Claude Desktop's MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

Restart Claude Desktop. You'll see 13 DataDive tools available.

### Claude Code / Codex Setup

Claude Code, Codex, and other stdio MCP clients can use the same local server command after building from source:

```json
{
  "mcpServers": {
    "datadive": {
      "command": "node",
      "args": ["/absolute/path/to/datadive-adapter/dist/index.js"],
      "env": {
        "DATADIVE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

For Codex CLI-style configs, use the equivalent command/args/env shape supported by your client:

```toml
[mcp_servers.datadive]
command = "node"
args = ["/absolute/path/to/datadive-adapter/dist/index.js"]

[mcp_servers.datadive.env]
DATADIVE_API_KEY = "your_api_key_here"
```

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

// Create a dive
const dive = await skill.createDive({
  keyword: "zinc supplements",
  asin: "B0012ZQPKG",
  numberOfCompetitors: 17,
});

// Generate optimized listing copy
const copy = await skill.triggerAiCopywriter("nicheId", "ranking-juice");
```

## Available Tools

### Read Tools (8)

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

### Write Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `datadive_create_dive` | Create a new Niche Dive research job for an ASIN | `keyword`, `asin`, `marketplace?`, `number_of_competitors?` |
| `datadive_create_rank_radar` | Create a Rank Radar keyword tracker for an ASIN | `asin`, `niche_id`, `marketplace?`, `number_of_keywords?` |
| `datadive_ai_copywriter` | Generate optimized listing copy using AI | `niche_id`, `prompt?` (cosmo, ranking-juice, nlp, cosmo-rufus) |
| `datadive_delete_niche` | Delete a niche and all its research data | `niche_id` |
| `datadive_delete_rank_radar` | Delete a Rank Radar tracker | `rank_radar_id` |

## Example Prompts for Claude Desktop

Once the MCP server is connected, just ask Claude naturally:

### Research & Analysis
- "List my DataDive niches"
- "Show me the keywords for my zinc supplements niche"
- "What competitors are in my zinc supplements niche?"
- "Show me the ranking juice analysis for my zinc supplements niche"
- "What are the keyword roots for my zinc supplements niche?"
- "List my rank radar trackers"

### Create & Build
- "Run a dive on ASIN B0012ZQPKG for zinc supplements with 10 competitors"
- "Create a rank radar for B0012ZQPKG in my zinc supplements niche, track 100 keywords"
- "Generate optimized listing copy for my zinc supplements niche"
- "Generate cosmo-rufus copy for my zinc supplements niche and compare it to the ranking-juice version"

### Track & Monitor
- "Check the status of my latest dive"
- "Show me keyword rankings for my rank radar"

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

# Validate and pack MCPB
npm run mcpb:validate
npm run mcpb:pack

# Run discovery script (captures raw API responses)
DATADIVE_API_KEY=xxx npm run discover
```

## MCPB Release Flow

Version tags create GitHub Releases with the packaged `.mcpb` attached:

```bash
git tag v1.0.1
git push origin v1.0.1
```

The release workflow runs tests, builds the adapter, validates the MCPB manifest, packs the bundle, and uploads `release/*.mcpb` as a release asset.

## MCPB Test Checklist

- Run `npm test`.
- Run `npm run build`.
- Run `npm run mcpb:validate`.
- Run `npm run mcpb:pack`.
- Confirm `release/datadive-adapter-v1.0.1.mcpb` exists.
- Open the `.mcpb` file with Claude Desktop.
- Enter `DATADIVE_API_KEY` in the install form.
- Confirm DataDive tools appear in Claude Desktop.
- Run a low-cost call such as listing niches.
- Temporarily install with a missing or invalid key and confirm the adapter returns a clear API-key error rather than crashing.
- Push a version tag and confirm the GitHub Action attaches the `.mcpb` to the release.

## Troubleshooting

- **Claude Desktop does not show the tools:** restart Claude Desktop, confirm the extension is enabled, and reinstall the `.mcpb` if needed.
- **Missing API key errors:** reinstall or edit the extension configuration and enter a valid DataDive API key.
- **Invalid DataDive key or unauthorized responses:** verify the key works against DataDive directly and has access to the API endpoints you are calling.
- **Node/runtime errors:** use the `.mcpb` install path when possible. For manual installs, confirm `node --version` is `18` or newer.
- **Build output looks stale:** run `npm run build`, then `npm run mcpb:pack` again.
- **Network/API failures:** confirm the machine running Claude Desktop can reach `https://api.datadive.tools`.
- **Manual JSON config does not work:** use an absolute path to `dist/index.js`, keep `command` as `node`, and restart the MCP client after editing config.

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

MIT — [Voartex](https://voartex.com)
