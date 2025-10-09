<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Paramètres IA
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Configurez les clés API pour la génération de texte dans les rapports
      </p>
    </div>

    <!-- Alert de succès -->
    <div v-if="showSuccess" class="alert alert-success mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Paramètres IA sauvegardés avec succès !</span>
    </div>

    <!-- Alert d'erreur -->
    <div v-if="error" class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div class="grid gap-6">
      <!-- Carte principale -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">Configuration de l'IA</h2>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Activation de l'IA -->
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-semibold">Activer la génération de texte par IA</span>
                <input
                  type="checkbox"
                  v-model="formData.aiEnabled"
                  class="toggle toggle-primary"
                />
              </label>
              <label class="label">
                <span class="label-text-alt text-gray-600">
                  Permet aux utilisateurs de générer automatiquement du texte dans les rapports
                </span>
              </label>
            </div>

            <div class="divider"></div>

            <!-- Provider IA -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Fournisseur d'IA</span>
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
                <span class="label-text font-semibold">Clé API Google Gemini</span>
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
                  class="absolute right-3 top-1/2 -translate-y-1/2"
                  :disabled="!formData.aiEnabled"
                >
                  <svg v-if="!showGeminiKey" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </div>
              <label class="label">
                <span class="label-text-alt text-gray-600">
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" class="link link-primary">
                    Obtenir une clé API Gemini
                  </a>
                </span>
                <span v-if="currentSettings.hasGeminiKey" class="label-text-alt text-success">
                  ✓ Clé configurée
                </span>
              </label>
            </div>

            <!-- Clé API OpenAI -->
            <div v-if="formData.aiProvider === 'openai'" class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Clé API OpenAI</span>
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
                  class="absolute right-3 top-1/2 -translate-y-1/2"
                  :disabled="!formData.aiEnabled"
                >
                  <svg v-if="!showOpenAIKey" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </div>
              <label class="label">
                <span class="label-text-alt text-gray-600">
                  <a href="https://platform.openai.com/api-keys" target="_blank" class="link link-primary">
                    Obtenir une clé API OpenAI
                  </a>
                </span>
                <span v-if="currentSettings.hasOpenAIKey" class="label-text-alt text-success">
                  ✓ Clé configurée
                </span>
              </label>
            </div>

            <!-- Clé API Claude -->
            <div v-if="formData.aiProvider === 'claude'" class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Clé API Anthropic Claude</span>
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
                  class="absolute right-3 top-1/2 -translate-y-1/2"
                  :disabled="!formData.aiEnabled"
                >
                  <svg v-if="!showClaudeKey" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </div>
              <label class="label">
                <span class="label-text-alt text-gray-600">
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" class="link link-primary">
                    Obtenir une clé API Claude
                  </a>
                </span>
                <span v-if="currentSettings.hasClaudeKey" class="label-text-alt text-success">
                  ✓ Clé configurée
                </span>
              </label>
            </div>

            <!-- Modèle IA -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Modèle IA</span>
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
                <span v-if="formData.aiModel && availableModels.length > 0" class="label-text-alt text-gray-600">
                  {{ availableModels.find(m => m.value === formData.aiModel)?.description }}
                </span>
                <span v-else class="label-text-alt text-gray-600">
                  Choisissez le modèle d'IA à utiliser pour la génération de texte
                </span>
              </label>
            </div>

            <div class="divider"></div>

            <!-- Boutons d'action -->
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                @click="testConnection"
                class="btn btn-outline"
                :disabled="loading || !formData.aiEnabled || (!formData.geminiApiKey && !formData.openaiApiKey)"
              >
                <svg v-if="testing" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Tester la connexion
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Carte d'information -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h3 class="font-semibold mb-2">ℹ️ Information</h3>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Les clés API sont chiffrées avant d'être stockées dans la base de données</li>
            <li>Seuls les administrateurs système peuvent configurer les paramètres IA</li>
            <li>3 fournisseurs disponibles : Google Gemini, OpenAI, Anthropic Claude</li>
            <li>Google Gemini offre un quota gratuit généreux pour commencer</li>
            <li>Les utilisateurs avec la permission "Modifier les rapports" pourront utiliser l'IA</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/http';
import { AI_PROVIDERS, getModelsForProvider, DEFAULT_MODELS, type AIProvider } from '@/config/ai-models.config';

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
import { watch } from 'vue';
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
