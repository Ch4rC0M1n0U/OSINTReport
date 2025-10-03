import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { reportsApi, type Report } from "@/services/api/reports";

export interface ReportSummary {
  id: string;
  title: string;
  status: string;
  issuedAt: string | null;
  owner: {
    firstName: string;
    lastName: string;
  };
}

interface PaginatedReports {
  items: ReportSummary[];
  total: number;
  limit: number;
  offset: number;
}

export const useReportsStore = defineStore("reports", () => {
  const items = ref<ReportSummary[]>([]);
  const total = ref(0);
  const limit = ref(10);
  const offset = ref(0);
  const search = ref("");
  const status = ref<string | undefined>();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedAt = ref<number | null>(null);

  const hasPrevious = computed(() => offset.value > 0);
  const hasNext = computed(() => offset.value + limit.value < total.value);

  async function fetchReports(options: { silent?: boolean } = {}) {
    if (!options.silent) {
      loading.value = true;
      error.value = null;
    }

    try {
      const response = await reportsApi.list({
        limit: limit.value,
        offset: offset.value,
        search: search.value || undefined,
        status: status.value || undefined,
      });

      items.value = response.items.map(report => ({
        id: report.id,
        title: report.title,
        status: report.status,
        issuedAt: report.issuedAt || null,
        owner: report.owner,
      }));
      total.value = response.total;
      limit.value = response.limit;
      offset.value = response.offset;
      lastFetchedAt.value = Date.now();
    } catch (err) {
      error.value = "Impossible de charger les rapports";
      throw err;
    } finally {
      if (!options.silent) {
        loading.value = false;
      }
    }
  }

  function setSearch(value: string) {
    search.value = value;
    offset.value = 0;
  }

  function setStatus(value: string | undefined) {
    status.value = value;
    offset.value = 0;
  }

  function setLimit(newLimit: number) {
    limit.value = newLimit;
    offset.value = 0;
  }

  async function goToNextPage() {
    if (!hasNext.value) return;
    offset.value += limit.value;
    await fetchReports();
  }

  async function goToPreviousPage() {
    if (!hasPrevious.value) return;
    offset.value = Math.max(0, offset.value - limit.value);
    await fetchReports();
  }

  function reset() {
    items.value = [];
    total.value = 0;
    offset.value = 0;
    search.value = "";
    status.value = undefined;
    error.value = null;
    lastFetchedAt.value = null;
  }

  return {
    items,
    total,
    limit,
    offset,
    search,
    status,
    loading,
    error,
    hasPrevious,
    hasNext,
    lastFetchedAt,
    fetchReports,
    setSearch,
    setStatus,
    setLimit,
    goToNextPage,
    goToPreviousPage,
    reset,
  };
});
