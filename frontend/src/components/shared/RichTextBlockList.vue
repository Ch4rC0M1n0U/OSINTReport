<template>
  <div v-if="blocks.length > 0" class="space-y-4 max-w-5xl mx-auto">
    <div
      v-for="(block, index) in blocks"
      :key="block.id"
      class="card bg-base-100 border-2 border-base-300 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden"
    >
      <div class="card-body p-5 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1">
            <span class="badge badge-primary badge-lg font-semibold gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Bloc {{ index + 1 }}
            </span>
            <input
              v-if="!readonly"
              v-model="block.title"
              type="text"
              placeholder="Titre du bloc (optionnel)"
              class="input input-sm input-bordered flex-1 max-w-xs border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 rounded-lg"
              @input="emit('update')"
            />
            <span v-else-if="block.title" class="text-base-content/70 font-medium">
              {{ block.title }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              v-if="!readonly && index > 0"
              type="button"
              @click="emit('move-up', index)"
              class="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 hover:text-primary transition-all duration-200"
              title="Déplacer vers le haut"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              v-if="!readonly && index < blocks.length - 1"
              type="button"
              @click="emit('move-down', index)"
              class="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 hover:text-primary transition-all duration-200"
              title="Déplacer vers le bas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              v-if="!readonly"
              type="button"
              @click="emit('delete', index)"
              class="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10 transition-all duration-200"
              title="Supprimer ce bloc"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <WysiwygEditor
          v-model="block.content"
          :placeholder="placeholder"
          :enable-entity-insertion="enableEntityInsertion"
          :report-id="reportId"
          :findings="findings"
          :readonly="readonly"
          @update:model-value="emit('update')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WysiwygEditor from '@/components/shared/WysiwygEditor.vue';
import type { RichTextBlock } from '@/composables/useRichTextBlocks';
import type { Finding } from '@/services/api/reports';

interface Props {
  blocks: RichTextBlock[];
  readonly?: boolean;
  placeholder?: string;
  enableEntityInsertion?: boolean;
  reportId?: string;
  findings?: Finding[];
}

interface Emits {
  (e: 'update'): void;
  (e: 'delete', index: number): void;
  (e: 'move-up', index: number): void;
  (e: 'move-down', index: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: 'Ajoutez votre texte... Utilisez le bouton 👤 pour insérer des entités.',
  enableEntityInsertion: true,
});

const emit = defineEmits<Emits>();
</script>
