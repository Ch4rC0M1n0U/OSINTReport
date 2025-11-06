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

// Nouveau layout OneNote-style
const activeTab = ref<'modules' | 'info' | 'entities'>('modules');
const selectedModuleId = ref<string | null>(null);

// Module actuellement sélectionné
const selectedModule = computed(() => {
  if (!selectedModuleId.value) return null;
  return modules.value.find(m => m.id === selectedModuleId.value) || null;
});

// Helper pour obtenir le type de module de manière sûre
const getModuleType = (module: ReportModule): ReportModuleType => {
  return module.type as ReportModuleType;
};

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
    
    // Auto-sélectionner le premier module si aucun n'est sélectionné
    if (modulesData.length > 0 && !selectedModuleId.value) {
      selectedModuleId.value = modulesData[0].id;
    }
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
    
    // Si le module supprimé était sélectionné, déselectionner
    if (selectedModuleId.value === moduleId) {
      selectedModuleId.value = null;
    }
    
    await loadReport();
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors de la suppression du module.",
      "Erreur de suppression"
    );
    console.error(err);
  }
}

// Sélectionner un module
function selectModule(moduleId: string) {
  selectedModuleId.value = moduleId;
}

// Toggle l'inclusion dans le PDF
async function toggleIncludeInPdf(moduleId: string, includeInPdf: boolean) {
  try {
    await reportsApi.toggleModuleInPdf(reportId.value, moduleId, includeInPdf);
    
    // Mettre à jour localement
    const module = modules.value.find(m => m.id === moduleId);
    if (module) {
      module.includeInPdf = includeInPdf;
    }
  } catch (err) {
    await modal.showError(
      "Erreur lors de la mise à jour du module.",
      "Erreur"
    );
    console.error(err);
  }
}

// Sélectionner tous les modules pour le PDF
async function selectAllForPdf() {
  try {
    const promises = modules.value
      .filter(m => !m.includeInPdf)
      .map(m => reportsApi.toggleModuleInPdf(reportId.value, m.id, true));
    
    await Promise.all(promises);
    
    // Mettre à jour localement
    modules.value.forEach(m => {
      m.includeInPdf = true;
    });
  } catch (err) {
    await modal.showError(
      "Erreur lors de la sélection de tous les modules.",
      "Erreur"
    );
    console.error(err);
  }
}

// Désélectionner tous les modules pour le PDF
async function deselectAllForPdf() {
  try {
    const promises = modules.value
      .filter(m => m.includeInPdf)
      .map(m => reportsApi.toggleModuleInPdf(reportId.value, m.id, false));
    
    await Promise.all(promises);
    
    // Mettre à jour localement
    modules.value.forEach(m => {
      m.includeInPdf = false;
    });
  } catch (err) {
    await modal.showError(
      "Erreur lors de la désélection de tous les modules.",
      "Erreur"
    );
    console.error(err);
  }
}

// Compter les modules inclus dans le PDF
const pdfModulesCount = computed(() => {
  return modules.value.filter(m => m.includeInPdf).length;
});

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

async function handleRemoveValidation() {
  const confirmed = await modal.showConfirm(
    "Voulez-vous retirer la validation de ce rapport ?",
    "Retirer la validation",
    "Confirmer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    await reportsApi.removeValidation(reportId.value);
    await loadReport();
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors du retrait de la validation.",
      "Erreur"
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
  } as any).format(new Date(date));
}

function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("fr-BE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  <div class="h-screen w-full flex flex-col overflow-hidden">
    <!-- Header fixe -->
    <div class="bg-base-200 border-b border-base-300 px-4 py-3 shadow-sm flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            class="btn btn-ghost btn-sm"
            @click="router.push({ name: 'reports.list' })"
          >
            ← Retour
          </button>
          <div class="border-l border-base-content/20 pl-4">
            <h2 v-if="report" class="text-2xl font-bold">{{ report.title }}</h2>
            <div v-if="report" class="flex items-center gap-3 mt-1">
              <span :class="`badge badge-sm ${statusColors[report.status]}`">{{ report.status }}</span>
              <span v-if="report.caseNumber" class="text-xs text-base-content/60">Dossier: {{ report.caseNumber }}</span>
              <span class="text-xs">
                {{ report.urgencyLevel ? getUrgencyInfo(report.urgencyLevel).icon : '' }}
                {{ report.urgencyLevel ? getUrgencyInfo(report.urgencyLevel).label : 'N/A' }}
              </span>
              <span class="text-xs">
                {{ report.classification ? getClassificationInfo(report.classification).icon : '' }}
                {{ report.classification ? getClassificationInfo(report.classification).label : 'N/A' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Actions rapides -->
        <div class="flex items-center gap-2">
          <button v-if="!report?.validatedById" class="btn btn-sm btn-warning" @click="showOfficerValidationModal = true">
            ✅ Valider
          </button>
          <button v-else class="btn btn-sm btn-outline btn-warning" @click="handleRemoveValidation">
            ❌ Retirer validation
          </button>
          <button class="btn btn-sm btn-primary" @click="handleExportPDF" :disabled="exportingPDF">
            <span v-if="exportingPDF">⏳ Export...</span>
            <span v-else>📄 Export PDF</span>
          </button>
          
          <!-- Menu déroulant Actions -->
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-sm btn-ghost gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              Actions
            </label>
            <ul tabindex="0" class="dropdown-content menu p-0 shadow-lg bg-base-100 w-64 z-10 border-l-4 border-primary mt-2">
              <!-- Édition -->
              <li class="border-b border-base-200">
                <a @click="openEditInfoDialog()" class="py-3 px-4 hover:bg-base-200 flex items-center gap-3 transition-colors">
                  <span class="text-xl">✏️</span>
                  <div>
                    <div class="font-semibold">Modifier les informations</div>
                    <div class="text-xs text-base-content/60">Éditer les métadonnées</div>
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

              <!-- Danger Zone -->
              <li v-if="isAdmin" class="bg-error/5 px-3 py-1 mt-2">
                <span class="text-xs uppercase tracking-wider text-error font-semibold">Zone de danger</span>
              </li>
              
              <li v-if="isAdmin" class="border-b border-base-200">
                <a @click="handleDeleteReport" class="py-3 px-4 hover:bg-error/10 flex items-center gap-3 transition-colors">
                  <span class="text-xl text-error">🗑️</span>
                  <div>
                    <div class="font-semibold text-error">Supprimer le rapport</div>
                    <div class="text-xs text-base-content/60">Action irréversible</div>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout principal : Sidebar + Contenu -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar des modules (style OneNote) -->
      <div class="w-80 bg-base-100 border-r border-base-300 flex flex-col">
        <!-- Header de la sidebar -->
        <div class="px-4 py-3 border-b border-base-300 bg-base-200">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-lg flex items-center gap-2">
              <span>📦</span>
              <span>Modules</span>
              <span class="text-sm font-normal text-base-content/60">({{ modules.length }})</span>
            </h3>
            <button class="btn btn-primary btn-xs" @click="openModuleDialog">
              + Ajouter
            </button>
          </div>
          
          <!-- Onglets : Modules / Infos / Entités -->
          <div class="tabs tabs-boxed tabs-xs">
            <a class="tab" :class="{ 'tab-active': activeTab === 'modules' }" @click="activeTab = 'modules'">Modules</a>
            <a class="tab" :class="{ 'tab-active': activeTab === 'info' }" @click="activeTab = 'info'">Infos</a>
            <a class="tab" :class="{ 'tab-active': activeTab === 'entities' }" @click="activeTab = 'entities'">Entités</a>
          </div>
        </div>

        <!-- Liste des modules -->
        <div v-show="activeTab === 'modules'" class="flex-1 overflow-y-auto">
          <div v-if="modules.length === 0" class="p-4 text-center text-base-content/60 text-sm">
            Aucun module.<br>Cliquez sur "+ Ajouter" pour commencer.
          </div>
          
          <!-- Boutons de sélection/désélection de tous -->
          <div v-if="modules.length > 0" class="sticky top-0 z-10 bg-base-100 border-b border-base-200 p-2 space-y-1">
            <div class="text-xs text-base-content/60 text-center mb-2">
              {{ pdfModulesCount }}/{{ modules.length }} module(s) pour le PDF
            </div>
            <div class="flex gap-1">
              <button
                @click="selectAllForPdf"
                class="btn btn-xs btn-outline btn-success flex-1 gap-1"
                :disabled="pdfModulesCount === modules.length"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Tout
              </button>
              <button
                @click="deselectAllForPdf"
                class="btn btn-xs btn-outline btn-error flex-1 gap-1"
                :disabled="pdfModulesCount === 0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Aucun
              </button>
            </div>
          </div>
          
          <VueDraggable
            v-else
            v-model="modules"
            item-key="id"
            handle=".drag-handle"
            @end="handleReorderModules"
            class="divide-y divide-base-200"
          >
            <template #item="{ element: module }">
              <div
                class="group p-3 cursor-pointer transition-colors hover:bg-base-200"
                :class="{ 'bg-primary/10 border-l-4 border-primary': selectedModuleId === module.id }"
                @click="selectModule(module.id)"
              >
                <div class="flex items-start gap-2">
                  <!-- Drag handle -->
                  <div class="drag-handle cursor-move mt-1 opacity-50 hover:opacity-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-lg">{{ getModuleIcon(module.type) }}</span>
                      <span class="font-semibold text-sm truncate">{{ module.title }}</span>
                    </div>
                    <div class="text-xs text-base-content/60 truncate">
                      {{ MODULE_TYPE_METADATA[getModuleType(module)]?.label || module.type }}
                    </div>
                    <div v-if="module.entity" class="text-xs text-accent mt-1">
                      📌 {{ module.entity.label }}
                    </div>
                  </div>
                  
                  <!-- Checkbox pour inclure dans le PDF -->
                  <div class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      :checked="module.includeInPdf"
                      @click.stop="toggleIncludeInPdf(module.id, !module.includeInPdf)"
                      class="checkbox checkbox-sm"
                      :title="module.includeInPdf ? 'Inclus dans le PDF' : 'Exclu du PDF'"
                    />
                    <span class="text-xs opacity-60" title="Inclure dans le PDF">📄</span>
                  </div>
                  
                  <!-- Bouton supprimer -->
                  <button
                    class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 hover:text-error"
                    @click.stop="handleDeleteModule(module.id)"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </template>
          </VueDraggable>
        </div>

        <!-- Onglet Informations -->
        <div v-show="activeTab === 'info'" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="report">
            <button class="btn btn-sm btn-outline w-full mb-4" @click="openEditInfoDialog()">
              ✏️ Modifier les informations
            </button>
            
            <div class="space-y-3 text-sm">
              <div>
                <div class="text-xs text-base-content/60 uppercase mb-1">Service enquêteur</div>
                <div class="font-semibold">{{ report.requestingService || "—" }}</div>
              </div>
              
              <div>
                <div class="text-xs text-base-content/60 uppercase mb-1">Base légale</div>
                <LegalBasisDisplay
                  :legal-basis="report.legalBasis"
                  :clickable="true"
                  @click-article="openArticleDetail"
                />
              </div>
              
              <div>
                <div class="text-xs text-base-content/60 uppercase mb-1">Contexte</div>
                <p class="text-sm leading-relaxed">{{ report.investigationContext || 'Non renseigné' }}</p>
              </div>
              
              <div v-if="report.keywords && report.keywords.length > 0">
                <div class="text-xs text-base-content/60 uppercase mb-2">Mots-clés</div>
                <div class="flex flex-wrap gap-1">
                  <span v-for="keyword in report.keywords" :key="keyword" 
                        class="badge badge-sm badge-outline">
                    {{ keyword }}
                  </span>
                </div>
              </div>

              <div v-if="report.validatedById">
                <div class="text-xs text-base-content/60 uppercase mb-1">Validé par</div>
                <div class="font-semibold">{{ report.validator?.firstName }} {{ report.validator?.lastName }}</div>
                <div class="text-xs text-base-content/60">
                  {{ formatDateTime(report.validatedAt) }}
                </div>
                <div v-if="report.validatorNotes" class="text-xs mt-1 italic">{{ report.validatorNotes }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet Entités -->
        <div v-show="activeTab === 'entities'" class="flex-1 overflow-y-auto p-4">
          <div class="text-sm text-base-content/60">
            Liste des entités liées à ce rapport ({{ stats?.entities || 0 }} entités)
          </div>
          <!-- TODO: Ajouter une liste d'entités si nécessaire -->
        </div>
      </div>

      <!-- Zone de contenu principale -->
      <div class="flex-1 bg-base-100 overflow-y-auto">
        <!-- État de chargement -->
        <div v-if="loading" class="flex items-center justify-center h-full">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Erreur -->
        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="alert alert-error max-w-md">
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Aucun module sélectionné -->
        <div v-else-if="!selectedModuleId && modules.length > 0" class="flex items-center justify-center h-full text-center">
          <div class="max-w-md space-y-4">
            <div class="text-6xl">📋</div>
            <h3 class="text-2xl font-bold">Sélectionnez un module</h3>
            <p class="text-base-content/60">Cliquez sur un module dans la sidebar pour afficher son contenu</p>
          </div>
        </div>

        <!-- Affichage du module sélectionné -->
        <div v-else-if="selectedModule" class="h-full">
          <div class="h-full p-4">
            <!-- Header du module -->
            <div class="flex items-start justify-between mb-3 pb-2 border-b border-base-200">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-2xl">{{ getModuleIcon(selectedModule.type) }}</span>
                  <h3 class="text-xl font-bold">{{ selectedModule.title }}</h3>
                </div>
                <div class="text-sm text-base-content/60">
                  {{ MODULE_TYPE_METADATA[getModuleType(selectedModule)]?.label || selectedModule.type }}
                </div>
                <div v-if="selectedModule.entity" class="mt-1">
                  <span class="badge badge-accent badge-sm">📌 {{ selectedModule.entity.label }}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="selectedModule.includeInPdf"
                    @change="toggleIncludeInPdf(selectedModule.id, !selectedModule.includeInPdf)"
                    class="checkbox checkbox-sm"
                  />
                  <span class="text-sm">Inclure dans PDF</span>
                </label>
              </div>
            </div>

            <!-- Contenu du module -->
            <div>
              <component
                v-if="selectedModule && getModuleComponent(getModuleType(selectedModule))"
                :is="getModuleComponent(getModuleType(selectedModule))"
                :model-value="selectedModule.payload || {}"
                :report-id="reportId"
                @update:modelValue="handleUpdateModule(selectedModule.id, $event)"
              />
              <div v-else class="text-sm text-base-content/60 italic">
                Composant non disponible pour le type "{{ selectedModule?.type }}"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

    <!-- Modal de génération PDF -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="exportingPDF" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Overlay sombre -->
        <div class="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>
        
        <!-- Modal de chargement -->
        <div class="relative bg-base-100 rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-300 scale-100">
          <div class="flex flex-col items-center gap-6">
            <!-- Spinner -->
            <div class="relative">
              <svg class="animate-spin h-16 w-16 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl animate-pulse">📄</span>
              </div>
            </div>
            
            <!-- Message -->
            <div class="text-center">
              <h3 class="text-xl font-bold mb-2">Génération du PDF en cours</h3>
              <p class="text-sm opacity-70">
                Veuillez patienter pendant que nous générons votre rapport...
              </p>
              <p class="text-xs opacity-50 mt-2">
                Cette opération peut prendre quelques secondes
              </p>
            </div>
            
            <!-- Barre de progression indéterminée -->
            <div class="w-full bg-base-300 rounded-full h-2 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-secondary animate-pulse" style="width: 70%"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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
