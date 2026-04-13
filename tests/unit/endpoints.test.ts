import { describe, it, expect, vi } from "vitest";
import { DataDiveClient } from "../../src/adapter/client.js";
import {
  listNiches,
  getKeywords,
  getCompetitors,
  getRankingJuices,
  getKeywordRoots,
  listRankRadars,
  getRankRadar,
} from "../../src/adapter/endpoints.js";
import listNichesFixture from "../fixtures/list-niches.json";
import getKeywordsFixture from "../fixtures/get-keywords.json";
import getCompetitorsFixture from "../fixtures/get-competitors.json";
import getRankingJuicesFixture from "../fixtures/get-ranking-juices.json";
import getKeywordRootsFixture from "../fixtures/get-keyword-roots.json";
import listRankRadarsFixture from "../fixtures/list-rank-radars.json";

function mockClient(response: unknown) {
  return {
    get: vi.fn().mockResolvedValue(response),
  } as unknown as DataDiveClient;
}

describe("endpoints", () => {
  it("listNiches calls correct path", async () => {
    const client = mockClient(listNichesFixture);
    const result = await listNiches(client, { page: 2, pageSize: 10 });
    expect(client.get).toHaveBeenCalledWith(
      "/v1/niches",
      expect.anything(),
      { page: 2, pageSize: 10 }
    );
    expect(result.data).toHaveLength(2);
  });

  it("getKeywords calls correct path and returns data wrapper", async () => {
    const client = mockClient(getKeywordsFixture);
    const result = await getKeywords(client, "WBcpBay2EO");
    expect(client.get).toHaveBeenCalledWith(
      "/v1/niches/WBcpBay2EO/keywords",
      expect.anything()
    );
    expect(result.data.keywords).toHaveLength(2);
  });

  it("getCompetitors calls correct path and returns data wrapper", async () => {
    const client = mockClient(getCompetitorsFixture);
    const result = await getCompetitors(client, "WBcpBay2EO");
    expect(client.get).toHaveBeenCalledWith(
      "/v1/niches/WBcpBay2EO/competitors",
      expect.anything()
    );
    expect(result.data.competitors).toHaveLength(1);
    expect(result.data.marketplace).toBe("com");
  });

  it("getRankingJuices calls correct path", async () => {
    const client = mockClient(getRankingJuicesFixture);
    const result = await getRankingJuices(client, "WBcpBay2EO");
    expect(result.data.currentListing.rankingJuice).toBe(1902847);
  });

  it("getKeywordRoots calls correct path", async () => {
    const client = mockClient(getKeywordRootsFixture);
    const result = await getKeywordRoots(client, "WBcpBay2EO");
    expect(result.data.keywords).toHaveLength(2);
  });

  it("listRankRadars calls correct path (double nested data)", async () => {
    const client = mockClient(listRankRadarsFixture);
    const result = await listRankRadars(client);
    expect(client.get).toHaveBeenCalledWith(
      "/v1/niches/rank-radars",
      expect.anything(),
      { page: undefined, pageSize: undefined }
    );
    expect(result.data.data).toHaveLength(1);
  });

  it("getRankRadar passes startDate/endDate params with defaults", async () => {
    const client = mockClient({});
    await getRankRadar(client, "rr-abc");
    expect(client.get).toHaveBeenCalledWith(
      "/v1/niches/rank-radars/rr-abc",
      expect.anything(),
      expect.objectContaining({
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );
  });

  it("getRankRadar uses custom dates when provided", async () => {
    const client = mockClient({});
    await getRankRadar(client, "rr-abc", {
      startDate: "2026-01-01",
      endDate: "2026-03-01",
    });
    expect(client.get).toHaveBeenCalledWith(
      "/v1/niches/rank-radars/rr-abc",
      expect.anything(),
      { startDate: "2026-01-01", endDate: "2026-03-01" }
    );
  });
});
