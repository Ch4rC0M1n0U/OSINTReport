/**
 * 🎯 useTreeDragDrop - Composable pour la gestion du drag-and-drop dans l'arborescence
 * 
 * Fonctionnalités:
 * - Gestion des contraintes de déplacement (quels éléments peuvent être déplacés où)
 * - Feedback visuel pendant le drag
 * - Réorganisation des éléments
 * - Support du touch (mobile)
 */
import { ref, computed } from 'vue';
import type { TreeNodeData, DragDropResult } from '@/components/tree/types';

export interface DragConstraints {
  // Définit quels types peuvent être déplacés vers quels autres types
  allowedTargets: Record<string, string[]>;
}

const defaultConstraints: DragConstraints = {
  allowedTargets: {
    // Un module peut être déplacé vers une entité ou le dossier général
    module: ['entity', 'folder'],
    // Un finding peut être déplacé vers un module
    finding: ['module'],
    // Une entité peut être déplacée vers un dossier (changement de type)
    entity: ['folder'],
  },
};

export function useTreeDragDrop(constraints: DragConstraints = defaultConstraints) {
  // État du drag en cours
  const isDragging = ref(false);
  const draggedNode = ref<TreeNodeData | null>(null);
  const dragOverNode = ref<TreeNodeData | null>(null);
  const dropPosition = ref<'before' | 'after' | 'inside'>('inside');
  
  // Position de l'indicateur de drop
  const dropIndicatorPosition = ref({ x: 0, y: 0, width: 0 });
  
  // Vérifier si un drop est autorisé
  const canDrop = computed(() => {
    if (!draggedNode.value || !dragOverNode.value) return false;
    
    const sourceType = draggedNode.value.type;
    const targetType = dragOverNode.value.type;
    
    // Empêcher de dropper sur soi-même
    if (draggedNode.value.id === dragOverNode.value.id) return false;
    
    // Empêcher de dropper sur ses propres enfants
    if (isDescendant(dragOverNode.value, draggedNode.value)) return false;
    
    // Vérifier les contraintes de type
    const allowedTargets = constraints.allowedTargets[sourceType] || [];
    return allowedTargets.includes(targetType);
  });
  
  // Vérifier si un nœud est descendant d'un autre
  function isDescendant(node: TreeNodeData, potentialAncestor: TreeNodeData): boolean {
    if (!potentialAncestor.children) return false;
    
    for (const child of potentialAncestor.children) {
      if (child.id === node.id) return true;
      if (isDescendant(node, child)) return true;
    }
    
    return false;
  }
  
  // Démarrer le drag
  function startDrag(node: TreeNodeData, event: DragEvent) {
    if (!node.draggable) return;
    
    isDragging.value = true;
    draggedNode.value = node;
    
    // Configurer les données de transfert
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify({
        id: node.id,
        type: node.type,
        label: node.label,
      }));
      
      // Créer une image de drag personnalisée
      const dragImage = createDragImage(node);
      event.dataTransfer.setDragImage(dragImage, 20, 20);
    }
  }
  
  // Créer une image personnalisée pour le drag
  function createDragImage(node: TreeNodeData): HTMLElement {
    const el = document.createElement('div');
    el.className = 'fixed -left-[9999px] px-3 py-2 bg-base-200 rounded-lg shadow-lg flex items-center gap-2 text-sm';
    el.innerHTML = `
      <span>${node.icon || '📄'}</span>
      <span>${node.label}</span>
    `;
    document.body.appendChild(el);
    
    // Supprimer après un court délai
    setTimeout(() => el.remove(), 0);
    
    return el;
  }
  
  // Pendant le drag over
  function handleDragOver(node: TreeNodeData, event: DragEvent) {
    if (!draggedNode.value || !node.droppable) return;
    
    event.preventDefault();
    dragOverNode.value = node;
    
    // Calculer la position (avant, après ou à l'intérieur)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    
    if (y < height * 0.25) {
      dropPosition.value = 'before';
    } else if (y > height * 0.75) {
      dropPosition.value = 'after';
    } else {
      dropPosition.value = 'inside';
    }
    
    // Mettre à jour l'indicateur visuel
    dropIndicatorPosition.value = {
      x: rect.left,
      y: dropPosition.value === 'before' ? rect.top : 
         dropPosition.value === 'after' ? rect.bottom : rect.top + height / 2,
      width: rect.width,
    };
  }
  
  // Quitter le drag over
  function handleDragLeave() {
    dragOverNode.value = null;
  }
  
  // Terminer le drag
  function endDrag() {
    isDragging.value = false;
    draggedNode.value = null;
    dragOverNode.value = null;
  }
  
  // Effectuer le drop
  function handleDrop(event: DragEvent): DragDropResult | null {
    event.preventDefault();
    
    if (!draggedNode.value || !dragOverNode.value || !canDrop.value) {
      endDrag();
      return null;
    }
    
    const result: DragDropResult = {
      success: true,
      action: dropPosition.value === 'inside' ? 'insert' : 'reorder',
      source: draggedNode.value,
      target: dragOverNode.value,
      position: dropPosition.value,
    };
    
    endDrag();
    return result;
  }
  
  // Classes CSS pour le feedback visuel
  function getDragClasses(node: TreeNodeData): Record<string, boolean> {
    return {
      'opacity-50': isDragging.value && draggedNode.value?.id === node.id,
      'ring-2 ring-primary ring-offset-2': dragOverNode.value?.id === node.id && canDrop.value,
      'ring-2 ring-error ring-offset-2': dragOverNode.value?.id === node.id && !canDrop.value,
    };
  }
  
  return {
    // État
    isDragging,
    draggedNode,
    dragOverNode,
    dropPosition,
    dropIndicatorPosition,
    canDrop,
    
    // Méthodes
    startDrag,
    handleDragOver,
    handleDragLeave,
    endDrag,
    handleDrop,
    getDragClasses,
    isDescendant,
  };
}
