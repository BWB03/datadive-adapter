/**
 * Phase 0: API Discovery Script
 *
 * Hits all 8 DataDive endpoints to capture response shapes.
 * Saves raw JSON to tests/fixtures/raw/ for schema refinement.
 *
 * Usage: DATADIVE_API_KEY=xxx npm run discover
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

async function hit(name: string, path: string) {
  console.log(`→ ${name}: ${path}`);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-api-key": API_KEY! },
    });
    const text = await res.text();
    const status = res.status;
    const file = join(OUT, `${name}.json`);
    writeFileSync(
      file,
      JSON.stringify({ status, body: JSON.parse(text) }, null, 2)
    );
    console.log(`  ✓ ${status} → ${file}`);
  } catch (err) {
    console.error(`  ✗ ${name}:`, err);
  }
}

async function main() {
  // First get niches to find a nicheId for subsequent calls
  await hit("list_niches", "/v1/niches");

  // Read the niche ID from the saved response
  const nichesRaw = await import(
    join(OUT, "list_niches.json"),
    { with: { type: "json" } }
  );
  const nicheId = nichesRaw.default?.body?.data?.[0]?.nicheId;

  if (nicheId) {
    console.log(`\nUsing nicheId: ${nicheId}\n`);
    await hit("get_keywords", `/v1/niches/${nicheId}/keywords`);
    await hit("get_competitors", `/v1/niches/${nicheId}/competitors`);
    await hit("get_ranking_juices", `/v1/niches/${nicheId}/ranking-juices`);
    await hit("get_keyword_roots", `/v1/niches/${nicheId}/roots`);
  } else {
    console.log("\nNo niches found — skipping niche-specific endpoints\n");
  }

  // Rank radars
  await hit("list_rank_radars", "/v1/niches/rank-radars");

  const radarsRaw = await import(
    join(OUT, "list_rank_radars.json"),
    { with: { type: "json" } }
  );
  const radarId = radarsRaw.default?.body?.data?.[0]?.id;

  if (radarId) {
    console.log(`\nUsing rankRadarId: ${radarId}\n`);
    await hit("get_rank_radar", `/v1/niches/rank-radars/${radarId}`);
  }

  // Dive status — use a placeholder (will 404 but captures error shape)
  await hit("get_dive_status", "/v1/niches/dives/placeholder-id");

  console.log("\nDone! Check tests/fixtures/raw/");
}

main();
