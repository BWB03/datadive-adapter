import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the endpoints module before importing DataDiveSkill
vi.mock("../../src/adapter/endpoints.js", () => ({
  listNiches: vi.fn(),
  getKeywords: vi.fn(),
  getCompetitors: vi.fn(),
  getRankingJuices: vi.fn(),
  getKeywordRoots: vi.fn(),
  listRankRadars: vi.fn(),
  getRankRadar: vi.fn(),
  getDiveStatus: vi.fn(),
}));

// Must also mock the client so constructor doesn't throw
vi.mock("../../src/adapter/client.js", () => ({
  DataDiveClient: vi.fn().mockImplementation(() => ({})),
  DataDiveApiError: class extends Error {
    httpStatus: number;
    constructor(msg: string, status: number) {
      super(msg);
      this.httpStatus = status;
      this.name = "DataDiveApiError";
    }
  },
}));

import { DataDiveSkill } from "../../src/openclaw.js";
import * as endpoints from "../../src/adapter/endpoints.js";
import listNichesFixture from "../fixtures/list-niches.json";
import getKeywordsFixture from "../fixtures/get-keywords.json";
import getCompetitorsFixture from "../fixtures/get-competitors.json";
import getRankingJuicesFixture from "../fixtures/get-ranking-juices.json";
import getKeywordRootsFixture from "../fixtures/get-keyword-roots.json";

describe("DataDiveSkill", () => {
  let skill: DataDiveSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new DataDiveSkill("test-key");
  });

  it("listNiches returns universal envelope", async () => {
    vi.mocked(endpoints.listNiches).mockResolvedValue(listNichesFixture as any);

    const result = await skill.listNiches();
    expect(result.source).toBe("datadive");
    expect(result.data_type).toBe("niche_summary");
    expect(Array.isArray(result.data)).toBe(true);
    const data = result.data as any[];
    expect(data[0].niche_id).toBe("z515cGOFg3");
    expect(data[0].hero_keyword).toBe("dog hat");
  });

  it("getKeywords returns keyword rankings", async () => {
    vi.mocked(endpoints.getKeywords).mockResolvedValue(getKeywordsFixture as any);

    const result = await skill.getKeywords("WBcpBay2EO");
    expect(result.data_type).toBe("keyword_ranking");
    const data = result.data as any[];
    expect(data[0].keyword).toBe("zinc supplements");
    expect(data[0].search_volume).toBe(240842);
  });

  it("getCompetitors returns structured competitor data", async () => {
    vi.mocked(endpoints.getCompetitors).mockResolvedValue(getCompetitorsFixture as any);

    const result = await skill.getCompetitors("WBcpBay2EO");
    expect(result.data_type).toBe("competitor");
    expect(result.marketplace).toBe("com");
    const data = result.data as any;
    expect(data.statistics.num_keywords).toBe(4996);
    expect(data.competitors[0].asin).toBe("B0098U0QC0");
    expect(data.competitors[0].brand).toBe("Garden of Life");
  });

  it("getRankingJuices returns structured ranking juice data", async () => {
    vi.mocked(endpoints.getRankingJuices).mockResolvedValue(getRankingJuicesFixture as any);

    const result = await skill.getRankingJuices("WBcpBay2EO");
    expect(result.data_type).toBe("ranking_juice");
    const data = result.data as any;
    expect(data.current_listing.total_ranking_juice).toBe(1902847);
    expect(data.optimized_listing.total_ranking_juice).toBe(2429811);
  });

  it("getKeywordRoots returns keyword root data", async () => {
    vi.mocked(endpoints.getKeywordRoots).mockResolvedValue(getKeywordRootsFixture as any);

    const result = await skill.getKeywordRoots("WBcpBay2EO");
    expect(result.data_type).toBe("keyword_root");
    const data = result.data as any[];
    expect(data[0].keyword).toBe("zinc");
    expect(data[0].competing_products).toBe(10000);
  });

  it("handles errors gracefully", async () => {
    const { DataDiveApiError } = await import("../../src/adapter/client.js");
    vi.mocked(endpoints.listNiches).mockRejectedValue(
      new DataDiveApiError("Unauthorized", 401)
    );

    const result = await skill.listNiches();
    expect(result.data_type).toBe("error");
    expect(result.error?.code).toBe("datadive_401");
    expect(result.data).toBeNull();
  });
});
