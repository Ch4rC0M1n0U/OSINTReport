import { defineStore } from "pinia";
import { ref } from "vue";
import {
  correlationsApi,
  type Correlation,
  type CorrelationType,
  type CorrelationCheckResult,
} from "@/services/api/correlations";

export const useCorrelationsStore = defineStore("correlations", () => {
  const correlations = ref<Correlation[]>([]);
  const realtimeCheckResult = ref<CorrelationCheckResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pour afficher des alertes en temps réel
  const checkInProgress = ref(false);

  async function checkRealtime(
    reportId: string,
    value: string,
    type: CorrelationType
  ) {
    if (!value || value.length < 3) {
      realtimeCheckResult.value = null;
      return null;
    }

    checkInProgress.value = true;
    try {
      const result = await correlationsApi.check(reportId, value, type);
      realtimeCheckResult.value = result;
      return result;
    } catch (err) {
      error.value = "Erreur lors de la vérification";
      throw err;
    } finally {
      checkInProgress.value = false;
    }
  }

  async function detectAll(reportId: string) {
    loading.value = true;
    error.value = null;

    try {
      const detected = await correlationsApi.detect(reportId);
      correlations.value = detected;
      return detected;
    } catch (err) {
      error.value = "Erreur lors de la détection automatique";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCorrelations(
    reportId: string,
    filters?: { type?: CorrelationType; verified?: boolean }
  ) {
    loading.value = true;
    error.value = null;

    try {
      const data = await correlationsApi.list(reportId, filters);
      correlations.value = data;
    } catch (err) {
      error.value = "Impossible de charger les corrélations";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verify(id: string, notes?: string) {
    try {
      const updated = await correlationsApi.verify(id, notes);
      // Mettre à jour dans la liste
      const index = correlations.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        correlations.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = "Erreur lors de la vérification";
      throw err;
    }
  }

  async function deleteCorrelation(id: string) {
    try {
      await correlationsApi.delete(id);
      correlations.value = correlations.value.filter((c) => c.id !== id);
    } catch (err) {
      error.value = "Erreur lors de la suppression";
      throw err;
    }
  }

  function clearRealtimeCheck() {
    realtimeCheckResult.value = null;
  }

  function reset() {
    correlations.value = [];
    realtimeCheckResult.value = null;
    error.value = null;
  }

  return {
    correlations,
    realtimeCheckResult,
    checkInProgress,
    loading,
    error,
    checkRealtime,
    detectAll,
    fetchCorrelations,
    verify,
    deleteCorrelation,
    clearRealtimeCheck,
    reset,
  };
});
