import { describe, it, expect } from "vitest";
import {
  ListNichesResponseSchema,
  GetKeywordsResponseSchema,
  GetCompetitorsResponseSchema,
  GetRankingJuicesResponseSchema,
  GetKeywordRootsResponseSchema,
  ListRankRadarsResponseSchema,
  NicheSchema,
  MklKeywordSchema,
} from "../../src/schema/datadive.js";
import {
  UniversalEnvelopeSchema,
  NicheSummarySchema,
  KeywordRankingSchema,
  CompetitorSummarySchema,
  RankingJuiceSummarySchema,
  KeywordRootSummarySchema,
  RankTrackerSchema,
  PaginationSchema,
} from "../../src/schema/universal.js";
import listNichesFixture from "../fixtures/list-niches.json";
import getKeywordsFixture from "../fixtures/get-keywords.json";
import getCompetitorsFixture from "../fixtures/get-competitors.json";
import getRankingJuicesFixture from "../fixtures/get-ranking-juices.json";
import getKeywordRootsFixture from "../fixtures/get-keyword-roots.json";
import listRankRadarsFixture from "../fixtures/list-rank-radars.json";

describe("DataDive schemas", () => {
  it("parses list niches response", () => {
    const result = ListNichesResponseSchema.parse(listNichesFixture);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].nicheId).toBe("z515cGOFg3");
    expect(result.total).toBe(2);
  });

  it("parses get keywords response (with data wrapper)", () => {
    const result = GetKeywordsResponseSchema.parse(getKeywordsFixture);
    expect(result.data.keywords).toHaveLength(2);
    expect(result.data.keywords[0].keyword).toBe("zinc supplements");
    expect(result.data.keywords[0].searchVolume).toBe(240842);
  });

  it("parses get competitors response", () => {
    const result = GetCompetitorsResponseSchema.parse(getCompetitorsFixture);
    expect(result.data.marketplace).toBe("com");
    expect(result.data.competitors).toHaveLength(1);
    expect(result.data.competitors[0].asin).toBe("B0098U0QC0");
    expect(result.data.competitors[0].brand).toBe("Garden of Life");
    expect(result.data.statistics.numKeywords).toBe(4996);
  });

  it("parses get ranking juices response", () => {
    const result = GetRankingJuicesResponseSchema.parse(getRankingJuicesFixture);
    expect(result.data.currentListing.rankingJuice).toBe(1902847);
    expect(result.data.optimizedListing.rankingJuice).toBe(2429811);
    expect(result.data.competitors).toHaveLength(1);
    expect(result.data.competitors[0].asin).toBe("B0098U0QC0");
  });

  it("parses get keyword roots response", () => {
    const result = GetKeywordRootsResponseSchema.parse(getKeywordRootsFixture);
    expect(result.data.keywords).toHaveLength(2);
    expect(result.data.keywords[0].keyword).toBe("zinc");
    expect(result.data.keywords[0].competingProducts).toBe(10000);
  });

  it("parses list rank radars response (double nested data)", () => {
    const result = ListRankRadarsResponseSchema.parse(listRankRadarsFixture);
    expect(result.data.data).toHaveLength(1);
    expect(result.data.data[0].asin).toBe("B09DCJJ9R3");
    expect(result.data.total).toBe(1);
  });

  it("validates individual niche", () => {
    const niche = NicheSchema.parse(listNichesFixture.data[0]);
    expect(niche.heroKeyword).toBe("dog hat");
  });

  it("validates individual keyword", () => {
    const kw = MklKeywordSchema.parse(getKeywordsFixture.data.keywords[0]);
    expect(kw.asinRanks?.["B00083B1DY"]).toBe(4);
  });

  it("parses competitor with object ASIN", () => {
    const fixture = JSON.parse(JSON.stringify(getCompetitorsFixture));
    fixture.data.competitors[0].asin = { asin: "B0098U0QC0", title: "Product" };
    const result = GetCompetitorsResponseSchema.parse(fixture);
    expect(result.data.competitors[0].asin).toEqual({ asin: "B0098U0QC0", title: "Product" });
  });

  it("parses ranking juices with object ASIN", () => {
    const fixture = JSON.parse(JSON.stringify(getRankingJuicesFixture));
    fixture.data.competitors[0].asin = { asin: "B0098U0QC0" };
    const result = GetRankingJuicesResponseSchema.parse(fixture);
    expect(result.data.competitors[0].asin).toEqual({ asin: "B0098U0QC0" });
  });

  it("parses rank radar with object ASIN", () => {
    const fixture = JSON.parse(JSON.stringify(listRankRadarsFixture));
    fixture.data.data[0].asin = { asin: "B09DCJJ9R3", title: "Dog Hat" };
    const result = ListRankRadarsResponseSchema.parse(fixture);
    expect(result.data.data[0].asin).toEqual({ asin: "B09DCJJ9R3", title: "Dog Hat" });
  });

  it("allows passthrough fields on niche", () => {
    const extended = { ...listNichesFixture.data[0], extraField: "hello" };
    const result = NicheSchema.parse(extended);
    expect((result as any).extraField).toBe("hello");
  });
});

describe("Universal schemas", () => {
  it("validates pagination", () => {
    const result = PaginationSchema.parse({
      current_page: 1,
      total_pages: 3,
      total_items: 50,
      has_more: true,
    });
    expect(result.has_more).toBe(true);
  });

  it("validates niche summary", () => {
    const result = NicheSummarySchema.parse({
      niche_id: "z515cGOFg3",
      hero_keyword: "dog hat",
      label: "Dog-hat opportunity",
      marketplace: "com",
      latest_research_date: "2026-03-14",
    });
    expect(result.niche_id).toBe("z515cGOFg3");
  });

  it("validates keyword ranking", () => {
    const result = KeywordRankingSchema.parse({
      keyword: "zinc supplements",
      search_volume: 240842,
      relevancy_score: 1,
      amazon_url: null,
      organic_ranks: { B00083B1DY: 4 },
      sponsored_ranks: {},
    });
    expect(result.search_volume).toBe(240842);
  });

  it("validates competitor summary", () => {
    const result = CompetitorSummarySchema.parse({
      asin: "B0098U0QC0",
      brand: "Garden of Life",
      image_url: "https://example.com/img.jpg",
      rating: 4.8,
      review_count: 30041,
      listing_creation_date: "2012-09-11T00:00:00.000Z",
      price: 11.19,
      sales: 27468,
      revenue: 307366.92,
      fulfillment: "AMZ",
      seller_country: "(Amazon)",
      category: "Health & Household",
      category_tree: "Health & Household > Vitamins",
      number_of_variations: 1,
      number_of_active_sellers: 12,
      outlier_keywords: 28,
      outlier_search_volume: 159618,
      keywords_ranked_page_1: 158,
      keywords_ranked_page_1_percent: 0.94,
      search_volume_ranked_page_1: 890725,
      search_volume_ranked_page_1_percent: 0.95,
      listing_ranking_juice: 1895870,
      title_ranking_juice: 625260,
      bullets_ranking_juice: 9617,
      description_ranking_juice: 856,
    });
    expect(result.asin).toBe("B0098U0QC0");
  });

  it("validates ranking juice summary", () => {
    const result = RankingJuiceSummarySchema.parse({
      current_listing: {
        total_ranking_juice: 1902847,
        title_ranking_juice: 628271,
        bullets_ranking_juice: 9017,
        description_ranking_juice: 0,
      },
      optimized_listing: {
        total_ranking_juice: 2429811,
        title_ranking_juice: 758971,
        bullets_ranking_juice: 51637,
        description_ranking_juice: 49624,
      },
      competitors: [
        {
          asin: "B0098U0QC0",
          listing: {
            total_ranking_juice: 1895870,
            title_ranking_juice: 625260,
            bullets_ranking_juice: 9617,
            description_ranking_juice: 856,
          },
        },
      ],
      latest_research_date: "2024-01-09T21:05:38.148Z",
    });
    expect(result.current_listing.total_ranking_juice).toBe(1902847);
  });

  it("validates keyword root summary", () => {
    const result = KeywordRootSummarySchema.parse({
      keyword: "zinc",
      search_volume: 365434,
      normalized_keyword: "zinc",
      normalized_search_volume: 365434,
      relevancy_score: 0.82,
      competing_products: 10000,
      number_of_exacts: 17,
      ranking_juice: 365434,
    });
    expect(result.competing_products).toBe(10000);
  });

  it("validates rank tracker", () => {
    const result = RankTrackerSchema.parse({
      tracker_id: "rr-abc123",
      asin: "B09DCJJ9R3",
      marketplace: "com",
      title: "Dog Hat",
      image_url: null,
      keyword_count: 150,
      top_10_keywords: 25,
      top_10_search_volume: 50000,
      top_50_keywords: 80,
      top_50_search_volume: 120000,
    });
    expect(result.keyword_count).toBe(150);
  });

  it("validates universal envelope", () => {
    const envelope = UniversalEnvelopeSchema.parse({
      source: "datadive",
      adapter_version: "1.0.0",
      data_type: "niche_summary",
      marketplace: "com",
      retrieved_at: "2026-03-14T08:30:00Z",
      data: [],
    });
    expect(envelope.source).toBe("datadive");
  });

  it("validates error envelope", () => {
    const envelope = UniversalEnvelopeSchema.parse({
      source: "datadive",
      adapter_version: "1.0.0",
      data_type: "error",
      retrieved_at: "2026-03-14T08:30:00Z",
      data: null,
      error: {
        code: "datadive_401",
        message: "Unauthorized",
        http_status: 401,
      },
    });
    expect(envelope.error?.code).toBe("datadive_401");
  });
});
