<template>
  <div v-if="blocks.length > 0" class="space-y-4">
    <div
      v-for="(block, index) in blocks"
      :key="block.id"
      class="card bg-base-100 border border-base-300 p-4"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2 flex-1">
          <span class="font-semibold text-base">📝 Bloc {{ index + 1 }}</span>
          <input
            v-if="!readonly"
            v-model="block.title"
            type="text"
            placeholder="Titre du bloc (optionnel)"
            class="input input-sm input-bordered flex-1 max-w-xs"
            @input="emit('update')"
          />
          <span v-else-if="block.title" class="text-base-content/70">
            — {{ block.title }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!readonly && index > 0"
            type="button"
            @click="emit('move-up', index)"
            class="btn btn-ghost btn-xs"
            title="Déplacer vers le haut"
          >
            ↑
          </button>
          <button
            v-if="!readonly && index < blocks.length - 1"
            type="button"
            @click="emit('move-down', index)"
            class="btn btn-ghost btn-xs"
            title="Déplacer vers le bas"
          >
            ↓
          </button>
          <button
            v-if="!readonly"
            type="button"
            @click="emit('delete', index)"
            class="btn btn-ghost btn-xs btn-circle text-error"
            title="Supprimer ce bloc"
          >
            ✕
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
