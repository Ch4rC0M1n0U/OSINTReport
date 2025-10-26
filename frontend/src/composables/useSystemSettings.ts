/**
 * Composable pour gérer les paramètres système globaux
 */

import { ref, computed } from "vue";
import { settingsApi, type SystemSettings } from "@/services/api/settings";

const settings = ref<SystemSettings | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
let loadingPromise: Promise<void> | null = null;

export function useSystemSettings() {
  /**
   * Charger les paramètres système
   */
  async function loadSettings() {
    // Si déjà chargé, retourner immédiatement
    if (settings.value) return;
    
    // Si en cours de chargement, attendre la promesse existante
    if (loadingPromise) return loadingPromise;

    loading.value = true;
    error.value = null;

    loadingPromise = (async () => {
      try {
        const data = await settingsApi.getSettings();
        settings.value = data;
      } catch (err: any) {
        error.value = err.response?.data?.message || "Erreur lors du chargement des paramètres";
        console.error("Erreur chargement settings:", err);
      } finally {
        loading.value = false;
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  /**
   * Forcer le rechargement des paramètres
   */
  async function refreshSettings() {
    settings.value = null;
    await loadSettings();
  }

  /**
   * Titre de l'application
   */
  const appTitle = computed(() => {
    if (!settings.value) return "OSINT REPORT";
    return `${settings.value.serviceName} REPORT`;
  });

  /**
   * Nom complet du service
   */
  const serviceFullName = computed(() => {
    return settings.value?.serviceFullName || null;
  });

  /**
   * URL complète du logo
   */
  const logoUrl = computed(() => {
    if (!settings.value?.logoUrl) return null;
    return settingsApi.getLogoUrl(settings.value.logoUrl);
  });

  /**
   * Couleur principale
   */
  const primaryColor = computed(() => {
    return settings.value?.primaryColor || "#003f87";
  });

  /**
   * Couleur secondaire
   */
  const secondaryColor = computed(() => {
    return settings.value?.secondaryColor || "#0066cc";
  });

  /**
   * Vérifier si le mode maintenance est activé
   */
  const isMaintenanceMode = computed(() => {
    return settings.value?.maintenanceEnabled === true;
  });

  /**
   * Message de maintenance
   */
  const maintenanceMessage = computed(() => {
    return settings.value?.maintenanceMessage || null;
  });

  /**
   * Date de fin de maintenance prévue
   */
  const maintenanceScheduledAt = computed(() => {
    return settings.value?.maintenanceScheduledAt || null;
  });

  return {
    settings,
    loading,
    error,
    loadSettings,
    refreshSettings,
    appTitle,
    serviceFullName,
    logoUrl,
    primaryColor,
    secondaryColor,
    isMaintenanceMode,
    maintenanceMessage,
    maintenanceScheduledAt,
  };
}
