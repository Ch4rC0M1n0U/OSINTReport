<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";

import { api } from "@/services/http";

interface ReportSummary {
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

const loading = ref(false);
const error = ref<string | null>(null);
const search = ref("");
const status = ref<string | undefined>(undefined);
const pagination = ref({ limit: 10, offset: 0 });
const reports = ref<PaginatedReports>({ items: [], total: 0, limit: 10, offset: 0 });

async function fetchReports() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get<PaginatedReports>("/reports", {
      params: {
        limit: pagination.value.limit,
        offset: pagination.value.offset,
        search: search.value || undefined,
        status: status.value || undefined,
      },
    });

    reports.value = response.data;
  } catch (err) {
    error.value = "Impossible de charger les rapports";
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(fetchReports, 300);

watch([search, status], () => {
  pagination.value = { ...pagination.value, offset: 0 };
  debouncedFetch();
});

onMounted(() => {
  fetchReports();
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function handlePageChange(direction: 1 | -1) {
  const nextOffset = pagination.value.offset + direction * pagination.value.limit;
  if (nextOffset < 0 || nextOffset >= reports.value.total) {
    return;
  }
  pagination.value = { ...pagination.value, offset: nextOffset };
  fetchReports();
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Rapports</h2>
        <p class="text-sm text-base-content/70">
          Recherchez vos rapports OSINT par statut, mots-clés ou agent.
        </p>
      </div>
      <div class="flex gap-3">
        <input
          v-model="search"
          class="input input-bordered w-full md:w-72"
          placeholder="Recherche (titre, dossier, service)"
          type="search"
        />
        <select v-model="status" class="select select-bordered">
          <option :value="undefined">Tous les statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
          <option value="ARCHIVED">Archivé</option>
        </select>
      </div>
    </header>

    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Émetteur</th>
                <th>Émis le</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="text-center py-10">
                  <span class="loading loading-spinner"></span>
                </td>
              </tr>
              <tr v-else-if="error">
                <td colspan="4" class="text-center text-error py-6">{{ error }}</td>
              </tr>
              <tr v-else-if="reports.items.length === 0">
                <td colspan="4" class="text-center py-6 text-base-content/70">
                  Aucun rapport trouvé pour ces critères.
                </td>
              </tr>
              <tr v-for="report in reports.items" :key="report.id">
                <td class="font-medium">
                  {{ report.title }}
                </td>
                <td>
                  <span class="badge badge-outline uppercase">{{ report.status }}</span>
                </td>
                <td>{{ report.owner.firstName }} {{ report.owner.lastName }}</td>
                <td>{{ formatDate(report.issuedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="flex items-center justify-between border-t px-6 py-4 text-sm">
          <span>
            {{ reports.items.length }} / {{ reports.total }} résultats
          </span>
          <div class="join">
            <button
              class="btn btn-outline btn-sm join-item"
              :disabled="pagination.offset === 0 || loading"
              @click="handlePageChange(-1)"
            >
              Précédent
            </button>
            <button
              class="btn btn-outline btn-sm join-item"
              :disabled="pagination.offset + pagination.limit >= reports.total || loading"
              @click="handlePageChange(1)"
            >
              Suivant
            </button>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>
