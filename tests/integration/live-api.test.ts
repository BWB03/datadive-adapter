import { describe, it, expect } from "vitest";
import { DataDiveSkill } from "../../src/openclaw.js";
import { UniversalEnvelopeSchema } from "../../src/schema/universal.js";

const API_KEY = process.env.DATADIVE_API_KEY;

describe.skipIf(!API_KEY)("DataDive Live API", () => {
  const skill = new DataDiveSkill(API_KEY);

  it("lists niches", async () => {
    const result = await skill.listNiches();
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.source).toBe("datadive");
    expect(parsed.data_type).toBe("niche_summary");
  });

  it("gets keywords for first niche", async () => {
    const niches = await skill.listNiches();
    const data = niches.data as any[];
    if (data.length === 0) return;

    const result = await skill.getKeywords(data[0].niche_id);
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("keyword_ranking");
  });

  it("gets competitors for first niche", async () => {
    const niches = await skill.listNiches();
    const data = niches.data as any[];
    if (data.length === 0) return;

    const result = await skill.getCompetitors(data[0].niche_id);
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("competitor");
  });

  it("gets ranking juices for first niche", async () => {
    const niches = await skill.listNiches();
    const data = niches.data as any[];
    if (data.length === 0) return;

    const result = await skill.getRankingJuices(data[0].niche_id);
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("ranking_juice");
  });

  it("gets keyword roots for first niche", async () => {
    const niches = await skill.listNiches();
    const data = niches.data as any[];
    if (data.length === 0) return;

    const result = await skill.getKeywordRoots(data[0].niche_id);
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("keyword_root");
  });

  it("lists rank radars", async () => {
    const result = await skill.listRankRadars();
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("rank_tracker");
  });

  it("gets rank radar detail", async () => {
    const radars = await skill.listRankRadars();
    const data = radars.data as any[];
    if (data.length === 0) return;

    const result = await skill.getRankRadar(data[0].tracker_id);
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("keyword_rank_history");
  });

  it("handles invalid dive ID gracefully", async () => {
    const result = await skill.getDiveStatus("nonexistent-id");
    const parsed = UniversalEnvelopeSchema.parse(result);
    expect(parsed.data_type).toBe("error");
  });
});
