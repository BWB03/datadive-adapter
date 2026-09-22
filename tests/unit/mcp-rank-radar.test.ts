import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import manifest from "../../manifest.json";

const { registered } = vi.hoisted(() => ({ registered: new Map<string, { schema: z.ZodRawShape; handler: (args: any) => Promise<any> }>() }));
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(name: string, _description: string, schema: z.ZodRawShape, handler: (args: any) => Promise<any>) {
      registered.set(name, { schema, handler });
    }
    async connect() {}
  },
}));
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({ StdioServerTransport: class {} }));

const fetchMock = vi.fn();
const dates = { start_date: "2026-09-01", end_date: "2026-09-22" };
async function call(name: string, args: unknown) {
  const tool = registered.get(name)!;
  return tool.handler(z.object(tool.schema).parse(args));
}
const reply = (body: unknown) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body)));

beforeAll(async () => {
  vi.stubEnv("DATADIVE_API_KEY", "test-key");
  vi.stubEnv("DATADIVE_RATE_LIMIT_BURST", "1000");
  await import("../../src/index.js");
});
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());

describe("MCP Rank Radar tools", () => {
  it("returns a complete history envelope from the nested paginated API", async () => {
    for (let currentPage = 1; currentPage <= 2; currentPage++) {
      reply({ success: true, data: {
        currentPage, total: 2, hasNext: currentPage === 1,
        data: [{ id: String(currentPage), keyword: `term ${currentPage}`, ranks: [{ date: "2026-09-22", organicRank: 3 }] }],
      } });
    }
    const result = await call("datadive_get_rank_radar", { rank_radar_id: "rr", ...dates, page_size: 100 });
    expect(result.isError).toBeUndefined();
    const envelope = JSON.parse(result.content[0].text);
    expect(envelope.data_type).toBe("keyword_rank_history");
    expect(envelope.data.map((row: any) => row.keyword_id)).toEqual(["1", "2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const url = new URL(fetchMock.mock.calls[1][0]);
    expect(Object.fromEntries(url.searchParams)).toEqual({ startDate: dates.start_date, endDate: dates.end_date, currentPage: "2", pageSize: "100" });
  });

  it.each([0, 101, 1.5])("rejects invalid page_size %s at the MCP boundary", async (page_size) => {
    await expect(call("datadive_get_rank_radar", { rank_radar_id: "rr", page_size })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["ppc", "sqp"])("routes %s reads to the dedicated endpoint", async (kind) => {
    const data = [{ id: "kw", keyword: "hat", ...(kind === "ppc" ? { ppcSpend: 10, campaigns: [] } : { ctrAsin: null }) }];
    reply(data);
    const result = await call(`datadive_get_rank_radar_${kind}`, { rank_radar_id: "rr/id", ...dates, include_campaigns: true });
    expect(JSON.parse(result.content[0].text)).toMatchObject({ data_type: `rank_radar_${kind}`, data });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe(`/v1/niches/rank-radars/rr%2Fid/${kind}`);
    expect(url.searchParams.get("startDate")).toBe(dates.start_date);
    expect(url.searchParams.get("endDate")).toBe(dates.end_date);
    expect(url.searchParams.get("includeCampaigns")).toBe(kind === "ppc" ? "true" : null);
  });

  it("reports later-page failures as MCP errors with no partial data", async () => {
    reply({ success: true, data: { currentPage: 1, total: 2, hasNext: true, data: [{ keyword: "hat" }] } });
    fetchMock.mockResolvedValueOnce(new Response("Rate limited", { status: 429 }));
    const result = await call("datadive_get_rank_radar", { rank_radar_id: "rr" });
    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toMatchObject({ data_type: "error", data: null, error: { code: "datadive_429" } });
  });

  it.each(["ppc", "sqp"])("reports dedicated %s endpoint errors", async (kind) => {
    fetchMock.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));
    const result = await call(`datadive_get_rank_radar_${kind}`, { rank_radar_id: "rr" });
    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toMatchObject({ data: null, error: { code: "datadive_401" } });
  });

  it("declares all registered tools in the MCPB manifest", () => {
    expect(manifest.tools.map((tool) => tool.name).sort()).toEqual([...registered.keys()].sort());
  });
});
