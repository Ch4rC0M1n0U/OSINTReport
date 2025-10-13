<script setup lang="ts">
import { ref, computed } from 'vue';
import AIGenerationModal from './AIGenerationModal.vue';
import type { AIGenerationModalProps } from './AIGenerationModal.vue';
import type { PersonalDataToProtect } from '@/services/ai-generation.service';
import { HugeiconsIcon } from '@hugeicons/vue';
import { ArtificialIntelligence01Icon } from '@hugeicons/core-free-icons';

export interface AIGenerateButtonProps {
  label?: string;
  contextType: 'summary' | 'module' | 'entity';
  reportData?: AIGenerationModalProps['reportData'];
  moduleData?: AIGenerationModalProps['moduleData'];
  entityData?: AIGenerationModalProps['entityData'];
  personalData?: PersonalDataToProtect;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  iconOnly?: boolean;
}

const props = withDefaults(defineProps<AIGenerateButtonProps>(), {
  label: 'Générer avec l\'IA',
  size: 'sm',
  variant: 'primary',
  iconOnly: false,
});

const emit = defineEmits<{
  generated: [text: string];
}>();

const isModalOpen = ref(false);

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const handleGenerated = (text: string) => {
  emit('generated', text);
};

const buttonClass = computed(() => {
  const classes = ['btn', 'gap-2'];
  
  // Taille
  switch (props.size) {
    case 'xs':
      classes.push('btn-xs');
      break;
    case 'sm':
      classes.push('btn-sm');
      break;
    case 'lg':
      classes.push('btn-lg');
      break;
  }
  
  // Variant
  switch (props.variant) {
    case 'primary':
      classes.push('btn-primary');
      break;
    case 'secondary':
      classes.push('btn-secondary');
      break;
    case 'ghost':
      classes.push('btn-ghost');
      break;
    case 'outline':
      classes.push('btn-outline');
      break;
  }
  
  return classes.join(' ');
});
</script>

<template>
  <div>
    <button
      @click="openModal"
      :class="buttonClass"
      :title="iconOnly ? label : undefined"
    >
      <HugeiconsIcon :icon="ArtificialIntelligence01Icon" :size="18" />
      <span v-if="!iconOnly">{{ label }}</span>
    </button>

    <AIGenerationModal
      :is-open="isModalOpen"
      :context-type="contextType"
      :report-data="reportData"
      :module-data="moduleData"
      :entity-data="entityData"
      :personal-data="personalData"
      @close="closeModal"
      @generated="handleGenerated"
    />
  </div>
</template>
