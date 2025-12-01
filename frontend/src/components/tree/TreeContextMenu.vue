<script setup lang="ts">
/**
 * 🎯 TreeContextMenu - Menu contextuel pour l'arborescence
 * 
 * Actions disponibles selon le type de nœud:
 * - Entity: Ajouter module, Supprimer, Éditer
 * - Module: Ajouter finding, Dupliquer, Supprimer, Déplacer
 * - Finding: Éditer, Supprimer, Déplacer
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { TreeNodeData } from './types';

interface Props {
  position: { x: number; y: number };
  node: TreeNodeData | null;
}

interface Emits {
  (e: 'action', action: string): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const menuRef = ref<HTMLDivElement>();

// Actions disponibles selon le type de nœud
const menuItems = computed(() => {
  if (!props.node) return [];
  
  const items: Array<{ action: string; label: string; icon: string; danger?: boolean }> = [];
  
  switch (props.node.type) {
    case 'report':
      items.push(
        { action: 'add-module', label: 'Ajouter un module', icon: '📦' },
        { action: 'add-entity', label: 'Ajouter une entité', icon: '👤' },
      );
      break;
      
    case 'folder':
      if (props.node.id === 'folder-general') {
        items.push({ action: 'add-module', label: 'Ajouter un module', icon: '📦' });
      } else {
        items.push({ action: 'add-entity', label: 'Ajouter une entité', icon: '👤' });
      }
      break;
      
    case 'entity':
      items.push(
        { action: 'add-module', label: 'Ajouter un module', icon: '📦' },
        { action: 'edit', label: 'Modifier', icon: '✏️' },
        { action: 'delete', label: 'Supprimer', icon: '🗑️', danger: true },
      );
      break;
      
    case 'module':
      items.push(
        { action: 'add-finding', label: 'Ajouter un finding', icon: '🔍' },
        { action: 'edit', label: 'Modifier', icon: '✏️' },
        { action: 'duplicate', label: 'Dupliquer', icon: '📋' },
        { action: 'toggle-pdf', label: 'Inclure/Exclure du PDF', icon: '📄' },
        { action: 'delete', label: 'Supprimer', icon: '🗑️', danger: true },
      );
      break;
      
    case 'finding':
      items.push(
        { action: 'edit', label: 'Modifier', icon: '✏️' },
        { action: 'move', label: 'Déplacer vers...', icon: '↗️' },
        { action: 'delete', label: 'Supprimer', icon: '🗑️', danger: true },
      );
      break;
  }
  
  return items;
});

// Position du menu (ajustée pour ne pas sortir de l'écran)
const menuStyle = computed(() => {
  let x = props.position.x;
  let y = props.position.y;
  
  // Ajuster si trop à droite
  if (x + 200 > window.innerWidth) {
    x = window.innerWidth - 210;
  }
  
  // Ajuster si trop bas
  if (y + 300 > window.innerHeight) {
    y = window.innerHeight - 310;
  }
  
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

// Fermer le menu en cliquant ailleurs
function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close');
  }
}

// Fermer avec Escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});

function handleAction(action: string) {
  emit('action', action);
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      class="fixed z-[9999] bg-base-100 rounded-lg shadow-xl border border-base-300 py-1 min-w-[180px]"
      :style="menuStyle"
    >
      <!-- En-tête avec le type de nœud -->
      <div class="px-3 py-2 border-b border-base-300 text-xs text-base-content/60 uppercase font-semibold">
        {{ node?.type }}
      </div>
      
      <!-- Actions -->
      <ul class="menu menu-compact p-1">
        <li v-for="item in menuItems" :key="item.action">
          <button
            class="flex items-center gap-2 w-full text-left"
            :class="{ 'text-error hover:bg-error/10': item.danger }"
            @click="handleAction(item.action)"
          >
            <span>{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </li>
      </ul>
      
      <!-- Message si aucune action disponible -->
      <div v-if="menuItems.length === 0" class="px-3 py-2 text-sm text-base-content/50">
        Aucune action disponible
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.menu li button {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
}

.menu li button:hover {
  background: oklch(var(--b2));
}
</style>
