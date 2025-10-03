<template>
  <div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- En-tête de la page -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2 flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Recherche de rapports
      </h1>
      <p class="text-base-content/70">
        Recherchez dans tous les rapports OSINT par titre, contenu, mots-clés ou entités
      </p>
    </div>

    <!-- Barre de recherche -->
    <div class="card bg-base-100 shadow-lg mb-6">
      <div class="card-body p-4">
        <form @submit.prevent="handleSearch" class="flex gap-2">
          <div class="flex-1">
            <input
              v-model="localQuery"
              type="text"
              placeholder="Rechercher par titre, mots-clés, numéro de dossier, contenu..."
              class="input input-bordered w-full"
              :disabled="searchStore.loading"
            />
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="searchStore.loading"
          >
            <svg
              v-if="searchStore.loading"
              class="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span v-else>Rechercher</span>
          </button>
        </form>

        <!-- Suggestions rapides -->
        <div v-if="!searchStore.hasQuery && !searchStore.hasResults" class="mt-3">
          <p class="text-sm text-base-content/60 mb-2">Suggestions :</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="suggestion in quickSuggestions"
              :key="suggestion"
              @click="applySuggestion(suggestion)"
              class="btn btn-ghost btn-xs"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout principal : filtres (sidebar) + résultats -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar filtres (1/4) -->
      <div class="lg:col-span-1">
        <SearchFilters />
      </div>

      <!-- Résultats (3/4) -->
      <div class="lg:col-span-3">
        <SearchResults />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSearchStore } from "@/stores/search";
import SearchFilters from "@/components/search/SearchFilters.vue";
import SearchResults from "@/components/search/SearchResults.vue";

const searchStore = useSearchStore();
const localQuery = ref("");

const quickSuggestions = [
  "cyber",
  "fraude",
  "trafic",
  "blanchiment",
  "enquête en cours",
  "urgent",
];

async function handleSearch() {
  await searchStore.updateQuery(localQuery.value);
}

function applySuggestion(suggestion: string) {
  localQuery.value = suggestion;
  handleSearch();
}

onMounted(() => {
  // Synchroniser la query locale avec le store
  localQuery.value = searchStore.query;

  // Si on arrive sur la page avec une query existante, lancer la recherche
  if (searchStore.hasQuery) {
    searchStore.search();
  }
});
</script>
