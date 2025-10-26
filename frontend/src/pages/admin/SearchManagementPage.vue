<template>
  <section class="space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="SearchAreaIcon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Gestion de la recherche</h1>
          <p class="text-base-content/70 mt-1">
            Administration de l'index MeiliSearch pour la recherche de rapports et la détection de corrélations
          </p>
        </div>
      </div>
    </header>

    <!-- Chargement -->
    <div v-if="loading" class="bg-base-200 border-l-4 border-info p-12">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-info"></span>
        <p class="text-base-content/70">Chargement des statistiques...</p>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="bg-base-200 border-l-4 border-error p-5">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-error" />
        <span class="font-medium">{{ error }}</span>
      </div>
    </div>

    <!-- Contenu -->
    <div v-else class="space-y-6">
      <!-- Statistiques de l'index -->
      <div class="bg-base-200 border-l-4 border-accent">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Analytics02Icon" :size="24" class="text-accent" />
            <h2 class="text-xl font-semibold">Statistiques de l'index</h2>
          </div>
        </div>

        <div class="p-6">
          <div v-if="searchStats" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Documents indexés -->
            <div class="bg-base-300/30 border-l-4 border-primary rounded p-5">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="text-sm text-base-content/70 mb-1">Documents indexés</div>
                  <div class="text-3xl font-bold text-primary">{{ searchStats.numberOfDocuments }}</div>
                  <div class="text-xs text-base-content/60 mt-1">Rapports dans l'index</div>
                </div>
                <div class="p-2 rounded-lg bg-primary/10">
                  <HugeiconsIcon :icon="Database01Icon" :size="24" class="text-primary" />
                </div>
              </div>
            </div>

            <!-- État de l'index -->
            <div class="bg-base-300/30 border-l-4 rounded p-5" :class="searchStats.isIndexing ? 'border-warning' : 'border-success'">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="text-sm text-base-content/70 mb-1">État</div>
                  <div
                    class="text-2xl font-bold"
                    :class="searchStats.isIndexing ? 'text-warning' : 'text-success'"
                  >
                    {{ searchStats.isIndexing ? "Indexation..." : "Prêt" }}
                  </div>
                  <div class="text-xs text-base-content/60 mt-1">
                    {{ searchStats.isIndexing ? "Opération en cours" : "Index disponible" }}
                  </div>
                </div>
                <div class="p-2 rounded-lg" :class="searchStats.isIndexing ? 'bg-warning/10' : 'bg-success/10'">
                  <span v-if="searchStats.isIndexing" class="loading loading-spinner loading-md text-warning"></span>
                  <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="24" class="text-success" />
                </div>
              </div>
            </div>

            <!-- Distribution des champs -->
            <div class="bg-base-300/30 border-l-4 border-info rounded p-5">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="text-sm text-base-content/70 mb-1">Champs indexés</div>
                  <div class="text-3xl font-bold text-info">
                    {{ Object.keys(searchStats.fieldDistribution || {}).length }}
                  </div>
                  <div class="text-xs text-base-content/60 mt-1">Attributs disponibles</div>
                </div>
                <div class="p-2 rounded-lg bg-info/10">
                  <HugeiconsIcon :icon="Settings02Icon" :size="24" class="text-info" />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="bg-base-300/30 border-l-4 border-warning p-5 rounded">
            <div class="flex items-center gap-3">
              <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-warning" />
              <span class="font-medium">Impossible de charger les statistiques</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              @click="loadSearchStats"
              class="btn btn-outline btn-primary gap-2"
              :disabled="loadingSearchStats"
            >
              <span v-if="loadingSearchStats" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="RefreshIcon" :size="18" />
              Actualiser les statistiques
            </button>
          </div>
        </div>
      </div>

      <!-- Actions de maintenance -->
      <div class="bg-base-200 border-l-4 border-warning">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Settings02Icon" :size="24" class="text-warning" />
            <h2 class="text-xl font-semibold">Maintenance de l'index</h2>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Réindexation complète -->
          <div class="bg-base-300/30 border border-base-300 rounded-lg p-5">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex-1 min-w-[250px]">
                <h3 class="font-semibold text-lg mb-2 flex items-center gap-2">
                  <HugeiconsIcon :icon="RefreshIcon" :size="20" class="text-warning" />
                  Réindexation complète
                </h3>
                <p class="text-sm text-base-content/70 mb-3">
                  Réindexe tous les rapports dans MeiliSearch. Cette opération supprime l'index
                  existant et le reconstruit entièrement.
                </p>
                <div class="text-xs text-base-content/60 space-y-1">
                  <p class="flex items-center gap-1">
                    <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="14" class="text-success" />
                    Nécessaire après une mise à jour majeure du système
                  </p>
                  <p class="flex items-center gap-1">
                    <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="14" class="text-success" />
                    Corrige les incohérences dans l'index
                  </p>
                  <p class="flex items-center gap-1">
                    <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="14" class="text-success" />
                    Active la détection de corrélations pour les nouveaux rapports
                  </p>
                </div>
              </div>
              <button
                type="button"
                @click="handleReindex"
                class="btn btn-warning gap-2 shrink-0"
                :disabled="reindexing || (searchStats?.isIndexing || false)"
              >
                <span v-if="reindexing" class="loading loading-spinner loading-sm"></span>
                <HugeiconsIcon v-else :icon="RefreshIcon" :size="18" />
                Réindexer
              </button>
            </div>
          </div>

          <!-- Info importante -->
          <div class="bg-base-300/30 border-l-4 border-warning p-5 rounded">
            <div class="flex items-start gap-3">
              <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-warning mt-0.5" />
              <div>
                <strong>Note importante :</strong>
                <p class="text-sm mt-1 text-base-content/70">
                  La réindexation complète peut prendre plusieurs minutes si vous avez beaucoup de
                  rapports. L'interface restera bloquée pendant l'opération. Une fois terminée, un
                  message de confirmation s'affichera avec le nombre de rapports indexés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations techniques -->
      <div class="bg-base-200 border-l-4 border-info">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="InformationCircleIcon" :size="24" class="text-info" />
            <h2 class="text-xl font-semibold">Informations techniques</h2>
          </div>
        </div>

        <div class="p-6">
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Paramètre</th>
                  <th>Valeur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-semibold">Index principal</td>
                  <td><code class="badge badge-ghost">reports</code></td>
                </tr>
                <tr>
                  <td class="font-semibold">Attributs recherchables</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span class="badge badge-sm badge-primary">title</span>
                      <span class="badge badge-sm badge-primary">caseNumber</span>
                      <span class="badge badge-sm badge-primary">summary</span>
                      <span class="badge badge-sm badge-primary">keywords</span>
                      <span class="badge badge-sm badge-primary">modulesContent</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="font-semibold">Attributs filtrables</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span class="badge badge-sm badge-secondary">status</span>
                      <span class="badge badge-sm badge-secondary">classification</span>
                      <span class="badge badge-sm badge-secondary">urgencyLevel</span>
                      <span class="badge badge-sm badge-secondary">ownerId</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="font-semibold">Attributs triables</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span class="badge badge-sm badge-accent">createdAt</span>
                      <span class="badge badge-sm badge-accent">updatedAt</span>
                      <span class="badge badge-sm badge-accent">issuedAt</span>
                      <span class="badge badge-sm badge-accent">title</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="searchStats?.fieldDistribution" class="mt-6">
            <h3 class="font-semibold mb-3">Distribution des champs</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div
                v-for="(count, field) in searchStats.fieldDistribution"
                :key="field"
                class="bg-base-300/30 border-l-4 border-accent rounded p-3"
              >
                <div class="text-xs text-base-content/70">{{ field }}</div>
                <div class="text-lg font-bold text-accent">{{ count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Dialog -->
    <ModalDialog
      v-model="modal.isOpen.value"
      :title="modal.config.value.title"
      :message="modal.config.value.message"
      :type="modal.config.value.type"
      :confirm-text="modal.config.value.confirmText"
      :cancel-text="modal.config.value.cancelText"
      :is-confirm="
        modal.config.value.type === 'confirm' || modal.config.value.type === 'error'
      "
      @confirm="modal.handleConfirm"
      @cancel="modal.handleCancel"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { searchAdminApi, type SearchStats } from "@/services/api/search-admin";
import { useModal } from "@/composables/useModal";
import ModalDialog from "@/components/shared/ModalDialog.vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  SearchAreaIcon,
  Analytics02Icon,
  RefreshIcon,
  AlertCircleIcon,
  InformationCircleIcon,
  Database01Icon,
  Settings02Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

const modal = useModal();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const searchStats = ref<SearchStats | null>(null);
const loadingSearchStats = ref(false);
const reindexing = ref(false);

// Methods
async function loadSearchStats() {
  loadingSearchStats.value = true;
  error.value = null;

  try {
    const stats = await searchAdminApi.getStats();
    searchStats.value = stats;
  } catch (err: any) {
    console.error("Erreur chargement stats:", err);
    error.value = err.response?.data?.message || "Erreur lors du chargement des statistiques";
  } finally {
    loadingSearchStats.value = false;
    loading.value = false;
  }
}

async function handleReindex() {
  const confirmed = await modal.showConfirm(
    "Êtes-vous sûr de vouloir réindexer tous les rapports ? Cette opération peut prendre plusieurs minutes et l'interface sera bloquée pendant ce temps.",
    "Réindexation complète",
    "Réindexer maintenant",
    "Annuler"
  );

  if (!confirmed) return;

  reindexing.value = true;
  try {
    const result = await searchAdminApi.reindex();
    await modal.showSuccess(
      result.message || `✅ ${result.indexed} rapport(s) réindexé(s) avec succès !`,
      "Réindexation terminée"
    );
    // Recharger les statistiques
    await loadSearchStats();
  } catch (err: any) {
    console.error("Erreur réindexation:", err);
    await modal.showError(
      err.response?.data?.message || "Erreur lors de la réindexation",
      "Erreur de réindexation"
    );
  } finally {
    reindexing.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadSearchStats();
});
</script>
