<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">🔍 Gestion de la recherche</h1>
      <p class="text-base-content/70">
        Administration de l'index MeiliSearch pour la recherche de rapports et la détection de corrélations
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Statistiques de l'index -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📊 Statistiques de l'index</h2>

          <div v-if="searchStats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <!-- Documents indexés -->
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div class="stat-title">Documents indexés</div>
              <div class="stat-value text-primary">{{ searchStats.numberOfDocuments }}</div>
              <div class="stat-desc">Rapports dans l'index</div>
            </div>

            <!-- État de l'index -->
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure" :class="searchStats.isIndexing ? 'text-warning' : 'text-success'">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div class="stat-title">État</div>
              <div
                class="stat-value text-2xl"
                :class="searchStats.isIndexing ? 'text-warning' : 'text-success'"
              >
                {{ searchStats.isIndexing ? "Indexation..." : "Prêt" }}
              </div>
              <div class="stat-desc">
                {{ searchStats.isIndexing ? "Opération en cours" : "Index disponible" }}
              </div>
            </div>

            <!-- Distribution des champs -->
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div class="stat-title">Champs indexés</div>
              <div class="stat-value text-secondary">
                {{ Object.keys(searchStats.fieldDistribution || {}).length }}
              </div>
              <div class="stat-desc">Attributs disponibles</div>
            </div>
          </div>

          <div v-else class="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Impossible de charger les statistiques</span>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-4 mt-6">
            <button
              type="button"
              @click="loadSearchStats"
              class="btn btn-outline btn-primary"
              :disabled="loadingSearchStats"
            >
              <span v-if="loadingSearchStats" class="loading loading-spinner loading-sm"></span>
              <span v-else>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </span>
              Actualiser les statistiques
            </button>
          </div>
        </div>
      </div>

      <!-- Actions de maintenance -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">⚙️ Maintenance de l'index</h2>

          <div class="space-y-4">
            <!-- Réindexation complète -->
            <div class="border border-base-300 rounded-lg p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-lg mb-2">⚡ Réindexation complète</h3>
                  <p class="text-sm opacity-70 mb-3">
                    Réindexe tous les rapports dans MeiliSearch. Cette opération supprime l'index
                    existant et le reconstruit entièrement.
                  </p>
                  <div class="text-xs opacity-60 space-y-1">
                    <p>✓ Nécessaire après une mise à jour majeure du système</p>
                    <p>✓ Corrige les incohérences dans l'index</p>
                    <p>✓ Active la détection de corrélations pour les nouveaux rapports</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="handleReindex"
                  class="btn btn-warning ml-4"
                  :disabled="reindexing || (searchStats?.isIndexing || false)"
                >
                  <span v-if="reindexing" class="loading loading-spinner loading-sm"></span>
                  <span v-else>⚡</span>
                  Réindexer
                </button>
              </div>
            </div>

            <!-- Info importante -->
            <div class="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <strong>Note importante :</strong>
                <p class="text-sm mt-1">
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
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">🔧 Informations techniques</h2>

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
                class="stat bg-base-200 rounded p-3"
              >
                <div class="stat-title text-xs">{{ field }}</div>
                <div class="stat-value text-lg">{{ count }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { searchAdminApi, type SearchStats } from "@/services/api/search-admin";
import { useModal } from "@/composables/useModal";
import ModalDialog from "@/components/shared/ModalDialog.vue";

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
