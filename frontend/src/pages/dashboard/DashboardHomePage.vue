<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink } from "vue-router";

import { useDashboardStore, type DashboardStatus } from "@/stores/dashboard";

const dashboardStore = useDashboardStore();
const { summary, loading, error, lastUpdated } = storeToRefs(dashboardStore);

onMounted(() => {
  if (!summary.value) {
    dashboardStore.fetchSummary().catch(() => {
      /* already handled */
    });
  }
});

const statusLabels: Record<DashboardStatus, string> = {
  DRAFT: "Brouillons",
  PUBLISHED: "Publiés",
  ARCHIVED: "Archivés",
};

const totalsCards = computed(() => {
  if (!summary.value) {
    return [] as Array<{ key: string; label: string; value: number; accent: string }>;
  }

  return [
    {
      key: "all",
      label: "Rapports totaux",
      value: summary.value.totals.all,
      accent: "primary",
    },
    {
      key: "draft",
      label: "Brouillons",
      value: summary.value.totals.draft,
      accent: "secondary",
    },
    {
      key: "published",
      label: "Publiés",
      value: summary.value.totals.published,
      accent: "accent",
    },
    {
      key: "archived",
      label: "Archivés",
      value: summary.value.totals.archived,
      accent: "info",
    },
  ];
});

const timelineWindow = 14;

const timelineData = computed(() => {
  if (!summary.value) return [] as Array<{ date: string; count: number }>;
  return summary.value.timeline.slice(-timelineWindow);
});

const maxTimelineCount = computed(() => {
  return timelineData.value.reduce((max, entry) => Math.max(max, entry.count), 0);
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function refresh() {
  dashboardStore.fetchSummary().catch(() => {
    /* error handled by store */
  });
}
</script>

<template>
  <section class="space-y-8">
    <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-3xl font-semibold">Tableau de bord</h2>
        <p class="text-sm text-base-content/70">
          Vue synthétique des rapports OSINT, dernières activités et charge opérationnelle.
        </p>
        <p v-if="lastUpdated" class="text-xs text-base-content/60 mt-2">
          Mise à jour : {{ formatDate(lastUpdated) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink class="btn btn-sm btn-primary" :to="{ name: 'reports.list' }">
          <span class="material-symbols-rounded text-base" aria-hidden="true">table_view</span>
          Voir les rapports
        </RouterLink>
        <button class="btn btn-sm btn-outline" :disabled="loading" @click="refresh">
          <span class="material-symbols-rounded text-base" aria-hidden="true">
            autorenew
          </span>
          Actualiser
        </button>
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
      </div>
    </header>

    <div v-if="error" class="alert alert-error shadow">
      <span>{{ error }}</span>
      <button class="btn btn-sm" @click="refresh">Réessayer</button>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in totalsCards" :key="card.key" class="card bg-base-100 shadow">
        <div class="card-body">
          <p class="text-sm text-base-content/60">{{ card.label }}</p>
          <p class="text-3xl font-semibold">{{ card.value }}</p>
          <progress class="progress mt-3" :class="`progress-${card.accent}`" :value="card.value" :max="summary?.totals.all || 1"></progress>
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <div class="card bg-base-100 shadow xl:col-span-1">
        <div class="card-body">
          <h3 class="card-title text-lg">Répartition des statuts</h3>
          <p class="text-sm text-base-content/70">
            Comparez la présence des rapports dans chaque phase du cycle de vie.
          </p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="status in summary?.statusDistribution ?? []"
              :key="status.status"
              class="flex flex-col gap-1"
            >
              <div class="flex items-center justify-between text-sm font-medium">
                <span>{{ status.label }}</span>
                <span>{{ status.count }} • {{ status.percentage }}%</span>
              </div>
              <progress
                class="progress progress-primary"
                :value="status.count"
                :max="summary?.totals.all || 1"
              ></progress>
            </li>
          </ul>
        </div>
      </div>

      <div class="card bg-base-100 shadow xl:col-span-2">
        <div class="card-body">
          <h3 class="card-title text-lg">Production des 14 derniers jours</h3>
          <p class="text-sm text-base-content/70">
            Nombre de rapports créés par jour. Barre vide = aucune création.
          </p>
          <div class="mt-6 space-y-2">
            <div
              v-for="entry in timelineData"
              :key="entry.date"
              class="flex items-center gap-3 text-sm"
            >
              <span class="w-16 text-right text-base-content/60">{{ formatDay(entry.date) }}</span>
              <div class="flex-1 h-3 bg-base-200 rounded">
                <div
                  class="h-3 rounded bg-primary transition-all"
                  :style="{
                    width: `${maxTimelineCount === 0 ? 0 : Math.round((entry.count / maxTimelineCount) * 100)}%`,
                  }"
                ></div>
              </div>
              <span class="w-8 text-right font-medium">{{ entry.count }}</span>
            </div>
            <p v-if="timelineData.length === 0" class="text-sm text-base-content/60">
              Aucune activité récente.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <header class="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 class="font-semibold">Derniers rapports mis à jour</h3>
            <p class="text-sm text-base-content/70">
              Top 5 des rapports récemment modifiés ou publiés.
            </p>
          </div>
        </header>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Responsable</th>
                <th>Modifié le</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="text-center py-10">
                  <span class="loading loading-spinner"></span>
                </td>
              </tr>
              <tr v-else-if="summary?.recentReports.length === 0">
                <td colspan="4" class="text-center py-8 text-base-content/60">
                  Aucune activité récente.
                </td>
              </tr>
              <tr v-for="report in summary?.recentReports ?? []" :key="report.id">
                <td class="font-medium">{{ report.title }}</td>
                <td>
                  <span class="badge badge-outline uppercase">{{ statusLabels[report.status] }}</span>
                </td>
                <td>
                  {{ report.owner.firstName }} {{ report.owner.lastName }}
                </td>
                <td>{{ formatDate(report.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
