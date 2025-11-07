<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <!-- Carte de contenu -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Résumé de la recherche</h2>
        </div>

        <div class="space-y-6">
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
          <section v-if="safePayload.summary" class="space-y-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Résumé global des recherches
            </h3>
            <div class="prose dark:prose-invert max-w-none pl-7">
              <MarkdownRenderer :content="safePayload.summary" />
            </div>
          </section>

          <!-- Méthodologie -->
          <section v-if="safePayload.methodology" class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Méthodologie
            </h3>
            <div class="prose dark:prose-invert max-w-none pl-7">
              <MarkdownRenderer :content="safePayload.methodology" />
            </div>
          </section>

          <!-- Éléments non trouvés -->
          <section v-if="safePayload.notFound && safePayload.notFound.length > 0" class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Éléments non trouvés
            </h3>
            <ul class="list-disc list-inside space-y-1 pl-7 text-gray-700 dark:text-gray-300">
              <li v-for="(item, index) in safePayload.notFound" :key="index">
                {{ item }}
              </li>
            </ul>
          </section>

          <!-- Notes -->
          <section v-if="safePayload.notes" class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Notes complémentaires
            </h3>
            <div class="prose dark:prose-invert max-w-none pl-7">
              <MarkdownRenderer :content="safePayload.notes" />
            </div>
          </section>

          <!-- Message si vide -->
          <div v-if="!richTextBlocks.length && !safePayload.summary && !safePayload.methodology && (!safePayload.notFound || safePayload.notFound.length === 0) && !safePayload.notes" class="text-center py-8">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 italic">Aucun contenu pour ce module</p>
          </div>
        </div>
      </div>

      <!-- Bouton édition -->
      <div class="flex justify-end gap-2">
        <button
          v-if="richTextBlocks.length > 0"
          disabled
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-not-allowed"
        >
          {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
        </button>
        <button
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
