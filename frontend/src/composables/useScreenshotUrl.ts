import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

/**
 * Composable pour gérer automatiquement les URLs de screenshots avec expiration
 * Régénère automatiquement l'URL quand elle est proche de l'expiration (7 jours avant)
 */
export function useScreenshotUrl(initialUrl: string | undefined) {
  const currentUrl = ref(initialUrl);
  const isExpiring = ref(false);
  const isExpired = ref(false);
  let checkInterval: NodeJS.Timeout | null = null;

  /**
   * Extrait le timestamp d'expiration de l'URL
   */
  function getExpirationFromUrl(url: string | undefined): number | null {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      const expires = urlObj.searchParams.get('expires');
      if (expires) {
        return parseInt(expires, 10);
      }
    } catch {
      // URL invalide
    }
    return null;
  }

  /**
   * Vérifie si l'URL est proche de l'expiration (7 jours)
   */
  function checkExpiration() {
    const expiresAt = getExpirationFromUrl(currentUrl.value);
    if (!expiresAt) {
      isExpiring.value = false;
      isExpired.value = false;
      return;
    }

    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    // URL expirée
    if (now >= expiresAt) {
      isExpired.value = true;
      isExpiring.value = false;
    }
    // URL expire dans moins de 7 jours
    else if (now >= expiresAt - sevenDaysInMs) {
      isExpiring.value = true;
      isExpired.value = false;
    }
    // URL encore valide pour longtemps
    else {
      isExpiring.value = false;
      isExpired.value = false;
    }
  }

  /**
   * Régénère l'URL (à implémenter selon votre API)
   * Pour l'instant, on log juste qu'une régénération serait nécessaire
   */
  async function regenerateUrl() {
    console.warn('⚠️ Screenshot URL expiring soon or expired, manual refresh needed');
    // TODO: Implémenter un appel API pour régénérer l'URL si nécessaire
    // Exemple:
    // const newUrl = await screenshotsApi.regenerateUrl(filename);
    // currentUrl.value = newUrl;
  }

  // URL valide à utiliser (même si expirée, on retourne l'URL originale)
  const displayUrl = computed(() => currentUrl.value);

  // Statut de l'URL
  const urlStatus = computed(() => {
    if (isExpired.value) return 'expired';
    if (isExpiring.value) return 'expiring';
    return 'valid';
  });

  // Vérification initiale
  onMounted(() => {
    checkExpiration();
    
    // Vérifier toutes les heures
    checkInterval = setInterval(() => {
      checkExpiration();
      
      // Si l'URL expire bientôt ou est expirée, tenter de la régénérer
      if (isExpiring.value || isExpired.value) {
        regenerateUrl();
      }
    }, 60 * 60 * 1000); // 1 heure
  });

  onUnmounted(() => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });

  // Watcher pour mettre à jour quand l'URL change
  watch(
    () => initialUrl,
    (newUrl) => {
      currentUrl.value = newUrl;
      checkExpiration();
    }
  );

  return {
    url: displayUrl,
    status: urlStatus,
    isExpiring,
    isExpired,
    checkExpiration,
    regenerateUrl,
  };
}
