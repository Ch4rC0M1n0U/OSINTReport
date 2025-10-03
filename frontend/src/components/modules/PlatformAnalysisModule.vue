<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">📱 Analyse de plateformes</span>
          <span class="badge badge-neutral">{{ findings.length }}</span>
        </div>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary"
          @click="startEditing"
        >
          ✏️ Modifier
        </button>
      </div>

      <!-- Plateforme principale -->
      <div v-if="modelValue.platform" class="alert">
        <span class="font-semibold">Plateforme: {{ getPlatformLabel(modelValue.platform) }}</span>
      </div>

      <!-- Liste des findings par plateforme -->
      <div v-if="findings.length > 0" class="space-y-3">
        <div
          v-for="(finding, index) in findings"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <!-- Nom du profil -->
                <h4 class="font-bold text-lg mb-2">{{ finding.label }}</h4>

                <!-- Description -->
                <div v-if="finding.description" class="text-sm opacity-80 mb-2">
                  {{ finding.description }}
                </div>

                <!-- Métadonnées plateforme -->
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div v-if="finding.metadata?.platform">
                    <span class="opacity-70">Plateforme:</span>
                    <span class="ml-1 badge badge-primary badge-sm">
                      {{ finding.metadata.platform }}
                    </span>
                  </div>

                  <div v-if="finding.metadata?.accountStatus">
                    <span class="opacity-70">Statut:</span>
                    <span
                      class="ml-1 badge badge-sm"
                      :class="getAccountStatusClass(finding.metadata.accountStatus)"
                    >
                      {{ finding.metadata.accountStatus }}
                    </span>
                  </div>

                  <div v-if="finding.metadata?.lastActive">
                    <span class="opacity-70">Dernière activité:</span>
                    <span class="ml-1 font-medium">{{ finding.metadata.lastActive }}</span>
                  </div>

                  <div v-if="finding.metadata?.followers">
                    <span class="opacity-70">Abonnés:</span>
                    <span class="ml-1 font-medium">{{ finding.metadata.followers }}</span>
                  </div>

                  <div v-if="finding.metadata?.profileUrl" class="col-span-2">
                    <span class="opacity-70">URL:</span>
                    <a
                      :href="finding.metadata.profileUrl"
                      target="_blank"
                      class="ml-1 link link-primary text-xs"
                    >
                      {{ finding.metadata.profileUrl }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Niveau de confiance -->
              <ConfidenceBadge :level="(finding.confidence as any) || 'probable'" />
            </div>

            <!-- Sources -->
            <div v-if="finding.sources?.length" class="mt-3 pt-3 border-t border-base-300">
              <div class="text-xs opacity-70 mb-2">Sources ({{ finding.sources.length }}):</div>
              <div class="space-y-1">
                <div
                  v-for="(source, si) in finding.sources"
                  :key="si"
                  class="bg-base-100 rounded p-2 text-xs"
                >
                  <span class="badge badge-xs badge-outline mr-1">{{ source.type }}</span>
                  <span class="font-mono">{{ source.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 opacity-60">
        <div class="text-5xl mb-3">📱</div>
        <p>Aucune analyse de plateforme</p>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-ghost mt-3"
          @click="startEditing"
        >
          Ajouter une analyse
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification des analyses</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Enregistrer
          </button>
        </div>
      </div>

      <!-- Liste des findings en édition -->
      <div class="space-y-4">
        <div
          v-for="(finding, index) in editedFindings"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-2 mb-3">
              <span class="font-semibold">Analyse #{{ index + 1 }}</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-circle text-error"
                @click="removeFinding(index)"
              >
                🗑️
              </button>
            </div>

            <FindingEditor
              v-model="editedFindings[index]"
              :show-metadata="true"
              placeholder="Nom du profil / compte"
            >
              <template #metadata>
                <div class="grid grid-cols-2 gap-3">
                  <!-- Plateforme -->
                  <div class="form-control">
                    <label class="label"><span class="label-text">Plateforme</span></label>
                    <input
                      v-model="finding.metadata!.platform"
                      type="text"
                      placeholder="Facebook, Twitter..."
                      class="input input-bordered input-sm"
                    />
                  </div>

                  <!-- Statut compte -->
                  <div class="form-control">
                    <label class="label"><span class="label-text">Statut</span></label>
                    <select
                      v-model="finding.metadata!.accountStatus"
                      class="select select-bordered select-sm"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="active">✅ Actif</option>
                      <option value="inactive">💤 Inactif</option>
                      <option value="suspended">⛔ Suspendu</option>
                      <option value="deleted">🗑️ Supprimé</option>
                    </select>
                  </div>

                  <!-- Dernière activité -->
                  <div class="form-control">
                    <label class="label"><span class="label-text">Dernière activité</span></label>
                    <input
                      v-model="finding.metadata!.lastActive"
                      type="text"
                      placeholder="Ex: 2025-01-15"
                      class="input input-bordered input-sm"
                    />
                  </div>

                  <!-- Followers -->
                  <div class="form-control">
                    <label class="label"><span class="label-text">Abonnés</span></label>
                    <input
                      v-model="finding.metadata!.followers"
                      type="text"
                      placeholder="Ex: 1234"
                      class="input input-bordered input-sm"
                    />
                  </div>

                  <!-- URL profil -->
                  <div class="form-control col-span-2">
                    <label class="label"><span class="label-text">URL du profil</span></label>
                    <input
                      v-model="finding.metadata!.profileUrl"
                      type="url"
                      placeholder="https://..."
                      class="input input-bordered input-sm"
                    />
                  </div>
                </div>
              </template>
            </FindingEditor>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-block" @click="addFinding">
          + Ajouter une analyse
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PlatformAnalysisPayload, Finding } from '@/services/api/reports';
import ConfidenceBadge from './shared/ConfidenceBadge.vue';
import FindingEditor from './shared/FindingEditor.vue';

const props = withDefaults(
  defineProps<{
    modelValue: PlatformAnalysisPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlatformAnalysisPayload): void;
}>();

const isEditing = ref(false);
const findings = ref<Finding[]>(props.modelValue.findings || []);
const editedFindings = ref<Finding[]>([]);

watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue.findings || [];
  },
  { deep: true }
);

function startEditing() {
  editedFindings.value = JSON.parse(JSON.stringify(findings.value));
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editedFindings.value = [];
}

function saveChanges() {
  findings.value = editedFindings.value;
  emit('update:modelValue', {
    platform: props.modelValue.platform,
    platformUrl: props.modelValue.platformUrl,
    findings: findings.value,
    screenshots: props.modelValue.screenshots,
    notes: props.modelValue.notes
  });
  isEditing.value = false;
}

function addFinding() {
  editedFindings.value.push({
    label: '',
    description: '',
    confidence: 'probable' as any,
    sources: [],
    metadata: {
      platform: '',
      accountStatus: '',
      lastActive: '',
      followers: '',
      profileUrl: '',
    },
  });
}

function removeFinding(index: number) {
  editedFindings.value.splice(index, 1);
}

function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: '📘 Facebook',
    instagram: '📷 Instagram',
    twitter: '🐦 Twitter/X',
    linkedin: '💼 LinkedIn',
    tiktok: '🎵 TikTok',
    snapchat: '👻 Snapchat',
    telegram: '✈️ Telegram',
    whatsapp: '💬 WhatsApp',
    other: '🌐 Autre',
  };
  return labels[platform] || platform;
}

function getAccountStatusClass(status: string): string {
  const classes: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-warning',
    suspended: 'badge-error',
    deleted: 'badge-ghost',
  };
  return classes[status] || 'badge-neutral';
}
</script>

<style scoped>
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
