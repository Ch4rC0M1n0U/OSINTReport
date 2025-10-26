<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink } from "vue-router";

import { useDashboardStore, type DashboardStatus } from "@/stores/dashboard";
import { HugeiconsIcon } from '@hugeicons/vue';
import { 
  TableIcon, 
  RefreshIcon,
  FileAttachmentIcon,
  File02Icon,
  FileValidationIcon,
  Archive02Icon,
  Calendar03Icon,
  UserIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Activity01Icon,
  SparklesIcon
} from '@hugeicons/core-free-icons';

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

const statusIcons: Record<DashboardStatus, any> = {
  DRAFT: File02Icon,
  PUBLISHED: FileValidationIcon,
  ARCHIVED: Archive02Icon,
};

const totalsCards = computed(() => {
  if (!summary.value) {
    return [] as Array<{ key: string; label: string; value: number; accent: string; icon: any; gradient: string }>;
  }

  return [
    {
      key: "all",
      label: "Rapports totaux",
      value: summary.value.totals.all,
      accent: "primary",
      icon: FileAttachmentIcon,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      key: "draft",
      label: "Brouillons",
      value: summary.value.totals.draft,
      accent: "warning",
      icon: File02Icon,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      key: "published",
      label: "Publiés",
      value: summary.value.totals.published,
      accent: "success",
      icon: FileValidationIcon,
      gradient: "from-emerald-500 to-green-600",
    },
    {
      key: "archived",
      label: "Archivés",
      value: summary.value.totals.archived,
      accent: "info",
      icon: Archive02Icon,
      gradient: "from-slate-500 to-gray-600",
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

const currentGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDayShort(value: string) {
  return new Intl.DateTimeFormat("fr-BE", {
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
  <section class="space-y-6">
    <!-- En-tête avec style cohérent -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <HugeiconsIcon :icon="SparklesIcon" :size="32" class="text-primary" />
            <h2 class="text-3xl font-bold">
              {{ currentGreeting }} 👋
            </h2>
          </div>
          <p class="text-sm text-base-content/60">
            Voici un aperçu de votre activité OSINT
          </p>
          <p v-if="lastUpdated" class="text-xs text-base-content/50 mt-2 flex items-center gap-1.5">
            <HugeiconsIcon :icon="RefreshIcon" :size="12" />
            Dernière mise à jour : {{ formatDate(lastUpdated) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink 
            class="btn btn-primary gap-2" 
            :to="{ name: 'reports.list' }"
          >
            <HugeiconsIcon :icon="TableIcon" :size="20" />
            Voir tous les rapports
          </RouterLink>
          <button 
            class="btn btn-outline gap-2" 
            :disabled="loading" 
            @click="refresh"
          >
            <HugeiconsIcon 
              :icon="RefreshIcon" 
              :size="20" 
              :class="{ 'animate-spin': loading }" 
            />
            Actualiser
          </button>
        </div>
      </div>
    </header>
    <!-- Alert erreur -->
    <div v-if="error" class="alert alert-error">
      <div class="flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-sm btn-ghost" @click="refresh">Réessayer</button>
    </div>

    <!-- Cartes de statistiques -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div 
        v-for="card in totalsCards" 
        :key="card.key"
        class="bg-base-100 border-l-4 shadow-sm p-5 hover:shadow-md transition-shadow"
        :class="{
          'border-primary': card.key === 'all',
          'border-warning': card.key === 'draft',
          'border-success': card.key === 'published',
          'border-info': card.key === 'archived'
        }"
      >
        <div class="flex items-start justify-between mb-3">
          <div 
            class="p-2.5 rounded-lg bg-gradient-to-br"
            :class="card.gradient"
          >
            <HugeiconsIcon :icon="card.icon" :size="22" class="text-white" />
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold text-base-content">
              {{ card.value }}
            </p>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold text-base-content/70 mb-2">
            {{ card.label }}
          </p>
          <div class="w-full bg-base-200 rounded-full h-1.5 overflow-hidden">
            <div 
              class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
              :class="card.gradient"
              :style="{ width: `${summary?.totals.all ? (card.value / summary.totals.all) * 100 : 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section graphiques et stats -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Répartition des statuts -->
      <div class="lg:col-span-1">
        <div class="bg-base-100 border-l-4 border-primary shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <HugeiconsIcon :icon="Activity01Icon" :size="24" class="text-primary" />
            <div>
              <h3 class="font-bold text-lg">Répartition des statuts</h3>
              <p class="text-xs text-base-content/60">État du cycle de vie</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <div
              v-for="status in summary?.statusDistribution ?? []"
              :key="status.status"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <HugeiconsIcon 
                    :icon="statusIcons[status.status]" 
                    :size="18" 
                    class="text-base-content/70"
                  />
                  <span class="text-sm font-semibold text-base-content/80">
                    {{ status.label }}
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-base-content">{{ status.count }}</span>
                  <span class="text-xs text-base-content/50 ml-1">({{ status.percentage }}%)</span>
                </div>
              </div>
              <div class="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                <div 
                  class="h-full rounded-full bg-primary transition-all duration-500"
                  :style="{ width: `${status.percentage}%` }"
                ></div>
              </div>
            </div>
            <div v-if="!summary?.statusDistribution?.length" class="text-center py-8">
              <p class="text-sm text-base-content/50">Aucune donnée disponible</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline de production -->
      <div class="lg:col-span-2">
        <div class="bg-base-100 border-l-4 border-success shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <HugeiconsIcon :icon="Calendar03Icon" :size="24" class="text-success" />
            <div>
              <h3 class="font-bold text-lg">Production des 14 derniers jours</h3>
              <p class="text-xs text-base-content/60">Nombre de rapports créés quotidiennement</p>
            </div>
          </div>

          <div class="mt-4">
            <!-- Timeline bars -->
            <div class="space-y-2.5">
              <div
                v-for="entry in timelineData"
                :key="entry.date"
                class="flex items-center gap-3"
              >
                <span class="text-xs font-medium text-base-content/60 w-12 text-right">
                  {{ formatDayShort(entry.date) }}
                </span>
                <div class="flex-1 relative h-7 bg-base-200 rounded overflow-hidden">
                  <div
                    class="absolute inset-y-0 left-0 bg-success rounded transition-all duration-500 flex items-center justify-end pr-2"
                    :style="{ width: `${maxTimelineCount === 0 ? 0 : Math.max(5, (entry.count / maxTimelineCount) * 100)}%` }"
                  >
                    <span v-if="entry.count > 0" class="text-xs font-bold text-white">
                      {{ entry.count }}
                    </span>
                  </div>
                </div>
                <span class="text-sm font-bold text-base-content w-8 text-center">
                  {{ entry.count }}
                </span>
              </div>
              <div v-if="timelineData.length === 0" class="text-center py-12">
                <HugeiconsIcon :icon="Calendar03Icon" :size="48" class="text-base-content/20 mx-auto mb-2" />
                <p class="text-sm text-base-content/50">Aucune activité récente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      <!-- Derniers rapports -->
      <div class="bg-base-100 border-l-4 border-warning shadow-sm">
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Clock01Icon" :size="24" class="text-warning" />
            <div>
              <h3 class="font-bold text-lg">Derniers rapports mis à jour</h3>
              <p class="text-xs text-base-content/60">Top 5 des modifications récentes</p>
            </div>
          </div>
          <RouterLink 
            :to="{ name: 'reports.list' }"
            class="btn btn-sm btn-ghost gap-2"
          >
            Voir tout
            <HugeiconsIcon :icon="TableIcon" :size="16" />
          </RouterLink>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table">
            <thead class="bg-base-200/50">
              <tr>
                <th class="font-bold">
                  <div class="flex items-center gap-2">
                    <HugeiconsIcon :icon="FileAttachmentIcon" :size="16" />
                    Titre du rapport
                  </div>
                </th>
                <th class="font-bold">
                  <div class="flex items-center gap-2">
                    <HugeiconsIcon :icon="CheckmarkCircle02Icon" :size="16" />
                    Statut
                  </div>
                </th>
                <th class="font-bold">
                  <div class="flex items-center gap-2">
                    <HugeiconsIcon :icon="UserIcon" :size="16" />
                    Responsable
                  </div>
                </th>
                <th class="font-bold">
                  <div class="flex items-center gap-2">
                    <HugeiconsIcon :icon="Clock01Icon" :size="16" />
                    Dernière modification
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="text-center py-16">
                  <span class="loading loading-spinner loading-lg text-primary"></span>
                  <p class="text-sm text-base-content/60 mt-4">Chargement des données...</p>
                </td>
              </tr>
              <tr v-else-if="summary?.recentReports.length === 0">
                <td colspan="4" class="text-center py-16">
                  <HugeiconsIcon :icon="FileAttachmentIcon" :size="48" class="text-base-content/20 mx-auto mb-3" />
                  <p class="text-base-content/60 font-medium">Aucune activité récente</p>
                  <p class="text-sm text-base-content/40 mt-1">Les rapports modifiés apparaîtront ici</p>
                </td>
              </tr>
              <tr 
                v-for="report in summary?.recentReports ?? []" 
                :key="report.id"
                class="hover:bg-base-200/50 transition-colors"
              >
                <td>
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                      <HugeiconsIcon :icon="FileAttachmentIcon" :size="18" class="text-primary" />
                    </div>
                    <span class="font-semibold text-base-content">{{ report.title }}</span>
                  </div>
                </td>
                <td>
                  <div class="badge badge-outline gap-2 font-semibold">
                    <HugeiconsIcon :icon="statusIcons[report.status]" :size="14" />
                    {{ statusLabels[report.status] }}
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="avatar placeholder">
                      <div class="bg-neutral text-neutral-content rounded-full w-8">
                        <span class="text-xs">{{ report.owner.firstName.charAt(0) }}{{ report.owner.lastName.charAt(0) }}</span>
                      </div>
                    </div>
                    <span class="text-sm font-medium">
                      {{ report.owner.firstName }} {{ report.owner.lastName }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="text-sm text-base-content/70">{{ formatDate(report.updatedAt) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  </section>
</template>
