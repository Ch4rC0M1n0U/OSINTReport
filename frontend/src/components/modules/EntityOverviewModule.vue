<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">👤 Entités identifiées</span>
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

      <!-- Liste des entités -->
      <div v-if="findings.length > 0" class="space-y-3">
        <div
          v-for="(finding, index) in findings"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <!-- Nom de l'entité -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <h4 class="font-bold text-lg">{{ finding.label }}</h4>
                
                <!-- Type d'entité -->
                <div v-if="finding.metadata?.entityType" class="mt-1">
                  <span class="badge badge-primary badge-sm">
                    {{ getEntityTypeLabel(finding.metadata.entityType) }}
                  </span>
                </div>

                <!-- Aliases -->
                <div v-if="finding.metadata?.aliases?.length" class="mt-2">
                  <div class="text-xs opacity-70 mb-1">Alias connus:</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(alias, i) in finding.metadata.aliases"
                      :key="i"
                      class="badge badge-ghost badge-sm"
                    >
                      {{ alias }}
                    </span>
                  </div>
                </div>

                <!-- Statut de vérification -->
                <div v-if="finding.metadata?.isVerified !== undefined" class="mt-2">
                  <span
                    class="badge badge-sm"
                    :class="finding.metadata.isVerified ? 'badge-success' : 'badge-warning'"
                  >
                    {{ finding.metadata.isVerified ? '✓ Vérifié' : '⚠️ À vérifier' }}
                  </span>
                </div>

                <!-- Description -->
                <div v-if="finding.description" class="mt-2 text-sm opacity-80">
                  <div class="text-xs opacity-70 mb-1">Description:</div>
                  <p class="whitespace-pre-wrap">{{ finding.description }}</p>
                </div>
              </div>

              <!-- Niveau de confiance -->
              <ConfidenceBadge :level="(finding.confidence as any) || 'medium'" />
            </div>

            <!-- Sources -->
            <div v-if="finding.sources && finding.sources.length > 0" class="mt-3 pt-3 border-t border-base-300">
              <div class="text-xs opacity-70 mb-2">Sources ({{ finding.sources.length }}):</div>
              <div class="space-y-2">
                <div
                  v-for="(source, sourceIndex) in finding.sources"
                  :key="sourceIndex"
                  class="bg-base-100 rounded p-2 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <span class="badge badge-xs badge-outline">{{ source.type }}</span>
                    <span class="font-mono text-xs">{{ source.value }}</span>
                  </div>
                  <div v-if="source.note" class="text-xs opacity-70 mt-1">{{ source.note }}</div>
                  <div v-if="source.accessedAt" class="text-xs opacity-50 mt-1">
                    {{ new Date(source.accessedAt).toLocaleDateString('fr-FR') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 opacity-60">
        <div class="text-5xl mb-3">👤</div>
        <p>Aucune entité identifiée</p>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-ghost mt-3"
          @click="startEditing"
        >
          Ajouter une entité
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification des entités</h4>
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
              <span class="font-semibold">Entité #{{ index + 1 }}</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-circle text-error"
                @click="removeFinding(index)"
                title="Supprimer cette entité"
              >
                🗑️
              </button>
            </div>

            <!-- Éditeur de finding avec métadonnées spécifiques -->
            <FindingEditor
              v-model="editedFindings[index]"
              :show-metadata="true"
              placeholder="Nom de l'entité (personne, organisation, etc.)"
            >
              <template #metadata>
                <!-- Type d'entité -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Type d'entité</span>
                  </label>
                  <select
                    v-model="finding.metadata!.entityType"
                    class="select select-bordered select-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="person">👤 Personne physique</option>
                    <option value="organization">🏢 Organisation</option>
                    <option value="company">🏭 Entreprise</option>
                    <option value="group">👥 Groupe</option>
                    <option value="alias">🎭 Pseudonyme</option>
                    <option value="other">❓ Autre</option>
                  </select>
                </div>

                <!-- Aliases -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Alias / Pseudonymes</span>
                  </label>
                  <div class="space-y-2">
                    <div
                      v-for="(alias, aliasIndex) in (finding.metadata?.aliases || [])"
                      :key="aliasIndex"
                      class="join w-full"
                    >
                      <input
                        v-model="finding.metadata!.aliases![aliasIndex]"
                        type="text"
                        placeholder="Alias / pseudonyme"
                        class="input input-bordered input-sm join-item flex-1"
                      />
                      <button
                        type="button"
                        class="btn btn-sm btn-ghost join-item"
                        @click="removeAlias(index, aliasIndex)"
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost btn-block"
                      @click="addAlias(index)"
                    >
                      + Ajouter un alias
                    </button>
                  </div>
                </div>

                <!-- Statut de vérification -->
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-3">
                    <input
                      v-model="finding.metadata!.isVerified"
                      type="checkbox"
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                    <span class="label-text">✓ Entité vérifiée</span>
                  </label>
                </div>
              </template>
            </FindingEditor>
          </div>
        </div>

        <!-- Bouton ajouter -->
        <button
          type="button"
          class="btn btn-outline btn-block"
          @click="addFinding"
        >
          + Ajouter une entité
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EntityOverviewPayload, Finding } from '@/services/api/reports';
import ConfidenceBadge from './shared/ConfidenceBadge.vue';
import FindingEditor from './shared/FindingEditor.vue';

const props = withDefaults(
  defineProps<{
    modelValue: EntityOverviewPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: EntityOverviewPayload): void;
}>();

// État
const isEditing = ref(false);
const findings = ref<Finding[]>(props.modelValue.findings || []);
const editedFindings = ref<Finding[]>([]);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue.findings || [];
  },
  { deep: true }
);

// Fonctions d'édition
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
    entityId: props.modelValue.entityId || '',
    context: props.modelValue.context || '',
    findings: findings.value
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
      entityType: '',
      aliases: [],
      isVerified: false,
    },
  });
}

function removeFinding(index: number) {
  editedFindings.value.splice(index, 1);
}

function addAlias(findingIndex: number) {
  if (!editedFindings.value[findingIndex].metadata) {
    editedFindings.value[findingIndex].metadata = {};
  }
  if (!editedFindings.value[findingIndex].metadata!.aliases) {
    editedFindings.value[findingIndex].metadata!.aliases = [];
  }
  editedFindings.value[findingIndex].metadata!.aliases!.push('');
}

function removeAlias(findingIndex: number, aliasIndex: number) {
  if (editedFindings.value[findingIndex].metadata?.aliases) {
    editedFindings.value[findingIndex].metadata!.aliases!.splice(aliasIndex, 1);
  }
}

function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    person: '👤 Personne',
    organization: '🏢 Organisation',
    company: '🏭 Entreprise',
    group: '👥 Groupe',
    alias: '🎭 Pseudonyme',
    other: '❓ Autre',
  };
  return labels[type] || type;
}
</script>

<style scoped>
/* Transitions */
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
