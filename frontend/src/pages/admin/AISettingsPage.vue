<template>
  <section class="space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="ArtificialIntelligence01Icon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Paramètres IA</h1>
          <p class="text-base-content/70 mt-1">
            Configurez les clés API pour la génération de texte dans les rapports
          </p>
        </div>
      </div>
    </header>

    <!-- Alert de succès -->
    <div v-if="showSuccess" class="bg-base-200 border-l-4 border-success p-5">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="24" class="text-success" />
        <span class="font-medium">Paramètres IA sauvegardés avec succès !</span>
      </div>
    </div>

    <!-- Alert d'erreur -->
    <div v-if="error" class="bg-base-200 border-l-4 border-error p-5">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-error" />
        <span class="font-medium">{{ error }}</span>
      </div>
    </div>

    <!-- Configuration principale -->
    <div class="bg-base-200 border-l-4 border-accent">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="Settings02Icon" :size="24" class="text-accent" />
          <h2 class="text-xl font-semibold">Configuration de l'IA</h2>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Activation de l'IA -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              v-model="formData.aiEnabled"
              class="toggle toggle-primary"
            />
            <div>
              <span class="label-text font-semibold block">Activer la génération de texte par IA</span>
              <span class="label-text-alt text-base-content/60 block mt-1">
                Permet aux utilisateurs de générer automatiquement du texte dans les rapports
              </span>
            </div>
          </label>
        </div>

        <div class="divider"></div>

        <!-- Provider IA -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Fournisseur d'IA</span>
          </label>
          <select
            v-model="formData.aiProvider"
            class="select select-bordered w-full"
            :disabled="!formData.aiEnabled"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Anthropic Claude</option>
          </select>
        </div>

        <!-- Clé API Gemini -->
        <div v-if="formData.aiProvider === 'gemini'" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Clé API Google Gemini</span>
          </label>
          <div class="relative">
            <input
              :type="showGeminiKey ? 'text' : 'password'"
              v-model="formData.geminiApiKey"
              placeholder="Entrez votre clé API Gemini"
              class="input input-bordered w-full pr-10"
              :disabled="!formData.aiEnabled"
            />
            <button
              type="button"
              @click="showGeminiKey = !showGeminiKey"
              class="absolute right-3 top-1/2 -translate-y-1/2 hover:text-primary"
              :disabled="!formData.aiEnabled"
            >
              <HugeiconsIcon :icon="showGeminiKey ? ViewOffIcon : ViewIcon" :size="20" />
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              <a href="https://makersuite.google.com/app/apikey" target="_blank" class="link link-primary">
                Obtenir une clé API Gemini
              </a>
            </span>
            <span v-if="currentSettings.hasGeminiKey" class="label-text-alt text-success flex items-center gap-1">
              <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="16" />
              Clé configurée
            </span>
          </label>
        </div>

        <!-- Clé API OpenAI -->
        <div v-if="formData.aiProvider === 'openai'" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Clé API OpenAI</span>
          </label>
          <div class="relative">
            <input
              :type="showOpenAIKey ? 'text' : 'password'"
              v-model="formData.openaiApiKey"
              placeholder="Entrez votre clé API OpenAI"
              class="input input-bordered w-full pr-10"
              :disabled="!formData.aiEnabled"
            />
            <button
              type="button"
              @click="showOpenAIKey = !showOpenAIKey"
              class="absolute right-3 top-1/2 -translate-y-1/2 hover:text-primary"
              :disabled="!formData.aiEnabled"
            >
              <HugeiconsIcon :icon="showOpenAIKey ? ViewOffIcon : ViewIcon" :size="20" />
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              <a href="https://platform.openai.com/api-keys" target="_blank" class="link link-primary">
                Obtenir une clé API OpenAI
              </a>
            </span>
            <span v-if="currentSettings.hasOpenAIKey" class="label-text-alt text-success flex items-center gap-1">
              <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="16" />
              Clé configurée
            </span>
          </label>
        </div>

        <!-- Clé API Claude -->
        <div v-if="formData.aiProvider === 'claude'" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Clé API Anthropic Claude</span>
          </label>
          <div class="relative">
            <input
              :type="showClaudeKey ? 'text' : 'password'"
              v-model="formData.claudeApiKey"
              placeholder="Entrez votre clé API Claude"
              class="input input-bordered w-full pr-10"
              :disabled="!formData.aiEnabled"
            />
            <button
              type="button"
              @click="showClaudeKey = !showClaudeKey"
              class="absolute right-3 top-1/2 -translate-y-1/2 hover:text-primary"
              :disabled="!formData.aiEnabled"
            >
              <HugeiconsIcon :icon="showClaudeKey ? ViewOffIcon : ViewIcon" :size="20" />
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              <a href="https://console.anthropic.com/settings/keys" target="_blank" class="link link-primary">
                Obtenir une clé API Claude
              </a>
            </span>
            <span v-if="currentSettings.hasClaudeKey" class="label-text-alt text-success flex items-center gap-1">
              <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="16" />
              Clé configurée
            </span>
          </label>
        </div>

        <!-- Modèle IA -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Modèle IA</span>
          </label>
          <select
            v-model="formData.aiModel"
            class="select select-bordered w-full"
            :disabled="!formData.aiEnabled"
          >
            <option 
              v-for="model in availableModels" 
              :key="model.value" 
              :value="model.value"
            >
              {{ model.label }}
            </option>
          </select>
          <label class="label">
            <span v-if="formData.aiModel && availableModels.length > 0" class="label-text-alt text-base-content/60">
              {{ availableModels.find(m => m.value === formData.aiModel)?.description }}
            </span>
            <span v-else class="label-text-alt text-base-content/60">
              Choisissez le modèle d'IA à utiliser pour la génération de texte
            </span>
          </label>
        </div>

        <div class="divider"></div>

        <!-- Boutons d'action -->
        <div class="flex gap-3 justify-end pt-4">
          <button
            type="button"
            @click="testConnection"
            class="btn btn-outline gap-2"
            :disabled="loading || !formData.aiEnabled || (!formData.geminiApiKey && !formData.openaiApiKey && !formData.claudeApiKey)"
          >
            <span v-if="testing" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="18" />
            Tester la connexion
          </button>
          <button
            type="submit"
            class="btn btn-primary gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="18" />
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Carte d'information -->
    <div class="bg-base-200 border-l-4 border-info">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="InformationCircleIcon" :size="24" class="text-info" />
          <h2 class="text-xl font-semibold">Informations</h2>
        </div>
      </div>
      <div class="p-6">
        <ul class="space-y-2 text-sm text-base-content/70">
          <li class="flex items-start gap-2">
            <span class="text-info mt-1">•</span>
            <span>Les clés API sont chiffrées avant d'être stockées dans la base de données</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-info mt-1">•</span>
            <span>Seuls les administrateurs système peuvent configurer les paramètres IA</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-info mt-1">•</span>
            <span>3 fournisseurs disponibles : Google Gemini, OpenAI, Anthropic Claude</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-info mt-1">•</span>
            <span>Google Gemini offre un quota gratuit généreux pour commencer</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-info mt-1">•</span>
            <span>Les utilisateurs avec la permission "Modifier les rapports" pourront utiliser l'IA</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/http';
import { AI_PROVIDERS, getModelsForProvider, DEFAULT_MODELS, type AIProvider } from '@/config/ai-models.config';
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  ArtificialIntelligence01Icon,
  Settings02Icon,
  Key01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";

interface AISettings {
  aiEnabled: boolean;
  aiProvider: 'gemini' | 'openai' | 'claude';
  aiModel: string;
  geminiApiKey: string | null;
  openaiApiKey: string | null;
  claudeApiKey: string | null;
}

interface CurrentSettings {
  aiEnabled: boolean;
  aiProvider: string | null;
  aiModel: string | null;
  hasGeminiKey: boolean;
  hasOpenAIKey: boolean;
  hasClaudeKey: boolean;
}

const loading = ref(false);
const testing = ref(false);
const error = ref('');
const showSuccess = ref(false);
const showGeminiKey = ref(false);
const showOpenAIKey = ref(false);
const showClaudeKey = ref(false);

const formData = ref<AISettings>({
  aiEnabled: false,
  aiProvider: 'gemini',
  aiModel: 'gemini-1.5-flash',
  geminiApiKey: null,
  openaiApiKey: null,
  claudeApiKey: null,
});

const currentSettings = ref<CurrentSettings>({
  aiEnabled: false,
  aiProvider: null,
  aiModel: null,
  hasGeminiKey: false,
  hasOpenAIKey: false,
  hasClaudeKey: false,
});

// Computed: Liste des modèles disponibles selon le provider sélectionné
const availableModels = computed(() => {
  return getModelsForProvider(formData.value.aiProvider);
});

// Computed: Informations du provider actuel
const currentProviderInfo = computed(() => {
  return AI_PROVIDERS[formData.value.aiProvider];
});

// Watcher: Changer le modèle par défaut quand on change de provider
watch(() => formData.value.aiProvider, (newProvider) => {
  if (DEFAULT_MODELS[newProvider]) {
    formData.value.aiModel = DEFAULT_MODELS[newProvider];
  }
});

async function loadSettings() {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get('/settings/ai/status');
    
    if (response.data.success) {
      const data = response.data.data;
      currentSettings.value = data;
      
      formData.value.aiEnabled = data.aiEnabled || false;
      formData.value.aiProvider = data.aiProvider || 'gemini';
      formData.value.aiModel = data.aiModel || DEFAULT_MODELS[data.aiProvider || 'gemini'];
      
      // Ne pas charger les vraies clés, elles sont chiffrées
      formData.value.geminiApiKey = null;
      formData.value.openaiApiKey = null;
      formData.value.claudeApiKey = null;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement des paramètres';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    loading.value = true;
    error.value = '';
    showSuccess.value = false;

    // Ne pas envoyer les clés si elles sont vides
    const dataToSend: any = {
      aiEnabled: formData.value.aiEnabled,
      aiProvider: formData.value.aiProvider,
      aiModel: formData.value.aiModel,
    };

    if (formData.value.geminiApiKey) {
      dataToSend.geminiApiKey = formData.value.geminiApiKey;
    }

    if (formData.value.openaiApiKey) {
      dataToSend.openaiApiKey = formData.value.openaiApiKey;
    }

    if (formData.value.claudeApiKey) {
      dataToSend.claudeApiKey = formData.value.claudeApiKey;
    }

    const response = await api.put('/settings/ai', dataToSend);

    if (response.data.success) {
      showSuccess.value = true;
      
      // Recharger les paramètres
      await loadSettings();
      
      // Effacer les champs de clés
      formData.value.geminiApiKey = null;
      formData.value.openaiApiKey = null;
      formData.value.claudeApiKey = null;
      
      setTimeout(() => {
        showSuccess.value = false;
      }, 5000);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde des paramètres';
  } finally {
    loading.value = false;
  }
}

async function testConnection() {
  try {
    testing.value = true;
    error.value = '';

    const response = await api.post('/settings/ai/test', {
      provider: formData.value.aiProvider
    });

    if (response.data.success) {
      alert(`✅ ${response.data.message}`);
    } else {
      alert(`❌ ${response.data.message}`);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors du test de connexion';
  } finally {
    testing.value = false;
  }
}

onMounted(() => {
  loadSettings();
});
</script>
