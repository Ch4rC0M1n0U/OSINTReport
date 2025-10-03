<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">🔎 Pistes d'enquête</span>
          <span class="badge badge-neutral">{{ leads.length }}</span>
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

      <!-- Liste des pistes -->
      <div v-if="leads.length > 0" class="space-y-3">
        <div
          v-for="(lead, index) in leads"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge badge-sm" :class="getPriorityClass(lead.priority)">
                    {{ getPriorityLabel(lead.priority) }}
                  </span>
                  <span class="badge badge-outline badge-sm">{{ lead.type }}</span>
                </div>

                <div v-if="lead.platform" class="text-sm mb-1">
                  <span class="opacity-70">Plateforme:</span>
                  <span class="ml-1 font-medium">{{ lead.platform }}</span>
                </div>

                <div v-if="lead.legalBasis" class="text-sm mb-1">
                  <span class="opacity-70">Base légale:</span>
                  <span class="ml-1 font-mono text-xs">{{ lead.legalBasis }}</span>
                </div>

                <div v-if="lead.dataTargeted?.length" class="text-sm mb-1">
                  <span class="opacity-70">Données ciblées:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="(data, i) in lead.dataTargeted"
                      :key="i"
                      class="badge badge-ghost badge-xs"
                    >
                      {{ data }}
                    </span>
                  </div>
                </div>

                <div v-if="lead.notes" class="text-sm opacity-80 mt-2">
                  {{ lead.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 opacity-60">
        <div class="text-5xl mb-3">🔎</div>
        <p>Aucune piste d'enquête</p>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-ghost mt-3"
          @click="startEditing"
        >
          Ajouter une piste
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
                placeholder="Plateforme"
                class="input input-bordered input-sm w-full"
              />

              <input
                v-model="lead.legalBasis"
                type="text"
                placeholder="Base légale"
                class="input input-bordered input-sm w-full"
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
                      placeholder="Type de donnée"
                      class="input input-bordered input-sm join-item flex-1"
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
import { ref, watch } from 'vue';
import type { InvestigationLeadsPayload, InvestigationLead } from '@/services/api/reports';

const props = withDefaults(
  defineProps<{
    modelValue: InvestigationLeadsPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: InvestigationLeadsPayload): void;
}>();

const isEditing = ref(false);
const leads = ref<InvestigationLead[]>(props.modelValue.leads || []);
const editedLeads = ref<InvestigationLead[]>([]);

watch(
  () => props.modelValue,
  (newValue) => {
    leads.value = newValue.leads || [];
  },
  { deep: true }
);

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
    leads: leads.value
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
