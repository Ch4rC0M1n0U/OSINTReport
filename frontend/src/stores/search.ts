/**
 * Store Pinia pour la recherche de rapports
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { searchService } from "@/services/api/search";
import type {
  SearchOptions,
  SearchHit,
  FacetDistribution,
  IndexStats,
} from "@/services/api/search";

export const useSearchStore = defineStore("search", () => {
  // ========== État ==========
  const query = ref<string>("");
  const results = ref<SearchHit[]>([]);
  const facets = ref<FacetDistribution>({});
  const stats = ref<IndexStats | null>(null);

  // Filtres actifs
  const statusFilter = ref<string | null>(null);
  const urgencyFilter = ref<string | null>(null);
  const classificationFilter = ref<string | null>(null);
  const sortBy = ref<string>("createdAt:desc");

  // Pagination
  const limit = ref<number>(20);
  const offset = ref<number>(0);
  const totalHits = ref<number>(0);

  // État de chargement et erreurs
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const processingTime = ref<number>(0);

  // ========== Computed ==========
  const hasResults = computed(() => results.value.length > 0);
  const hasQuery = computed(() => query.value.trim().length > 0);
  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1);
  const totalPages = computed(() => Math.ceil(totalHits.value / limit.value));
  const hasNextPage = computed(() => offset.value + limit.value < totalHits.value);
  const hasPreviousPage = computed(() => offset.value > 0);

  // Nombre de filtres actifs
  const activeFiltersCount = computed(() => {
    let count = 0;
    if (statusFilter.value) count++;
    if (urgencyFilter.value) count++;
    if (classificationFilter.value) count++;
    return count;
  });

  // Options de recherche courantes
  const searchOptions = computed<SearchOptions>(() => ({
    q: query.value || undefined,
    status: statusFilter.value as SearchOptions["status"],
    urgencyLevel: urgencyFilter.value as SearchOptions["urgencyLevel"],
    classification: classificationFilter.value as SearchOptions["classification"],
    sort: sortBy.value as SearchOptions["sort"],
    limit: limit.value,
    offset: offset.value,
  }));

  // ========== Actions ==========

  /**
   * Effectuer une recherche
   */
  async function search() {
    loading.value = true;
    error.value = null;

    try {
      const response = await searchService.search(searchOptions.value);
      results.value = response.hits;
      totalHits.value = response.estimatedTotalHits;
      processingTime.value = response.processingTimeMs;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Erreur lors de la recherche";
      results.value = [];
      totalHits.value = 0;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Charger les facettes (compteurs pour les filtres)
   */
  async function loadFacets() {
    try {
      const response = await searchService.getFacets(query.value || undefined);
      facets.value = response.facetDistribution;
    } catch (err: any) {
      console.error("Erreur chargement facettes:", err);
      facets.value = {};
    }
  }

  /**
   * Charger les statistiques de l'index (admin)
   */
  async function loadStats() {
    try {
      stats.value = await searchService.getStats();
    } catch (err: any) {
      console.error("Erreur chargement stats:", err);
      stats.value = null;
    }
  }

  /**
   * Déclencher une réindexation (admin)
   */
  async function reindex() {
    loading.value = true;
    error.value = null;

    try {
      const result = await searchService.reindex();
      console.log("Réindexation terminée:", result);
      // Recharger les stats après réindexation
      await loadStats();
      return result;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Erreur lors de la réindexation";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Mettre à jour le terme de recherche et relancer la recherche
   */
  async function updateQuery(newQuery: string) {
    query.value = newQuery;
    offset.value = 0; // Reset pagination
    await Promise.all([search(), loadFacets()]);
  }

  /**
   * Mettre à jour un filtre et relancer la recherche
   */
  async function updateFilter(
    filterType: "status" | "urgency" | "classification",
    value: string | null
  ) {
    switch (filterType) {
      case "status":
        statusFilter.value = value;
        break;
      case "urgency":
        urgencyFilter.value = value;
        break;
      case "classification":
        classificationFilter.value = value;
        break;
    }
    offset.value = 0; // Reset pagination
    await search();
  }

  /**
   * Mettre à jour le tri et relancer la recherche
   */
  async function updateSort(newSort: string) {
    sortBy.value = newSort;
    offset.value = 0;
    await search();
  }

  /**
   * Réinitialiser tous les filtres
   */
  async function resetFilters() {
    statusFilter.value = null;
    urgencyFilter.value = null;
    classificationFilter.value = null;
    sortBy.value = "createdAt:desc";
    offset.value = 0;
    await search();
  }

  /**
   * Aller à la page suivante
   */
  async function nextPage() {
    if (hasNextPage.value) {
      offset.value += limit.value;
      await search();
    }
  }

  /**
   * Aller à la page précédente
   */
  async function previousPage() {
    if (hasPreviousPage.value) {
      offset.value = Math.max(0, offset.value - limit.value);
      await search();
    }
  }

  /**
   * Aller à une page spécifique
   */
  async function goToPage(page: number) {
    const newOffset = (page - 1) * limit.value;
    if (newOffset >= 0 && newOffset < totalHits.value) {
      offset.value = newOffset;
      await search();
    }
  }

  /**
   * Réinitialiser tout l'état de recherche
   */
  function reset() {
    query.value = "";
    results.value = [];
    facets.value = {};
    stats.value = null;
    statusFilter.value = null;
    urgencyFilter.value = null;
    classificationFilter.value = null;
    sortBy.value = "createdAt:desc";
    limit.value = 20;
    offset.value = 0;
    totalHits.value = 0;
    loading.value = false;
    error.value = null;
    processingTime.value = 0;
  }

  return {
    // État
    query,
    results,
    facets,
    stats,
    statusFilter,
    urgencyFilter,
    classificationFilter,
    sortBy,
    limit,
    offset,
    totalHits,
    loading,
    error,
    processingTime,

    // Computed
    hasResults,
    hasQuery,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    activeFiltersCount,
    searchOptions,

    // Actions
    search,
    loadFacets,
    loadStats,
    reindex,
    updateQuery,
    updateFilter,
    updateSort,
    resetFilters,
    nextPage,
    previousPage,
    goToPage,
    reset,
  };
});
