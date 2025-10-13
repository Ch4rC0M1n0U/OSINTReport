<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { HugeiconsIcon } from '@hugeicons/vue';
import { 
  Calendar03Icon, 
  Loading02Icon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon 
} from '@hugeicons/core-free-icons';
import { api } from '@/services/http';

const featureFlags = [
  {
    label: "Activer l'audit avancé",
    description: "Journalise les actions sensibles dans le journal d'audit détaillé.",
    enabled: true,
  },
  {
    label: "Autoriser le relais d'alertes",
    description: "Diffuse automatiquement les alertes critiques aux équipes abonnées.",
    enabled: false,
  },
  {
    label: "Verrouillage temporaire",
    description: "Force la révocation des sessions inactives après 24h.",
    enabled: true,
  },
];

// État des tâches CRON
const cronStatus = ref<any>(null);
const loadingCronStatus = ref(false);
const regeneratingUrls = ref(false);
const regenerationSuccess = ref(false);
const regenerationError = ref<string | null>(null);

// Charger le status du CRON
async function loadCronStatus() {
  loadingCronStatus.value = true;
  try {
    const response = await api.get('/cron/screenshot-urls/status');
    cronStatus.value = response.data;
  } catch (error: any) {
    console.error('Erreur chargement status CRON:', error);
    cronStatus.value = null;
  } finally {
    loadingCronStatus.value = false;
  }
}

// Déclencher régénération manuelle
async function triggerManualRegeneration() {
  regeneratingUrls.value = true;
  regenerationSuccess.value = false;
  regenerationError.value = null;

  try {
    await api.post('/cron/screenshot-urls/regenerate');
    regenerationSuccess.value = true;
    
    // Rafraîchir le status après 2 secondes
    setTimeout(() => {
      loadCronStatus();
      regenerationSuccess.value = false;
    }, 2000);
  } catch (error: any) {
    console.error('Erreur régénération URLs:', error);
    regenerationError.value = error.response?.data?.message || 'Erreur lors de la régénération';
    
    setTimeout(() => {
      regenerationError.value = null;
    }, 5000);
  } finally {
    regeneratingUrls.value = false;
  }
}

onMounted(() => {
  loadCronStatus();
});
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-2">
      <h2 class="text-2xl font-semibold">Réglages d'administration</h2>
      <p class="text-sm text-base-content/70">
        Paramétrez les options globales de la plateforme OSINT et ajustez les politiques de sécurité.
      </p>
    </header>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="card bg-base-100 shadow">
        <div class="card-body space-y-4">
          <h3 class="card-title text-lg">Paramètres généraux</h3>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Maintenance programmée</span>
              <input type="checkbox" class="toggle toggle-primary" checked />
            </label>
            <span class="label-text-alt text-base-content/60">
              Notifie les utilisateurs 24h avant la maintenance planifiée.
            </span>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Verrouiller la création de comptes</span>
              <input type="checkbox" class="toggle toggle-primary" />
            </label>
            <span class="label-text-alt text-base-content/60">
              Seuls les administrateurs peuvent inviter de nouveaux agents.
            </span>
          </div>
          <button class="btn btn-primary btn-sm self-end">Enregistrer</button>
        </div>
      </div>

      <div class="card bg-base-100 shadow">
        <div class="card-body space-y-4">
          <h3 class="card-title text-lg">Notifications</h3>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Alertes critiques</span>
              <input type="checkbox" class="toggle toggle-secondary" checked />
            </label>
            <span class="label-text-alt text-base-content/60">
              Envoie un courriel aux responsables lors d'un incident majeur.
            </span>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Notifications Slack</span>
              <input type="checkbox" class="toggle toggle-secondary" />
            </label>
            <span class="label-text-alt text-base-content/60">
              Nécessite une intégration Slack valide.
            </span>
          </div>
          <button class="btn btn-secondary btn-sm self-end">Mettre à jour</button>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <h3 class="card-title text-lg">Fonctionnalités bêta</h3>
        <p class="text-sm text-base-content/70">
          Activez temporairement des fonctionnalités en cours d'évaluation pour un sous-ensemble d'équipes.
        </p>
        <ul class="space-y-3">
          <li
            v-for="flag in featureFlags"
            :key="flag.label"
            class="flex flex-col gap-1 rounded border border-base-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p class="font-medium">{{ flag.label }}</p>
              <p class="text-sm text-base-content/60">{{ flag.description }}</p>
            </div>
            <label class="label cursor-pointer justify-end gap-3">
              <span class="label-text text-sm">{{ flag.enabled ? "Activé" : "Désactivé" }}</span>
              <input type="checkbox" class="toggle toggle-accent" :checked="flag.enabled" />
            </label>
          </li>
        </ul>
      </div>
    </div>

    <!-- Section Tâches CRON -->
    <div class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="card-title text-lg flex items-center gap-2">
              <HugeiconsIcon :icon="Calendar03Icon" class="w-5 h-5" />
              Tâches automatiques (CRON)
            </h3>
            <p class="text-sm text-base-content/70 mt-1">
              Surveillance et gestion des tâches planifiées du système
            </p>
          </div>
          <button 
            @click="loadCronStatus" 
            class="btn btn-ghost btn-sm"
            :disabled="loadingCronStatus"
          >
            <HugeiconsIcon 
              :icon="Loading02Icon" 
              class="w-4 h-4"
              :class="{ 'animate-spin': loadingCronStatus }"
            />
            Actualiser
          </button>
        </div>

        <!-- État de chargement -->
        <div v-if="loadingCronStatus" class="flex items-center justify-center py-8">
          <HugeiconsIcon :icon="Loading02Icon" class="w-8 h-8 animate-spin text-primary" />
        </div>

        <!-- Contenu -->
        <div v-else-if="cronStatus" class="space-y-4">
          <!-- Tâche: Régénération des URLs de screenshots -->
          <div class="rounded-lg border border-base-200 p-4 space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-base">{{ cronStatus.service }}</h4>
                  <span class="badge badge-success badge-sm">{{ cronStatus.status }}</span>
                </div>
                <p class="text-sm text-base-content/60 mt-1">
                  Régénère automatiquement les URLs signées des screenshots avant leur expiration
                </p>
              </div>
            </div>

            <!-- Détails de configuration -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div class="flex items-start gap-2">
                <HugeiconsIcon :icon="Calendar03Icon" class="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p class="font-medium text-xs text-base-content/70">Planification</p>
                  <p class="text-base-content">{{ cronStatus.schedule }}</p>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <HugeiconsIcon :icon="AlertCircleIcon" class="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
                <div>
                  <p class="font-medium text-xs text-base-content/70">Seuil de régénération</p>
                  <p class="text-base-content">{{ cronStatus.regenerationThreshold }}</p>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <HugeiconsIcon :icon="CheckmarkCircle02Icon" class="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                <div>
                  <p class="font-medium text-xs text-base-content/70">Durée d'expiration</p>
                  <p class="text-base-content">{{ cronStatus.newExpirationDuration }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-base-200">
              <button 
                @click="triggerManualRegeneration"
                class="btn btn-primary btn-sm"
                :disabled="regeneratingUrls"
              >
                <HugeiconsIcon 
                  :icon="Loading02Icon" 
                  v-if="regeneratingUrls"
                  class="w-4 h-4 animate-spin"
                />
                <span v-else>▶️</span>
                {{ regeneratingUrls ? 'Exécution en cours...' : 'Exécuter maintenant' }}
              </button>

              <!-- Message de succès -->
              <div 
                v-if="regenerationSuccess" 
                class="flex items-center gap-2 text-sm text-success px-3"
              >
                <HugeiconsIcon :icon="CheckmarkCircle02Icon" class="w-4 h-4" />
                <span>Régénération lancée avec succès</span>
              </div>

              <!-- Message d'erreur -->
              <div 
                v-if="regenerationError" 
                class="flex items-center gap-2 text-sm text-error px-3"
              >
                <HugeiconsIcon :icon="AlertCircleIcon" class="w-4 h-4" />
                <span>{{ regenerationError }}</span>
              </div>
            </div>
          </div>

          <!-- Info supplémentaire -->
          <div class="alert alert-info text-sm">
            <HugeiconsIcon :icon="AlertCircleIcon" class="w-5 h-5" />
            <div>
              <p class="font-medium">À propos de la régénération automatique</p>
              <p class="text-xs mt-1">
                Le CRON s'exécute automatiquement tous les jours à 03:00 pour prolonger la validité des URLs 
                de screenshots qui expirent dans moins de 30 jours. Vous pouvez déclencher une exécution 
                manuelle à tout moment via le bouton ci-dessus.
              </p>
            </div>
          </div>
        </div>

        <!-- Erreur de chargement -->
        <div v-else class="alert alert-error">
          <HugeiconsIcon :icon="AlertCircleIcon" class="w-5 h-5" />
          <div>
            <p class="font-medium">Impossible de charger le status des tâches CRON</p>
            <p class="text-xs mt-1">
              Veuillez vérifier que vous avez les permissions nécessaires (system:settings)
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
