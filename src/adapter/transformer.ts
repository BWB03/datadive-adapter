import { ADAPTER_VERSION, SOURCE } from "../constants.js";
import type { UniversalEnvelope } from "../schema/universal.js";
import type { Pagination } from "../utils/pagination.js";

// --- Envelope builders ---

export function toUniversalEnvelope(
  dataType: string,
  data: unknown,
  opts?: {
    marketplace?: string | null;
    pagination?: Pagination;
  }
): UniversalEnvelope {
  return {
    source: SOURCE,
    adapter_version: ADAPTER_VERSION,
    data_type: dataType,
    marketplace: opts?.marketplace ?? null,
    retrieved_at: new Date().toISOString(),
    pagination: opts?.pagination,
    data,
  };
}

export function toErrorEnvelope(
  code: string,
  message: string,
  httpStatus?: number
): UniversalEnvelope {
  return {
    source: SOURCE,
    adapter_version: ADAPTER_VERSION,
    data_type: "error",
    retrieved_at: new Date().toISOString(),
    data: null,
    error: {
      code,
      message,
      http_status: httpStatus,
    },
  };
}

// --- Per-type transformers ---

export function transformNiche(raw: {
  nicheId: string;
  heroKeyword: string;
  nicheLabel: string;
  marketplace: string;
  latestResearchDate?: string | null;
}) {
  return {
    niche_id: raw.nicheId,
    hero_keyword: raw.heroKeyword,
    label: raw.nicheLabel,
    marketplace: raw.marketplace,
    latest_research_date: raw.latestResearchDate ?? null,
  };
}

export function transformKeyword(raw: {
  keyword: string;
  searchVolume?: number | null;
  relevancy?: number | null;
  amazonUrl?: string | null;
  asinRanks?: Record<string, number | null>;
  sponsoredAsinRanks?: Record<string, number | null>;
}) {
  return {
    keyword: raw.keyword,
    search_volume: raw.searchVolume ?? null,
    relevancy_score: raw.relevancy ?? null,
    amazon_url: raw.amazonUrl ?? null,
    organic_ranks: raw.asinRanks ?? {},
    sponsored_ranks: raw.sponsoredAsinRanks ?? {},
  };
}

export function transformCompetitor(raw: {
  asin: string;
  brand?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  listingCreationDate?: number | null;
  price?: number | null;
  sales?: number | null;
  revenue?: number | null;
  fulfillment?: string | null;
  numberOfActiveSellers?: number | null;
  sellerCountry?: string | null;
  category?: string | null;
  categoryTree?: string | null;
  numberOfVariations?: number | null;
  outlierKws?: number | null;
  outlierSV?: number | null;
  kwRankedOnP1?: number | null;
  kwRankedOnP1Percent?: number | null;
  svRankedOnP1?: number | null;
  svRankedOnP1Percent?: number | null;
  listingRankingJuice?: {
    value: number;
    contribution: {
      title: { rankingJuice: number };
      bullets: { rankingJuice: number };
      description: { rankingJuice: number };
    };
  } | null;
}) {
  return {
    asin: raw.asin,
    brand: raw.brand ?? null,
    image_url: raw.imageUrl ?? null,
    rating: raw.rating ?? null,
    review_count: raw.reviewCount ?? null,
    listing_creation_date: raw.listingCreationDate
      ? new Date(raw.listingCreationDate).toISOString()
      : null,
    price: raw.price ?? null,
    sales: raw.sales ?? null,
    revenue: raw.revenue ?? null,
    fulfillment: raw.fulfillment ?? null,
    seller_country: raw.sellerCountry ?? null,
    category: raw.category ?? null,
    category_tree: raw.categoryTree ?? null,
    number_of_variations: raw.numberOfVariations ?? null,
    number_of_active_sellers: raw.numberOfActiveSellers ?? null,
    outlier_keywords: raw.outlierKws ?? null,
    outlier_search_volume: raw.outlierSV ?? null,
    keywords_ranked_page_1: raw.kwRankedOnP1 ?? null,
    keywords_ranked_page_1_percent: raw.kwRankedOnP1Percent ?? null,
    search_volume_ranked_page_1: raw.svRankedOnP1 ?? null,
    search_volume_ranked_page_1_percent: raw.svRankedOnP1Percent ?? null,
    listing_ranking_juice: raw.listingRankingJuice?.value ?? null,
    title_ranking_juice:
      raw.listingRankingJuice?.contribution.title.rankingJuice ?? null,
    bullets_ranking_juice:
      raw.listingRankingJuice?.contribution.bullets.rankingJuice ?? null,
    description_ranking_juice:
      raw.listingRankingJuice?.contribution.description.rankingJuice ?? null,
  };
}

export function transformNicheStatistics(raw: {
  marketplace: string;
  statistics: {
    numKeywords: number;
    numVisibleKeywords: number;
    totalSvOfKeywords: number;
    totalSvOfVisibleKeywords: number;
  };
  latestResearchDate?: string | null;
}) {
  return {
    marketplace: raw.marketplace,
    num_keywords: raw.statistics.numKeywords,
    num_visible_keywords: raw.statistics.numVisibleKeywords,
    total_search_volume: raw.statistics.totalSvOfKeywords,
    visible_search_volume: raw.statistics.totalSvOfVisibleKeywords,
    latest_research_date: raw.latestResearchDate ?? null,
  };
}

function transformListingJuice(raw: {
  rankingJuice: number;
  title: { rankingJuice: number };
  bullets: { rankingJuice: number };
  description: { rankingJuice: number };
}) {
  return {
    total_ranking_juice: raw.rankingJuice,
    title_ranking_juice: raw.title.rankingJuice,
    bullets_ranking_juice: raw.bullets.rankingJuice,
    description_ranking_juice: raw.description.rankingJuice,
  };
}

export function transformRankingJuices(raw: {
  currentListing: {
    rankingJuice: number;
    title: { rankingJuice: number };
    bullets: { rankingJuice: number };
    description: { rankingJuice: number };
  };
  optimizedListing: {
    rankingJuice: number;
    title: { rankingJuice: number };
    bullets: { rankingJuice: number };
    description: { rankingJuice: number };
  };
  competitors: Array<{
    asin: string;
    listing: {
      rankingJuice: number;
      title: { rankingJuice: number };
      bullets: { rankingJuice: number };
      description: { rankingJuice: number };
    };
  }>;
  latestResearchDate?: string | null;
}) {
  return {
    current_listing: transformListingJuice(raw.currentListing),
    optimized_listing: transformListingJuice(raw.optimizedListing),
    competitors: raw.competitors.map((c) => ({
      asin: c.asin,
      listing: transformListingJuice(c.listing),
    })),
    latest_research_date: raw.latestResearchDate ?? null,
  };
}

export function transformKeywordRoot(raw: {
  keyword: string;
  searchVolume?: number | null;
  normalizedKeyword?: string | null;
  normalizedSearchVolume?: number | null;
  relevancy?: number | null;
  competingProducts?: number | null;
  numberOfexacts?: number | null;
  rankingJuice?: number | null;
}) {
  return {
    keyword: raw.keyword,
    search_volume: raw.searchVolume ?? null,
    normalized_keyword: raw.normalizedKeyword ?? null,
    normalized_search_volume: raw.normalizedSearchVolume ?? null,
    relevancy_score: raw.relevancy ?? null,
    competing_products: raw.competingProducts ?? null,
    number_of_exacts: raw.numberOfexacts ?? null,
    ranking_juice: raw.rankingJuice ?? null,
  };
}

export function transformRankTracker(raw: {
  id: string;
  asin: string;
  marketplace: string;
  keywordCount?: number;
  title?: string | null;
  imageUrl?: string | null;
  top10KW?: unknown;
  top10SV?: unknown;
  top50KW?: unknown;
  top50SV?: unknown;
}) {
  return {
    tracker_id: raw.id,
    asin: raw.asin,
    marketplace: raw.marketplace,
    title: raw.title ?? null,
    image_url: raw.imageUrl ?? null,
    keyword_count: raw.keywordCount ?? null,
    top_10_keywords: raw.top10KW ?? null,
    top_10_search_volume: raw.top10SV ?? null,
    top_50_keywords: raw.top50KW ?? null,
    top_50_search_volume: raw.top50SV ?? null,
  };
}

export function transformKeywordRankHistory(raw: {
  id?: string;
  keyword: string;
  searchVolume?: number | null;
  ranks?: unknown[];
  highlights?: unknown[];
}) {
  return {
    keyword_id: raw.id ?? null,
    keyword: raw.keyword,
    search_volume: raw.searchVolume ?? null,
    ranks: raw.ranks ?? [],
    highlights: raw.highlights ?? [],
  };
}

// Pass-through for unknown response shapes (dive status)
export function transformPassthrough(raw: unknown) {
  return raw;
}
