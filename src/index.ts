import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { DataDiveClient, DataDiveApiError } from "./adapter/client.js";
import {
  listNiches,
  getKeywords,
  getCompetitors,
  getRankingJuices,
  getKeywordRoots,
  listRankRadars,
  getRankRadar,
  getDiveStatus,
  createDive,
  createRankRadar,
  triggerAiCopywriter,
  deleteNiche,
  deleteRankRadar,
} from "./adapter/endpoints.js";
import {
  toUniversalEnvelope,
  toErrorEnvelope,
  transformNiche,
  transformKeyword,
  transformCompetitor,
  transformNicheStatistics,
  transformRankingJuices,
  transformKeywordRoot,
  transformRankTracker,
  transformKeywordRankHistory,
  transformPassthrough,
} from "./adapter/transformer.js";
import { extractPagination } from "./utils/pagination.js";

const client = new DataDiveClient();
const server = new McpServer({
  name: "datadive-adapter",
  version: "1.0.0",
});

function errorResult(err: unknown) {
  const envelope =
    err instanceof DataDiveApiError
      ? toErrorEnvelope(
          `datadive_${err.httpStatus}`,
          err.message,
          err.httpStatus
        )
      : toErrorEnvelope(
          "adapter_error",
          err instanceof Error ? err.message : "Unknown error"
        );
  return { content: [{ type: "text" as const, text: JSON.stringify(envelope, null, 2) }], isError: true };
}

// --- 1. List Niches ---
server.tool(
  "datadive_list_niches",
  "List all niches configured in DataDive. Returns niche IDs, hero keywords, labels, and marketplace.",
  { page: z.number().int().optional(), page_size: z.number().int().optional() },
  async ({ page, page_size }) => {
    try {
      const raw = await listNiches(client, { page, pageSize: page_size });
      const data = raw.data.map(transformNiche);
      const envelope = toUniversalEnvelope("niche_summary", data, {
        pagination: extractPagination(raw),
      });
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 2. Get Keywords ---
server.tool(
  "datadive_get_keywords",
  "Get the master keyword list for a niche including search volume, relevancy, organic ranks, and sponsored ranks.",
  { niche_id: z.string() },
  async ({ niche_id }) => {
    try {
      const raw = await getKeywords(client, niche_id);
      const data = raw.data.keywords.map(transformKeyword);
      const envelope = toUniversalEnvelope("keyword_ranking", data);
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 3. Get Competitors ---
server.tool(
  "datadive_get_competitors",
  "Get competitor ASINs and niche statistics for a given niche.",
  { niche_id: z.string() },
  async ({ niche_id }) => {
    try {
      const raw = await getCompetitors(client, niche_id);
      const competitors = raw.data.competitors.map(transformCompetitor);
      const statistics = transformNicheStatistics(raw.data);
      const envelope = toUniversalEnvelope("competitor", {
        statistics,
        competitors,
      }, { marketplace: raw.data.marketplace });
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 4. Get Ranking Juices ---
server.tool(
  "datadive_get_ranking_juices",
  "Get ranking factor analysis for a niche showing what drives organic rank.",
  { niche_id: z.string() },
  async ({ niche_id }) => {
    try {
      const raw = await getRankingJuices(client, niche_id);
      const data = transformRankingJuices(raw.data);
      const envelope = toUniversalEnvelope("ranking_juice", data);
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 5. Get Keyword Roots ---
server.tool(
  "datadive_get_keyword_roots",
  "Get keyword root groupings for a niche showing how keywords cluster together.",
  { niche_id: z.string() },
  async ({ niche_id }) => {
    try {
      const raw = await getKeywordRoots(client, niche_id);
      const data = raw.data.keywords.map(transformKeywordRoot);
      const envelope = toUniversalEnvelope("keyword_root", data);
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 6. List Rank Radars ---
server.tool(
  "datadive_list_rank_radars",
  "List all Rank Radar keyword trackers. Returns ASIN, keyword count, and top 10/50 ranking summary metrics.",
  { page: z.number().int().optional(), page_size: z.number().int().optional() },
  async ({ page, page_size }) => {
    try {
      const raw = await listRankRadars(client, { page, pageSize: page_size });
      const inner = raw.data;
      const data = inner.data.map(transformRankTracker);
      const envelope = toUniversalEnvelope("rank_tracker", data, {
        pagination: extractPagination(inner),
      });
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 7. Get Rank Radar ---
server.tool(
  "datadive_get_rank_radar",
  "Get keyword ranking data for a specific Rank Radar tracker including historical rank positions and search volume.",
  { rank_radar_id: z.string() },
  async ({ rank_radar_id }) => {
    try {
      const raw = await getRankRadar(client, rank_radar_id);
      const envelope = toUniversalEnvelope("keyword_rank_history", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 8. Get Dive Status ---
server.tool(
  "datadive_get_dive_status",
  "Check the status of a Niche Dive research job.",
  { dive_id: z.string() },
  async ({ dive_id }) => {
    try {
      const raw = await getDiveStatus(client, dive_id);
      const envelope = toUniversalEnvelope("dive_status", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// =====================
// Phase 2: Write Tools
// =====================

// --- 9. Create Dive ---
server.tool(
  "datadive_create_dive",
  "Create a new Niche Dive research job. Kicks off keyword research for a given search term. Use datadive_get_dive_status to check progress.",
  {
    keyword: z.string().describe("The search term / hero keyword to research"),
    marketplace: z.string().optional().describe("Amazon marketplace (default: com)"),
    asins: z.array(z.string()).optional().describe("Optional list of competitor ASINs to include"),
  },
  async ({ keyword, marketplace, asins }) => {
    try {
      const raw = await createDive(client, { keyword, marketplace, asins });
      const envelope = toUniversalEnvelope("dive_created", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 10. Create Rank Radar ---
server.tool(
  "datadive_create_rank_radar",
  "Create a new Rank Radar keyword tracker for an ASIN. Tracks keyword ranking positions over time.",
  {
    asin: z.string().describe("The Amazon ASIN to track"),
    marketplace: z.string().optional().describe("Amazon marketplace (default: com)"),
  },
  async ({ asin, marketplace }) => {
    try {
      const raw = await createRankRadar(client, { asin, marketplace });
      const envelope = toUniversalEnvelope("rank_radar_created", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 11. AI Copywriter ---
server.tool(
  "datadive_ai_copywriter",
  "Trigger the AI Copywriter for a niche. Generates optimized listing copy based on keyword research data.",
  { niche_id: z.string().describe("The DataDive niche ID") },
  async ({ niche_id }) => {
    try {
      const raw = await triggerAiCopywriter(client, niche_id);
      const envelope = toUniversalEnvelope("ai_copywriter", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 12. Delete Niche ---
server.tool(
  "datadive_delete_niche",
  "Delete a niche and all its associated research data. This action cannot be undone.",
  { niche_id: z.string().describe("The DataDive niche ID to delete") },
  async ({ niche_id }) => {
    try {
      const raw = await deleteNiche(client, niche_id);
      const envelope = toUniversalEnvelope("niche_deleted", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

// --- 13. Delete Rank Radar ---
server.tool(
  "datadive_delete_rank_radar",
  "Delete a Rank Radar keyword tracker. This action cannot be undone.",
  { rank_radar_id: z.string().describe("The Rank Radar tracker ID to delete") },
  async ({ rank_radar_id }) => {
    try {
      const raw = await deleteRankRadar(client, rank_radar_id);
      const envelope = toUniversalEnvelope("rank_radar_deleted", transformPassthrough(raw));
      return { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] };
    } catch (err) {
      return errorResult(err);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
