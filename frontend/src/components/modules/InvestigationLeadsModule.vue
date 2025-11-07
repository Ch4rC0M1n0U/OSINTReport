<template>
  <div class="space-y-4 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <!-- Carte de contenu -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div class="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <svg class="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Pistes d'enquête</h2>
          <span class="ml-auto px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold">
            {{ leads.length }} piste{{ leads.length > 1 ? 's' : '' }}
          </span>
        </div>

        <div class="space-y-4">
          <!-- Blocs de texte enrichi -->
          <RichTextBlockList
            v-if="richTextBlocks.length > 0"
            :blocks="richTextBlocks"
            :readonly="readonly"
            :report-id="reportId"
            :findings="findings"
            placeholder="Ajoutez des informations sur les pistes d'enquête... Utilisez le bouton 👤 pour insérer des entités."
            @update="emitUpdate"
            @delete="deleteBlock"
            @move-up="moveBlockUp"
            @move-down="moveBlockDown"
          />

          <!-- Liste des pistes -->
          <div v-if="leads.length > 0" class="space-y-3">
            <div
              v-for="(lead, index) in leads"
              :key="index"
              class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 space-y-2">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-1 text-xs font-semibold rounded" :class="getPriorityClass(lead.priority)">
                      {{ getPriorityLabel(lead.priority) }}
                    </span>
                    <span class="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                      {{ getTypeLabel(lead.type) }}
                    </span>
                  </div>

                  <div v-if="lead.platform" class="text-sm">
                    <span class="font-medium text-gray-600 dark:text-gray-400">Plateforme:</span>
                    <span class="ml-2 text-gray-900 dark:text-white font-semibold">{{ lead.platform }}</span>
                  </div>

                  <div v-if="lead.legalBasis" class="text-sm">
                    <span class="font-medium text-gray-600 dark:text-gray-400">Base légale:</span>
                    <span class="ml-2 font-mono text-xs text-gray-900 dark:text-white">{{ lead.legalBasis }}</span>
                  </div>

                  <div v-if="lead.dataTargeted?.length" class="text-sm">
                    <span class="font-medium text-gray-600 dark:text-gray-400 block mb-1">Données ciblées:</span>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="(data, i) in lead.dataTargeted"
                        :key="i"
                        class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {{ data }}
                      </span>
                    </div>
                  </div>

                  <div v-if="lead.notes" class="text-sm text-gray-700 dark:text-gray-300 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    {{ lead.notes }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div v-else-if="!richTextBlocks.length" class="text-center py-8">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 italic">Aucune piste d'enquête définie</p>
          </div>
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex items-center justify-between">
        <button
          v-if="!readonly && richTextBlocks.length > 0"
          type="button"
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-not-allowed"
          disabled
        >
          {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
        </button>
        <div class="flex-1"></div>
        <button
          v-if="!readonly"
          type="button"
          @click="startEditing"
          class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification des pistes</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Enregistrer
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="(lead, index) in editedLeads"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-3">
            <div class="flex justify-between mb-2">
              <span class="font-semibold">Piste #{{ index + 1 }}</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-circle text-error"
                @click="removeLead(index)"
              >
                🗑️
              </button>
            </div>

            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <select v-model="lead.type" class="select select-bordered select-sm">
                  <option value="requisition">Réquisition</option>
                  <option value="platform_contact">Contact plateforme</option>
                  <option value="follow_up">Suivi</option>
                </select>

                <select v-model="lead.priority" class="select select-bordered select-sm">
                  <option value="">Priorité...</option>
                  <option value="low">🟢 Basse</option>
                  <option value="medium">🟡 Moyenne</option>
                  <option value="high">🔴 Haute</option>
                </select>
              </div>

              <input
                v-model="lead.platform"
                type="text"
                placeholder="Plateforme (appuyez sur Entrée pour sauvegarder)"
                class="input input-sm w-full px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
                @keyup.enter="saveChanges"
              />

              <input
                v-model="lead.legalBasis"
                type="text"
                placeholder="Base légale (appuyez sur Entrée pour sauvegarder)"
                class="input input-sm w-full px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
                @keyup.enter="saveChanges"
              />

              <!-- Données ciblées -->
              <div>
                <div class="text-xs opacity-70 mb-1">Données ciblées:</div>
                <div class="space-y-1">
                  <div
                    v-for="(data, dataIndex) in (lead.dataTargeted || [])"
                    :key="dataIndex"
                    class="join w-full"
                  >
                    <input
                      v-model="lead.dataTargeted![dataIndex]"
                      type="text"
                      placeholder="Type de donnée (Entrée pour sauvegarder)"
                      class="input input-sm join-item flex-1 px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
                      @keyup.enter="saveChanges"
                    />
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost join-item"
                      @click="removeDataTargeted(index, dataIndex)"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost btn-block"
                    @click="addDataTargeted(index)"
                  >
                    + Ajouter une donnée
                  </button>
                </div>
              </div>

              <textarea
                v-model="lead.notes"
                placeholder="Notes"
                class="textarea textarea-bordered textarea-sm w-full"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-block" @click="addLead">
          + Ajouter une piste
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import type { InvestigationLeadsPayload, InvestigationLead, Finding } from '@/services/api/reports';
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

const props = withDefaults(
  defineProps<{
    modelValue: InvestigationLeadsPayload;
    readonly?: boolean;
    reportId?: string;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: InvestigationLeadsPayload): void;
}>();

// Injecter les findings depuis le contexte du rapport
const findings = inject<Finding[]>('reportFindings', []);

const isEditing = ref(false);
const leads = ref<InvestigationLead[]>(props.modelValue.leads || []);
const editedLeads = ref<InvestigationLead[]>([]);

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || [], emitUpdate);

watch(
  () => props.modelValue,
  (newValue) => {
    leads.value = newValue.leads || [];
    if (newValue.richTextBlocks) {
      setBlocks(newValue.richTextBlocks);
    }
  },
  { deep: true }
);

function emitUpdate() {
  emit('update:modelValue', {
    leads: leads.value,
    richTextBlocks: richTextBlocks.value,
  });
}

function startEditing() {
  editedLeads.value = JSON.parse(JSON.stringify(leads.value));
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editedLeads.value = [];
}

function saveChanges() {
  leads.value = editedLeads.value;
  emit('update:modelValue', {
    leads: leads.value,
    richTextBlocks: richTextBlocks.value,
  });
  isEditing.value = false;
}

function addLead() {
  editedLeads.value.push({
    type: 'requisition',
    platform: '',
    legalBasis: '',
    dataTargeted: [],
    priority: 'medium',
    notes: '',
  });
}

function removeLead(index: number) {
  editedLeads.value.splice(index, 1);
}

function addDataTargeted(leadIndex: number) {
  if (!editedLeads.value[leadIndex].dataTargeted) {
    editedLeads.value[leadIndex].dataTargeted = [];
  }
  editedLeads.value[leadIndex].dataTargeted!.push('');
}

function removeDataTargeted(leadIndex: number, dataIndex: number) {
  editedLeads.value[leadIndex].dataTargeted!.splice(dataIndex, 1);
}

function getPriorityLabel(priority?: string): string {
  const labels: Record<string, string> = {
    low: '🟢 Basse',
    medium: '🟡 Moyenne',
    high: '🔴 Haute',
  };
  return priority ? labels[priority] || priority : 'Non définie';
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    requisition: 'Réquisition',
    platform_contact: 'Contact plateforme',
    follow_up: 'Suivi',
  };
  return labels[type] || type;
}

function getPriorityClass(priority?: string): string {
  const classes: Record<string, string> = {
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-error',
  };
  return priority ? classes[priority] || 'badge-neutral' : 'badge-neutral';
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
