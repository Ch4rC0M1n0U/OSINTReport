<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">📋 Logs d'audit</h1>
      <p class="text-base-content/60">
        Consultez l'historique complet des actions effectuées sur la plateforme
      </p>
    </div>

    <!-- Statistiques -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total de logs</div>
        <div class="stat-value text-primary">{{ stats.totalLogs.toLocaleString() }}</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Action principale</div>
        <div class="stat-value text-sm">
          {{ stats.actionStats[0]?.action || "N/A" }}
        </div>
        <div class="stat-desc">{{ stats.actionStats[0]?.count || 0 }} fois</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Ressource principale</div>
        <div class="stat-value text-sm">
          {{ stats.resourceStats[0]?.resource || "N/A" }}
        </div>
        <div class="stat-desc">{{ stats.resourceStats[0]?.count || 0 }} fois</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Utilisateur le plus actif</div>
        <div class="stat-value text-sm" v-if="stats.userStats[0]?.user">
          {{ stats.userStats[0].user.firstName }} {{ stats.userStats[0].user.lastName }}
        </div>
        <div class="stat-value text-sm" v-else>N/A</div>
        <div class="stat-desc">{{ stats.userStats[0]?.count || 0 }} actions</div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card bg-base-100 shadow mb-6">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-title">🔍 Filtres</h2>
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="btn btn-ghost btn-sm"
          >
            ✖️ Effacer les filtres
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Recherche -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Recherche</span>
            </label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Action, ressource, IP..."
              class="input input-bordered"
              @input="debouncedSearch"
            />
          </div>

          <!-- Action -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Action</span>
            </label>
            <select v-model="filters.action" class="select select-bordered" @change="applyFilters">
              <option value="">Toutes les actions</option>
              <option v-for="action in availableActions" :key="action" :value="action">
                {{ formatAction(action) }}
              </option>
            </select>
          </div>

          <!-- Ressource -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Ressource</span>
            </label>
            <select
              v-model="filters.resource"
              class="select select-bordered"
              @change="applyFilters"
            >
              <option value="">Toutes les ressources</option>
              <option v-for="resource in availableResources" :key="resource" :value="resource">
                {{ formatResource(resource) }}
              </option>
            </select>
          </div>

          <!-- Date de début -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date de début</span>
            </label>
            <input
              v-model="filters.startDate"
              type="datetime-local"
              class="input input-bordered"
              @change="applyFilters"
            />
          </div>

          <!-- Date de fin -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date de fin</span>
            </label>
            <input
              v-model="filters.endDate"
              type="datetime-local"
              class="input input-bordered"
              @change="applyFilters"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Tableau des logs -->
    <div v-else-if="logs.length > 0" class="card bg-base-100 shadow">
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>IP</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <!-- Date/Heure -->
              <td class="whitespace-nowrap">
                <div class="text-sm">
                  {{ formatDate(log.timestamp) }}
                </div>
                <div class="text-xs text-base-content/60">
                  {{ formatTime(log.timestamp) }}
                </div>
              </td>

              <!-- Utilisateur -->
              <td>
                <div v-if="log.user" class="flex flex-col">
                  <span class="font-medium">
                    {{ log.user.firstName }} {{ log.user.lastName }}
                  </span>
                  <span class="text-xs text-base-content/60">
                    {{ log.user.matricule }}
                  </span>
                  <span v-if="log.user.unit" class="text-xs text-base-content/50">
                    {{ log.user.unit }}
                  </span>
                </div>
                <div v-else class="text-base-content/50 italic">
                  Système
                </div>
              </td>

              <!-- Action -->
              <td>
                <span :class="getActionBadgeClass(log.action)" class="badge badge-sm">
                  {{ formatAction(log.action) }}
                </span>
              </td>

              <!-- Ressource -->
              <td>
                <div class="flex flex-col">
                  <span class="font-medium">{{ formatResource(log.resource) }}</span>
                  <span v-if="log.resourceId" class="text-xs text-base-content/60 font-mono">
                    ID: {{ log.resourceId.substring(0, 8) }}...
                  </span>
                </div>
              </td>

              <!-- IP -->
              <td>
                <span class="font-mono text-sm">{{ log.ipAddress || "N/A" }}</span>
              </td>

              <!-- Détails -->
              <td>
                <button
                  v-if="log.details"
                  @click="showDetails(log)"
                  class="btn btn-ghost btn-xs"
                >
                  👁️ Voir
                </button>
                <span v-else class="text-base-content/50">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-body border-t">
        <div class="flex items-center justify-between">
          <div class="text-sm text-base-content/60">
            Affichage de {{ (pagination.page - 1) * pagination.limit + 1 }} à
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} sur
            {{ pagination.total }} logs
          </div>

          <div class="join">
            <button
              @click="goToPage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="join-item btn btn-sm"
            >
              «
            </button>
            <button class="join-item btn btn-sm">Page {{ pagination.page }}</button>
            <button
              @click="goToPage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="join-item btn btn-sm"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Aucun résultat -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body text-center py-12">
        <p class="text-base-content/60">Aucun log trouvé</p>
      </div>
    </div>

    <!-- Modal de détails -->
    <dialog ref="detailsModal" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">📋 Détails du log</h3>

        <div v-if="selectedLog" class="space-y-4">
          <!-- Informations générales -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm font-semibold text-base-content/60">Action</div>
              <div>{{ formatAction(selectedLog.action) }}</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-base-content/60">Ressource</div>
              <div>{{ formatResource(selectedLog.resource) }}</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-base-content/60">Date/Heure</div>
              <div>{{ formatDateTime(selectedLog.timestamp) }}</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-base-content/60">Adresse IP</div>
              <div class="font-mono text-sm">{{ selectedLog.ipAddress || "N/A" }}</div>
            </div>
          </div>

          <!-- Utilisateur -->
          <div v-if="selectedLog.user">
            <div class="text-sm font-semibold text-base-content/60 mb-2">Utilisateur</div>
            <div class="bg-base-200 p-3 rounded-lg">
              <div><strong>Nom:</strong> {{ selectedLog.user.firstName }} {{ selectedLog.user.lastName }}</div>
              <div><strong>Matricule:</strong> {{ selectedLog.user.matricule }}</div>
              <div><strong>Email:</strong> {{ selectedLog.user.email }}</div>
              <div v-if="selectedLog.user.unit"><strong>Unité:</strong> {{ selectedLog.user.unit }}</div>
            </div>
          </div>

          <!-- User Agent -->
          <div v-if="selectedLog.userAgent">
            <div class="text-sm font-semibold text-base-content/60 mb-2">Navigateur</div>
            <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all">
              {{ selectedLog.userAgent }}
            </div>
          </div>

          <!-- Détails JSON -->
          <div v-if="selectedLog.details">
            <div class="text-sm font-semibold text-base-content/60 mb-2">Détails techniques</div>
            <pre class="bg-base-200 p-3 rounded-lg overflow-auto max-h-64 text-xs">{{
              JSON.stringify(selectedLog.details, null, 2)
            }}</pre>
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Fermer</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { auditApi, type AuditLog, type AuditStats } from "@/services/api/audit";

const logs = ref<AuditLog[]>([]);
const stats = ref<AuditStats | null>(null);
const loading = ref(false);
const availableActions = ref<string[]>([]);
const availableResources = ref<string[]>([]);

const filters = ref({
  page: 1,
  limit: 50,
  search: "",
  action: "",
  resource: "",
  startDate: "",
  endDate: "",
});

const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
});

const selectedLog = ref<AuditLog | null>(null);
const detailsModal = ref<HTMLDialogElement | null>(null);

let searchTimeout: number | null = null;

const hasActiveFilters = computed(() => {
  return (
    filters.value.search ||
    filters.value.action ||
    filters.value.resource ||
    filters.value.startDate ||
    filters.value.endDate
  );
});

/**
 * Charger les logs
 */
async function loadLogs() {
  try {
    loading.value = true;
    const response = await auditApi.getLogs({
      page: filters.value.page,
      limit: filters.value.limit,
      search: filters.value.search || undefined,
      action: filters.value.action || undefined,
      resource: filters.value.resource || undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
    });

    logs.value = response.data;
    pagination.value = response.pagination;
  } catch (error) {
    console.error("Erreur lors du chargement des logs:", error);
  } finally {
    loading.value = false;
  }
}

/**
 * Charger les statistiques
 */
async function loadStats() {
  try {
    stats.value = await auditApi.getStats(
      filters.value.startDate || undefined,
      filters.value.endDate || undefined
    );
  } catch (error) {
    console.error("Erreur lors du chargement des stats:", error);
  }
}

/**
 * Charger les listes de filtres disponibles
 */
async function loadFilterOptions() {
  try {
    [availableActions.value, availableResources.value] = await Promise.all([
      auditApi.getActions(),
      auditApi.getResources(),
    ]);
  } catch (error) {
    console.error("Erreur lors du chargement des options de filtres:", error);
  }
}

/**
 * Recherche avec debounce
 */
function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = window.setTimeout(() => {
    filters.value.page = 1;
    loadLogs();
  }, 500);
}

/**
 * Appliquer les filtres
 */
function applyFilters() {
  filters.value.page = 1;
  loadLogs();
  loadStats();
}

/**
 * Effacer tous les filtres
 */
function clearFilters() {
  filters.value = {
    page: 1,
    limit: 50,
    search: "",
    action: "",
    resource: "",
    startDate: "",
    endDate: "",
  };
  loadLogs();
  loadStats();
}

/**
 * Aller à une page
 */
function goToPage(page: number) {
  filters.value.page = page;
  loadLogs();
}

/**
 * Afficher les détails d'un log
 */
function showDetails(log: AuditLog) {
  selectedLog.value = log;
  detailsModal.value?.showModal();
}

/**
 * Formater une action
 */
function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Formater une ressource
 */
function formatResource(resource: string): string {
  const resourceNames: Record<string, string> = {
    auth: "Authentification",
    user: "Utilisateur",
    report: "Rapport",
    module: "Module",
    entity: "Entité",
    research: "Recherche",
    file: "Fichier",
    correlation: "Corrélation",
    settings: "Paramètres",
    ai: "Intelligence Artificielle",
    search: "Recherche",
  };
  return resourceNames[resource] || resource;
}

/**
 * Classe CSS pour le badge d'action
 */
function getActionBadgeClass(action: string): string {
  if (action.includes("CREATE")) return "badge-success";
  if (action.includes("UPDATE")) return "badge-info";
  if (action.includes("DELETE")) return "badge-error";
  if (action.includes("LOGIN")) return "badge-primary";
  if (action.includes("FAILED")) return "badge-warning";
  return "badge-ghost";
}

/**
 * Formater une date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formater une heure
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Formater une date et heure complète
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

onMounted(async () => {
  await Promise.all([loadLogs(), loadStats(), loadFilterOptions()]);
});
</script>
