<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { api } from "@/services/http";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Mail01Icon,
  Add01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  AlertCircleIcon,
  WifiConnected01Icon,
  MailRemove01Icon,
  DatabaseIcon,
  ViewIcon,
  ViewOffIcon,
  Edit02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const configs = ref<SmtpConfig[]>([]);
const loading = ref(false);
const error = ref("");
const success = ref("");
const showForm = ref(false);
const editingId = ref<string | null>(null);
const testingConnection = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const form = reactive({
  host: "",
  port: 587,
  secure: true,
  username: "",
  password: "",
  fromEmail: "",
  fromName: "",
  active: true,
});

function resetForm() {
  form.host = "";
  form.port = 587;
  form.secure = true;
  form.username = "";
  form.password = "";
  form.fromEmail = "";
  form.fromName = "";
  form.active = true;
  editingId.value = null;
  showForm.value = false;
  testResult.value = null;
}

async function loadConfigs() {
  try {
    loading.value = true;
    error.value = "";
    const response = await api.get("/smtp/configs");
    configs.value = response.data.configs;
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur de chargement des configurations";
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    loading.value = true;
    error.value = "";
    success.value = "";

    if (editingId.value) {
      await api.put(`/smtp/config/${editingId.value}`, form);
      success.value = "Configuration mise à jour avec succès";
    } else {
      await api.post("/smtp/config", form);
      success.value = "Configuration créée avec succès";
    }

    await loadConfigs();
    resetForm();
  } catch (err: any) {
    error.value = err.response?.data?.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
}

function editConfig(config: SmtpConfig) {
  form.host = config.host;
  form.port = config.port;
  form.secure = config.secure;
  form.username = config.username;
  form.password = ""; // Ne pas pré-remplir le mot de passe
  form.fromEmail = config.fromEmail;
  form.fromName = config.fromName || "";
  form.active = config.active;
  editingId.value = config.id;
  showForm.value = true;
  testResult.value = null;
}

async function deleteConfig(id: string) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
    return;
  }

  try {
    loading.value = true;
    error.value = "";
    await api.delete(`/smtp/config/${id}`);
    success.value = "Configuration supprimée";
    await loadConfigs();
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur de suppression";
  } finally {
    loading.value = false;
  }
}

async function activateConfig(id: string) {
  try {
    loading.value = true;
    error.value = "";
    await api.post(`/smtp/config/${id}/activate`);
    success.value = "Configuration activée";
    await loadConfigs();
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur d'activation";
  } finally {
    loading.value = false;
  }
}

async function testConnection() {
  if (!form.host || !form.username || !form.password) {
    error.value = "Veuillez remplir tous les champs obligatoires";
    return;
  }

  try {
    testingConnection.value = true;
    error.value = "";
    
    const response = await api.post("/smtp/test", {
      host: form.host,
      port: form.port,
      secure: form.secure,
      username: form.username,
      password: form.password,
    });

    testResult.value = response.data;
  } catch (err: any) {
    testResult.value = {
      success: false,
      message: err.response?.data?.message || "Erreur lors du test",
    };
  } finally {
    testingConnection.value = false;
  }
}

onMounted(() => {
  loadConfigs();
});
</script>

<template>
  <div class="container mx-auto p-6 max-w-6xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <HugeiconsIcon :icon="Mail01Icon" :size="32" class="text-primary" />
          Configuration SMTP
        </h1>
        <p class="text-base-content/60 mt-1">
          Gérez les serveurs SMTP pour l'envoi d'emails
        </p>
      </div>
      <button 
        v-if="!showForm"
        class="btn btn-primary" 
        @click="showForm = true"
      >
        <HugeiconsIcon :icon="Add01Icon" :size="20" />
        Nouvelle configuration
      </button>
    </div>

    <!-- Alerts -->
    <div v-if="success" class="alert alert-success mb-4">
      <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="20" />
      <span>{{ success }}</span>
      <button class="btn btn-sm btn-ghost" @click="success = ''">
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" />
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">
      <HugeiconsIcon :icon="AlertCircleIcon" :size="20" />
      <span>{{ error }}</span>
      <button class="btn btn-sm btn-ghost" @click="error = ''">
        <HugeiconsIcon :icon="Cancel01Icon" :size="18" />
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-title">
            {{ editingId ? 'Modifier' : 'Nouvelle' }} configuration SMTP
          </h2>
          <button class="btn btn-ghost btn-sm" @click="resetForm">
            <HugeiconsIcon :icon="Cancel01Icon" :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Host -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Hôte SMTP *</span>
              </div>
              <input 
                v-model="form.host" 
                type="text" 
                class="input input-bordered" 
                placeholder="smtp.example.com"
                required 
              />
            </label>

            <!-- Port -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Port *</span>
              </div>
              <input 
                v-model.number="form.port" 
                type="number" 
                class="input input-bordered" 
                min="1"
                max="65535"
                required 
              />
            </label>

            <!-- Username -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Nom d'utilisateur *</span>
              </div>
              <input 
                v-model="form.username" 
                type="text" 
                class="input input-bordered" 
                required 
              />
            </label>

            <!-- Password -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Mot de passe *</span>
              </div>
              <input 
                v-model="form.password" 
                type="password" 
                class="input input-bordered" 
                :required="!editingId"
                :placeholder="editingId ? 'Laisser vide pour ne pas changer' : ''"
              />
            </label>

            <!-- From Email -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Email expéditeur *</span>
              </div>
              <input 
                v-model="form.fromEmail" 
                type="email" 
                class="input input-bordered" 
                placeholder="noreply@police.belgium.eu"
                required 
              />
            </label>

            <!-- From Name -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Nom expéditeur</span>
              </div>
              <input 
                v-model="form.fromName" 
                type="text" 
                class="input input-bordered" 
                placeholder="OSINT Report"
              />
            </label>
          </div>

          <!-- Secure -->
          <label class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input 
                v-model="form.secure" 
                type="checkbox" 
                class="checkbox checkbox-primary" 
              />
              <div>
                <span class="label-text font-medium">Connexion sécurisée (SSL/TLS)</span>
                <p class="text-sm text-base-content/60">Recommandé pour la sécurité</p>
              </div>
            </label>
          </label>

          <!-- Active -->
          <label class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input 
                v-model="form.active" 
                type="checkbox" 
                class="checkbox checkbox-primary" 
              />
              <div>
                <span class="label-text font-medium">Configuration active</span>
                <p class="text-sm text-base-content/60">
                  Activer cette configuration désactivera les autres
                </p>
              </div>
            </label>
          </label>

          <!-- Test Result -->
          <div v-if="testResult" class="alert" :class="testResult.success ? 'alert-success' : 'alert-error'">
            <HugeiconsIcon :icon="testResult.success ? CheckmarkCircle01Icon : AlertCircleIcon" :size="20" />
            <span>{{ testResult.message }}</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button 
              type="button"
              class="btn btn-outline" 
              @click="testConnection"
              :disabled="loading || testingConnection"
            >
              <span v-if="testingConnection" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="WifiConnected01Icon" :size="20" />
              Tester la connexion
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="loading || testingConnection"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="20" />
              {{ editingId ? 'Mettre à jour' : 'Créer' }}
            </button>
            <button 
              type="button" 
              class="btn btn-ghost" 
              @click="resetForm"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Configurations List -->
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">Configurations existantes</h2>

        <div v-if="loading && configs.length === 0" class="flex justify-center p-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="configs.length === 0" class="text-center p-8 text-base-content/60">
          <HugeiconsIcon :icon="MailRemove01Icon" :size="64" class="mb-4" />
          <p>Aucune configuration SMTP</p>
          <p class="text-sm">Créez-en une pour activer l'envoi d'emails</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Hôte</th>
                <th>Port</th>
                <th>Expéditeur</th>
                <th>Statut</th>
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="config in configs" :key="config.id">
                <td>
                  <div class="flex items-center gap-2">
                    <HugeiconsIcon :icon="DatabaseIcon" :size="18" class="text-base-content/40" />
                    {{ config.host }}
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <HugeiconsIcon :icon="config.secure ? ViewOffIcon : ViewIcon" :size="16" />
                    {{ config.port }}
                  </div>
                </td>
                <td>
                  <div>
                    <div class="font-medium">{{ config.fromName || 'Sans nom' }}</div>
                    <div class="text-sm text-base-content/60">{{ config.fromEmail }}</div>
                  </div>
                </td>
                <td>
                  <span 
                    class="badge" 
                    :class="config.active ? 'badge-success' : 'badge-ghost'"
                  >
                    {{ config.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">
                  {{ new Date(config.createdAt).toLocaleDateString('fr-FR') }}
                </td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      v-if="!config.active"
                      class="btn btn-sm btn-success"
                      @click="activateConfig(config.id)"
                      title="Activer"
                    >
                      <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="18" />
                    </button>
                    <button 
                      class="btn btn-sm btn-ghost"
                      @click="editConfig(config)"
                      title="Modifier"
                    >
                      <HugeiconsIcon :icon="Edit02Icon" :size="18" />
                    </button>
                    <button 
                      class="btn btn-sm btn-error btn-outline"
                      @click="deleteConfig(config.id)"
                      title="Supprimer"
                    >
                      <HugeiconsIcon :icon="Delete02Icon" :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
