<script setup lang="ts">
/**
 * 🌳 TreeNode - Composant de nœud d'arborescence réutilisable
 * 
 * Fonctionnalités:
 * - Affichage récursif avec indentation
 * - Expansion/Réduction animée
 * - Drag-and-drop intégré
 * - Menu contextuel (clic droit)
 * - Icônes personnalisables par type
 * - Sélection et multi-sélection
 */
import { ref, computed, inject } from 'vue';
import type { TreeNodeData } from './types';

interface Props {
  node: TreeNodeData;
  level?: number;
  isDragging?: boolean;
}

interface Emits {
  (e: 'select', node: TreeNodeData): void;
  (e: 'toggle', node: TreeNodeData): void;
  (e: 'context-menu', event: { node: TreeNodeData; position: { x: number; y: number } }): void;
  (e: 'drag-start', node: TreeNodeData): void;
  (e: 'drag-end'): void;
  (e: 'drag-over', node: TreeNodeData): void;
  (e: 'drop', target: TreeNodeData, source: TreeNodeData): void;
  (e: 'double-click', node: TreeNodeData): void;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  isDragging: false,
});

const emit = defineEmits<Emits>();

// Injection du nœud en cours de drag (depuis le parent)
const draggedNode = inject<{ value: TreeNodeData | null }>('draggedNode', { value: null });

// État local
const isExpanded = ref(props.node.expanded ?? true);
const isDragOver = ref(false);

// Styles dynamiques
const nodeStyle = computed(() => ({
  paddingLeft: `${props.level * 20 + 8}px`,
}));

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);

// Icônes par type
const getDefaultIcon = (type: TreeNodeData['type']): string => {
  const icons: Record<TreeNodeData['type'], string> = {
    report: '📋',
    entity: '👤',
    module: '📦',
    finding: '🔍',
    folder: '📁',
  };
  return icons[type] || '📄';
};

const nodeIcon = computed(() => props.node.icon || getDefaultIcon(props.node.type));

// Handlers
function handleToggle(e: Event) {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
  emit('toggle', props.node);
}

function handleSelect() {
  emit('select', props.node);
}

function handleDoubleClick() {
  emit('double-click', props.node);
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  emit('context-menu', {
    node: props.node,
    position: { x: e.clientX, y: e.clientY },
  });
}

// Drag and Drop
function handleDragStart(e: DragEvent) {
  if (!props.node.draggable) {
    e.preventDefault();
    return;
  }
  
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', JSON.stringify({
    id: props.node.id,
    type: props.node.type,
    label: props.node.label,
  }));
  
  emit('drag-start', props.node);
}

function handleDragEnd() {
  emit('drag-end');
}

function handleDragOver(e: DragEvent) {
  if (!props.node.droppable) return;
  
  // Empêcher de drop sur soi-même ou sur ses enfants
  if (draggedNode.value?.id === props.node.id) return;
  
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  isDragOver.value = true;
  emit('drag-over', props.node);
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  
  if (!props.node.droppable || !draggedNode.value) return;
  
  emit('drop', props.node, draggedNode.value);
}

// Handler pour les drops depuis les enfants
function handleChildDrop(target: TreeNodeData, source: TreeNodeData) {
  emit('drop', target, source);
}

// Classes CSS dynamiques
const nodeClasses = computed(() => [
  'tree-node',
  'group',
  'flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer',
  'transition-all duration-150 ease-out',
  'hover:bg-base-200',
  {
    'bg-primary/10 border-l-4 border-primary': props.node.selected,
    'bg-accent/20 border-2 border-dashed border-accent': isDragOver.value,
    'opacity-50': props.isDragging,
  },
]);
</script>

<template>
  <div class="tree-node-wrapper">
    <!-- Nœud principal -->
    <div
      :class="nodeClasses"
      :style="nodeStyle"
      :draggable="node.draggable"
      @click="handleSelect"
      @dblclick="handleDoubleClick"
      @contextmenu="handleContextMenu"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Chevron d'expansion -->
      <button
        v-if="hasChildren"
        type="button"
        class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-base-300 transition-transform duration-200"
        :class="{ 'rotate-90': isExpanded }"
        @click="handleToggle"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <span v-else class="w-5 flex-shrink-0"></span>
      
      <!-- Icône -->
      <span class="flex-shrink-0 text-lg">{{ nodeIcon }}</span>
      
      <!-- Label -->
      <span class="flex-1 truncate text-sm font-medium">{{ node.label }}</span>
      
      <!-- Badge -->
      <span
        v-if="node.badge !== undefined"
        class="badge badge-sm"
        :class="`badge-${node.badgeType || 'primary'}`"
      >
        {{ node.badge }}
      </span>
      
      <!-- Indicateur de drag -->
      <span
        v-if="node.draggable"
        class="drag-handle opacity-0 group-hover:opacity-50 cursor-move"
        title="Glisser pour déplacer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </span>
    </div>
    
    <!-- Enfants (avec animation) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="hasChildren && isExpanded" class="tree-children">
        <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :is-dragging="isDragging"
          @select="emit('select', $event)"
          @toggle="emit('toggle', $event)"
          @context-menu="emit('context-menu', $event)"
          @drag-start="emit('drag-start', $event)"
          @drag-end="emit('drag-end')"
          @drag-over="emit('drag-over', $event)"
          @drop="handleChildDrop"
          @double-click="emit('double-click', $event)"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tree-node-wrapper {
  user-select: none;
}

.tree-node.dragging {
  opacity: 0.5;
}

/* Ligne de connexion verticale pour les enfants */
.tree-children {
  position: relative;
}

.tree-children::before {
  content: '';
  position: absolute;
  left: calc(var(--level, 0) * 20px + 16px);
  top: 0;
  bottom: 0;
  width: 1px;
  background: oklch(var(--bc) / 0.1);
}
</style>
