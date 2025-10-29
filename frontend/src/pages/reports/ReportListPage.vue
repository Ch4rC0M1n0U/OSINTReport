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
    <!-- En-tête -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <h2 class="text-3xl font-bold mb-2">Rapports OSINT</h2>
          <p class="text-sm text-base-content/60">
            Recherchez et gérez vos rapports d'investigation
          </p>
        </div>
        <router-link to="/reports/new" class="btn btn-primary gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Créer un rapport
        </router-link>
      </div>
    </header>

    <!-- Filtres -->
    <div class="bg-base-100 border-l-4 border-info shadow-sm p-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label class="text-xs uppercase tracking-wider text-base-content/60 mb-2 block">
            Recherche
          </label>
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              v-model="searchModel"
              class="input input-bordered w-full pl-10"
              placeholder="Titre, numéro de dossier, service..."
              type="search"
            />
          </div>
        </div>
        <div class="md:w-64">
          <label class="text-xs uppercase tracking-wider text-base-content/60 mb-2 block">
            Statut
          </label>
          <select v-model="statusModel" class="select select-bordered w-full">
            <option value="">Tous les statuts</option>
            <option value="DRAFT">📝 Brouillon</option>
            <option value="PUBLISHED">✅ Publié</option>
            <option value="ARCHIVED">📦 Archivé</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Liste des rapports -->
    <div class="bg-base-100 border-l-4 border-success shadow-sm">
      <div class="p-0">
        <!-- En-tête de la liste -->
        <div class="px-6 py-4 border-b border-base-200 bg-base-50">
          <div class="grid grid-cols-12 gap-4 text-xs uppercase tracking-wider text-base-content/60 font-semibold">
            <div class="col-span-5">Rapport</div>
            <div class="col-span-2">Statut</div>
            <div class="col-span-3">Émetteur</div>
            <div class="col-span-2">Date d'émission</div>
          </div>
        </div>

        <!-- Contenu -->
        <div v-if="loading" class="text-center py-16">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="text-sm text-base-content/60 mt-4">Chargement des rapports...</p>
        </div>
        
        <div v-else-if="error" class="text-center py-16">
          <div class="text-error text-xl mb-2">⚠️</div>
          <p class="text-error font-semibold">{{ error }}</p>
        </div>
        
        <div v-else-if="items.length === 0" class="text-center py-16">
          <div class="text-6xl mb-4 opacity-20">📄</div>
          <p class="text-base-content/60">Aucun rapport trouvé pour ces critères.</p>
        </div>

        <div v-else class="divide-y divide-base-200">
          <div
            v-for="report in items" 
            :key="report.id"
            class="px-6 py-4 hover:bg-base-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-primary"
            @click="$router.push({ name: 'reports.detail', params: { id: report.id } })"
          >
            <div class="grid grid-cols-12 gap-4 items-center">
              <!-- Titre -->
              <div class="col-span-5">
                <div class="font-semibold text-base">{{ report.title }}</div>
              </div>

              <!-- Statut -->
              <div class="col-span-2">
                <div class="flex items-center gap-2">
                  <div 
                    class="w-1 h-8 rounded-sm"
                    :class="{
                      'bg-warning': report.status === 'DRAFT',
                      'bg-success': report.status === 'PUBLISHED',
                      'bg-base-300': report.status === 'ARCHIVED'
                    }"
                  ></div>
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <div class="font-medium text-sm">{{ report.status }}</div>
                      <span 
                        v-if="report.isLocked" 
                        class="text-success text-lg" 
                        title="Rapport validé et verrouillé"
                      >
                        🔒
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Émetteur -->
              <div class="col-span-3">
                <div class="flex items-center gap-2">
                  <div class="avatar placeholder">
                    <div class="bg-neutral text-neutral-content w-8 h-8 rounded-sm">
                      <span class="text-xs">{{ report.owner.firstName[0] }}{{ report.owner.lastName[0] }}</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-medium text-sm">{{ report.owner.firstName }} {{ report.owner.lastName }}</div>
                  </div>
                </div>
              </div>

              <!-- Date -->
              <div class="col-span-2">
                <div class="text-sm text-base-content/70">{{ formatDate(report.issuedAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <footer class="flex items-center justify-between border-t border-base-200 px-6 py-4 bg-base-50">
          <div class="text-sm text-base-content/60">
            <span class="font-semibold text-base-content">{{ items.length }}</span> sur 
            <span class="font-semibold text-base-content">{{ total }}</span> résultats
          </div>
          <div class="join">
            <button
              class="btn btn-sm join-item"
              :disabled="!hasPrevious || loading"
              @click="handlePageChange(-1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Précédent
            </button>
            <button
              class="btn btn-sm join-item"
              :disabled="!hasNext || loading"
              @click="handlePageChange(1)"
            >
              Suivant
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>
