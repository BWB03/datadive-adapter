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
  return client.get("/v1/niches", ListNichesResponseSchema, {
    page: opts?.page,
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
  opts?: { page?: number; pageSize?: number }
) {
  return client.get("/v1/niches/rank-radars", ListRankRadarsResponseSchema, {
    page: opts?.page,
    pageSize: opts?.pageSize,
  });
}

export async function getRankRadar(
  client: DataDiveClient,
  rankRadarId: string
) {
  return client.get(
    `/v1/niches/rank-radars/${encodeURIComponent(rankRadarId)}`,
    GetRankRadarResponseSchema
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
    marketplace?: string;
    asins?: string[];
  }
) {
  return client.post("/v1/niches/dives", CreateDiveResponseSchema, {
    keyword: opts.keyword,
    marketplace: opts.marketplace ?? "com",
    ...(opts.asins?.length ? { asins: opts.asins } : {}),
  });
}

export async function createRankRadar(
  client: DataDiveClient,
  opts: {
    asin: string;
    marketplace?: string;
  }
) {
  return client.post("/v1/niches/rank-radars", CreateRankRadarResponseSchema, {
    asin: opts.asin,
    marketplace: opts.marketplace ?? "com",
  });
}

export async function triggerAiCopywriter(
  client: DataDiveClient,
  nicheId: string
) {
  return client.post(
    `/v1/niches/${encodeURIComponent(nicheId)}/ai-copywriter`,
    AiCopywriterResponseSchema
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
