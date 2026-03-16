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
import type { UniversalEnvelope } from "./schema/universal.js";

export class DataDiveSkill {
  private client: DataDiveClient;

  constructor(apiKey?: string) {
    this.client = new DataDiveClient({ apiKey });
  }

  private handleError(err: unknown): UniversalEnvelope {
    if (err instanceof DataDiveApiError) {
      return toErrorEnvelope(
        `datadive_${err.httpStatus}`,
        err.message,
        err.httpStatus
      );
    }
    return toErrorEnvelope(
      "adapter_error",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  async listNiches(opts?: {
    page?: number;
    pageSize?: number;
  }): Promise<UniversalEnvelope> {
    try {
      const raw = await listNiches(this.client, opts);
      return toUniversalEnvelope("niche_summary", raw.data.map(transformNiche), {
        pagination: extractPagination(raw),
      });
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getKeywords(nicheId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await getKeywords(this.client, nicheId);
      return toUniversalEnvelope(
        "keyword_ranking",
        raw.data.keywords.map(transformKeyword)
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getCompetitors(nicheId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await getCompetitors(this.client, nicheId);
      const competitors = raw.data.competitors.map(transformCompetitor);
      const statistics = transformNicheStatistics(raw.data);
      return toUniversalEnvelope("competitor", {
        statistics,
        competitors,
      }, { marketplace: raw.data.marketplace });
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getRankingJuices(nicheId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await getRankingJuices(this.client, nicheId);
      return toUniversalEnvelope(
        "ranking_juice",
        transformRankingJuices(raw.data)
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getKeywordRoots(nicheId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await getKeywordRoots(this.client, nicheId);
      return toUniversalEnvelope(
        "keyword_root",
        raw.data.keywords.map(transformKeywordRoot)
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listRankRadars(opts?: {
    page?: number;
    pageSize?: number;
  }): Promise<UniversalEnvelope> {
    try {
      const raw = await listRankRadars(this.client, opts);
      const inner = raw.data;
      return toUniversalEnvelope(
        "rank_tracker",
        inner.data.map(transformRankTracker),
        { pagination: extractPagination(inner) }
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getRankRadar(rankRadarId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await getRankRadar(this.client, rankRadarId);
      return toUniversalEnvelope(
        "keyword_rank_history",
        transformPassthrough(raw)
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getDiveStatus(diveId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await getDiveStatus(this.client, diveId);
      return toUniversalEnvelope("dive_status", transformPassthrough(raw));
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Phase 2: Write methods

  async createDive(opts: {
    keyword: string;
    marketplace?: string;
    asins?: string[];
  }): Promise<UniversalEnvelope> {
    try {
      const raw = await createDive(this.client, opts);
      return toUniversalEnvelope("dive_created", transformPassthrough(raw));
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createRankRadar(opts: {
    asin: string;
    marketplace?: string;
  }): Promise<UniversalEnvelope> {
    try {
      const raw = await createRankRadar(this.client, opts);
      return toUniversalEnvelope("rank_radar_created", transformPassthrough(raw));
    } catch (err) {
      return this.handleError(err);
    }
  }

  async triggerAiCopywriter(nicheId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await triggerAiCopywriter(this.client, nicheId);
      return toUniversalEnvelope("ai_copywriter", transformPassthrough(raw));
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteNiche(nicheId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await deleteNiche(this.client, nicheId);
      return toUniversalEnvelope("niche_deleted", transformPassthrough(raw));
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteRankRadar(rankRadarId: string): Promise<UniversalEnvelope> {
    try {
      const raw = await deleteRankRadar(this.client, rankRadarId);
      return toUniversalEnvelope("rank_radar_deleted", transformPassthrough(raw));
    } catch (err) {
      return this.handleError(err);
    }
  }
}
