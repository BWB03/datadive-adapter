import { z } from "zod";

// --- Pagination ---

export const PaginationSchema = z.object({
  current_page: z.number(),
  total_pages: z.number(),
  total_items: z.number(),
  has_more: z.boolean(),
});

// --- Error Detail ---

export const ErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  http_status: z.number().optional(),
});

// --- Universal Envelope ---

export const UniversalEnvelopeSchema = z.object({
  source: z.string(),
  adapter_version: z.string(),
  data_type: z.string(),
  marketplace: z.string().nullable().optional(),
  retrieved_at: z.string(),
  pagination: PaginationSchema.optional(),
  data: z.unknown(),
  error: ErrorDetailSchema.optional(),
});

export type UniversalEnvelope = z.infer<typeof UniversalEnvelopeSchema>;

// --- Data Types ---

export const NicheSummarySchema = z.object({
  niche_id: z.string(),
  hero_keyword: z.string(),
  label: z.string(),
  marketplace: z.string(),
  latest_research_date: z.string().nullable().optional(),
});

export const KeywordRankingSchema = z.object({
  keyword: z.string(),
  search_volume: z.number().nullable().optional(),
  relevancy_score: z.number().nullable().optional(),
  amazon_url: z.string().nullable().optional(),
  organic_ranks: z.record(z.string(), z.number().nullable()).optional(),
  sponsored_ranks: z.record(z.string(), z.number().nullable()).optional(),
});

export const CompetitorSummarySchema = z.object({
  asin: z.string(),
  brand: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  review_count: z.number().nullable().optional(),
  listing_creation_date: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  sales: z.number().nullable().optional(),
  revenue: z.number().nullable().optional(),
  fulfillment: z.string().nullable().optional(),
  seller_country: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  category_tree: z.string().nullable().optional(),
  number_of_variations: z.number().nullable().optional(),
  number_of_active_sellers: z.number().nullable().optional(),
  outlier_keywords: z.number().nullable().optional(),
  outlier_search_volume: z.number().nullable().optional(),
  keywords_ranked_page_1: z.number().nullable().optional(),
  keywords_ranked_page_1_percent: z.number().nullable().optional(),
  search_volume_ranked_page_1: z.number().nullable().optional(),
  search_volume_ranked_page_1_percent: z.number().nullable().optional(),
  listing_ranking_juice: z.number().nullable().optional(),
  title_ranking_juice: z.number().nullable().optional(),
  bullets_ranking_juice: z.number().nullable().optional(),
  description_ranking_juice: z.number().nullable().optional(),
});

export const NicheStatisticsSchema = z.object({
  marketplace: z.string(),
  num_keywords: z.number(),
  num_visible_keywords: z.number(),
  total_search_volume: z.number(),
  visible_search_volume: z.number(),
  latest_research_date: z.string().nullable().optional(),
});

export const RankingJuiceListingSchema = z.object({
  total_ranking_juice: z.number(),
  title_ranking_juice: z.number(),
  bullets_ranking_juice: z.number(),
  description_ranking_juice: z.number(),
});

export const RankingJuiceSummarySchema = z.object({
  current_listing: RankingJuiceListingSchema,
  optimized_listing: RankingJuiceListingSchema,
  competitors: z.array(
    z.object({
      asin: z.string(),
      listing: RankingJuiceListingSchema,
    })
  ),
  latest_research_date: z.string().nullable().optional(),
});

export const KeywordRootSummarySchema = z.object({
  keyword: z.string(),
  search_volume: z.number().nullable().optional(),
  normalized_keyword: z.string().nullable().optional(),
  normalized_search_volume: z.number().nullable().optional(),
  relevancy_score: z.number().nullable().optional(),
  competing_products: z.number().nullable().optional(),
  number_of_exacts: z.number().nullable().optional(),
  ranking_juice: z.number().nullable().optional(),
});

export const RankTrackerSchema = z.object({
  tracker_id: z.string(),
  asin: z.string(),
  marketplace: z.string(),
  title: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  keyword_count: z.number().nullable().optional(),
  top_10_keywords: z.unknown().optional(),
  top_10_search_volume: z.unknown().optional(),
  top_50_keywords: z.unknown().optional(),
  top_50_search_volume: z.unknown().optional(),
});

export const RankEntrySchema = z.object({
  date: z.string(),
  organic_rank: z.number().nullable(),
  impression_rank: z.number().nullable(),
});

export const KeywordRankHistorySchema = z.object({
  keyword_id: z.string().nullable().optional(),
  keyword: z.string(),
  search_volume: z.number().nullable().optional(),
  relevancy_score: z.number().nullable().optional(),
  ranks: z.array(RankEntrySchema),
  highlights: z.array(z.unknown()).optional(),
});

export const DiveStatusSummarySchema = z.object({}).passthrough();
