import {
  DEFAULT_RATE_LIMIT_RPS,
  DEFAULT_RATE_LIMIT_BURST,
} from "../constants.js";

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(
    rps = Number(process.env.DATADIVE_RATE_LIMIT_RPS) || DEFAULT_RATE_LIMIT_RPS,
    burst = Number(process.env.DATADIVE_RATE_LIMIT_BURST) ||
      DEFAULT_RATE_LIMIT_BURST
  ) {
    this.maxTokens = burst;
    this.tokens = burst;
    this.refillRate = rps / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitMs = Math.ceil((1 - this.tokens) / this.refillRate);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.refill();
    this.tokens -= 1;
  }
}
