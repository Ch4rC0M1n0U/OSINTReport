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
        placeholder="Informations complémentaires..."
        class="mb-4"
      />
      
      <!-- Résumé global -->
      <section v-if="safePayload.summary" class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-lg">📊 Résumé global des recherches</h3>
          <div class="prose max-w-none">
            <MarkdownRenderer :content="safePayload.summary" />
          </div>
        </div>
      </section>

      <!-- Méthodologie -->
      <section v-if="safePayload.methodology" class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-lg">🔬 Méthodologie</h3>
          <div class="prose max-w-none">
            <MarkdownRenderer :content="safePayload.methodology" />
          </div>
        </div>
      </section>

      <!-- Éléments non trouvés -->
      <section v-if="safePayload.notFound && safePayload.notFound.length > 0" class="card bg-warning/10 border border-warning/30 shadow">
        <div class="card-body">
          <h3 class="card-title text-lg">⚠️ Éléments non trouvés</h3>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li v-for="(item, index) in safePayload.notFound" :key="index" class="text-base-content/80">
              {{ item }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Notes -->
      <section v-if="safePayload.notes" class="card bg-info/10 border border-info/30 shadow">
        <div class="card-body">
          <h3 class="card-title text-lg">📝 Notes complémentaires</h3>
          <div class="prose max-w-none">
            <MarkdownRenderer :content="safePayload.notes" />
          </div>
        </div>
      </section>

      <!-- Message si vide -->
      <div v-if="!richTextBlocks.length && !safePayload.summary && !safePayload.methodology && (!safePayload.notFound || safePayload.notFound.length === 0) && !safePayload.notes" class="text-center py-8 text-base-content/60 italic">
        Aucun contenu pour ce module
      </div>

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
        <button @click="startEditing" class="btn btn-primary">
          ✏️ Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition avec auto-save -->
    <div v-else class="space-y-6">
      <!-- Bouton ajouter texte -->
      <div class="flex justify-end">
        <button
          type="button"
          @click="addRichTextBlock"
          class="btn btn-sm btn-outline gap-2"
        >
          <span>📝</span>
          <span>Ajouter un bloc de texte</span>
        </button>
      </div>

      <!-- Blocs de texte enrichi -->
      <RichTextBlockList
        v-if="richTextBlocks.length > 0"
        :blocks="richTextBlocks"
        :readonly="false"
        :report-id="reportId"
        :findings="findings"
        placeholder="Ajoutez des informations complémentaires... Utilisez le bouton 👤 pour insérer des entités."
        class="mb-4"
        @update="() => {}"
        @delete="deleteBlock"
        @move-up="moveBlockUp"
        @move-down="moveBlockDown"
      />
      
      <!-- Résumé global -->
      <section class="form-control">
        <label class="label">
          <span class="label-text font-semibold text-base">📊 Résumé global des recherches</span>
        </label>
        <WysiwygEditor
          v-model="editablePayload.summary"
          placeholder="Décrivez les résultats globaux des recherches effectuées... Utilisez le bouton 👤 pour insérer des entités."
          :enable-entity-insertion="true"
          :report-id="report?.id"
        />
        <label class="label">
          <span class="label-text-alt">Synthèse des informations trouvées (sauvegardera au clic sur "Enregistrer")</span>
        </label>
      </section>

      <!-- Méthodologie -->
      <section class="form-control">
        <label class="label">
          <span class="label-text font-semibold text-base">🔬 Méthodologie (optionnel)</span>
        </label>
        <WysiwygEditor
          v-model="methodologyModel"
          placeholder="Décrivez les méthodes et outils utilisés pour les recherches... Utilisez le bouton 👤 pour insérer des entités."
          :enable-entity-insertion="true"
          :report-id="report?.id"
        />
        <label class="label">
          <span class="label-text-alt">Sources, outils, techniques utilisés</span>
        </label>
      </section>

      <!-- Éléments non trouvés -->
      <section class="form-control">
        <label class="label">
          <span class="label-text font-semibold text-base">⚠️ Éléments non trouvés</span>
        </label>
        
        <!-- Liste des éléments -->
        <div v-if="editablePayload.notFound.length > 0" class="space-y-2 mb-2">
          <div
            v-for="(item, index) in editablePayload.notFound"
            :key="index"
            class="join w-full"
          >
            <input
              v-model="editablePayload.notFound[index]"
              type="text"
              class="input input-sm join-item flex-1 px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
              placeholder="Élément non trouvé..."
              @keyup.enter="addNotFound"
            />
            <button
              type="button"
              class="btn btn-sm btn-error join-item"
              @click="removeNotFound(index)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Bouton ajouter -->
        <button
          type="button"
          class="btn btn-sm btn-outline w-full"
          @click="addNotFound"
        >
          + Ajouter un élément non trouvé
        </button>
        <label class="label">
          <span class="label-text-alt">Informations recherchées mais non localisées</span>
        </label>
      </section>

      <!-- Notes complémentaires -->
      <section class="form-control">
        <label class="label">
          <span class="label-text font-semibold text-base">📝 Notes complémentaires (optionnel)</span>
        </label>
        <WysiwygEditor
          v-model="notesModel"
          placeholder="Ajoutez des notes, remarques ou observations supplémentaires... Utilisez le bouton 👤 pour insérer des entités."
          :enable-entity-insertion="true"
          :report-id="report?.id"
        />
        <label class="label">
          <span class="label-text-alt">Informations additionnelles</span>
        </label>
      </section>

      <!-- Bouton terminer -->
      <div class="flex justify-end gap-2">
        <button @click="isEditing = false" class="btn btn-ghost">
          ✕ Annuler
        </button>
        <button @click="finishEditing" class="btn btn-success">
          💾 Enregistrer les modifications
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from "vue";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";
import RichTextBlockList from "@/components/shared/RichTextBlockList.vue";
import type { Report } from "@/services/api/reports";
import { useRichTextBlocks } from "@/composables/useRichTextBlocks";
import type { Finding } from "@/services/api/findings";

interface RichTextBlock {
  id: string;
  title: string;
  content: string;
}

interface ResearchSummaryPayload {
  summary: string;
  notFound: string[];
  methodology?: string;
  notes?: string;
  richTextBlocks?: RichTextBlock[];
}

interface Props {
  modelValue: ResearchSummaryPayload;
  reportId?: number;
}

interface Emits {
  (e: "update:modelValue", payload: ResearchSummaryPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Injecter les données du rapport depuis le parent
const report = inject<Report>('report', null as any);
const findings = inject<Finding[]>('reportFindings', []);

// Composable pour les blocs de texte enrichi
const emitUpdate = () => {
  // L'update sera géré par finishEditing
};

const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks
} = useRichTextBlocks(props.modelValue.richTextBlocks || [], emitUpdate);

const isEditing = ref(false);
const editablePayload = ref<ResearchSummaryPayload>({
  summary: "",
  notFound: [],
  methodology: undefined,
  notes: undefined,
});

// Computed pour lecture sécurisée
const safePayload = computed(() => ({
  summary: props.modelValue?.summary || "",
  notFound: props.modelValue?.notFound || [],
  methodology: props.modelValue?.methodology || "",
  notes: props.modelValue?.notes || "",
}));

// Computed pour v-model avec strings (jamais undefined)
const methodologyModel = computed({
  get: () => editablePayload.value.methodology || "",
  set: (value: string) => { editablePayload.value.methodology = value || undefined; }
});

const notesModel = computed({
  get: () => editablePayload.value.notes || "",
  set: (value: string) => { editablePayload.value.notes = value || undefined; }
});

// Synchroniser les blocs avec le modelValue
watch(
  () => props.modelValue.richTextBlocks,
  (newBlocks) => {
    if (!isEditing.value) {
      setBlocks(newBlocks || []);
    }
  },
  { deep: true }
);

function startEditing() {
  editablePayload.value = {
    summary: safePayload.value.summary,
    notFound: [...safePayload.value.notFound],
    methodology: safePayload.value.methodology || undefined,
    notes: safePayload.value.notes || undefined,
    richTextBlocks: props.modelValue.richTextBlocks || [],
  };
  setBlocks(editablePayload.value.richTextBlocks || []);
  isEditing.value = true;
}

function finishEditing() {
  // Sauvegarde manuelle uniquement
  const payload: ResearchSummaryPayload = {
    ...editablePayload.value,
    richTextBlocks: richTextBlocks.value,
  };
  emit("update:modelValue", payload);
  isEditing.value = false;
}

function addNotFound() {
  editablePayload.value.notFound.push("");
}

function removeNotFound(index: number) {
  editablePayload.value.notFound.splice(index, 1);
}
</script>
