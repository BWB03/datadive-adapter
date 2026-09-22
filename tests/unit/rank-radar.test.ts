import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataDiveClient } from "../../src/adapter/client.js";
import { getRankRadar, getRankRadarPpc, getRankRadarSqp } from "../../src/adapter/endpoints.js";
import { DataDiveSkill } from "../../src/openclaw.js";
import legacy from "../fixtures/get-rank-radar.json";

const dates = { startDate: "2026-09-01", endDate: "2026-09-22" };
const keyword = (id: string) => ({ id, keyword: `keyword ${id}`, ranks: [{ date: "2026-09-22", organicRank: 5 }] });
const page = (currentPage: number, hasNext: boolean, data = [keyword(String(currentPage))]) => ({
  success: true,
  data: { currentPage, hasNext, total: 3, data },
});
const fetchMock = vi.fn();
const reply = (body: unknown) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body)));
const request = (index: number) => new URL(fetchMock.mock.calls[index][0]);
let client: DataDiveClient;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("DATADIVE_RATE_LIMIT_BURST", "1000");
  client = new DataDiveClient({ apiKey: "test-key" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Rank Radar pagination through the HTTP client", () => {
  it("fetches every nested page, including a short middle page, and preserves dates", async () => {
    reply(page(1, true));
    reply(page(2, true));
    reply(page(3, false));
    const result = await getRankRadar(client, "rr/encoded", { ...dates, pageSize: 100 });
    expect(result.data.map((row) => row.id)).toEqual(["1", "2", "3"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 3; i++) {
      expect(request(i).pathname).toBe("/v1/niches/rank-radars/rr%2Fencoded");
      expect(Object.fromEntries(request(i).searchParams)).toEqual({
        ...dates, currentPage: String(i + 1), pageSize: "100",
      });
    }
  });

  it("accepts legacy arrays in a single request during rollout", async () => {
    reply(legacy);
    expect((await getRankRadar(client, "rr")).data).toEqual(legacy.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(request(0).searchParams.get("pageSize")).toBe("20");
  });

  it("resolves default dates once even if a later page crosses midnight", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-09-22T23:59:59Z"));
      fetchMock.mockImplementationOnce(async () => {
        vi.setSystemTime(new Date("2026-09-23T00:00:01Z"));
        return new Response(JSON.stringify(page(1, true)));
      });
      reply(page(2, false));
      await getRankRadar(client, "rr");
      for (let i = 0; i < 2; i++) {
        expect(request(i).searchParams.get("startDate")).toBe("2026-08-23");
        expect(request(i).searchParams.get("endDate")).toBe("2026-09-22");
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns an empty result when there are no tracked keywords", async () => {
    reply({ success: true, data: { currentPage: 1, total: 0, hasNext: false, data: [] } });
    expect((await getRankRadar(client, "rr")).data).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([0, -1, 101, 1.5, NaN])("rejects invalid page size %s before making a request", async (pageSize) => {
    await expect(getRankRadar(client, "rr", { pageSize })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops on a repeated page instead of looping or duplicating keywords", async () => {
    reply(page(1, true));
    reply(page(1, true));
    await expect(getRankRadar(client, "rr")).rejects.toThrow("pagination did not advance");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects an empty page that claims more results", async () => {
    reply(page(1, true, []));
    await expect(getRankRadar(client, "rr")).rejects.toThrow("pagination did not advance");
  });

  it("rejects missing pagination controls instead of silently truncating", async () => {
    reply({ success: true, data: { currentPage: 1, total: 3, data: [keyword("1")] } });
    await expect(getRankRadar(client, "rr")).rejects.toThrow();
  });

  it("rejects unsuccessful responses", async () => {
    reply({ success: false, data: [] });
    await expect(getRankRadar(client, "rr")).rejects.toThrow("unsuccessful");
  });

  it("rejects a switch to the legacy format partway through pagination", async () => {
    reply(page(1, true));
    reply(legacy);
    await expect(getRankRadar(client, "rr")).rejects.toThrow("pagination disappeared");
  });

  it("propagates later-page errors without returning partial results", async () => {
    reply(page(1, true));
    fetchMock.mockResolvedValueOnce(new Response("Rate limited", { status: 429 }));
    await expect(getRankRadar(client, "rr")).rejects.toMatchObject({ httpStatus: 429 });
  });
});

describe("dedicated PPC and SQP endpoints", () => {
  it.each([true, false])("preserves PPC metrics and serializes includeCampaigns=%s", async (includeCampaigns) => {
    const data = [{ id: "1", keyword: "hat", ppcSpend: 0, ppcSales: 123.45, sponsoredRank: null,
      campaigns: [{ campaignId: 42, campaignName: "Hats", matchType: "EXACT" }] }];
    reply(data);
    expect(await getRankRadarPpc(client, "rr/id", { ...dates, includeCampaigns })).toEqual(data);
    expect(request(0).pathname).toBe("/v1/niches/rank-radars/rr%2Fid/ppc");
    expect(Object.fromEntries(request(0).searchParams)).toEqual({ ...dates, includeCampaigns: String(includeCampaigns) });
  });

  it("preserves SQP fields and null metrics without requiring PPC fields", async () => {
    const data = [{ id: "1", keyword: "hat", searchQueryVolume: 10, clicksAsinCount: 0, ctrAsin: null }];
    reply(data);
    expect(await getRankRadarSqp(client, "rr/id", dates)).toEqual(data);
    expect(request(0).pathname).toBe("/v1/niches/rank-radars/rr%2Fid/sqp");
    expect(Object.fromEntries(request(0).searchParams)).toEqual(dates);
  });

  it("defaults both endpoints to the last 30 days and accepts empty arrays", async () => {
    reply([]);
    reply([]);
    expect(await getRankRadarPpc(client, "rr")).toEqual([]);
    expect(await getRankRadarSqp(client, "rr")).toEqual([]);
    for (let i = 0; i < 2; i++) {
      expect(request(i).searchParams.get("startDate")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(request(i).searchParams.get("endDate")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(request(i).searchParams.has("includeCampaigns")).toBe(false);
    }
  });

  it.each([getRankRadarPpc, getRankRadarSqp])("rejects malformed keyword identities", async (endpoint) => {
    reply([{ ppcSpend: 12 }]);
    await expect(endpoint(client, "rr")).rejects.toThrow();
  });
});

describe("OpenClaw Rank Radar consumers", () => {
  it("keeps the existing complete keyword_rank_history envelope", async () => {
    reply(page(1, true));
    reply(page(2, false));
    const result = await new DataDiveSkill("test-key").getRankRadar("rr", { ...dates, pageSize: 100 });
    expect(result.data_type).toBe("keyword_rank_history");
    expect(result.data).toMatchObject([
      { keyword_id: "1", ranks: [{ organic_rank: 5 }] },
      { keyword_id: "2", ranks: [{ organic_rank: 5 }] },
    ]);
    expect(result.pagination).toBeUndefined();
  });

  it("exposes dedicated PPC and SQP envelopes without dropping native metrics", async () => {
    const skill = new DataDiveSkill("test-key");
    const ppc = [{ id: "1", keyword: "hat", ppcSpend: 10 }];
    const sqp = [{ id: "1", keyword: "hat", searchQueryVolume: 100 }];
    reply(ppc);
    reply(sqp);
    expect(await skill.getRankRadarPpc("rr", { ...dates, includeCampaigns: true })).toMatchObject({ data_type: "rank_radar_ppc", data: ppc });
    expect(await skill.getRankRadarSqp("rr", dates)).toMatchObject({ data_type: "rank_radar_sqp", data: sqp });
  });

  it("returns an error envelope if a later keyword page fails", async () => {
    reply(page(1, true));
    fetchMock.mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));
    expect(await new DataDiveSkill("test-key").getRankRadar("rr")).toMatchObject({ data_type: "error", data: null, error: { code: "datadive_403" } });
  });
});
