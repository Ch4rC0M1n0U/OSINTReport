<script setup lang="ts">
/**
 * 🌳 ReportTreeView - Gestion arborescente des rapports OSINT
 * 
 * Structure hiérarchique:
 * 📋 Rapport
 * ├── 📁 Entités (groupées par type)
 * │   ├── 👤 Personne A
 * │   │   ├── 📦 Module: Vue d'ensemble
 * │   │   │   └── 🔍 Finding 1
 * │   │   │   └── 🔍 Finding 2
 * │   │   └── 📦 Module: Analyse plateforme
 * │   └── 🏢 Organisation B
 * └── 📁 Modules généraux
 *     ├── 📦 Résumé
 *     └── 📦 Conclusions
 * 
 * Fonctionnalités:
 * - Drag-and-drop entre niveaux
 * - Menu contextuel (clic droit)
 * - Expansion/Réduction par section
 * - Recherche dans l'arbre
 * - Actions rapides (ajouter, supprimer, dupliquer)
 */
import { ref, computed, provide } from 'vue';
import TreeNode from './TreeNode.vue';
import type { TreeNodeData } from './types';
import TreeContextMenu from './TreeContextMenu.vue';
import type { ReportModule, Finding } from '@/services/api/reports';

// Types pour l'interface
interface Entity {
  id: string;
  label: string;
  type: 'PERSON' | 'ORGANIZATION' | 'TELEPHONE' | 'EMAIL' | 'ACCOUNT' | 'ADDRESS' | 'OTHER';
  notes?: string;
}

interface Props {
  reportId: string;
  reportTitle: string;
  modules: ReportModule[];
  entities?: Entity[];
  selectedId?: string | null;
  readonly?: boolean;
}

interface Emits {
  (e: 'select-module', moduleId: string): void;
  (e: 'select-entity', entityId: string): void;
  (e: 'select-finding', data: { moduleId: string; findingIndex: number }): void;
  (e: 'reorder-modules', moduleIds: string[]): void;
  (e: 'move-module-to-entity', data: { moduleId: string; entityId: string }): void;
  (e: 'move-finding', data: { fromModuleId: string; toModuleId: string; findingIndex: number }): void;
  (e: 'add-module', type: string): void;
  (e: 'add-entity'): void;
  (e: 'add-finding', moduleId: string): void;
  (e: 'delete-module', moduleId: string): void;
  (e: 'delete-finding', data: { moduleId: string; findingIndex: number }): void;
  (e: 'duplicate-module', moduleId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  entities: () => [],
  selectedId: null,
});

const emit = defineEmits<Emits>();

// État pour le drag-and-drop
const draggedNode = ref<TreeNodeData | null>(null);
provide('draggedNode', draggedNode);

// État pour le menu contextuel
const contextMenu = ref({
  show: false,
  position: { x: 0, y: 0 },
  node: null as TreeNodeData | null,
});

// Recherche
const searchQuery = ref('');

// Icônes des types d'entités
const entityTypeIcons: Record<string, string> = {
  PERSON: '👤',
  ORGANIZATION: '🏢',
  TELEPHONE: '📞',
  EMAIL: '📧',
  ACCOUNT: '🔐',
  ADDRESS: '📍',
  OTHER: '📄',
};

// Icônes des types de modules
const moduleTypeIcons: Record<string, string> = {
  summary: '📝',
  entities: '👥',
  objectives: '🎯',
  research_summary: '🔬',
  entity_overview: '👤',
  identifier_lookup: '🔎',
  platform_analysis: '🌐',
  media_gallery: '🖼️',
  data_retention: '💾',
  conclusions: '✅',
  investigation_leads: '🔗',
  sign_off: '✍️',
};

// Construction de l'arbre
const treeData = computed<TreeNodeData>(() => {
  // Grouper les modules par entité
  const modulesByEntity = new Map<string | null, ReportModule[]>();
  
  for (const module of props.modules) {
    const entityId = module.entityId || null;
    if (!modulesByEntity.has(entityId)) {
      modulesByEntity.set(entityId, []);
    }
    modulesByEntity.get(entityId)!.push(module);
  }
  
  // Construire les nœuds d'entités
  const entityNodes: TreeNodeData[] = [];
  
  // Grouper les entités par type
  const entitiesByType = new Map<string, Entity[]>();
  for (const entity of props.entities || []) {
    if (!entitiesByType.has(entity.type)) {
      entitiesByType.set(entity.type, []);
    }
    entitiesByType.get(entity.type)!.push(entity);
  }
  
  // Créer les dossiers par type d'entité
  for (const [type, entities] of entitiesByType) {
    const typeFolder: TreeNodeData = {
      id: `folder-${type}`,
      label: getEntityTypeLabel(type),
      type: 'folder',
      icon: entityTypeIcons[type] || '📁',
      expanded: true,
      droppable: false,
      draggable: false,
      badge: entities.length,
      badgeType: 'info',
      children: entities.map(entity => createEntityNode(entity, modulesByEntity.get(entity.id) || [])),
    };
    entityNodes.push(typeFolder);
  }
  
  // Nœud pour les modules sans entité (généraux)
  const generalModules = modulesByEntity.get(null) || [];
  const generalModulesNode: TreeNodeData = {
    id: 'folder-general',
    label: 'Modules généraux',
    type: 'folder',
    icon: '📦',
    expanded: true,
    droppable: true,
    draggable: false,
    badge: generalModules.length,
    badgeType: 'secondary',
    children: generalModules.map(module => createModuleNode(module)),
  };
  
  // Arbre complet
  return {
    id: props.reportId,
    label: props.reportTitle,
    type: 'report',
    icon: '📋',
    expanded: true,
    draggable: false,
    droppable: false,
    children: [
      ...entityNodes,
      generalModulesNode,
    ],
  };
});

// Créer un nœud d'entité
function createEntityNode(entity: Entity, modules: ReportModule[]): TreeNodeData {
  return {
    id: entity.id,
    label: entity.label,
    type: 'entity',
    icon: entityTypeIcons[entity.type] || '👤',
    expanded: true,
    draggable: !props.readonly,
    droppable: true,
    data: entity,
    badge: modules.length > 0 ? modules.length : undefined,
    badgeType: 'primary',
    selected: props.selectedId === entity.id,
    children: modules.map(module => createModuleNode(module)),
  };
}

// Créer un nœud de module
function createModuleNode(module: ReportModule): TreeNodeData {
  const findings = extractFindings(module);
  
  return {
    id: module.id,
    label: module.title || getModuleTypeLabel(module.type),
    type: 'module',
    icon: moduleTypeIcons[module.type] || '📦',
    expanded: true,
    draggable: !props.readonly,
    droppable: true,
    data: module,
    selected: props.selectedId === module.id,
    badge: findings.length > 0 ? findings.length : undefined,
    badgeType: 'accent',
    children: findings.map((finding, index) => createFindingNode(module.id, finding, index)),
  };
}

// Créer un nœud de finding
function createFindingNode(moduleId: string, finding: Finding, index: number): TreeNodeData {
  return {
    id: `${moduleId}-finding-${index}`,
    label: finding.label || `Finding ${index + 1}`,
    type: 'finding',
    icon: getConfidenceIcon(finding.confidence),
    expanded: false,
    draggable: !props.readonly,
    droppable: false,
    data: { ...finding, moduleId, index },
    selected: props.selectedId === `${moduleId}-finding-${index}`,
  };
}

// Extraire les findings d'un module
function extractFindings(module: ReportModule): Finding[] {
  const payload = module.payload || {};
  return payload.findings || [];
}

// Labels des types d'entités
function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PERSON: 'Personnes',
    ORGANIZATION: 'Organisations',
    TELEPHONE: 'Téléphones',
    EMAIL: 'Emails',
    ACCOUNT: 'Comptes',
    ADDRESS: 'Adresses',
    OTHER: 'Autres',
  };
  return labels[type] || type;
}

// Labels des types de modules
function getModuleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    summary: 'Résumé',
    entities: 'Entités concernées',
    objectives: 'Objectifs',
    research_summary: 'Résumé des recherches',
    entity_overview: 'Vue d\'ensemble',
    identifier_lookup: 'Recherche d\'identifiant',
    platform_analysis: 'Analyse de plateforme',
    media_gallery: 'Galerie média',
    data_retention: 'Conservation des données',
    conclusions: 'Conclusions',
    investigation_leads: 'Pistes d\'enquête',
    sign_off: 'Validation',
  };
  return labels[type] || type;
}

// Icône selon la confiance
function getConfidenceIcon(confidence?: string): string {
  const icons: Record<string, string> = {
    confirmed: '✅',
    probable: '🔶',
    possible: '❓',
    unverified: '⚠️',
  };
  return icons[confidence || ''] || '🔍';
}

// Handlers
function handleNodeSelect(node: TreeNodeData) {
  switch (node.type) {
    case 'module':
      emit('select-module', node.id);
      break;
    case 'entity':
      emit('select-entity', node.id);
      break;
    case 'finding':
      const findingData = node.data as { moduleId: string; index: number };
      emit('select-finding', { moduleId: findingData.moduleId, findingIndex: findingData.index });
      break;
  }
}

function handleContextMenu(event: { node: TreeNodeData; position: { x: number; y: number } }) {
  if (props.readonly) return;
  
  contextMenu.value = {
    show: true,
    position: event.position,
    node: event.node,
  };
}

function handleDragStart(node: TreeNodeData) {
  draggedNode.value = node;
}

function handleDragEnd() {
  draggedNode.value = null;
}

function handleDrop(target: TreeNodeData, source: TreeNodeData) {
  if (!source || source.id === target.id) return;
  
  // Module déplacé vers une entité
  if (source.type === 'module' && target.type === 'entity') {
    emit('move-module-to-entity', { moduleId: source.id, entityId: target.id });
  }
  
  // Module déplacé vers le dossier général
  if (source.type === 'module' && target.id === 'folder-general') {
    emit('move-module-to-entity', { moduleId: source.id, entityId: '' });
  }
  
  // Finding déplacé vers un autre module
  if (source.type === 'finding' && target.type === 'module') {
    const findingData = source.data as { moduleId: string; index: number };
    emit('move-finding', {
      fromModuleId: findingData.moduleId,
      toModuleId: target.id,
      findingIndex: findingData.index,
    });
  }
  
  draggedNode.value = null;
}

// Actions du menu contextuel
function handleContextAction(action: string) {
  const node = contextMenu.value.node;
  if (!node) return;
  
  switch (action) {
    case 'add-module':
      emit('add-module', 'entity_overview');
      break;
    case 'add-entity':
      emit('add-entity');
      break;
    case 'add-finding':
      if (node.type === 'module') {
        emit('add-finding', node.id);
      }
      break;
    case 'delete':
      if (node.type === 'module') {
        emit('delete-module', node.id);
      } else if (node.type === 'finding') {
        const data = node.data as { moduleId: string; index: number };
        emit('delete-finding', { moduleId: data.moduleId, findingIndex: data.index });
      }
      break;
    case 'duplicate':
      if (node.type === 'module') {
        emit('duplicate-module', node.id);
      }
      break;
  }
  
  closeContextMenu();
}

function closeContextMenu() {
  contextMenu.value.show = false;
  contextMenu.value.node = null;
}

// Recherche dans l'arbre
const filteredTree = computed(() => {
  if (!searchQuery.value.trim()) return treeData.value;
  
  const query = searchQuery.value.toLowerCase();
  return filterTreeNode(treeData.value, query);
});

function filterTreeNode(node: TreeNodeData, query: string): TreeNodeData | null {
  const matchesLabel = node.label.toLowerCase().includes(query);
  
  let filteredChildren: TreeNodeData[] = [];
  if (node.children) {
    filteredChildren = node.children
      .map(child => filterTreeNode(child, query))
      .filter((n): n is TreeNodeData => n !== null);
  }
  
  if (matchesLabel || filteredChildren.length > 0) {
    return {
      ...node,
      expanded: true,
      children: filteredChildren.length > 0 ? filteredChildren : node.children,
    };
  }
  
  return null;
}
</script>

<template>
  <div class="report-tree-view flex flex-col h-full">
    <!-- Barre de recherche -->
    <div class="p-3 border-b border-base-300">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher dans l'arbre..."
          class="input input-sm input-bordered w-full pl-9"
        />
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>
    
    <!-- Actions rapides -->
    <div v-if="!readonly" class="flex gap-1 p-2 border-b border-base-300">
      <button
        class="btn btn-xs btn-ghost gap-1 flex-1"
        @click="emit('add-module', 'entity_overview')"
        title="Ajouter un module"
      >
        <span>📦</span>
        <span class="hidden sm:inline">Module</span>
      </button>
      <button
        class="btn btn-xs btn-ghost gap-1 flex-1"
        @click="emit('add-entity')"
        title="Ajouter une entité"
      >
        <span>👤</span>
        <span class="hidden sm:inline">Entité</span>
      </button>
    </div>
    
    <!-- Arbre -->
    <div class="flex-1 overflow-y-auto p-2">
      <TreeNode
        v-if="filteredTree"
        :node="filteredTree"
        @select="handleNodeSelect"
        @context-menu="handleContextMenu"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drop="handleDrop"
      />
      
      <div v-else class="text-center py-8 text-base-content/50">
        Aucun résultat pour "{{ searchQuery }}"
      </div>
    </div>
    
    <!-- Menu contextuel -->
    <TreeContextMenu
      v-if="contextMenu.show"
      :position="contextMenu.position"
      :node="contextMenu.node"
      @action="handleContextAction"
      @close="closeContextMenu"
    />
  </div>
</template>

<style scoped>
.report-tree-view {
  background: oklch(var(--b1));
}
</style>
