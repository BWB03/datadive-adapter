import { describe, it, expect } from "vitest";
import { TokenBucket } from "../../src/utils/rate-limit.js";

describe("TokenBucket", () => {
  it("allows burst requests immediately", async () => {
    const bucket = new TokenBucket(10, 3);
    const start = Date.now();
    await bucket.acquire();
    await bucket.acquire();
    await bucket.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("delays after burst is exhausted", async () => {
    const bucket = new TokenBucket(10, 1); // 1 burst, 10 rps
    await bucket.acquire(); // uses the 1 burst token
    const start = Date.now();
    await bucket.acquire(); // must wait ~100ms for refill
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(50);
  });

  it("refills tokens over time", async () => {
    const bucket = new TokenBucket(100, 1); // 100 rps, 1 burst
    await bucket.acquire(); // drain
    await new Promise((r) => setTimeout(r, 50)); // wait for ~5 tokens
    // Should succeed quickly since tokens refilled
    const start = Date.now();
    await bucket.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
