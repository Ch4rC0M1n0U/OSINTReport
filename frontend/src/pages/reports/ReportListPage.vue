<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";

import { useReportsStore } from "@/stores/reports";

const reportsStore = useReportsStore();
const { items, total, loading, error, search, status, hasNext, hasPrevious } =
  storeToRefs(reportsStore);

const debouncedFetch = useDebounceFn(() => reportsStore.fetchReports(), 300);

const searchModel = computed({
  get: () => search.value,
  set: (value: string) => {
    reportsStore.setSearch(value);
    debouncedFetch();
  },
});

const statusModel = computed({
  get: () => status.value ?? "",
  set: (value: string) => {
    reportsStore.setStatus(value || undefined);
    debouncedFetch();
  },
});

onMounted(() => {
  reportsStore.fetchReports().catch(() => {
    /* already handled in store */
  });
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function handlePageChange(direction: 1 | -1) {
  if (direction === 1) {
    void reportsStore.goToNextPage();
  } else {
    void reportsStore.goToPreviousPage();
  }
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
        <router-link to="/reports/new" class="btn btn-primary">
          + Créer un rapport
        </router-link>
      </div>
    </header>

    <header class="flex gap-3">
      <div class="flex flex-1 gap-3">
        <input
          v-model="searchModel"
          class="input input-bordered w-full md:w-72"
          placeholder="Recherche (titre, dossier, service)"
          type="search"
        />
        <select v-model="statusModel" class="select select-bordered">
          <option value="">Tous les statuts</option>
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
              <tr v-else-if="items.length === 0">
                <td colspan="4" class="text-center py-6 text-base-content/70">
                  Aucun rapport trouvé pour ces critères.
                </td>
              </tr>
              <tr 
                v-for="report in items" 
                :key="report.id"
                class="hover:bg-base-200 cursor-pointer"
                @click="$router.push({ name: 'reports.detail', params: { id: report.id } })"
              >
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
            {{ items.length }} / {{ total }} résultats
          </span>
          <div class="join">
            <button
              class="btn btn-outline btn-sm join-item"
              :disabled="!hasPrevious || loading"
              @click="handlePageChange(-1)"
            >
              Précédent
            </button>
            <button
              class="btn btn-outline btn-sm join-item"
              :disabled="!hasNext || loading"
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
