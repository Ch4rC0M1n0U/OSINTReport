<script setup lang="ts">
import { ref, onMounted, computed, watch, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  reportsApi,
  type Report,
  type ReportModule,
  type ReportStats,
  type ReportModuleType,
  MODULE_TYPE_METADATA,
} from "@/services/api/reports";
import { correlationsApi, type Correlation } from "@/services/api/correlations";
import { useAuthStore } from "@/stores/auth";
import EntitySelector from "@/components/reports/EntitySelector.vue";
import EntityDialog from "@/components/reports/EntityDialog.vue";
import CorrelationAlert from "@/components/reports/CorrelationAlert.vue";
import OfficerValidationModal from "@/components/reports/OfficerValidationModal.vue";
import VueDraggable from "vuedraggable";
import ModalDialog from "@/components/shared/ModalDialog.vue";
import { useModal } from "@/composables/useModal";
import LegalBasisSelector from "@/components/shared/LegalBasisSelector.vue";
import { parseLegalBasis, LEGAL_ARTICLES, type LegalArticle } from "@/data/legal-basis";
import LegalArticleDetailModal from "@/components/shared/LegalArticleDetailModal.vue";
import LegalBasisDisplay from "@/components/shared/LegalBasisDisplay.vue";

// Composants de modules
import SummaryModule from "@/components/modules/SummaryModule.vue";
import ObjectivesModule from "@/components/modules/ObjectivesModule.vue";
import ConclusionsModule from "@/components/modules/ConclusionsModule.vue";
import EntityOverviewModule from "@/components/modules/EntityOverviewModule.vue";
import IdentifierLookupModule from "@/components/modules/IdentifierLookupModule.vue";
import PlatformAnalysisModule from "@/components/modules/PlatformAnalysisModule.vue";
import MediaGalleryModule from "@/components/modules/MediaGalleryModule.vue";
import DataRetentionModule from "@/components/modules/DataRetentionModule.vue";
import InvestigationLeadsModule from "@/components/modules/InvestigationLeadsModule.vue";
import SignOffModule from "@/components/modules/SignOffModule.vue";
import ResearchSummaryModule from "@/components/modules/ResearchSummaryModule.vue";

const route = useRoute();
const router = useRouter();
const modal = useModal();
const authStore = useAuthStore();

const reportId = computed(() => route.params.id as string);
const isAdmin = computed(() => authStore.user?.roleName === 'admin');

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
const showEditInfoDialog = ref(false);
const showOfficerValidationModal = ref(false);
const exportingPDF = ref(false);
const showArticleDetailModal = ref(false);
const selectedArticle = ref<LegalArticle | null>(null);

const moduleForm = ref<{
  type: ReportModuleType;
  title: string;
  entityId: string | undefined;
  payload: Record<string, any>;
}>({
  type: "summary",
  title: "",
  entityId: undefined,
  payload: {},
});

const editInfoForm = ref({
  title: "",
  caseNumber: "",
  requestingService: "",
  investigationContext: "",
  urgencyLevel: "ROUTINE" as "ROUTINE" | "URGENT" | "CRITICAL",
  classification: "CONFIDENTIAL" as "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET",
  legalBasis: "",
  keywords: [] as string[],
});

const keywordInput = ref("");

// Construire la liste des types depuis MODULE_TYPE_METADATA
const moduleTypes = (Object.keys(MODULE_TYPE_METADATA) as ReportModuleType[])
  .map((key) => ({
    value: key,
    label: MODULE_TYPE_METADATA[key].label,
    icon: MODULE_TYPE_METADATA[key].icon,
  }))
  .sort((a, b) => MODULE_TYPE_METADATA[a.value].order - MODULE_TYPE_METADATA[b.value].order);

// Pré-remplir le titre avec le label du type de module sélectionné
watch(
  () => moduleForm.value.type,
  (newType: ReportModuleType) => {
    const selectedModuleType = moduleTypes.find((mt) => mt.value === newType);
    if (selectedModuleType) {
      moduleForm.value.title = selectedModuleType.label;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await loadReport();
});

// Fournir le rapport aux composants enfants (pour l'IA)
provide('report', report);

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
  const confirmed = await modal.showConfirm(
    "Lancer la détection automatique des corrélations ?",
    "Détection automatique",
    "Lancer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    const detected = await correlationsApi.detect(reportId.value);
    await modal.showSuccess(
      `${detected.length} corrélation(s) détectée(s) !`,
      "Détection réussie"
    );
    await loadCorrelations();
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors de la détection des corrélations.",
      "Erreur de détection"
    );
    console.error(err);
  }
}

function openModuleDialog() {
  const defaultType = "summary";
  const defaultModuleType = moduleTypes.find((mt) => mt.value === defaultType);
  
  moduleForm.value = {
    type: defaultType,
    title: defaultModuleType?.label || "",
    entityId: undefined,
    payload: {},
  };
  showModuleDialog.value = true;
}

async function handleCreateModule() {
  if (!moduleForm.value.title.trim()) {
    await modal.showWarning(
      "Le titre du module est obligatoire.",
      "Champ requis"
    );
    return;
  }

  try {
    const createData: any = {
      type: moduleForm.value.type,
      title: moduleForm.value.title,
      entityId: moduleForm.value.entityId,
    };
    
    // N'envoyer le payload que s'il n'est pas vide
    if (Object.keys(moduleForm.value.payload).length > 0) {
      createData.payload = moduleForm.value.payload;
    }
    
    await reportsApi.createModule(reportId.value, createData);

    showModuleDialog.value = false;
    await loadReport();
  } catch (err: any) {
    await modal.showError(
      err.response?.data?.message || "Une erreur est survenue lors de la création du module.",
      "Erreur de création"
    );
    console.error(err);
  }
}

async function handleDeleteModule(moduleId: string) {
  const confirmed = await modal.showDangerConfirm(
    "Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible.",
    "Supprimer le module",
    "Supprimer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    await reportsApi.deleteModule(reportId.value, moduleId);
    await loadReport();
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors de la suppression du module.",
      "Erreur de suppression"
    );
    console.error(err);
  }
}

async function handleChangeStatus(newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const statusLabels = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé"
  };
  
  const confirmed = await modal.showConfirm(
    `Voulez-vous changer le statut du rapport vers "${statusLabels[newStatus]}" ?`,
    "Changement de statut",
    "Confirmer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    await reportsApi.updateStatus(reportId.value, newStatus);
    await loadReport();
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors du changement de statut.",
      "Erreur"
    );
    console.error(err);
  }
}

function openEditInfoDialog() {
  if (!report.value) return;
  
  console.log('📋 Rapport chargé:', report.value);
  console.log('🔍 urgencyLevel:', report.value.urgencyLevel);
  console.log('🔒 classification:', report.value.classification);
  console.log('📝 investigationContext:', report.value.investigationContext);
  console.log('⚖️ legalBasis:', report.value.legalBasis);
  
  editInfoForm.value = {
    title: report.value.title,
    caseNumber: report.value.caseNumber || "",
    requestingService: report.value.requestingService || "",
    investigationContext: report.value.investigationContext || "",
    urgencyLevel: (report.value.urgencyLevel as "ROUTINE" | "URGENT" | "CRITICAL") || "ROUTINE",
    classification: (report.value.classification as "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET") || "CONFIDENTIAL",
    legalBasis: report.value.legalBasis || "",
    keywords: report.value.keywords ? [...report.value.keywords] : [],
  };
  
  console.log('✅ Formulaire initialisé:', editInfoForm.value);
  
  keywordInput.value = "";
  showEditInfoDialog.value = true;
}

function addKeyword() {
  const keyword = keywordInput.value.trim().toLowerCase();
  if (keyword && !editInfoForm.value.keywords.includes(keyword)) {
    editInfoForm.value.keywords.push(keyword);
    keywordInput.value = "";
  }
}

function removeKeyword(keyword: string) {
  editInfoForm.value.keywords = editInfoForm.value.keywords.filter((k) => k !== keyword);
}

async function handleSaveEditInfo() {
  if (!editInfoForm.value.title.trim()) {
    await modal.showWarning(
      "Le titre du rapport est obligatoire.",
      "Champ requis"
    );
    return;
  }

  if (!editInfoForm.value.investigationContext || !editInfoForm.value.investigationContext.trim()) {
    await modal.showWarning(
      "Le contexte de l'enquête est obligatoire.",
      "Champ requis"
    );
    return;
  }

  try {
    await reportsApi.update(reportId.value, {
      title: editInfoForm.value.title,
      caseNumber: editInfoForm.value.caseNumber || undefined,
      requestingService: editInfoForm.value.requestingService || undefined,
      investigationContext: editInfoForm.value.investigationContext,
      urgencyLevel: editInfoForm.value.urgencyLevel,
      classification: editInfoForm.value.classification,
      legalBasis: editInfoForm.value.legalBasis || undefined,
      keywords: editInfoForm.value.keywords.length > 0 ? editInfoForm.value.keywords : undefined,
    });

    // Recharger le rapport
    await loadReport();
    showEditInfoDialog.value = false;

    await modal.showSuccess(
      "Les modifications ont été enregistrées avec succès.",
      "Modifications enregistrées"
    );
  } catch (err: any) {
    await modal.showError(
      err.response?.data?.message || "Erreur lors de la sauvegarde des modifications.",
      "Erreur"
    );
  }
}

// Ouvrir le détail d'un article de loi
function openArticleDetail(articleCode: string) {
  const article = LEGAL_ARTICLES.find((a) => a.code === articleCode);
  if (article) {
    selectedArticle.value = article;
    showArticleDetailModal.value = true;
  }
}

async function handleDuplicate() {
  const confirmed = await modal.showConfirm(
    "Voulez-vous créer une copie de ce rapport ?",
    "Dupliquer le rapport",
    "Dupliquer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    const newReport = await reportsApi.duplicate(reportId.value);
    router.push({ name: "reports.detail", params: { id: newReport.id } });
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors de la duplication du rapport.",
      "Erreur de duplication"
    );
    console.error(err);
  }
}

async function handleDeleteReport() {
  const confirmed = await modal.showConfirm(
    "⚠️ Cette action est irréversible. Le rapport et tous ses modules seront définitivement supprimés.",
    "Supprimer le rapport",
    "Supprimer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    await reportsApi.delete(reportId.value);
    // Rediriger immédiatement sans attendre la modal
    router.push({ name: "reports.list" });
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors de la suppression du rapport.",
      "Erreur de suppression"
    );
    console.error(err);
  }
}

function getModuleIcon(type: string) {
  return moduleTypes.find((t) => t.value === type)?.icon || "📋";
}

function getModuleComponent(type: ReportModuleType) {
  const componentMap: Record<string, any> = {
    summary: SummaryModule,
    entities: EntityOverviewModule, // Type "entities" pour compatibilité
    objectives: ObjectivesModule,
    conclusions: ConclusionsModule,
    research_summary: ResearchSummaryModule,
    entity_overview: EntityOverviewModule,
    identifier_lookup: IdentifierLookupModule,
    platform_analysis: PlatformAnalysisModule,
    media_gallery: MediaGalleryModule,
    data_retention: DataRetentionModule,
    investigation_leads: InvestigationLeadsModule,
    sign_off: SignOffModule,
  };
  return componentMap[type] || null;
}

async function handleUpdateModule(moduleId: string, payload: any) {
  try {
    await reportsApi.updateModule(reportId.value, moduleId, { payload });
    
    // Mettre à jour localement le payload du module sans tout recharger
    const moduleIndex = modules.value.findIndex(m => m.id === moduleId);
    if (moduleIndex !== -1) {
      modules.value[moduleIndex].payload = payload;
    }
    
    console.log("✅ Module mis à jour:", moduleId);
  } catch (err: any) {
    // Afficher l'erreur seulement en cas de problème
    await modal.showError(
      err.response?.data?.message || "Une erreur est survenue lors de la mise à jour du module.",
      "Erreur de mise à jour"
    );
    console.error(err);
  }
}

async function handleReorderModules() {
  try {
    const moduleIds = modules.value.map((m) => m.id);
    await reportsApi.reorderModules(reportId.value, moduleIds);
    // Pas besoin de recharger, l'ordre est déjà à jour dans la vue
  } catch (err: any) {
    await modal.showError(
      err.response?.data?.message || "Une erreur est survenue lors du réordonnement des modules.",
      "Erreur de réordonnement"
    );
    console.error(err);
    // Recharger en cas d'erreur pour rétablir l'ordre correct
    await loadReport();
  }
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
    await modal.showError(
      err.response?.data?.message || "Une erreur est survenue lors de l'export PDF.",
      "Erreur d'export"
    );
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

// Métadonnées pour les niveaux d'urgence
const urgencyLevels = {
  ROUTINE: { label: "Routine", icon: "📋", color: "badge-info" },
  URGENT: { label: "Urgent", icon: "⚡", color: "badge-warning" },
  CRITICAL: { label: "Critique", icon: "🚨", color: "badge-error" },
};

// Métadonnées pour les classifications
const classifications = {
  PUBLIC: { label: "Public", icon: "🌐" },
  RESTRICTED: { label: "Restreint", icon: "⚠️" },
  CONFIDENTIAL: { label: "Confidentiel", icon: "🔒" },
  SECRET: { label: "Secret", icon: "🔐" },
};

// Options pour les formulaires
const urgencyOptions = [
  { value: "ROUTINE", label: "Routine", icon: "📋" },
  { value: "URGENT", label: "Urgent", icon: "⚡" },
  { value: "CRITICAL", label: "Critique", icon: "🚨" },
];

const classificationOptions = [
  { value: "PUBLIC", label: "Public", icon: "🌐" },
  { value: "RESTRICTED", label: "Restreint", icon: "⚠️" },
  { value: "CONFIDENTIAL", label: "Confidentiel", icon: "🔒" },
  { value: "SECRET", label: "Secret", icon: "🔐" },
];

function getUrgencyInfo(level: string) {
  return urgencyLevels[level as keyof typeof urgencyLevels] || urgencyLevels.ROUTINE;
}

function getClassificationInfo(classif: string) {
  return classifications[classif as keyof typeof classifications] || classifications.CONFIDENTIAL;
}
</script>

<template>
  <div>
    <div class="space-y-6">
    <!-- En-tête -->
    <div class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <button
            class="btn btn-ghost btn-sm mb-3"
            @click="router.push({ name: 'reports.list' })"
          >
            ← Retour
          </button>
          <div class="flex items-center justify-between mb-4">
            <h2 v-if="report" class="text-3xl font-bold">
              {{ report.title }}
            </h2>
          </div>
          
          <!-- Métadonnées du rapport -->
          <div v-if="report" class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <!-- Statut -->
            <div class="flex items-center gap-2">
              <div class="w-1 h-8 rounded-sm" :class="statusColors[report.status].replace('badge-', 'bg-')"></div>
              <div>
                <div class="text-xs text-base-content/60 uppercase tracking-wider">Statut</div>
                <div class="font-semibold">{{ report.status }}</div>
              </div>
            </div>

            <!-- Numéro de dossier -->
            <div v-if="report.caseNumber" class="flex items-center gap-2">
              <div class="w-1 h-8 rounded-sm bg-base-content/20"></div>
              <div>
                <div class="text-xs text-base-content/60 uppercase tracking-wider">Dossier</div>
                <div class="font-semibold">{{ report.caseNumber }}</div>
              </div>
            </div>

            <!-- Niveau d'urgence -->
            <div class="flex items-center gap-2">
              <div class="w-1 h-8 rounded-sm" :class="getUrgencyInfo(report.urgencyLevel).color.replace('badge-', 'bg-')"></div>
              <div>
                <div class="text-xs text-base-content/60 uppercase tracking-wider">Urgence</div>
                <div class="font-semibold">
                  {{ getUrgencyInfo(report.urgencyLevel).icon }} {{ getUrgencyInfo(report.urgencyLevel).label }}
                </div>
              </div>
            </div>

            <!-- Classification -->
            <div class="flex items-center gap-2">
              <div class="w-1 h-8 rounded-sm bg-error"></div>
              <div>
                <div class="text-xs text-base-content/60 uppercase tracking-wider">Classification</div>
                <div class="font-semibold">
                  {{ getClassificationInfo(report.classification).icon }} {{ getClassificationInfo(report.classification).label }}
                </div>
              </div>
            </div>

            <!-- Validation -->
            <div class="flex items-center gap-2">
              <div class="w-1 h-8 rounded-sm" :class="report.isLocked ? 'bg-success' : 'bg-warning'"></div>
              <div class="flex-1">
                <div class="text-xs text-base-content/60 uppercase tracking-wider">Validation</div>
                <button
                  type="button"
                  class="btn btn-xs gap-1 mt-1"
                  :class="report.isLocked ? 'btn-success' : 'btn-warning'"
                  @click="showOfficerValidationModal = true"
                >
                  <span v-if="report.isLocked">🔒</span>
                  <span v-else>🔓</span>
                  {{ report.isLocked ? 'Validé' : 'Valider' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="dropdown dropdown-end ml-4" v-if="report">
          <label tabindex="0" class="btn btn-primary btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            Actions
          </label>
          <ul tabindex="0" class="dropdown-content menu p-0 shadow-lg bg-base-100 w-64 z-10 border-l-4 border-primary">
            <!-- Édition -->
            <li class="border-b border-base-200">
              <a @click="openEditInfoDialog" class="py-3 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-xl">✏️</span>
                <div>
                  <div class="font-semibold">Modifier les informations</div>
                  <div class="text-xs text-base-content/60">Éditer les métadonnées</div>
                </div>
              </a>
            </li>

            <!-- Export -->
            <li class="border-b border-base-200">
              <a @click="handleExportPDF" :class="{ 'loading': exportingPDF }" class="py-3 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-xl">📄</span>
                <div>
                  <div class="font-semibold">Exporter en PDF</div>
                  <div class="text-xs text-base-content/60">Générer le document</div>
                </div>
              </a>
            </li>

            <!-- Analyse -->
            <li class="bg-base-50 px-3 py-1">
              <span class="text-xs uppercase tracking-wider text-base-content/60 font-semibold">Analyse</span>
            </li>
            <li class="border-b border-base-200">
              <a @click="showStatsModal = true" class="py-2 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-lg">📊</span>
                <span class="font-medium">Statistiques</span>
              </a>
            </li>
            <li class="border-b border-base-200">
              <a @click="loadCorrelations" class="py-2 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-lg">🔗</span>
                <span class="font-medium">Voir corrélations</span>
              </a>
            </li>
            <li class="border-b border-base-200">
              <a @click="detectCorrelations" class="py-2 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-lg">🔍</span>
                <span class="font-medium">Détecter corrélations</span>
              </a>
            </li>

            <!-- Gestion -->
            <li class="bg-base-50 px-3 py-1">
              <span class="text-xs uppercase tracking-wider text-base-content/60 font-semibold">Gestion</span>
            </li>
            <li v-if="report.status === 'DRAFT'" class="border-b border-base-200">
              <a @click="handleChangeStatus('PUBLISHED')" class="py-2 px-4 hover:bg-success/10 flex items-center gap-3 transition-colors">
                <span class="text-lg">✓</span>
                <span class="font-medium text-success">Publier</span>
              </a>
            </li>
            <li v-if="report.status === 'PUBLISHED'" class="border-b border-base-200">
              <a @click="handleChangeStatus('ARCHIVED')" class="py-2 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-lg">📦</span>
                <span class="font-medium">Archiver</span>
              </a>
            </li>
            <li class="border-b border-base-200">
              <a @click="handleDuplicate" class="py-2 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                <span class="text-lg">📋</span>
                <span class="font-medium">Dupliquer</span>
              </a>
            </li>

            <!-- Danger zone (admin only) -->
            <li v-if="isAdmin" class="bg-error/5 px-3 py-1 border-t-2 border-error">
              <span class="text-xs uppercase tracking-wider text-error font-semibold">Zone dangereuse</span>
            </li>
            <li v-if="isAdmin">
              <a @click="handleDeleteReport" class="py-3 px-4 hover:bg-error/10 flex items-center gap-3 transition-colors">
                <span class="text-xl">🗑️</span>
                <div>
                  <div class="font-semibold text-error">Supprimer le rapport</div>
                  <div class="text-xs text-error/60">Action irréversible</div>
                </div>
              </a>
            </li>
        </ul>
      </div>
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
      <div class="bg-base-100 border-l-4 border-info shadow-sm">
        <div class="p-6">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <span class="text-2xl">ℹ️</span>
            <span>Informations</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="text-xs uppercase tracking-wider text-base-content/60 mb-2">Service enquêteur</div>
              <div class="font-semibold text-base">
                {{ report.requestingService || "—" }}
              </div>
            </div>
            <div class="md:col-span-2">
              <LegalBasisDisplay
                :legal-basis="report.legalBasis"
                :clickable="true"
                @click-article="openArticleDetail"
              />
            </div>
            <div class="md:col-span-2">
              <div class="text-xs uppercase tracking-wider text-base-content/60 mb-2">Contexte</div>
              <p class="text-sm leading-relaxed">{{ report.investigationContext || 'Non renseigné' }}</p>
            </div>
            <div v-if="report.keywords && report.keywords.length > 0" class="md:col-span-2">
              <div class="text-xs uppercase tracking-wider text-base-content/60 mb-3">Mots-clés</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="keyword in report.keywords" :key="keyword" 
                      class="px-3 py-1 bg-base-200 text-sm font-medium border-l-2 border-primary">
                  {{ keyword }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div class="bg-base-100 border-l-4 border-success shadow-sm">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold flex items-center gap-2">
              <span class="text-2xl">📦</span>
              <span>Modules</span>
              <span class="text-base font-normal text-base-content/60">({{ modules.length }})</span>
            </h3>
            <button class="btn btn-primary btn-sm" @click="openModuleDialog">
              + Ajouter un module
            </button>
          </div>

          <div v-if="modules.length === 0" class="text-center py-12 text-base-content/60">
            Aucun module. Commencez par en ajouter un.
          </div>

          <VueDraggable
            v-else
            v-model="modules"
            item-key="id"
            class="space-y-4"
            handle=".drag-handle"
            @end="handleReorderModules"
          >
            <template #item="{ element: module }">
              <div
                class="border-l-4 border-base-300 bg-base-50 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <!-- En-tête du module -->
                <div class="flex items-start justify-between p-4 bg-base-100">
                  <div class="flex items-center gap-3 flex-1">
                    <!-- Poignée de drag -->
                    <div class="drag-handle cursor-move p-2 hover:bg-base-200 transition-colors" title="Glisser pour réordonner">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 h-5 text-base-content/40"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-2xl">{{ getModuleIcon(module.type) }}</span>
                        <h4 class="font-bold text-lg">{{ module.title }}</h4>
                      </div>
                      <div class="text-xs uppercase tracking-wider text-base-content/60">
                        {{ MODULE_TYPE_METADATA[module.type as ReportModuleType]?.label || module.type }}
                      </div>
                      <div v-if="module.entity" class="text-sm mt-2">
                        Entité: <span class="px-2 py-0.5 bg-base-200 text-xs font-medium border-l-2 border-accent">{{ module.entity.label }}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    class="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-colors"
                    @click="handleDeleteModule(module.id)"
                    title="Supprimer ce module"
                  >
                    🗑️
                  </button>
                </div>

                <!-- Contenu du module (composant dynamique) -->
                <div class="p-6 pt-4 bg-base-100">
                  <component
                    v-if="getModuleComponent(module.type as ReportModuleType)"
                    :is="getModuleComponent(module.type as ReportModuleType)"
                    :model-value="module.payload || {}"
                    :report-id="reportId"
                    @update:model-value="(payload: any) => handleUpdateModule(module.id, payload)"
                  />
                  <div v-else class="text-sm text-base-content/60 italic">
                    Composant non disponible pour le type "{{ module.type }}"
                  </div>
                </div>
              </div>
            </template>
          </VueDraggable>
        </div>
      </div>
    </template>

    <!-- Modal: Créer module -->
    <div v-if="showModuleDialog" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-success pl-4">
          <span class="text-2xl">➕</span>
          <span>Ajouter un module</span>
        </h3>

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

    <!-- Modal: Modifier les informations du rapport -->
    <div v-if="showEditInfoDialog" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-warning pl-4">
          <span class="text-2xl">✏️</span>
          <span>Modifier les informations du rapport</span>
        </h3>
        
        <form @submit.prevent="handleSaveEditInfo" class="space-y-4">
          <!-- Titre -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Titre du rapport <span class="text-error">*</span></span>
            </label>
            <input
              v-model="editInfoForm.title"
              type="text"
              class="input input-bordered"
              required
            />
          </div>

          <!-- Numéro de dossier et Service -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Numéro de dossier</span>
              </label>
              <input
                v-model="editInfoForm.caseNumber"
                type="text"
                placeholder="Ex: PV.2024.12345"
                class="input input-bordered"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Service enquêteur</span>
              </label>
              <input
                v-model="editInfoForm.requestingService"
                type="text"
                placeholder="Ex: Brigade Cyber Crime"
                class="input input-bordered"
              />
            </div>
          </div>

          <!-- Contexte -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Contexte de l'enquête <span class="text-error">*</span></span>
              <span class="label-text-alt" :class="(editInfoForm.investigationContext || '').length > 500 ? 'text-error' : 'text-base-content/60'">
                {{ (editInfoForm.investigationContext || '').length }} / 500
              </span>
            </label>
            <textarea
              v-model="editInfoForm.investigationContext"
              class="textarea textarea-bordered h-24"
              :class="(editInfoForm.investigationContext || '').length > 500 ? 'textarea-error' : ''"
              maxlength="500"
              required
            ></textarea>
          </div>

          <!-- Base légale -->
          <LegalBasisSelector
            v-model="editInfoForm.legalBasis"
            hint="Sélectionnez les articles du Code d'Instruction Criminelle belge applicables"
          />

          <!-- Urgence -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Niveau d'urgence</span>
            </label>
            <select v-model="editInfoForm.urgencyLevel" class="select select-bordered">
              <option v-for="option in urgencyOptions" :key="option.value" :value="option.value">
                {{ option.icon }} {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Classification -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Classification</span>
            </label>
            <select v-model="editInfoForm.classification" class="select select-bordered">
              <option v-for="option in classificationOptions" :key="option.value" :value="option.value">
                {{ option.icon }} {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Mots-clés -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Mots-clés</span>
            </label>
            <div class="join w-full">
              <input
                v-model="keywordInput"
                type="text"
                placeholder="Ajouter un mot-clé"
                class="input input-bordered join-item flex-1"
                @keypress.enter.prevent="addKeyword"
              />
              <button
                type="button"
                class="btn btn-primary join-item"
                @click="addKeyword"
              >
                Ajouter
              </button>
            </div>
            <div v-if="editInfoForm.keywords.length > 0" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="keyword in editInfoForm.keywords"
                :key="keyword"
                class="px-3 py-2 bg-base-200 text-sm font-medium border-l-2 border-primary flex items-center gap-2"
              >
                {{ keyword }}
                <button
                  type="button"
                  class="hover:text-error transition-colors"
                  @click="removeKeyword(keyword)"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              @click="showEditInfoDialog = false"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              💾 Enregistrer
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="showEditInfoDialog = false"></div>
    </div>

    <!-- Modal: Statistiques -->
    <div v-if="showStatsModal && stats" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-primary pl-4">
          <span class="text-2xl">📊</span>
          <span>Statistiques du rapport</span>
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-base-200 p-4 border-l-4 border-info">
            <div class="text-xs uppercase tracking-wider text-base-content/60 mb-1">Modules</div>
            <div class="text-3xl font-bold">{{ stats.modules }}</div>
          </div>
          <div class="bg-base-200 p-4 border-l-4 border-success">
            <div class="text-xs uppercase tracking-wider text-base-content/60 mb-1">Entités</div>
            <div class="text-3xl font-bold">{{ stats.entities }}</div>
          </div>
          <div class="bg-base-200 p-4 border-l-4 border-warning">
            <div class="text-xs uppercase tracking-wider text-base-content/60 mb-1">Enregistrements recherche</div>
            <div class="text-3xl font-bold">{{ stats.researchRecords }}</div>
          </div>
          <div class="bg-base-200 p-4 border-l-4 border-accent">
            <div class="text-xs uppercase tracking-wider text-base-content/60 mb-1">Corrélations</div>
            <div class="text-3xl font-bold">{{ stats.correlations }}</div>
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
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-accent pl-4">
          <span class="text-2xl">🔗</span>
          <span>Corrélations</span>
          <span class="text-base font-normal text-base-content/60">({{ correlations?.length || 0 }})</span>
        </h3>

        <div v-if="!correlations || correlations.length === 0" class="text-center py-12 text-base-content/60">
          Aucune corrélation détectée
        </div>

        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="corr in correlations"
            :key="corr.id"
            class="bg-base-100 border-l-4 border-base-300 hover:border-accent transition-colors p-4"
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
    
    <!-- Modal de détail d'article de loi -->
    <LegalArticleDetailModal
      :is-open="showArticleDetailModal"
      :article="selectedArticle"
      @close="showArticleDetailModal = false"
    />
    
    <!-- Modal Dialog réutilisable -->
    <ModalDialog
      v-model="modal.isOpen.value"
      :title="modal.config.value.title"
      :message="modal.config.value.message"
      :type="modal.config.value.type"
      :confirm-text="modal.config.value.confirmText"
      :cancel-text="modal.config.value.cancelText"
      :is-confirm="modal.config.value.type === 'confirm' || modal.config.value.type === 'error'"
      @confirm="modal.handleConfirm"
      @cancel="modal.handleCancel"
    />
    </div>

    <!-- Modal de validation officier -->
    <OfficerValidationModal
      :show="showOfficerValidationModal"
      :report="report"
      :is-admin="isAdmin"
      @close="showOfficerValidationModal = false"
      @validated="loadReport"
    />
  </div>
</template>
