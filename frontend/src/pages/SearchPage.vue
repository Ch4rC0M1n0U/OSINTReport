<template>
  <section class="container mx-auto px-4 py-6 max-w-7xl space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="Search01Icon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Recherche de rapports</h1>
          <p class="text-base-content/70 mt-1">
            Recherchez dans tous les rapports OSINT par titre, contenu, mots-clés ou entités
          </p>
        </div>
      </div>
    </header>

    <!-- Barre de recherche -->
    <div class="bg-base-200 border-l-4 border-accent p-6">
      <form @submit.prevent="handleSearch" class="flex gap-3">
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <HugeiconsIcon :icon="Search01Icon" :size="20" class="text-base-content/40" />
          </div>
          <input
            v-model="localQuery"
            type="text"
            placeholder="Rechercher par titre, mots-clés, numéro de dossier, contenu..."
            class="input input-bordered w-full pl-12"
            :disabled="searchStore.loading"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary gap-2 min-w-[140px]"
          :disabled="searchStore.loading"
        >
          <span v-if="searchStore.loading" class="loading loading-spinner loading-sm"></span>
          <HugeiconsIcon v-else :icon="Search01Icon" :size="18" />
          {{ searchStore.loading ? 'Recherche...' : 'Rechercher' }}
        </button>
      </form>

      <!-- Suggestions rapides -->
      <div v-if="!searchStore.hasQuery && !searchStore.hasResults" class="mt-4 pt-4 border-t border-base-300">
        <div class="flex items-center gap-2 mb-3">
          <HugeiconsIcon :icon="SparklesIcon" :size="16" class="text-base-content/60" />
          <p class="text-sm font-medium text-base-content/60">Suggestions rapides :</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="suggestion in quickSuggestions"
            :key="suggestion"
            @click="applySuggestion(suggestion)"
            class="btn btn-sm btn-ghost border border-base-300 hover:border-primary hover:text-primary gap-2"
          >
            <HugeiconsIcon :icon="Tag01Icon" :size="14" />
            {{ suggestion }}
          </button>
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
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useSearchStore } from "@/stores/search";
import SearchFilters from "@/components/search/SearchFilters.vue";
import SearchResults from "@/components/search/SearchResults.vue";

// Import HugeIcons
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Search01Icon,
  SparklesIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

const searchStore = useSearchStore();
const route = useRoute();
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
  // Lire la query de l'URL si présente
  const urlQuery = route.query.q as string | undefined;
  
  if (urlQuery) {
    // Query depuis l'URL (prioritaire)
    localQuery.value = urlQuery;
    searchStore.updateQuery(urlQuery);
    searchStore.search();
  } else {
    // Sinon, synchroniser avec le store
    localQuery.value = searchStore.query;
    
    // Si on arrive sur la page avec une query existante dans le store, lancer la recherche
    if (searchStore.hasQuery) {
      searchStore.search();
    }
  }
});
</script>
