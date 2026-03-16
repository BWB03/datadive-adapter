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
