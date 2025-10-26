<template>
  <div class="space-y-4">
    <!-- En-tête des résultats -->
    <div class="bg-base-200 border-l-4 border-success p-4">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="FileAttachmentIcon" :size="24" class="text-success" />
        <div>
          <p class="font-semibold">
            <span v-if="searchStore.totalHits > 0">
              {{ searchStore.totalHits }} résultat{{ searchStore.totalHits > 1 ? "s" : "" }}
            </span>
            <span v-else>Aucun résultat</span>
            <span v-if="searchStore.hasQuery"> pour "{{ searchStore.query }}"</span>
          </p>
          <p v-if="searchStore.processingTime > 0" class="text-sm text-base-content/60">
            Recherche effectuée en {{ searchStore.processingTime }}ms
          </p>
        </div>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="searchStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="searchStore.error" class="bg-base-200 border-l-4 border-error p-6">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="32" class="text-error" />
        <div>
          <h3 class="font-semibold text-error">Erreur de recherche</h3>
          <p class="text-sm text-base-content/70">{{ searchStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Liste des résultats -->
    <div v-else-if="searchStore.hasResults" class="space-y-3">
      <div
        v-for="hit in searchStore.results"
        :key="hit.id"
        class="bg-base-200 border-l-4 border-primary hover:border-accent transition-colors cursor-pointer p-5"
        @click="navigateToReport(hit.id)"
      >
        <!-- En-tête du résultat -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <h3
              class="text-lg font-semibold mb-2"
              v-html="hit._formatted?.title || hit.title"
            ></h3>
            <div class="flex flex-wrap gap-2 text-xs">
              <span v-if="hit.caseNumber" class="flex items-center gap-1 px-2 py-1 bg-base-300 rounded">
                <HugeiconsIcon :icon="FolderIcon" :size="14" />
                {{ hit.caseNumber }}
              </span>
              <span v-if="hit.reportNumber" class="flex items-center gap-1 px-2 py-1 bg-base-300 rounded">
                <HugeiconsIcon :icon="FileAttachmentIcon" :size="14" />
                #{{ hit.reportNumber }}
              </span>
              <span class="flex items-center gap-1 px-2 py-1 bg-base-300 rounded">
                <HugeiconsIcon :icon="User02Icon" :size="14" />
                {{ hit.ownerName }}
              </span>
            </div>
          </div>

          <!-- Badges statut, urgence, classification -->
          <div class="flex flex-wrap gap-1 justify-end">
            <span :class="getStatusBadgeClass(hit.status)">
              {{ getStatusLabel(hit.status) }}
            </span>
            <span v-if="hit.urgencyLevel" :class="getUrgencyBadgeClass(hit.urgencyLevel)">
              {{ getUrgencyLabel(hit.urgencyLevel) }}
            </span>
            <span
              v-if="hit.classification"
              :class="getClassificationBadgeClass(hit.classification)"
            >
              {{ getClassificationLabel(hit.classification) }}
            </span>
          </div>
        </div>

        <!-- Résumé avec highlighting -->
        <p
          v-if="hit._formatted?.summary || hit.summary"
          class="text-sm text-base-content/80 line-clamp-2 mb-2"
          v-html="hit._formatted?.summary || hit.summary"
        ></p>

        <!-- Contexte d'investigation avec highlighting -->
        <p
          v-if="hit._formatted?.investigationContext || hit.investigationContext"
          class="text-sm text-base-content/60 line-clamp-1 italic mb-3"
          v-html="hit._formatted?.investigationContext || hit.investigationContext"
        ></p>

        <!-- Mots-clés -->
        <div v-if="hit.keywords && hit.keywords.length > 0" class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="keyword in hit.keywords.slice(0, 5)"
            :key="keyword"
            class="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs"
          >
            <HugeiconsIcon :icon="Tag01Icon" :size="12" />
            {{ keyword }}
          </span>
          <span v-if="hit.keywords.length > 5" class="px-2 py-1 bg-base-300 rounded text-xs">
            +{{ hit.keywords.length - 5 }}
          </span>
        </div>

        <!-- Pied du résultat -->
        <div class="flex items-center justify-between pt-3 border-t border-base-300 text-xs text-base-content/60">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1">
              <HugeiconsIcon :icon="Calendar03Icon" :size="14" />
              {{ formatDate(hit.createdAt) }}
            </span>
            <span v-if="hit.issuedAt" class="flex items-center gap-1">
              <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="14" />
              Émis: {{ formatDate(hit.issuedAt) }}
            </span>
          </div>
          <button class="btn btn-ghost btn-xs gap-1 hover:text-primary">
            Voir détails
            <HugeiconsIcon :icon="ArrowRight01Icon" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Message vide -->
    <div v-else class="text-center py-16">
      <div class="p-4 rounded-lg bg-base-200/50 inline-block mb-4">
        <HugeiconsIcon :icon="Search01Icon" :size="64" class="text-base-content/20" />
      </div>
      <p class="text-lg font-medium text-base-content/60 mb-2">
        {{ searchStore.hasQuery ? "Aucun résultat trouvé" : "Effectuez une recherche" }}
      </p>
      <p v-if="searchStore.hasQuery" class="text-sm text-base-content/40">
        Essayez d'autres mots-clés ou de modifier les filtres
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="searchStore.hasResults && searchStore.totalPages > 1" class="flex justify-center pt-4">
      <div class="join">
        <button
          @click="searchStore.previousPage()"
          :disabled="!searchStore.hasPreviousPage"
          class="join-item btn btn-sm gap-1"
        >
          <HugeiconsIcon :icon="ArrowLeft01Icon" :size="14" />
          Précédent
        </button>
        <button class="join-item btn btn-sm btn-disabled">
          Page {{ searchStore.currentPage }} / {{ searchStore.totalPages }}
        </button>
        <button
          @click="searchStore.nextPage()"
          :disabled="!searchStore.hasNextPage"
          class="join-item btn btn-sm gap-1"
        >
          Suivant
          <HugeiconsIcon :icon="ArrowRight01Icon" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchStore } from "@/stores/search";
import { useRouter } from "vue-router";

// Import HugeIcons
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  FileAttachmentIcon,
  AlertCircleIcon,
  FolderIcon,
  User02Icon,
  Tag01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  Search01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";

const searchStore = useSearchStore();
const router = useRouter();

function navigateToReport(reportId: string) {
  router.push({ name: "reports.detail", params: { id: reportId } });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé",
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    DRAFT: "badge badge-warning badge-sm",
    PUBLISHED: "badge badge-success badge-sm",
    ARCHIVED: "badge badge-ghost badge-sm",
  };
  return classes[status] || "badge badge-ghost badge-sm";
}

function getUrgencyLabel(urgency: string): string {
  const labels: Record<string, string> = {
    ROUTINE: "Routine",
    URGENT: "Urgent",
    CRITICAL: "Critique",
  };
  return labels[urgency] || urgency;
}

function getUrgencyBadgeClass(urgency: string): string {
  const classes: Record<string, string> = {
    ROUTINE: "badge badge-success badge-sm",
    URGENT: "badge badge-warning badge-sm",
    CRITICAL: "badge badge-error badge-sm",
  };
  return classes[urgency] || "badge badge-ghost badge-sm";
}

function getClassificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    PUBLIC: "Public",
    RESTRICTED: "Restreint",
    CONFIDENTIAL: "Confidentiel",
    SECRET: "Secret",
  };
  return labels[classification] || classification;
}

function getClassificationBadgeClass(classification: string): string {
  const classes: Record<string, string> = {
    PUBLIC: "badge badge-success badge-sm",
    RESTRICTED: "badge badge-info badge-sm",
    CONFIDENTIAL: "badge badge-warning badge-sm",
    SECRET: "badge badge-error badge-sm",
  };
  return classes[classification] || "badge badge-ghost badge-sm";
}
</script>

<style scoped>
/* Style pour le highlighting Meilisearch */
:deep(mark) {
  @apply bg-warning/30 font-semibold px-0.5 rounded;
}
</style>
