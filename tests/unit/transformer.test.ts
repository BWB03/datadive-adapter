import { describe, it, expect } from "vitest";
import {
  toUniversalEnvelope,
  toErrorEnvelope,
  transformNiche,
  transformKeyword,
  transformCompetitor,
  transformNicheStatistics,
  transformRankingJuices,
  transformKeywordRoot,
  transformRankTracker,
  transformKeywordRankHistory,
} from "../../src/adapter/transformer.js";
import { UniversalEnvelopeSchema } from "../../src/schema/universal.js";

describe("transformNiche", () => {
  it("maps camelCase to snake_case", () => {
    const result = transformNiche({
      nicheId: "z515cGOFg3",
      heroKeyword: "dog hat",
      nicheLabel: "Dog-hat opportunity",
      marketplace: "com",
      latestResearchDate: "2026-03-14",
    });
    expect(result).toEqual({
      niche_id: "z515cGOFg3",
      hero_keyword: "dog hat",
      label: "Dog-hat opportunity",
      marketplace: "com",
      latest_research_date: "2026-03-14",
    });
  });

  it("handles null latestResearchDate", () => {
    const result = transformNiche({
      nicheId: "x",
      heroKeyword: "k",
      nicheLabel: "l",
      marketplace: "com",
      latestResearchDate: null,
    });
    expect(result.latest_research_date).toBeNull();
  });
});

describe("transformKeyword", () => {
  it("maps keyword fields correctly", () => {
    const result = transformKeyword({
      keyword: "zinc supplements",
      searchVolume: 240842,
      relevancy: 1,
      asinRanks: { B00083B1DY: 4 },
    });
    expect(result.search_volume).toBe(240842);
    expect(result.relevancy_score).toBe(1);
    expect(result.organic_ranks).toEqual({ B00083B1DY: 4 });
    expect(result.sponsored_ranks).toEqual({});
    expect(result.amazon_url).toBeNull();
  });

  it("handles missing optional fields", () => {
    const result = transformKeyword({ keyword: "test" });
    expect(result.search_volume).toBeNull();
    expect(result.amazon_url).toBeNull();
    expect(result.organic_ranks).toEqual({});
    expect(result.sponsored_ranks).toEqual({});
  });
});

describe("transformCompetitor", () => {
  it("maps competitor fields correctly", () => {
    const result = transformCompetitor({
      asin: "B0098U0QC0",
      brand: "Garden of Life",
      imageUrl: "https://example.com/img.jpg",
      rating: 4.8,
      reviewCount: 30041,
      listingCreationDate: 1347321600000,
      price: 11.19,
      sales: 27468,
      revenue: 307366.92,
      fulfillment: "AMZ",
      numberOfActiveSellers: 12,
      sellerCountry: "(Amazon)",
      category: "Health & Household",
      categoryTree: "Health & Household > Vitamins",
      numberOfVariations: 1,
      outlierKws: 28,
      outlierSV: 159618,
      kwRankedOnP1: 158,
      kwRankedOnP1Percent: 0.94,
      svRankedOnP1: 890725,
      svRankedOnP1Percent: 0.95,
      listingRankingJuice: {
        value: 1895870,
        contribution: {
          title: { rankingJuice: 625260 },
          bullets: { rankingJuice: 9617 },
          description: { rankingJuice: 856 },
        },
      },
    });
    expect(result.asin).toBe("B0098U0QC0");
    expect(result.brand).toBe("Garden of Life");
    expect(result.listing_creation_date).toBe("2012-09-11T00:00:00.000Z");
    expect(result.listing_ranking_juice).toBe(1895870);
    expect(result.title_ranking_juice).toBe(625260);
    expect(result.keywords_ranked_page_1).toBe(158);
  });

  it("handles null listing creation date", () => {
    const result = transformCompetitor({
      asin: "X",
      listingCreationDate: null,
    });
    expect(result.listing_creation_date).toBeNull();
  });

  it("extracts ASIN from object format", () => {
    const result = transformCompetitor({
      asin: { asin: "B0098U0QC0", title: "Some Product" },
    });
    expect(result.asin).toBe("B0098U0QC0");
  });
});

describe("transformNicheStatistics", () => {
  it("maps statistics fields", () => {
    const result = transformNicheStatistics({
      marketplace: "com",
      statistics: {
        numKeywords: 4996,
        numVisibleKeywords: 168,
        totalSvOfKeywords: 5070506,
        totalSvOfVisibleKeywords: 934717,
      },
      latestResearchDate: "2024-01-09T21:05:38.148Z",
    });
    expect(result.num_keywords).toBe(4996);
    expect(result.visible_search_volume).toBe(934717);
    expect(result.marketplace).toBe("com");
  });
});

describe("transformRankingJuices", () => {
  it("maps ranking juice structure", () => {
    const result = transformRankingJuices({
      currentListing: {
        rankingJuice: 1902847,
        title: { rankingJuice: 628271 },
        bullets: { rankingJuice: 9017 },
        description: { rankingJuice: 0 },
      },
      optimizedListing: {
        rankingJuice: 2429811,
        title: { rankingJuice: 758971 },
        bullets: { rankingJuice: 51637 },
        description: { rankingJuice: 49624 },
      },
      competitors: [
        {
          asin: "B0098U0QC0",
          listing: {
            rankingJuice: 1895870,
            title: { rankingJuice: 625260 },
            bullets: { rankingJuice: 9617 },
            description: { rankingJuice: 856 },
          },
        },
      ],
      latestResearchDate: "2024-01-09T21:05:38.148Z",
    });
    expect(result.current_listing.total_ranking_juice).toBe(1902847);
    expect(result.optimized_listing.title_ranking_juice).toBe(758971);
    expect(result.competitors[0].asin).toBe("B0098U0QC0");
    expect(result.competitors[0].listing.total_ranking_juice).toBe(1895870);
  });

  it("extracts ASIN from object format in competitors", () => {
    const result = transformRankingJuices({
      currentListing: {
        rankingJuice: 100,
        title: { rankingJuice: 50 },
        bullets: { rankingJuice: 30 },
        description: { rankingJuice: 20 },
      },
      optimizedListing: {
        rankingJuice: 200,
        title: { rankingJuice: 100 },
        bullets: { rankingJuice: 60 },
        description: { rankingJuice: 40 },
      },
      competitors: [
        {
          asin: { asin: "B0098U0QC0", title: "Product" },
          listing: {
            rankingJuice: 150,
            title: { rankingJuice: 75 },
            bullets: { rankingJuice: 45 },
            description: { rankingJuice: 30 },
          },
        },
      ],
    });
    expect(result.competitors[0].asin).toBe("B0098U0QC0");
  });
});

describe("transformKeywordRoot", () => {
  it("maps keyword root fields", () => {
    const result = transformKeywordRoot({
      keyword: "zinc",
      searchVolume: 365434,
      normalizedKeyword: "zinc",
      normalizedSearchVolume: 365434,
      relevancy: 0.82,
      competingProducts: 10000,
      numberOfexacts: 17,
      rankingJuice: 365434,
    });
    expect(result.keyword).toBe("zinc");
    expect(result.competing_products).toBe(10000);
    expect(result.number_of_exacts).toBe(17);
    expect(result.ranking_juice).toBe(365434);
    expect(result.normalized_keyword).toBe("zinc");
  });
});

describe("transformRankTracker", () => {
  it("maps rank tracker fields", () => {
    const result = transformRankTracker({
      id: "rr-abc",
      asin: "B09DCJJ9R3",
      marketplace: "com",
      keywordCount: 150,
      title: "Dog Hat",
      imageUrl: "https://example.com/img.jpg",
      top10KW: 25,
      top10SV: 50000,
      top50KW: 80,
      top50SV: 120000,
    });
    expect(result.tracker_id).toBe("rr-abc");
    expect(result.keyword_count).toBe(150);
    expect(result.top_10_keywords).toBe(25);
  });

  it("extracts ASIN from object format", () => {
    const result = transformRankTracker({
      id: "rr-abc",
      asin: { asin: "B09DCJJ9R3", title: "Dog Hat" },
      marketplace: "com",
    });
    expect(result.asin).toBe("B09DCJJ9R3");
  });
});

describe("transformKeywordRankHistory", () => {
  it("maps keyword rank history", () => {
    const result = transformKeywordRankHistory({
      id: "kw1",
      keyword: "dog hat",
      searchVolume: 12000,
      ranks: [{ date: "2026-03-14", rank: 5 }],
      highlights: [],
    });
    expect(result.keyword_id).toBe("kw1");
    expect(result.ranks).toHaveLength(1);
  });

  it("handles missing id", () => {
    const result = transformKeywordRankHistory({
      keyword: "test",
    });
    expect(result.keyword_id).toBeNull();
    expect(result.ranks).toEqual([]);
  });
});

describe("toUniversalEnvelope", () => {
  it("creates valid envelope", () => {
    const envelope = toUniversalEnvelope("niche_summary", [
      { niche_id: "x", hero_keyword: "k", label: "l", marketplace: "com" },
    ]);
    const parsed = UniversalEnvelopeSchema.parse(envelope);
    expect(parsed.source).toBe("datadive");
    expect(parsed.data_type).toBe("niche_summary");
    expect(parsed.retrieved_at).toBeTruthy();
  });

  it("includes pagination when provided", () => {
    const envelope = toUniversalEnvelope("niche_summary", [], {
      pagination: {
        current_page: 1,
        total_pages: 3,
        total_items: 50,
        has_more: true,
      },
    });
    expect(envelope.pagination?.has_more).toBe(true);
  });
});

describe("toErrorEnvelope", () => {
  it("creates error envelope", () => {
    const envelope = toErrorEnvelope("datadive_401", "Unauthorized", 401);
    const parsed = UniversalEnvelopeSchema.parse(envelope);
    expect(parsed.data_type).toBe("error");
    expect(parsed.error?.code).toBe("datadive_401");
    expect(parsed.data).toBeNull();
  });
});
