<template>
  <div class="bg-base-200 rounded-lg p-4 space-y-4">
    <!-- En-tête des filtres -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold flex items-center gap-2">
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filtres
        <span v-if="searchStore.activeFiltersCount > 0" class="badge badge-primary">
          {{ searchStore.activeFiltersCount }}
        </span>
      </h3>
      <button
        v-if="searchStore.activeFiltersCount > 0"
        @click="searchStore.resetFilters()"
        class="btn btn-ghost btn-sm"
      >
        Réinitialiser
      </button>
    </div>

    <!-- Tri -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Trier par</span>
      </label>
      <select
        v-model="searchStore.sortBy"
        @change="searchStore.updateSort(searchStore.sortBy)"
        class="select select-bordered w-full"
      >
        <option value="createdAt:desc">Plus récent</option>
        <option value="createdAt:asc">Plus ancien</option>
        <option value="updatedAt:desc">Dernière modification</option>
        <option value="issuedAt:desc">Date d'émission</option>
        <option value="title:asc">Titre (A-Z)</option>
      </select>
    </div>

    <!-- Filtre statut -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Statut</span>
      </label>
      <div class="space-y-2">
        <label
          v-for="status in statusOptions"
          :key="status.value"
          class="label cursor-pointer justify-start gap-3"
        >
          <input
            type="radio"
            name="status"
            :value="status.value"
            :checked="searchStore.statusFilter === status.value"
            @change="searchStore.updateFilter('status', status.value)"
            class="radio radio-primary radio-sm"
          />
          <span class="label-text">{{ status.label }}</span>
          <span
            v-if="searchStore.facets?.status?.[status.value]"
            class="badge badge-ghost badge-sm ml-auto"
          >
            {{ searchStore.facets.status[status.value] }}
          </span>
        </label>
        <label class="label cursor-pointer justify-start gap-3">
          <input
            type="radio"
            name="status"
            :value="null"
            :checked="searchStore.statusFilter === null"
            @change="searchStore.updateFilter('status', null)"
            class="radio radio-sm"
          />
          <span class="label-text text-base-content/70">Tous</span>
        </label>
      </div>
    </div>

    <!-- Filtre urgence -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Urgence</span>
      </label>
      <div class="space-y-2">
        <label
          v-for="urgency in urgencyOptions"
          :key="urgency.value"
          class="label cursor-pointer justify-start gap-3"
        >
          <input
            type="radio"
            name="urgency"
            :value="urgency.value"
            :checked="searchStore.urgencyFilter === urgency.value"
            @change="searchStore.updateFilter('urgency', urgency.value)"
            class="radio radio-sm"
            :class="urgency.radioClass"
          />
          <span class="label-text">{{ urgency.label }}</span>
          <span
            v-if="searchStore.facets?.urgencyLevel?.[urgency.value]"
            class="badge badge-ghost badge-sm ml-auto"
          >
            {{ searchStore.facets.urgencyLevel[urgency.value] }}
          </span>
        </label>
        <label class="label cursor-pointer justify-start gap-3">
          <input
            type="radio"
            name="urgency"
            :value="null"
            :checked="searchStore.urgencyFilter === null"
            @change="searchStore.updateFilter('urgency', null)"
            class="radio radio-sm"
          />
          <span class="label-text text-base-content/70">Tous</span>
        </label>
      </div>
    </div>

    <!-- Filtre classification -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Classification</span>
      </label>
      <div class="space-y-2">
        <label
          v-for="classification in classificationOptions"
          :key="classification.value"
          class="label cursor-pointer justify-start gap-3"
        >
          <input
            type="radio"
            name="classification"
            :value="classification.value"
            :checked="searchStore.classificationFilter === classification.value"
            @change="searchStore.updateFilter('classification', classification.value)"
            class="radio radio-sm"
            :class="classification.radioClass"
          />
          <span class="label-text">{{ classification.label }}</span>
          <span
            v-if="searchStore.facets?.classification?.[classification.value]"
            class="badge badge-ghost badge-sm ml-auto"
          >
            {{ searchStore.facets.classification[classification.value] }}
          </span>
        </label>
        <label class="label cursor-pointer justify-start gap-3">
          <input
            type="radio"
            name="classification"
            :value="null"
            :checked="searchStore.classificationFilter === null"
            @change="searchStore.updateFilter('classification', null)"
            class="radio radio-sm"
          />
          <span class="label-text text-base-content/70">Tous</span>
        </label>
      </div>
    </div>

    <!-- Statistiques (admin uniquement) -->
    <div v-if="authStore.hasPermission('system:admin')" class="divider"></div>
    <div v-if="authStore.hasPermission('system:admin') && searchStore.stats" class="space-y-2">
      <h4 class="text-sm font-semibold text-base-content/70">Statistiques de l'index</h4>
      <div class="stats stats-vertical shadow-sm bg-base-100">
        <div class="stat py-2 px-3">
          <div class="stat-title text-xs">Documents indexés</div>
          <div class="stat-value text-2xl">{{ searchStore.stats.numberOfDocuments }}</div>
        </div>
        <div class="stat py-2 px-3">
          <div class="stat-title text-xs">Statut d'indexation</div>
          <div class="stat-value text-lg">
            <span v-if="searchStore.stats.isIndexing" class="loading loading-spinner loading-sm"></span>
            <span v-else class="text-success">✓</span>
          </div>
        </div>
      </div>
      <button
        @click="handleReindex"
        :disabled="searchStore.loading"
        class="btn btn-outline btn-sm w-full"
      >
        <span v-if="searchStore.loading" class="loading loading-spinner loading-xs"></span>
        <span v-else>Réindexer tout</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useSearchStore } from "@/stores/search";
import { useAuthStore } from "@/stores/auth";

const searchStore = useSearchStore();
const authStore = useAuthStore();

const statusOptions = [
  { label: "Brouillon", value: "DRAFT" },
  { label: "Publié", value: "PUBLISHED" },
  { label: "Archivé", value: "ARCHIVED" },
];

const urgencyOptions = [
  { label: "Routine", value: "ROUTINE", radioClass: "radio-success" },
  { label: "Urgent", value: "URGENT", radioClass: "radio-warning" },
  { label: "Critique", value: "CRITICAL", radioClass: "radio-error" },
];

const classificationOptions = [
  { label: "Public", value: "PUBLIC", radioClass: "radio-success" },
  { label: "Restreint", value: "RESTRICTED", radioClass: "radio-info" },
  { label: "Confidentiel", value: "CONFIDENTIAL", radioClass: "radio-warning" },
  { label: "Secret", value: "SECRET", radioClass: "radio-error" },
];

async function handleReindex() {
  if (confirm("Êtes-vous sûr de vouloir réindexer tous les rapports ?")) {
    try {
      await searchStore.reindex();
      alert("Réindexation terminée avec succès");
    } catch (err) {
      alert("Erreur lors de la réindexation");
    }
  }
}

onMounted(async () => {
  // Charger les facettes au montage
  await searchStore.loadFacets();

  // Charger les stats si admin
  if (authStore.hasPermission("system:admin")) {
    await searchStore.loadStats();
  }
});
</script>
