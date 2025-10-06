<template>
  <div class="space-y-6">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <div v-if="safeObjectives.length > 0">
        <!-- Convertir le tableau en liste Markdown pour le rendu -->
        <MarkdownRenderer :content="objectivesAsMarkdown" />
      </div>
      <p v-else class="text-base-content/60 italic">Aucun objectif défini</p>

      <!-- Bouton édition -->
      <div class="flex justify-end">
        <button
          @click="startEditing"
          class="btn btn-primary"
        >
          ✏️ Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-6">
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">
            🎯 Objectifs OSINT
          </h3>
          <button
            type="button"
            @click="addObjective"
            class="btn btn-sm btn-primary"
          >
            ➕ Ajouter un objectif
          </button>
        </div>

        <div v-if="editablePayload.objectives.length === 0" class="text-sm text-base-content/60 italic">
          Aucun objectif
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(objective, index) in editablePayload.objectives"
            :key="index"
            class="join w-full"
          >
            <input
              v-model="editablePayload.objectives[index]"
              type="text"
              placeholder="Ex: Identifier les profils sur les réseaux sociaux"
              class="input input-sm join-item flex-1 px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
              @keyup.enter="addObjective"
            />
            <button
              type="button"
              @click="removeObjective(index)"
              class="btn btn-sm btn-error join-item"
            >
              ✕
            </button>
          </div>
        </div>
      </section>

      <!-- Boutons actions -->
      <div class="flex justify-end gap-3">
        <button
          @click="cancelEditing"
          class="btn btn-ghost"
        >
          Annuler
        </button>
        <button
          @click="saveChanges"
          class="btn btn-success"
        >
          💾 Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ObjectivesPayload } from "@/services/api/reports";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";

interface Props {
  modelValue: ObjectivesPayload;
}

interface Emits {
  (e: "update:modelValue", payload: ObjectivesPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(false);
const editablePayload = ref<ObjectivesPayload>({ objectives: [] });

// Computed pour gérer le payload vide ou undefined
const safeObjectives = computed(() => {
  return props.modelValue?.objectives || [];
});

// Convertir les objectifs en liste Markdown pour le rendu
const objectivesAsMarkdown = computed(() => {
  return safeObjectives.value.map(obj => `- ${obj}`).join('\n');
});

function startEditing() {
  editablePayload.value = {
    objectives: props.modelValue?.objectives ? [...props.modelValue.objectives] : []
  };
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

function addObjective() {
  editablePayload.value.objectives.push("");
}

function removeObjective(index: number) {
  editablePayload.value.objectives.splice(index, 1);
}

async function saveChanges() {
  emit("update:modelValue", editablePayload.value);
  isEditing.value = false;
}
</script>
