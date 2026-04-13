import { z } from "zod";

// --- Paginated wrapper ---

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    currentPage: z.number(),
    pageSize: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
    lastPage: z.number(),
    total: z.number(),
    data: z.array(itemSchema),
  });

// --- 1. List Niches ---

export const NicheSchema = z
  .object({
    nicheId: z.string(),
    heroKeyword: z.string(),
    nicheLabel: z.string(),
    marketplace: z.string(),
    latestResearchDate: z.string().nullable().optional(),
  })
  .passthrough();

export const ListNichesResponseSchema = PaginatedResponseSchema(NicheSchema);

// --- 2. Get Keywords ---
// API returns: { data: { keywords: [...] } }

export const MklKeywordSchema = z
  .object({
    keyword: z.string(),
    searchVolume: z.number().nullable().optional(),
    relevancy: z.number().nullable().optional(),
    amazonUrl: z.string().nullable().optional(),
    asinRanks: z.record(z.string(), z.number().nullable()).optional(),
    sponsoredAsinRanks: z.record(z.string(), z.number().nullable()).optional(),
  })
  .passthrough();

export const GetKeywordsResponseSchema = z.object({
  data: z
    .object({
      keywords: z.array(MklKeywordSchema),
      latestResearchDate: z.string().nullable().optional(),
    })
    .passthrough(),
});

// --- 3. Get Competitors ---
// API returns: { data: { marketplace, statistics, opportunityEvaluation, benchmark, competitorsStrength, latestResearchDate, competitors: [...] } }

const RankingJuiceContributionSchema = z.object({
  rankingJuice: z.number(),
  weight: z.number(),
  listingRankingJuice: z.number(),
});

const ListingRankingJuiceSchema = z.object({
  value: z.number(),
  contribution: z.object({
    title: RankingJuiceContributionSchema,
    bullets: RankingJuiceContributionSchema,
    description: RankingJuiceContributionSchema,
  }),
});

export const CompetitorSchema = z
  .object({
    asin: z.union([z.string(), z.object({}).passthrough()]),
    brand: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    reviewCount: z.number().nullable().optional(),
    listingCreationDate: z.number().nullable().optional(),
    listingCreationDateEvaluation: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    sales: z.number().nullable().optional(),
    revenue: z.number().nullable().optional(),
    outlierKws: z.number().nullable().optional(),
    outlierSV: z.number().nullable().optional(),
    kwRankedOnP1: z.number().nullable().optional(),
    kwRankedOnP1Percent: z.number().nullable().optional(),
    kwRankedOnP1Evaluation: z.string().nullable().optional(),
    svRankedOnP1: z.number().nullable().optional(),
    svRankedOnP1Percent: z.number().nullable().optional(),
    svRankedOnP1Evaluation: z.string().nullable().optional(),
    advertisedKws: z.number().nullable().optional(),
    advertisedKwsPercent: z.number().nullable().optional(),
    tosKwsAds: z.number().nullable().optional(),
    tosKwsAdsPercent: z.number().nullable().optional(),
    tosSvAds: z.number().nullable().optional(),
    tosSvAdsPercent: z.number().nullable().optional(),
    fulfillment: z.string().nullable().optional(),
    numberOfActiveSellers: z.number().nullable().optional(),
    sellerCountry: z.string().nullable().optional(),
    listingRankingJuice: ListingRankingJuiceSchema.nullable().optional(),
    numberOfVariations: z.number().nullable().optional(),
    asinCatalog: z.unknown().nullable().optional(),
    category: z.string().nullable().optional(),
    categoryTree: z.string().nullable().optional(),
  })
  .passthrough();

const OpportunityValueSchema = z.object({
  value: z.number(),
  opportunity: z.string(),
});

const CompetitorStrengthBucketSchema = z.object({
  sellers: z.number(),
  percentage: z.number(),
});

export const GetCompetitorsResponseSchema = z.object({
  data: z
    .object({
      marketplace: z.string(),
      statistics: z
        .object({
          numKeywords: z.number(),
          numVisibleKeywords: z.number(),
          numMaxVisibleKeywords: z.number(),
          totalSvOfKeywords: z.number(),
          totalSvOfVisibleKeywords: z.number(),
          totalSvOfVisibleOutlierKeywords: z.number(),
          totalSvOfResidueKeywords: z.number(),
        })
        .passthrough(),
      opportunityEvaluation: z
        .object({
          competitionSvStrength: OpportunityValueSchema.optional(),
          competitionKwStrength: OpportunityValueSchema.optional(),
          numRelevantKeywords: OpportunityValueSchema.optional(),
          numRelevantSearchVolume: z.number().optional(),
          medianDaysListed: OpportunityValueSchema.optional(),
          medianReviewCount: OpportunityValueSchema.optional(),
          numLaunchKeywords: OpportunityValueSchema.optional(),
          numLaunchSearchVolume: z.number().optional(),
        })
        .passthrough(),
      benchmark: z.object({}).passthrough(),
      competitorsStrength: z.object({}).passthrough(),
      latestResearchDate: z.string().nullable().optional(),
      competitors: z.array(CompetitorSchema),
    })
    .passthrough(),
});

// --- 4. Get Ranking Juices ---
// API returns: { data: { currentListing, optimizedListing, competitors: [...], latestResearchDate } }

const ListingSectionSchema = z.object({
  rankingJuice: z.number(),
});

const ListingJuiceSchema = z.object({
  rankingJuice: z.number(),
  title: ListingSectionSchema,
  bullets: ListingSectionSchema,
  description: ListingSectionSchema,
});

const JuiceCompetitorSchema = z.object({
  asin: z.union([z.string(), z.object({}).passthrough()]),
  listing: ListingJuiceSchema,
});

export const GetRankingJuicesResponseSchema = z.object({
  data: z
    .object({
      currentListing: ListingJuiceSchema,
      optimizedListing: ListingJuiceSchema,
      competitors: z.array(JuiceCompetitorSchema),
      latestResearchDate: z.string().nullable().optional(),
    })
    .passthrough(),
});

// --- 5. Get Keyword Roots ---
// API returns: { data: { keywords: [...] } }

export const KeywordRootSchema = z
  .object({
    keyword: z.string(),
    searchVolume: z.number().nullable().optional(),
    normalizedKeyword: z.string().nullable().optional(),
    normalizedSearchVolume: z.number().nullable().optional(),
    relevancy: z.number().nullable().optional(),
    cpr8dayGiveAways: z.number().nullable().optional(),
    competingProducts: z.number().nullable().optional(),
    numberOfexacts: z.number().nullable().optional(),
    rankingJuice: z.number().nullable().optional(),
  })
  .passthrough();

export const GetKeywordRootsResponseSchema = z.object({
  data: z
    .object({
      keywords: z.array(KeywordRootSchema),
    })
    .passthrough(),
});

// --- 6. List Rank Radars ---
// API returns: { data: { pageSize, currentPage, ..., data: [...] } } (double nested data)

export const RankRadarSchema = z
  .object({
    id: z.string(),
    asin: z.union([z.string(), z.object({}).passthrough()]),
    marketplace: z.string(),
    keywordCount: z.number().optional(),
    title: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    top10KW: z.unknown().optional(),
    top10SV: z.unknown().optional(),
    top50KW: z.unknown().optional(),
    top50SV: z.unknown().optional(),
  })
  .passthrough();

export const ListRankRadarsResponseSchema = z.object({
  data: PaginatedResponseSchema(RankRadarSchema),
});

// --- 7. Get Rank Radar (keyword rankings) ---

export const KrtKeywordSchema = z
  .object({
    id: z.string().optional(),
    keyword: z.string(),
    searchVolume: z.number().nullable().optional(),
    ranks: z.array(z.unknown()).optional(),
    highlights: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const GetRankRadarResponseSchema = z.unknown();

// --- 8. Get Dive Status ---
// Error shape: { message, success }
// Success shape: unknown (need a real dive ID to discover)

export const GetDiveStatusResponseSchema = z.unknown();

// =====================
// Phase 2: Write Endpoints
// =====================

// --- 9. Create Niche Dive ---
// POST /v1/niches/dives
// Requires: keyword, marketplace, asin, numberOfCompetitors (min 2)
// Returns: { success, data: { diveId, estimatedCompletionDate } }

export const CreateDiveResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    diveId: z.string(),
    estimatedCompletionDate: z.string(),
  }),
});

// --- 10. Create Rank Radar ---
// POST /v1/niches/rank-radars
// Requires: asin, marketplace, nicheId, numberOfKeywords (min 1)
// Returns: { success, data: { rankRadarId } }

export const CreateRankRadarResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    rankRadarId: z.string(),
  }),
});

// --- 11. AI Copywriter ---
// POST /v1/niches/{nicheId}/ai-copywriter
// Requires: prompt (cosmo | ranking-juice | nlp | cosmo-rufus)
// Returns: { data: { rankingJuice, bullets, description, title } }

export const AiCopywriterResponseSchema = z.object({
  data: z.object({
    rankingJuice: z.unknown().optional(),
    bullets: z.array(z.string()),
    description: z.string(),
    title: z.string(),
  }).passthrough(),
});

// --- 12. Delete Niche ---
// DELETE /v1/niches/{nicheId}

export const DeleteNicheResponseSchema = z.unknown();

// --- 13. Delete Rank Radar ---
// DELETE /v1/niches/rank-radars/{rankRadarId}

export const DeleteRankRadarResponseSchema = z.unknown();
