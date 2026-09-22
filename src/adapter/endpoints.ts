import { z } from "zod";
import { DataDiveClient } from "./client.js";
import {
  ListNichesResponseSchema,
  GetKeywordsResponseSchema,
  GetCompetitorsResponseSchema,
  GetRankingJuicesResponseSchema,
  GetKeywordRootsResponseSchema,
  ListRankRadarsResponseSchema,
  GetRankRadarResponseSchema,
  GetRankRadarPpcResponseSchema,
  GetRankRadarSqpResponseSchema,
  KrtKeywordSchema,
  GetDiveStatusResponseSchema,
  CreateDiveResponseSchema,
  CreateRankRadarResponseSchema,
  AiCopywriterResponseSchema,
  DeleteNicheResponseSchema,
  DeleteRankRadarResponseSchema,
} from "../schema/datadive.js";

export async function listNiches(
  client: DataDiveClient,
  opts?: { page?: number; pageSize?: number }
) {
  // DataDive's API names the page selector `currentPage`, not `page`
  // (see GET /v1/niches in the DataDive OpenAPI spec). Sending `page`
  // is silently ignored and the API always returns page 1.
  return client.get("/v1/niches", ListNichesResponseSchema, {
    currentPage: opts?.page,
    pageSize: opts?.pageSize,
  });
}

export async function getKeywords(
  client: DataDiveClient,
  nicheId: string
) {
  return client.get(
    `/v1/niches/${encodeURIComponent(nicheId)}/keywords`,
    GetKeywordsResponseSchema
  );
}

export async function getCompetitors(
  client: DataDiveClient,
  nicheId: string
) {
  return client.get(
    `/v1/niches/${encodeURIComponent(nicheId)}/competitors`,
    GetCompetitorsResponseSchema
  );
}

export async function getRankingJuices(
  client: DataDiveClient,
  nicheId: string
) {
  return client.get(
    `/v1/niches/${encodeURIComponent(nicheId)}/ranking-juices`,
    GetRankingJuicesResponseSchema
  );
}

export async function getKeywordRoots(
  client: DataDiveClient,
  nicheId: string
) {
  return client.get(
    `/v1/niches/${encodeURIComponent(nicheId)}/roots`,
    GetKeywordRootsResponseSchema
  );
}

export async function listRankRadars(
  client: DataDiveClient,
  opts?: {
    page?: number;
    pageSize?: number;
    nicheId?: string;
    status?: "ALL" | "PAUSED";
    searchText?: string;
  }
) {
  // DataDive's API names the page selector `currentPage`, not `page` (the
  // adapter previously sent `page`, which the API ignores — every call
  // returned page 1). It also supports `nicheId`/`status`/`searchText`
  // filters; `searchText` matches an ASIN or product title, which is the
  // server-side ASIN filter callers want. See GET /v1/niches/rank-radars
  // in the DataDive OpenAPI spec. Undefined values are dropped by client.get.
  return client.get("/v1/niches/rank-radars", ListRankRadarsResponseSchema, {
    currentPage: opts?.page,
    pageSize: opts?.pageSize,
    nicheId: opts?.nicheId,
    status: opts?.status,
    searchText: opts?.searchText,
  });
}

export interface RankRadarDateOptions {
  startDate?: string;
  endDate?: string;
}

export interface RankRadarOptions extends RankRadarDateOptions {
  pageSize?: number;
}

function rankRadarDates(opts?: RankRadarDateOptions) {
  // Resolve once per operation, so every page uses the same date range.
  const end = opts?.endDate ?? new Date().toISOString().slice(0, 10);
  const start =
    opts?.startDate ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return { startDate: start, endDate: end };
}

export async function getRankRadar(
  client: DataDiveClient,
  rankRadarId: string,
  opts?: RankRadarOptions
) {
  const pageSize = z.number().int().min(1).max(100).parse(opts?.pageSize ?? 20);
  const dates = rankRadarDates(opts);
  const keywords: z.infer<typeof KrtKeywordSchema>[] = [];
  let currentPage = 1;

  while (true) {
    const response = await client.get(
      `/v1/niches/rank-radars/${encodeURIComponent(rankRadarId)}`,
      GetRankRadarResponseSchema,
      { ...dates, currentPage, pageSize }
    );
    if (!response.success) throw new Error("DataDive Rank Radar request was unsuccessful");
    if (Array.isArray(response.data)) {
      if (currentPage !== 1) throw new Error("DataDive Rank Radar pagination disappeared mid-request");
      return { success: true, data: response.data };
    }

    const page = response.data;
    if (page.currentPage !== currentPage || (page.hasNext && page.data.length === 0)) {
      throw new Error("DataDive Rank Radar pagination did not advance");
    }
    keywords.push(...page.data);
    if (!page.hasNext) return { success: true, data: keywords };
    currentPage = page.currentPage + 1;
  }
}

export async function getRankRadarPpc(
  client: DataDiveClient,
  rankRadarId: string,
  opts?: RankRadarDateOptions & { includeCampaigns?: boolean }
) {
  return client.get(
    `/v1/niches/rank-radars/${encodeURIComponent(rankRadarId)}/ppc`,
    GetRankRadarPpcResponseSchema,
    {
      ...rankRadarDates(opts),
      includeCampaigns: opts?.includeCampaigns === undefined ? undefined : String(opts.includeCampaigns),
    }
  );
}

export async function getRankRadarSqp(
  client: DataDiveClient,
  rankRadarId: string,
  opts?: RankRadarDateOptions
) {
  return client.get(
    `/v1/niches/rank-radars/${encodeURIComponent(rankRadarId)}/sqp`,
    GetRankRadarSqpResponseSchema,
    rankRadarDates(opts)
  );
}

export async function getDiveStatus(
  client: DataDiveClient,
  diveId: string
) {
  return client.get(
    `/v1/niches/dives/${encodeURIComponent(diveId)}`,
    GetDiveStatusResponseSchema
  );
}

// =====================
// Phase 2: Write Endpoints
// =====================

export async function createDive(
  client: DataDiveClient,
  opts: {
    keyword: string;
    asin: string;
    marketplace?: string;
    numberOfCompetitors?: number;
  }
) {
  return client.post("/v1/niches/dives", CreateDiveResponseSchema, {
    keyword: opts.keyword,
    asin: opts.asin,
    marketplace: opts.marketplace ?? "com",
    numberOfCompetitors: opts.numberOfCompetitors ?? 17,
  });
}

export async function createRankRadar(
  client: DataDiveClient,
  opts: {
    asin: string;
    nicheId: string;
    marketplace?: string;
    numberOfKeywords?: number;
  }
) {
  return client.post("/v1/niches/rank-radars", CreateRankRadarResponseSchema, {
    asin: opts.asin,
    nicheId: opts.nicheId,
    marketplace: opts.marketplace ?? "com",
    numberOfKeywords: opts.numberOfKeywords ?? 50,
  });
}

export async function triggerAiCopywriter(
  client: DataDiveClient,
  nicheId: string,
  prompt?: string
) {
  return client.post(
    `/v1/niches/${encodeURIComponent(nicheId)}/ai-copywriter`,
    AiCopywriterResponseSchema,
    { prompt: prompt ?? "ranking-juice" }
  );
}

export async function deleteNiche(
  client: DataDiveClient,
  nicheId: string
) {
  return client.delete(
    `/v1/niches/${encodeURIComponent(nicheId)}`,
    DeleteNicheResponseSchema
  );
}

export async function deleteRankRadar(
  client: DataDiveClient,
  rankRadarId: string
) {
  return client.delete(
    `/v1/niches/rank-radars/${encodeURIComponent(rankRadarId)}`,
    DeleteRankRadarResponseSchema
  );
}
