import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { DataDiveClient, DataDiveApiError } from "../../src/adapter/client.js";
import { TokenBucket } from "../../src/utils/rate-limit.js";

// Mock a no-delay bucket for tests
function instantBucket() {
  return {
    acquire: vi.fn().mockResolvedValue(undefined),
  } as unknown as TokenBucket;
}

describe("DataDiveClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws if no API key", () => {
    const orig = process.env.DATADIVE_API_KEY;
    delete process.env.DATADIVE_API_KEY;
    expect(() => new DataDiveClient({ apiKey: "" })).toThrow(
      "DATADIVE_API_KEY is required"
    );
    if (orig) process.env.DATADIVE_API_KEY = orig;
  });

  it("sends x-api-key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ value: 42 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataDiveClient({
      apiKey: "test-key",
      bucket: instantBucket(),
    });

    await client.get("/test", z.object({ value: z.number() }));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["x-api-key"]).toBe("test-key");
  });

  it("appends query params", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataDiveClient({
      apiKey: "test-key",
      bucket: instantBucket(),
    });

    await client.get("/test", z.object({}), { page: 2, pageSize: 10 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=10");
  });

  it("skips undefined params", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataDiveClient({
      apiKey: "test-key",
      bucket: instantBucket(),
    });

    await client.get("/test", z.object({}), {
      page: 1,
      pageSize: undefined,
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=1");
    expect(url).not.toContain("pageSize");
  });

  it("throws DataDiveApiError on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve("bad key"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataDiveClient({
      apiKey: "bad-key",
      bucket: instantBucket(),
    });

    await expect(
      client.get("/test", z.object({}))
    ).rejects.toThrow(DataDiveApiError);
  });

  it("validates response with Zod schema", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ wrong: "shape" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataDiveClient({
      apiKey: "test-key",
      bucket: instantBucket(),
    });

    await expect(
      client.get("/test", z.object({ value: z.number() }))
    ).rejects.toThrow();
  });

  it("acquires rate limit token before each request", async () => {
    const bucket = instantBucket();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataDiveClient({
      apiKey: "test-key",
      bucket,
    });

    await client.get("/a", z.object({}));
    await client.get("/b", z.object({}));

    expect(bucket.acquire).toHaveBeenCalledTimes(2);
  });
});
