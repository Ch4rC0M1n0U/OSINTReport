<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { reportsApi, type Report, type ReportModule, type ReportStats, type ReportModuleType } from "@/services/api/reports";
import { correlationsApi, type Correlation } from "@/services/api/correlations";
import EntitySelector from "@/components/reports/EntitySelector.vue";
import EntityDialog from "@/components/reports/EntityDialog.vue";
import CorrelationAlert from "@/components/reports/CorrelationAlert.vue";

const route = useRoute();
const router = useRouter();

const reportId = computed(() => route.params.id as string);

const report = ref<Report | null>(null);
const modules = ref<ReportModule[]>([]);
const stats = ref<ReportStats | null>(null);
const correlations = ref<Correlation[]>([]);

const loading = ref(true);
const error = ref<string | null>(null);

const showModuleDialog = ref(false);
const showEntityDialog = ref(false);
const showStatsModal = ref(false);
const showCorrelationsModal = ref(false);
const exportingPDF = ref(false);

const moduleForm = ref<{
  type: ReportModuleType;
  title: string;
  entityId: string | undefined;
  payload: Record<string, any>;
}>({
  type: "research-detail",
  title: "",
  entityId: undefined,
  payload: {},
});

const moduleTypes: Array<{ value: ReportModuleType; label: string; icon: string }> = [
  { value: "summary", label: "Résumé", icon: "📋" },
  { value: "entities", label: "Entités", icon: "�" },
  { value: "objectives", label: "Objectifs", icon: "🎯" },
  { value: "research-summary", label: "Résumé de recherche", icon: "📊" },
  { value: "research-detail", label: "Détail de recherche", icon: "�" },
  { value: "identifier-lookup", label: "Recherche d'identifiant", icon: "🔎" },
  { value: "media-gallery", label: "Galerie média", icon: "�️" },
  { value: "data-retention", label: "Conservation de données", icon: "�" },
  { value: "conclusions", label: "Conclusions", icon: "✅" },
  { value: "investigation", label: "Investigation", icon: "�️" },
  { value: "sign-off", label: "Signature", icon: "✍️" },
];

onMounted(async () => {
  await loadReport();
});

async function loadReport() {
  loading.value = true;
  error.value = null;

  try {
    const [reportData, modulesData, statsData] = await Promise.all([
      reportsApi.getById(reportId.value),
      reportsApi.listModules(reportId.value),
      reportsApi.getStats(reportId.value),
    ]);

    report.value = reportData;
    modules.value = modulesData;
    stats.value = statsData;
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur lors du chargement";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function loadCorrelations() {
  try {
    const data = await correlationsApi.list(reportId.value);
    correlations.value = data;
    showCorrelationsModal.value = true;
  } catch (err) {
    console.error("Erreur chargement corrélations:", err);
  }
}

async function detectCorrelations() {
  if (!confirm("Lancer la détection automatique des corrélations ?")) return;

  try {
    const detected = await correlationsApi.detect(reportId.value);
    alert(`${detected.length} corrélation(s) détectée(s) !`);
    await loadCorrelations();
  } catch (err) {
    alert("Erreur lors de la détection");
    console.error(err);
  }
}

function openModuleDialog() {
  moduleForm.value = {
    type: "research-detail",
    title: "",
    entityId: undefined,
    payload: {},
  };
  showModuleDialog.value = true;
}

async function handleCreateModule() {
  if (!moduleForm.value.title.trim()) {
    alert("Le titre est obligatoire");
    return;
  }

  try {
    await reportsApi.createModule(reportId.value, {
      type: moduleForm.value.type,
      title: moduleForm.value.title,
      entityId: moduleForm.value.entityId,
      payload: moduleForm.value.payload,
    });

    showModuleDialog.value = false;
    await loadReport();
  } catch (err: any) {
    alert(err.response?.data?.message || "Erreur lors de la création du module");
    console.error(err);
  }
}

async function handleDeleteModule(moduleId: string) {
  if (!confirm("Supprimer ce module ?")) return;

  try {
    await reportsApi.deleteModule(reportId.value, moduleId);
    await loadReport();
  } catch (err) {
    alert("Erreur lors de la suppression");
    console.error(err);
  }
}

async function handleChangeStatus(newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  if (!confirm(`Changer le statut vers ${newStatus} ?`)) return;

  try {
    await reportsApi.updateStatus(reportId.value, newStatus);
    await loadReport();
  } catch (err) {
    alert("Erreur lors du changement de statut");
    console.error(err);
  }
}

async function handleDuplicate() {
  if (!confirm("Dupliquer ce rapport ?")) return;

  try {
    const newReport = await reportsApi.duplicate(reportId.value);
    router.push({ name: "reports.detail", params: { id: newReport.id } });
  } catch (err) {
    alert("Erreur lors de la duplication");
    console.error(err);
  }
}

function getModuleIcon(type: string) {
  return moduleTypes.find((t) => t.value === type)?.icon || "📋";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

async function handleExportPDF() {
  exportingPDF.value = true;
  try {
    const pdfBlob = await reportsApi.exportPDF(report.value!.id);
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    
    // Générer le nom de fichier
    const caseNum = report.value?.caseNumber || "NO-CASE";
    const reportIdShort = report.value?.id.substring(0, 8);
    const date = new Date().toISOString().split("T")[0];
    link.download = `OSINT_${caseNum}_${reportIdShort}_${date}.pdf`;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alert(err.response?.data?.message || "Erreur lors de l'export PDF");
    console.error(err);
  } finally {
    exportingPDF.value = false;
  }
}

const statusColors = {
  DRAFT: "badge-warning",
  PUBLISHED: "badge-success",
  ARCHIVED: "badge-neutral",
};
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <button
          class="btn btn-ghost btn-sm mb-2"
          @click="router.push({ name: 'reports.list' })"
        >
          ← Retour
        </button>
        <h2 v-if="report" class="text-2xl font-semibold">
          {{ report.title }}
        </h2>
        <div v-if="report" class="flex gap-2 mt-2">
          <span class="badge" :class="statusColors[report.status]">
            {{ report.status }}
          </span>
          <span v-if="report.caseNumber" class="badge badge-outline">
            📁 {{ report.caseNumber }}
          </span>
          <span class="badge badge-outline">
            {{ report.urgencyLevel }}
          </span>
          <span class="badge badge-outline">
            🔒 {{ report.classification }}
          </span>
        </div>
      </div>

      <div class="dropdown dropdown-end" v-if="report">
        <label tabindex="0" class="btn btn-sm">
          Actions ▾
        </label>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
          <li>
            <a @click="handleExportPDF" :class="{ 'loading': exportingPDF }">
              📄 Exporter PDF
            </a>
          </li>
          <li class="divider"></li>
          <li>
            <a @click="showStatsModal = true">📊 Statistiques</a>
          </li>
          <li>
            <a @click="loadCorrelations">🔗 Voir corrélations</a>
          </li>
          <li>
            <a @click="detectCorrelations">🔍 Détecter corrélations</a>
          </li>
          <li class="divider"></li>
          <li v-if="report.status === 'DRAFT'">
            <a @click="handleChangeStatus('PUBLISHED')">✓ Publier</a>
          </li>
          <li v-if="report.status === 'PUBLISHED'">
            <a @click="handleChangeStatus('ARCHIVED')">📦 Archiver</a>
          </li>
          <li>
            <a @click="handleDuplicate">📋 Dupliquer</a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <!-- Contenu -->
    <template v-else-if="report">
      <!-- Informations -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title">ℹ️ Informations</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-sm opacity-70">Service enquêteur</div>
              <div class="font-medium">
                {{ report.investigationService || "—" }}
              </div>
            </div>
            <div>
              <div class="text-sm opacity-70">Base légale</div>
              <div class="font-medium">{{ report.legalBasis || "—" }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-sm opacity-70 mb-1">Contexte</div>
              <p class="text-sm">{{ report.investigationContext }}</p>
            </div>
            <div v-if="report.keywords && report.keywords.length > 0" class="md:col-span-2">
              <div class="text-sm opacity-70 mb-2">Mots-clés</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="keyword in report.keywords" :key="keyword" class="badge">
                  {{ keyword }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h3 class="card-title">📦 Modules ({{ modules.length }})</h3>
            <button class="btn btn-primary btn-sm" @click="openModuleDialog">
              + Ajouter un module
            </button>
          </div>

          <div v-if="modules.length === 0" class="text-center py-8 opacity-60">
            Aucun module. Commencez par en ajouter un.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="module in modules"
              :key="module.id"
              class="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xl">{{ getModuleIcon(module.type) }}</span>
                    <h4 class="font-semibold">{{ module.title }}</h4>
                  </div>
                  <div class="text-sm opacity-70">{{ module.type }}</div>
                  <div v-if="module.entity" class="text-sm mt-1">
                    Entité: <span class="badge badge-sm">{{ module.entity.label }}</span>
                  </div>
                </div>
                <button
                  class="btn btn-ghost btn-sm btn-circle"
                  @click="handleDeleteModule(module.id)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: Créer module -->
    <div v-if="showModuleDialog" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="text-lg font-bold mb-4">➕ Ajouter un module</h3>

        <form @submit.prevent="handleCreateModule" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Type de module</span>
            </label>
            <select v-model="moduleForm.type" class="select select-bordered">
              <option v-for="type in moduleTypes" :key="type.value" :value="type.value">
                {{ type.icon }} {{ type.label }}
              </option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Titre <span class="text-error">*</span></span>
            </label>
            <input
              v-model="moduleForm.title"
              type="text"
              placeholder="Ex: Analyse CDR +32475123456"
              class="input input-bordered"
              required
            />
          </div>

          <EntitySelector
            v-model="moduleForm.entityId"
            label="Entité liée (optionnel)"
            @create-new="showEntityDialog = true"
          />

          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showModuleDialog = false"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              Créer le module
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="showModuleDialog = false"></div>
    </div>

    <!-- Modal: Statistiques -->
    <div v-if="showStatsModal && stats" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">📊 Statistiques du rapport</h3>
        <div class="stats stats-vertical shadow w-full">
          <div class="stat">
            <div class="stat-title">Modules</div>
            <div class="stat-value">{{ stats.modules }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Entités</div>
            <div class="stat-value">{{ stats.entities }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Enregistrements recherche</div>
            <div class="stat-value">{{ stats.researchRecords }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Corrélations</div>
            <div class="stat-value">{{ stats.correlations }}</div>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showStatsModal = false">Fermer</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showStatsModal = false"></div>
    </div>

    <!-- Modal: Corrélations -->
    <div v-if="showCorrelationsModal" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-3xl">
        <h3 class="text-lg font-bold mb-4">
          🔗 Corrélations ({{ correlations.length }})
        </h3>

        <div v-if="correlations.length === 0" class="text-center py-8 opacity-60">
          Aucune corrélation détectée
        </div>

        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="corr in correlations"
            :key="corr.id"
            class="border border-base-300 rounded-lg p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge badge-sm">{{ corr.type }}</span>
                  <span class="font-mono text-sm">{{ corr.value }}</span>
                  <span
                    v-if="corr.verified"
                    class="badge badge-success badge-sm"
                    title="Vérifié"
                  >
                    ✓
                  </span>
                </div>
                <div class="text-sm opacity-70">
                  Rapport lié: {{ corr.targetReport?.title || corr.sourceReport?.title }}
                </div>
                <div class="text-xs opacity-60 mt-1">
                  Confiance: {{ Math.round(corr.confidenceScore * 100) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showCorrelationsModal = false">Fermer</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showCorrelationsModal = false"></div>
    </div>

    <EntityDialog
      :show="showEntityDialog"
      @close="showEntityDialog = false"
      @saved="showEntityDialog = false"
    />
  </div>
</template>
