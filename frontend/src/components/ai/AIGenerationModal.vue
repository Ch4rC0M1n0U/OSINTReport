<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AIGenerationService, type PersonalDataToProtect } from '@/services/ai-generation.service';
import { HugeiconsIcon } from '@hugeicons/vue';
import {
  ArtificialIntelligence01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  UserShield01Icon,
  RefreshIcon,
  AiMagicIcon,
} from '@hugeicons/core-free-icons';

export interface AIGenerationModalProps {
  isOpen: boolean;
  contextType: 'summary' | 'module' | 'entity';
  reportData?: {
    title: string;
    type: string;
    classification: string;
    legalBasis: string;
    existingContent?: string;
  };
  moduleData?: {
    type: string;
    name: string;
    entityData?: Record<string, any>;
    existingContent?: string;
  };
  entityData?: {
    data: Record<string, any>;
    existingContent?: string;
  };
  personalData?: PersonalDataToProtect;
}

const props = defineProps<AIGenerationModalProps>();
const emit = defineEmits<{
  close: [];
  generated: [text: string];
}>();

const isGenerating = ref(false);
const generatedText = ref('');
const error = ref('');
const aiStatus = ref<{ available: boolean; provider: string; model: string } | null>(null);

// Vérifier le statut de l'IA
const checkAIStatus = async () => {
  try {
    aiStatus.value = await AIGenerationService.getStatus();
    console.log('Statut IA chargé:', aiStatus.value);
  } catch (err) {
    console.error('Erreur vérification statut IA:', err);
    aiStatus.value = { available: false, provider: '', model: '' };
  }
};

// Surveiller l'ouverture de la modal pour charger le statut
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    checkAIStatus();
  }
}, { immediate: true });

const modalTitle = computed(() => {
  switch (props.contextType) {
    case 'summary':
      return 'Générer un résumé de rapport';
    case 'module':
      return 'Générer du texte pour le module';
    case 'entity':
      return 'Générer une analyse d\'entité';
    default:
      return 'Générer du texte';
  }
});

const generateText = async () => {
  if (!aiStatus.value?.available) {
    error.value = 'L\'IA n\'est pas configurée. Veuillez configurer les paramètres IA dans l\'administration.';
    return;
  }

  isGenerating.value = true;
  error.value = '';
  generatedText.value = '';

  try {
    let result;

    switch (props.contextType) {
      case 'summary':
        if (!props.reportData) {
          throw new Error('Données du rapport manquantes');
        }
        result = await AIGenerationService.generateReportSummary({
          reportTitle: props.reportData.title,
          reportType: props.reportData.type,
          classification: props.reportData.classification,
          legalBasis: props.reportData.legalBasis,
          existingContent: props.reportData.existingContent,
          personalData: props.personalData,
        });
        break;

      case 'module':
        if (!props.moduleData) {
          throw new Error('Données du module manquantes');
        }
        result = await AIGenerationService.generateModuleText({
          moduleType: props.moduleData.type,
          moduleName: props.moduleData.name,
          entityData: props.moduleData.entityData,
          existingContent: props.moduleData.existingContent,
          personalData: props.personalData,
        });
        break;

      case 'entity':
        if (!props.entityData) {
          throw new Error('Données de l\'entité manquantes');
        }
        result = await AIGenerationService.generateEntityAnalysis({
          entityData: props.entityData.data,
          existingContent: props.entityData.existingContent,
          personalData: props.personalData,
        });
        break;

      default:
        throw new Error('Type de contexte invalide');
    }

    generatedText.value = result.content;
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la génération du texte';
    console.error('Erreur génération IA:', err);
  } finally {
    isGenerating.value = false;
  }
};

const useGeneratedText = () => {
  if (generatedText.value) {
    emit('generated', generatedText.value);
    closeModal();
  }
};

const closeModal = () => {
  generatedText.value = '';
  error.value = '';
  emit('close');
};
</script>

<template>
  <dialog :open="isOpen" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-4xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <HugeiconsIcon :icon="ArtificialIntelligence01Icon" :size="24" class="text-primary" />
          {{ modalTitle }}
        </h3>
        <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost">
          <HugeiconsIcon :icon="Cancel01Icon" :size="18" />
        </button>
      </div>

      <!-- Statut IA -->
      <div v-if="aiStatus" class="alert mb-4" :class="aiStatus.available ? 'alert-info' : 'alert-warning'">
        <HugeiconsIcon :icon="aiStatus.available ? CheckmarkCircle01Icon : AlertCircleIcon" :size="20" />
        <div class="flex-1">
          <div v-if="aiStatus.available">
            <strong>IA configurée :</strong> {{ aiStatus.provider }} 
            <span class="text-sm opacity-70">({{ aiStatus.model }})</span>
          </div>
          <div v-else>
            <strong>IA non configurée</strong>
            <p class="text-sm">Veuillez configurer les paramètres IA dans l'administration.</p>
          </div>
        </div>
      </div>

      <!-- Protection des données -->
      <div class="alert alert-success mb-4">
        <HugeiconsIcon :icon="UserShield01Icon" :size="20" />
        <div class="text-sm">
          <strong>Protection RGPD active :</strong> Les données personnelles sont automatiquement anonymisées avant envoi à l'IA.
        </div>
      </div>

      <!-- Zone de génération -->
      <div v-if="!generatedText" class="space-y-4">
        <p class="text-sm text-base-content/70">
          Cliquez sur "Générer" pour créer du texte professionnel basé sur les données du rapport.
          Le texte sera généré en respectant les normes d'un rapport OSINT officiel.
        </p>

        <button
          @click="generateText"
          :disabled="isGenerating || !aiStatus?.available"
          class="btn btn-primary w-full gap-2"
        >
          <HugeiconsIcon 
            :icon="isGenerating ? RefreshIcon : AiMagicIcon" 
            :size="20" 
            :class="{ 'animate-spin': isGenerating }" 
          />
          {{ isGenerating ? 'Génération en cours...' : 'Générer le texte' }}
        </button>
      </div>

      <!-- Texte généré -->
      <div v-else class="space-y-4">
        <div class="alert alert-success">
          <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="20" />
          <span>Texte généré avec succès !</span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Texte généré</span>
            <span class="label-text-alt text-base-content/60">
              Vous pouvez copier ou utiliser ce texte
            </span>
          </label>
          <textarea
            v-model="generatedText"
            class="textarea textarea-bordered h-64 font-mono text-sm"
            readonly
          ></textarea>
        </div>

        <div class="flex gap-2 justify-end">
          <button @click="generatedText = ''" class="btn btn-ghost gap-2">
            <HugeiconsIcon :icon="RefreshIcon" :size="18" />
            Générer à nouveau
          </button>
          <button @click="useGeneratedText" class="btn btn-primary gap-2">
            <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="18" />
            Utiliser ce texte
          </button>
        </div>
      </div>

      <!-- Erreur -->
      <div v-if="error" class="alert alert-error mt-4">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="20" />
        <span>{{ error }}</span>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button @click="closeModal" class="btn btn-ghost">Annuler</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="closeModal">
      <button>close</button>
    </form>
  </dialog>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
