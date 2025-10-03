<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { reportsApi, type CreateReportData } from "@/services/api/reports";
import EntitySelector from "@/components/reports/EntitySelector.vue";
import EntityDialog from "@/components/reports/EntityDialog.vue";
import CorrelationAlert from "@/components/reports/CorrelationAlert.vue";
import LegalBasisSelector from "@/components/shared/LegalBasisSelector.vue";
import LegalBasisDisplay from "@/components/shared/LegalBasisDisplay.vue";
import { parseLegalBasis } from "@/data/legal-basis";

const router = useRouter();

const currentStep = ref(1);
const totalSteps = 3;

// Formulaire
const form = ref<CreateReportData>({
  title: "",
  caseNumber: "",
  requestingService: "",
  investigationContext: "",
  urgencyLevel: "ROUTINE",
  classification: "CONFIDENTIAL",
  legalBasis: "",
  keywords: [],
});

const keywordInput = ref("");
const showEntityDialog = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

// Options
const urgencyLevels = [
  { value: "ROUTINE", label: "Routine", color: "info", icon: "📋" },
  { value: "URGENT", label: "Urgent", color: "warning", icon: "⚡" },
  { value: "CRITICAL", label: "Critique", color: "error", icon: "🚨" },
];

const classifications = [
  { value: "PUBLIC", label: "Public", icon: "🌐" },
  { value: "RESTRICTED", label: "Restreint", icon: "⚠️" },
  { value: "CONFIDENTIAL", label: "Confidentiel", icon: "🔒" },
  { value: "SECRET", label: "Secret", icon: "🔐" },
];

const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    return form.value.title.trim().length > 0;
  }
  if (currentStep.value === 2) {
    return form.value.investigationContext.trim().length > 0;
  }
  return true;
});

const urgencyInfo = computed(() => {
  return urgencyLevels.find(u => u.value === form.value.urgencyLevel) || urgencyLevels[0];
});

const classificationInfo = computed(() => {
  return classifications.find(c => c.value === form.value.classification) || classifications[0];
});

function nextStep() {
  if (canGoNext.value && currentStep.value < totalSteps) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function addKeyword() {
  const keyword = keywordInput.value.trim().toLowerCase();
  if (keyword && !form.value.keywords?.includes(keyword)) {
    form.value.keywords = [...(form.value.keywords || []), keyword];
    keywordInput.value = "";
  }
}

function removeKeyword(keyword: string) {
  form.value.keywords = form.value.keywords?.filter((k) => k !== keyword) || [];
}

async function handleSubmit() {
  if (!canGoNext.value) return;

  saving.value = true;
  error.value = null;

  try {
    const report = await reportsApi.create({
      ...form.value,
      keywords: form.value.keywords?.length ? form.value.keywords : undefined,
      caseNumber: form.value.caseNumber || undefined,
      requestingService: form.value.requestingService || undefined,
      legalBasis: form.value.legalBasis || undefined,
    });

    // Rediriger vers la page de détail du rapport
    await router.push({ name: "reports.detail", params: { id: report.id } });
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur lors de la création du rapport";
    console.error(err);
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  if (confirm("Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.")) {
    router.push({ name: "reports.list" });
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">📝 Créer un rapport OSINT</h2>
        <p class="text-sm text-base-content/70">
          Étape {{ currentStep }} sur {{ totalSteps }}
        </p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="handleCancel">✕ Annuler</button>
    </header>

    <!-- Barre de progression -->
    <div class="w-full bg-base-200 rounded-full h-2">
      <div
        class="bg-primary h-2 rounded-full transition-all duration-300"
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      ></div>
    </div>

    <!-- Steps -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- Étape 1: Informations de base -->
        <div v-if="currentStep === 1" class="space-y-4">
          <h3 class="text-xl font-semibold mb-4">📋 Informations de base</h3>

          <div class="form-control">
            <label class="label">
              <span class="label-text">
                Titre du rapport <span class="text-error">*</span>
              </span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Ex: Enquête fraude bancaire #2024-001"
              class="input input-bordered"
              required
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Numéro de dossier</span>
              </label>
              <input
                v-model="form.caseNumber"
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
                v-model="form.requestingService"
                type="text"
                placeholder="Ex: Brigade Cyber Crime"
                class="input input-bordered"
              />
            </div>
          </div>

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
            <div v-if="form.keywords && form.keywords.length > 0" class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="keyword in form.keywords"
                :key="keyword"
                class="badge badge-lg gap-2"
              >
                {{ keyword }}
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle"
                  @click="removeKeyword(keyword)"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- Étape 2: Contexte et classification -->
        <div v-if="currentStep === 2" class="space-y-4">
          <h3 class="text-xl font-semibold mb-4">🔒 Contexte et classification</h3>

          <div class="form-control">
            <label class="label">
              <span class="label-text">
                Contexte de l'enquête <span class="text-error">*</span>
              </span>
            </label>
            <textarea
              v-model="form.investigationContext"
              class="textarea textarea-bordered h-24"
              placeholder="Décrivez le contexte de l'enquête..."
              required
            ></textarea>
          </div>

          <LegalBasisSelector
            v-model="form.legalBasis"
            hint="Sélectionnez les articles du Code d'Instruction Criminelle belge applicables"
          />

          <div class="form-control">
            <label class="label">
              <span class="label-text">Niveau d'urgence</span>
            </label>
            <div class="flex gap-3">
              <label
                v-for="level in urgencyLevels"
                :key="level.value"
                class="flex-1 cursor-pointer"
              >
                <input
                  v-model="form.urgencyLevel"
                  type="radio"
                  :value="level.value"
                  class="hidden"
                />
                <div
                  class="border rounded-lg p-3 text-center transition"
                  :class="{
                    [`border-${level.color} bg-${level.color}/10`]: form.urgencyLevel === level.value,
                    'border-base-300 hover:bg-base-200': form.urgencyLevel !== level.value,
                  }"
                >
                  <div class="text-2xl mb-1">{{ level.icon }}</div>
                  <div class="text-sm">{{ level.label }}</div>
                </div>
              </label>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Classification</span>
            </label>
            <div class="flex gap-3">
              <label
                v-for="classif in classifications"
                :key="classif.value"
                class="flex-1 cursor-pointer"
              >
                <input
                  v-model="form.classification"
                  type="radio"
                  :value="classif.value"
                  class="hidden"
                />
                <div
                  class="border rounded-lg p-3 text-center transition"
                  :class="{
                    'border-primary bg-primary/10': form.classification === classif.value,
                    'border-base-300 hover:bg-base-200': form.classification !== classif.value,
                  }"
                >
                  <div class="text-2xl mb-1">{{ classif.icon }}</div>
                  <div class="text-sm">{{ classif.label }}</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Étape 3: Validation -->
        <div v-if="currentStep === 3" class="space-y-4">
          <h3 class="text-xl font-semibold mb-4">✅ Validation</h3>

          <div class="bg-base-200 rounded-lg p-6 space-y-4">
            <div>
              <h4 class="font-semibold text-lg mb-2">{{ form.title }}</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div v-if="form.caseNumber">
                  <span class="opacity-70">Dossier:</span>
                  <span class="ml-2 font-medium">{{ form.caseNumber }}</span>
                </div>
                <div v-if="form.requestingService">
                  <span class="opacity-70">Service:</span>
                  <span class="ml-2 font-medium">{{ form.requestingService }}</span>
                </div>
              </div>
            </div>

            <div class="divider my-2"></div>

            <div>
              <div class="text-sm opacity-70 mb-1">Contexte:</div>
              <p class="text-sm">{{ form.investigationContext }}</p>
            </div>

            <LegalBasisDisplay
              :legal-basis="form.legalBasis"
              label="Base légale:"
              :clickable="false"
            />

            <div class="flex gap-4">
              <div>
                <span class="text-sm opacity-70">Urgence:</span>
                <span class="ml-2 badge badge-outline">
                  {{ urgencyInfo.icon }} {{ urgencyInfo.label }}
                </span>
              </div>
              <div>
                <span class="text-sm opacity-70">Classification:</span>
                <span class="ml-2 badge badge-outline">
                  {{ classificationInfo.icon }} {{ classificationInfo.label }}
                </span>
              </div>
            </div>

            <div v-if="form.keywords && form.keywords.length > 0">
              <div class="text-sm opacity-70 mb-2">Mots-clés:</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="keyword in form.keywords" :key="keyword" class="badge">
                  {{ keyword }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Navigation -->
        <div class="card-actions justify-between mt-6">
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn btn-outline"
            @click="prevStep"
            :disabled="saving"
          >
            ← Précédent
          </button>
          <div v-else></div>

          <div class="flex gap-2">
            <button
              v-if="currentStep < totalSteps"
              type="button"
              class="btn btn-primary"
              @click="nextStep"
              :disabled="!canGoNext"
            >
              Suivant →
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary"
              @click="handleSubmit"
              :disabled="!canGoNext || saving"
            >
              <span v-if="saving" class="loading loading-spinner"></span>
              {{ saving ? "Création..." : "✓ Créer le rapport" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <EntityDialog
      :show="showEntityDialog"
      @close="showEntityDialog = false"
      @saved="showEntityDialog = false"
    />
  </div>
</template>
