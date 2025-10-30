import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { api } from "@/services/http";

export type DashboardStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface DashboardSummary {
  generatedAt: string;
  totals: {
    all: number;
    draft: number;
    published: number;
    archived: number;
    validated: number;
  };
  statusDistribution: Array<{
    status: DashboardStatus;
    label: string;
    count: number;
    percentage: number;
  }>;
  recentReports: Array<{
    id: string;
    title: string;
    status: DashboardStatus;
    issuedAt: string | null;
    updatedAt: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const summary = ref<DashboardSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const lastUpdated = computed(() => summary.value?.generatedAt ?? null);

  async function fetchSummary(options: { silent?: boolean } = {}) {
    if (!options.silent) {
      loading.value = true;
      error.value = null;
    }

    try {
      const response = await api.get<DashboardSummary>("/reports/dashboard");
      summary.value = response.data;
    } catch (err) {
      error.value = "Impossible de charger le tableau de bord";
      throw err;
    } finally {
      if (!options.silent) {
        loading.value = false;
      }
    }
  }

  function reset() {
    summary.value = null;
    error.value = null;
    loading.value = false;
  }

  return {
    summary,
    loading,
    error,
    lastUpdated,
    fetchSummary,
    reset,
  };
});
