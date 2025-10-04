/**
 * 👤 Entity Overview Module - Version optimisée avec Modal CRUD
 * 
 * Fonctionnalités:
 * - Modal pour création/édition (évite les modifications accidentelles)
 * - Validation d'unicité (pas de doublons)
 * - Confirmation avant suppression
 * - Metadata: entityType, aliases, isVerified
 */
<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div class="space-y-3">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold text-gray-900 dark:text-white">👤 Entités identifiées</span>
          <span class="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
            {{ findings.length }}
          </span>
        </div>
        <button
          type="button"
          @click="openCreateModal"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          ➕ Ajouter une entité
        </button>
      </div>

      <!-- Liste des entités -->
      <div v-if="findings.length > 0" class="space-y-3">
        <div
          v-for="(finding, index) in findings"
          :key="index"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="p-4">
            <!-- Header avec nom et actions -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-lg text-gray-900 dark:text-white">{{ finding.label }}</h4>
                  
                  <!-- Type d'entité -->
                  <span v-if="finding.metadata?.entityType" class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {{ getEntityTypeLabel(finding.metadata.entityType) }}
                  </span>
                  
                  <!-- Statut de vérification -->
                  <span
                    v-if="finding.metadata?.isVerified !== undefined"
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="finding.metadata.isVerified 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'"
                  >
                    {{ finding.metadata.isVerified ? '✓ Vérifié' : '⚠️ À vérifier' }}
                  </span>
                </div>

                <!-- Aliases -->
                <div v-if="finding.metadata?.aliases?.length" class="mt-2">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Alias connus:</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(alias, i) in finding.metadata.aliases"
                      :key="i"
                      class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {{ alias }}
                    </span>
                  </div>
                </div>

                <!-- Description -->
                <div v-if="finding.description" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <p class="whitespace-pre-wrap">{{ finding.description }}</p>
                </div>
              </div>

              <!-- Actions et confiance -->
              <div class="flex flex-col items-end gap-2">
                <ConfidenceBadge :level="(finding.confidence as any) || 'medium'" />
                
                <div class="flex gap-1">
                  <button
                    @click="openEditModal(finding, index)"
                    class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    @click="confirmDelete(finding, index)"
                    class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <!-- Sources -->
            <div v-if="finding.sources && finding.sources.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">Sources ({{ finding.sources.length }}):</div>
              <div class="space-y-2">
                <div
                  v-for="(source, sourceIndex) in finding.sources"
                  :key="sourceIndex"
                  class="bg-gray-50 dark:bg-gray-900/50 rounded p-2 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded">
                      {{ source.type }}
                    </span>
                    <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ source.value }}</span>
                  </div>
                  <div v-if="source.note" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ source.note }}</div>
                  <div v-if="source.accessedAt" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ new Date(source.accessedAt).toLocaleDateString('fr-FR') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div class="text-5xl mb-3">👤</div>
        <p class="text-gray-600 dark:text-gray-400">Aucune entité identifiée</p>
        <button
          type="button"
          @click="openCreateModal"
          class="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          Ajouter une entité
        </button>
      </div>
    </div>

    <!-- Modal Création/Édition -->
    <FindingModal
      :is-open="modalState.isOpen"
      :mode="modalState.mode"
      create-title="➕ Ajouter une entité"
      edit-title="✏️ Modifier l'entité"
      :can-save="!validation.errors.value.label?.length && !validation.errors.value.sources?.length"
      @close="closeModal"
      @save="saveModal"
    >
      <template #content>
        <!-- Formulaire finding de base -->
        <FindingEditor
          v-model="editedFinding"
          label-placeholder="Nom complet de l'entité (ex: John DOE)"
          description-placeholder="Détails supplémentaires sur l'entité..."
        />

        <!-- Métadonnées spécifiques EntityOverview -->
        <div class="mt-6 space-y-4">
          <h4 class="font-semibold text-gray-900 dark:text-white">Informations complémentaires</h4>

          <!-- Type d'entité -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type d'entité
            </label>
            <select
              v-model="editedFinding.metadata!.entityType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="person">👤 Personne</option>
              <option value="organization">🏢 Organisation</option>
              <option value="company">🏭 Entreprise</option>
              <option value="group">👥 Groupe</option>
              <option value="alias">🎭 Alias</option>
            </select>
          </div>

          <!-- Aliases -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alias / Noms alternatifs
            </label>
            <div class="space-y-2">
              <div
                v-for="(alias, index) in editedFinding.metadata!.aliases"
                :key="index"
                class="flex gap-2"
              >
                <input
                  v-model="editedFinding.metadata!.aliases![index]"
                  type="text"
                  placeholder="Ex: Johnny, J. DOE..."
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  @click="removeAlias(index)"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  🗑️
                </button>
              </div>
              <button
                @click="addAlias"
                class="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                ➕ Ajouter un alias
              </button>
            </div>
          </div>

          <!-- Vérification -->
          <div class="flex items-center gap-3">
            <input
              v-model="editedFinding.metadata!.isVerified"
              type="checkbox"
              id="isVerified"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="isVerified" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              ✓ Entité vérifiée et confirmée
            </label>
          </div>
        </div>

        <!-- Erreurs de validation -->
        <div v-if="validationErrors.length > 0" class="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div class="text-sm font-medium text-red-800 dark:text-red-300 mb-1">⚠️ Erreurs de validation:</div>
          <ul class="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
            <li v-for="(error, idx) in validationErrors" :key="idx">{{ error }}</li>
          </ul>
        </div>
      </template>
    </FindingModal>

    <!-- Modal Confirmation Suppression -->
    <ConfirmDeleteModal
      :is-open="deleteConfirm.isOpen"
      title="Supprimer cette entité ?"
      message="Êtes-vous sûr de vouloir supprimer cette entité ?"
      :item-label="deleteConfirm.item?.label"
      @confirm="handleDelete"
      @cancel="deleteConfirm.isOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import type { Finding, EntityOverviewPayload } from "@/services/api/reports";
import FindingModal from "@/components/shared/FindingModal.vue";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal.vue";
import FindingEditor from "@/components/shared/FindingEditor.vue";
import ConfidenceBadge from "@/components/shared/ConfidenceBadge.vue";
import { useValidation, commonRules } from "@/composables/useValidation";

interface Props {
  modelValue: EntityOverviewPayload;
}

interface Emits {
  (e: "update:modelValue", payload: EntityOverviewPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const findings = computed(() => props.modelValue?.findings || []);

// État du modal
const modalState = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  editIndex: -1
});

// Finding en cours d'édition
const editedFinding = ref<Finding>({
  label: '',
  description: '',
  confidence: 'probable' as any,
  sources: [],
  metadata: {
    entityType: 'person',
    aliases: [],
    isVerified: false
  }
});

// Validation
const validation = useValidation(editedFinding, {
  rules: {
    label: [
      commonRules.required('Le nom de l\'entité est requis'),
      commonRules.minLength(2, 'Le nom doit contenir au moins 2 caractères'),
      commonRules.unique(
        findings.value.filter((_, idx) => idx !== modalState.editIndex),
        (a, b) => a.label.toLowerCase() === b.label.toLowerCase(),
        'Cette entité existe déjà'
      )
    ],
    sources: [
      commonRules.minLength(1, 'Au moins une source est requise')
    ]
  }
});

// Erreurs de validation formatées
const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (validation.errors.value.label) {
    errors.push(...validation.errors.value.label);
  }
  
  if (validation.errors.value.sources) {
    errors.push(...validation.errors.value.sources);
  }
  
  return errors;
});

// État de confirmation suppression
const deleteConfirm = reactive({
  isOpen: false,
  item: null as Finding | null,
  index: -1
});

// Ouvrir modal création
function openCreateModal() {
  modalState.mode = 'create';
  modalState.editIndex = -1;
  
  editedFinding.value = {
    label: '',
    description: '',
    confidence: 'probable' as any,
    sources: [],
    metadata: {
      entityType: 'person',
      aliases: [],
      isVerified: false
    }
  };
  
  validation.reset();
  modalState.isOpen = true;
}

// Ouvrir modal édition
function openEditModal(finding: Finding, index: number) {
  modalState.mode = 'edit';
  modalState.editIndex = index;
  
  // Deep copy
  editedFinding.value = JSON.parse(JSON.stringify(finding));
  
  // S'assurer que metadata existe
  if (!editedFinding.value.metadata) {
    editedFinding.value.metadata = {};
  }
  if (!editedFinding.value.metadata.aliases) {
    editedFinding.value.metadata.aliases = [];
  }
  
  validation.reset();
  modalState.isOpen = true;
}

// Fermer modal
function closeModal() {
  modalState.isOpen = false;
}

// Sauvegarder modal
function saveModal() {
  // Valider
  if (!validation.validate()) {
    return;
  }
  
  const newFindings = [...findings.value];
  
  if (modalState.mode === 'create') {
    newFindings.push({ ...editedFinding.value });
  } else {
    newFindings[modalState.editIndex] = { ...editedFinding.value };
  }
  
  // Inclure entityId et context depuis props
  emit('update:modelValue', {
    entityId: props.modelValue.entityId || '',
    context: props.modelValue.context || '',
    findings: newFindings
  });
  closeModal();
}

// Gestion des aliases
function addAlias() {
  if (!editedFinding.value.metadata) {
    editedFinding.value.metadata = {};
  }
  if (!editedFinding.value.metadata.aliases) {
    editedFinding.value.metadata.aliases = [];
  }
  editedFinding.value.metadata.aliases.push('');
}

function removeAlias(index: number) {
  editedFinding.value.metadata?.aliases?.splice(index, 1);
}

// Confirmation suppression
function confirmDelete(finding: Finding, index: number) {
  deleteConfirm.item = finding;
  deleteConfirm.index = index;
  deleteConfirm.isOpen = true;
}

// Supprimer
function handleDelete() {
  const newFindings = findings.value.filter((_, idx) => idx !== deleteConfirm.index);
  
  // Inclure entityId et context depuis props
  emit('update:modelValue', {
    entityId: props.modelValue.entityId || '',
    context: props.modelValue.context || '',
    findings: newFindings
  });
  
  deleteConfirm.isOpen = false;
  deleteConfirm.item = null;
  deleteConfirm.index = -1;
}

// Labels pour entity types
function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    person: 'Personne',
    organization: 'Organisation',
    company: 'Entreprise',
    group: 'Groupe',
    alias: 'Alias'
  };
  return labels[type] || type;
}
</script>
