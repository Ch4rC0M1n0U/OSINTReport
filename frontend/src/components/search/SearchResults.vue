<template>
  <div class="space-y-4">
    <!-- En-tête des résultats -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-base-content/70">
          <span v-if="searchStore.totalHits > 0">
            {{ searchStore.totalHits }} résultat{{ searchStore.totalHits > 1 ? "s" : "" }}
          </span>
          <span v-else>Aucun résultat</span>
          <span v-if="searchStore.hasQuery"> pour "{{ searchStore.query }}"</span>
          <span v-if="searchStore.processingTime > 0" class="ml-2 opacity-60">
            ({{ searchStore.processingTime }}ms)
          </span>
        </p>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="searchStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="searchStore.error" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
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
      <span>{{ searchStore.error }}</span>
    </div>

    <!-- Liste des résultats -->
    <div v-else-if="searchStore.hasResults" class="space-y-3">
      <div
        v-for="hit in searchStore.results"
        :key="hit.id"
        class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        @click="navigateToReport(hit.id)"
      >
        <div class="card-body p-4">
          <!-- En-tête du résultat -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h3
                class="card-title text-base mb-1"
                v-html="hit._formatted?.title || hit.title"
              ></h3>
              <div class="flex flex-wrap gap-2 text-xs text-base-content/70">
                <span v-if="hit.caseNumber" class="badge badge-ghost badge-sm">
                  📋 {{ hit.caseNumber }}
                </span>
                <span v-if="hit.reportNumber" class="badge badge-ghost badge-sm">
                  #{{ hit.reportNumber }}
                </span>
                <span class="badge badge-ghost badge-sm">
                  👤 {{ hit.ownerName }}
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
            class="text-sm text-base-content/80 line-clamp-2 mt-2"
            v-html="hit._formatted?.summary || hit.summary"
          ></p>

          <!-- Contexte d'investigation avec highlighting -->
          <p
            v-if="hit._formatted?.investigationContext || hit.investigationContext"
            class="text-sm text-base-content/60 line-clamp-1 mt-1 italic"
            v-html="hit._formatted?.investigationContext || hit.investigationContext"
          ></p>

          <!-- Mots-clés -->
          <div v-if="hit.keywords && hit.keywords.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="keyword in hit.keywords.slice(0, 5)"
              :key="keyword"
              class="badge badge-outline badge-sm"
            >
              {{ keyword }}
            </span>
            <span v-if="hit.keywords.length > 5" class="badge badge-ghost badge-sm">
              +{{ hit.keywords.length - 5 }}
            </span>
          </div>

          <!-- Pied du résultat -->
          <div class="flex items-center justify-between mt-3 text-xs text-base-content/60">
            <div class="flex items-center gap-3">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5 inline mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {{ formatDate(hit.createdAt) }}
              </span>
              <span v-if="hit.issuedAt">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5 inline mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Émis: {{ formatDate(hit.issuedAt) }}
              </span>
            </div>
            <button class="btn btn-ghost btn-xs">
              Voir détails →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message vide -->
    <div v-else class="text-center py-12">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-16 w-16 mx-auto text-base-content/30 mb-4"
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
      <p class="text-base-content/60">
        {{ searchStore.hasQuery ? "Aucun résultat trouvé" : "Effectuez une recherche" }}
      </p>
      <p v-if="searchStore.hasQuery" class="text-sm text-base-content/40 mt-2">
        Essayez d'autres mots-clés ou de modifier les filtres
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="searchStore.hasResults && searchStore.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button
          @click="searchStore.previousPage()"
          :disabled="!searchStore.hasPreviousPage"
          class="join-item btn btn-sm"
        >
          «
        </button>
        <button class="join-item btn btn-sm btn-disabled">
          Page {{ searchStore.currentPage }} / {{ searchStore.totalPages }}
        </button>
        <button
          @click="searchStore.nextPage()"
          :disabled="!searchStore.hasNextPage"
          class="join-item btn btn-sm"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchStore } from "@/stores/search";
import { useRouter } from "vue-router";

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
