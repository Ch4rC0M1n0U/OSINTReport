<template>
  <div class="bg-base-200 border-l-4 border-info p-5 space-y-5">
    <!-- En-tête des filtres -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <HugeiconsIcon :icon="FilterIcon" :size="20" />
        Filtres
        <span v-if="searchStore.activeFiltersCount > 0" class="badge badge-primary">
          {{ searchStore.activeFiltersCount }}
        </span>
      </h3>
      <button
        v-if="searchStore.activeFiltersCount > 0"
        @click="searchStore.resetFilters()"
        class="btn btn-ghost btn-sm gap-1"
      >
        <HugeiconsIcon :icon="Cancel01Icon" :size="14" />
        Réinitialiser
      </button>
    </div>

    <!-- Tri -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium flex items-center gap-2">
          <HugeiconsIcon :icon="SortingIcon" :size="16" />
          Trier par
        </span>
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
        <span class="label-text font-medium flex items-center gap-2">
          <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="16" />
          Statut
        </span>
      </label>
      <div class="space-y-2">
        <label
          v-for="status in statusOptions"
          :key="status.value"
          class="label cursor-pointer justify-start gap-3 hover:bg-base-300/50 rounded px-2 -mx-2"
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
        <label class="label cursor-pointer justify-start gap-3 hover:bg-base-300/50 rounded px-2 -mx-2">
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
        <span class="label-text font-medium flex items-center gap-2">
          <HugeiconsIcon :icon="AlertCircleIcon" :size="16" />
          Urgence
        </span>
      </label>
      <div class="space-y-2">
        <label
          v-for="urgency in urgencyOptions"
          :key="urgency.value"
          class="label cursor-pointer justify-start gap-3 hover:bg-base-300/50 rounded px-2 -mx-2"
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
        <label class="label cursor-pointer justify-start gap-3 hover:bg-base-300/50 rounded px-2 -mx-2">
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
        <span class="label-text font-medium flex items-center gap-2">
          <HugeiconsIcon :icon="LockIcon" :size="16" />
          Classification
        </span>
      </label>
      <div class="space-y-2">
        <label
          v-for="classification in classificationOptions"
          :key="classification.value"
          class="label cursor-pointer justify-start gap-3 hover:bg-base-300/50 rounded px-2 -mx-2"
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
        <label class="label cursor-pointer justify-start gap-3 hover:bg-base-300/50 rounded px-2 -mx-2">
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
    <div v-if="authStore.hasPermission('system:admin') && searchStore.stats" class="space-y-3">
      <h4 class="text-sm font-semibold text-base-content/70 flex items-center gap-2">
        <HugeiconsIcon :icon="DashboardSpeed01Icon" :size="16" />
        Statistiques de l'index
      </h4>
      <div class="bg-base-100 rounded-lg p-3 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs text-base-content/60">Documents indexés</span>
          <span class="font-semibold">{{ searchStore.stats.numberOfDocuments }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-base-content/60">Statut d'indexation</span>
          <span class="font-semibold">
            <span v-if="searchStore.stats.isIndexing" class="loading loading-spinner loading-sm"></span>
            <span v-else class="text-success">✓ Terminé</span>
          </span>
        </div>
      </div>
      <button
        @click="handleReindex"
        :disabled="searchStore.loading"
        class="btn btn-outline btn-sm w-full gap-2"
      >
        <span v-if="searchStore.loading" class="loading loading-spinner loading-xs"></span>
        <HugeiconsIcon v-else :icon="RefreshIcon" :size="14" />
        Réindexer tout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useSearchStore } from "@/stores/search";
import { useAuthStore } from "@/stores/auth";

// Import HugeIcons
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  FilterIcon,
  Cancel01Icon,
  SortingIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  LockIcon,
  DashboardSpeed01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

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
