<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <!-- Blocs de texte enrichi -->
      <RichTextBlockList
        v-if="richTextBlocks.length > 0"
        :blocks="richTextBlocks"
        :readonly="true"
        :report-id="reportId"
        :findings="findings"
        placeholder="Ajoutez des informations sur les objectifs OSINT..."
      />
      
      <div v-if="safeObjectives.length > 0">
        <!-- Convertir le tableau en liste Markdown pour le rendu -->
        <MarkdownRenderer :content="objectivesAsMarkdown" />
      </div>
      <p v-else class="text-base-content/60 italic">Aucun objectif défini</p>

      <!-- Bouton édition -->
      <div class="flex justify-end gap-2">
        <button
          v-if="richTextBlocks.length > 0"
          @click="() => {}"
          class="btn btn-ghost btn-sm"
          disabled
        >
          {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
        </button>
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
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="addRichTextBlock"
              class="btn btn-sm btn-outline gap-2"
              title="Ajouter un bloc de texte enrichi"
            >
              <span>📝</span>
              <span>Ajouter un texte</span>
            </button>
            <button
              type="button"
              @click="addObjective"
              class="btn btn-sm btn-primary"
            >
              ➕ Ajouter un objectif
            </button>
          </div>
        </div>

        <!-- Blocs de texte enrichi en mode édition -->
        <RichTextBlockList
          v-if="richTextBlocks.length > 0"
          :blocks="richTextBlocks"
          :readonly="false"
          :report-id="reportId"
          :findings="findings"
          placeholder="Ajoutez des informations sur les objectifs OSINT... Utilisez le bouton 👤 pour insérer des entités."
          class="mb-4"
          @update="() => {}"
          @delete="deleteBlock"
          @move-up="moveBlockUp"
          @move-down="moveBlockDown"
        />

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
import { ref, computed, inject } from "vue";
import type { ObjectivesPayload, Finding } from "@/services/api/reports";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

interface Props {
  modelValue: ObjectivesPayload;
  reportId?: string;
}

interface Emits {
  (e: "update:modelValue", payload: ObjectivesPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Injecter les findings depuis le contexte du rapport
const findings = inject<Finding[]>('reportFindings', []);

const isEditing = ref(false);
const editablePayload = ref<ObjectivesPayload>({ objectives: [] });

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || []);

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
    objectives: props.modelValue?.objectives ? [...props.modelValue.objectives] : [],
    richTextBlocks: props.modelValue?.richTextBlocks || [],
  };
  if (props.modelValue?.richTextBlocks) {
    setBlocks(props.modelValue.richTextBlocks);
  }
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
  emit("update:modelValue", {
    objectives: editablePayload.value.objectives,
    richTextBlocks: richTextBlocks.value,
  });
  isEditing.value = false;
}
</script>
