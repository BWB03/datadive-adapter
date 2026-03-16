/**
 * Test write endpoints to capture response shapes.
 * Usage: DATADIVE_API_KEY=xxx npx tsx scripts/test-write.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const API_KEY = process.env.DATADIVE_API_KEY;
if (!API_KEY) {
  console.error("Set DATADIVE_API_KEY env var");
  process.exit(1);
}

const BASE = "https://api.datadive.tools";
const OUT = join(import.meta.dirname ?? ".", "..", "tests", "fixtures", "raw");
mkdirSync(OUT, { recursive: true });

async function post(name: string, path: string, body: Record<string, unknown>) {
  console.log(`→ POST ${name}: ${path}`);
  console.log(`  Body: ${JSON.stringify(body)}`);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const status = res.status;
    const file = join(OUT, `${name}.json`);
    try {
      const parsed = JSON.parse(text);
      writeFileSync(file, JSON.stringify({ status, body: parsed }, null, 2));
    } catch {
      writeFileSync(file, JSON.stringify({ status, body: text }, null, 2));
    }
    console.log(`  ✓ ${status} → ${file}`);
  } catch (err) {
    console.error(`  ✗ ${name}:`, err);
  }
}

async function main() {
  // Create rank radar — needs nicheId + numberOfKeywords
  await post("create_rank_radar", "/v1/niches/rank-radars", {
    asin: "B0012ZQPKG",
    marketplace: "com",
    nicheId: "WBcpBay2EO",
    numberOfKeywords: 50,
  });

  // AI Copywriter — needs prompt type
  await post("ai_copywriter", "/v1/niches/WBcpBay2EO/ai-copywriter", {
    prompt: "ranking-juice",
  });

  console.log("\nDone! Check tests/fixtures/raw/");
}

main();
