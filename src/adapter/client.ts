import { ZodSchema } from "zod";
import { BASE_URL, DEFAULT_TIMEOUT_MS } from "../constants.js";
import { TokenBucket } from "../utils/rate-limit.js";

export class DataDiveApiError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "DataDiveApiError";
  }
}

export class DataDiveClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly bucket: TokenBucket;

  constructor(opts?: {
    apiKey?: string;
    baseUrl?: string;
    timeoutMs?: number;
    bucket?: TokenBucket;
  }) {
    this.apiKey =
      opts?.apiKey ?? process.env.DATADIVE_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error(
        "DATADIVE_API_KEY is required. Set it as an environment variable or pass it to the constructor."
      );
    }
    this.baseUrl = opts?.baseUrl ?? BASE_URL;
    this.timeoutMs =
      opts?.timeoutMs ??
      (Number(process.env.DATADIVE_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS);
    this.bucket = opts?.bucket ?? new TokenBucket();
  }

  async get<T>(path: string, schema: ZodSchema<T>, params?: Record<string, string | number | undefined>): Promise<T> {
    await this.bucket.acquire();

    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v != null) url.searchParams.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url.toString(), {
        headers: { "x-api-key": this.apiKey },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => undefined);
        throw new DataDiveApiError(
          `DataDive API ${res.status}: ${res.statusText}`,
          res.status,
          body
        );
      }

      const json = await res.json();
      return schema.parse(json);
    } catch (err) {
      if (err instanceof DataDiveApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new DataDiveApiError(
          `DataDive API request timed out after ${this.timeoutMs}ms`,
          408
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
