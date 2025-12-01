<script setup lang="ts">
/**
 * 🌳 ModuleTreeSidebar - Sidebar avec gestion arborescente des modules
 * 
 * Affiche la structure complète:
 * - Modules généraux / par entité
 * - Findings (entités identifiées)
 * - Blocs de texte (richTextBlocks)
 * - Objectifs, conclusions, etc.
 */
import { ref, computed } from 'vue';
import VueDraggable from 'vuedraggable';
import type { ReportModule, ReportModuleType, Finding, RichTextBlock } from '@/services/api/reports';
import { MODULE_TYPE_METADATA } from '@/services/api/reports';

// Types internes pour l'arborescence
type NodeType = 'folder' | 'module' | 'finding' | 'entity' | 'textblock' | 'objective' | 'statement' | 'lead';

interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  icon: string;
  expanded: boolean;
  selected: boolean;
  data?: any;
  children?: TreeNode[];
  badge?: number | string;
  badgeType?: string;
  includeInPdf?: boolean;
  moduleId?: string; // Pour les enfants, référence au module parent
}

interface Props {
  modules: ReportModule[];
  selectedModuleId: string | null;
  readonly?: boolean;
}

interface Emits {
  (e: 'select', moduleId: string): void;
  (e: 'delete', moduleId: string): void;
  (e: 'toggle-pdf', moduleId: string, include: boolean): void;
  (e: 'reorder', moduleIds: string[]): void;
  (e: 'add'): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<Emits>();

// État local
const searchQuery = ref('');
const expandedNodes = ref<Set<string>>(new Set(['folder-general']));
const viewMode = ref<'tree' | 'list'>('tree');

// Toggle l'expansion d'un nœud
function toggleNode(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId);
  } else {
    expandedNodes.value.add(nodeId);
  }
  // Force reactivity
  expandedNodes.value = new Set(expandedNodes.value);
}

// Vérifier si un nœud est expandé
function isExpanded(nodeId: string): boolean {
  return expandedNodes.value.has(nodeId);
}

// Modules généraux (sans entité liée)
const generalModules = computed(() => 
  props.modules.filter(m => !m.entityId)
);

// Modules liés à des entités
const entityModulesMap = computed(() => {
  const map = new Map<string, { entity: any; modules: ReportModule[] }>();
  
  for (const module of props.modules) {
    if (module.entityId && module.entity) {
      if (!map.has(module.entityId)) {
        map.set(module.entityId, {
          entity: module.entity,
          modules: [],
        });
      }
      map.get(module.entityId)!.modules.push(module);
    }
  }
  
  return map;
});

// Construction de l'arbre complet
const treeNodes = computed<TreeNode[]>(() => {
  const nodes: TreeNode[] = [];
  
  // Dossier des modules généraux
  if (generalModules.value.length > 0) {
    const childNodes = generalModules.value.map(m => createModuleNode(m));
    const totalItems = childNodes.reduce((sum, n) => sum + (n.badge ? Number(n.badge) : 0), 0);
    
    nodes.push({
      id: 'folder-general',
      label: 'Modules généraux',
      type: 'folder',
      icon: '📁',
      expanded: isExpanded('folder-general'),
      selected: false,
      badge: generalModules.value.length,
      badgeType: 'info',
      children: childNodes,
    });
  }
  
  // Dossiers par entité liée
  for (const [entityId, { entity, modules }] of entityModulesMap.value) {
    const folderId = `folder-entity-${entityId}`;
    nodes.push({
      id: folderId,
      label: entity.label,
      type: 'folder',
      icon: getEntityTypeIcon(entity.type),
      expanded: isExpanded(folderId),
      selected: false,
      badge: modules.length,
      badgeType: 'primary',
      children: modules.map(m => createModuleNode(m)),
    });
  }
  
  return nodes;
});

// Créer un nœud de module avec tous ses enfants
function createModuleNode(module: ReportModule): TreeNode {
  const children: TreeNode[] = [];
  const payload = module.payload || {};
  
  // Extraire le contenu selon le type de module
  const moduleType = module.type as ReportModuleType;
  
  // 1. Findings (entités identifiées, résultats de recherche)
  if (payload.findings && Array.isArray(payload.findings)) {
    const findings = payload.findings as Finding[];
    findings.forEach((finding, index) => {
      children.push({
        id: `${module.id}-finding-${index}`,
        label: finding.label || `Élément ${index + 1}`,
        type: 'finding',
        icon: getConfidenceIcon(finding.confidence),
        expanded: false,
        selected: false,
        data: finding,
        moduleId: module.id,
        badge: finding.sources?.length ? `${finding.sources.length} src` : undefined,
      });
    });
  }
  
  // 2. Entities (module "entities" - entités concernées)
  if (payload.entities && Array.isArray(payload.entities)) {
    payload.entities.forEach((entity: any, index: number) => {
      children.push({
        id: `${module.id}-entity-${index}`,
        label: entity.label || entity.entityId || `Entité ${index + 1}`,
        type: 'entity',
        icon: '👤',
        expanded: false,
        selected: false,
        data: entity,
        moduleId: module.id,
      });
    });
  }
  
  // 3. Blocs de texte enrichi
  if (payload.richTextBlocks && Array.isArray(payload.richTextBlocks)) {
    const blocks = payload.richTextBlocks as RichTextBlock[];
    blocks.forEach((block, index) => {
      children.push({
        id: `${module.id}-textblock-${index}`,
        label: block.title || `Bloc ${index + 1}`,
        type: 'textblock',
        icon: '📝',
        expanded: false,
        selected: false,
        data: block,
        moduleId: module.id,
      });
    });
  }
  
  // 4. Objectifs
  if (payload.objectives && Array.isArray(payload.objectives)) {
    payload.objectives.forEach((objective: string, index: number) => {
      children.push({
        id: `${module.id}-objective-${index}`,
        label: objective.substring(0, 50) + (objective.length > 50 ? '...' : ''),
        type: 'objective',
        icon: '🎯',
        expanded: false,
        selected: false,
        data: objective,
        moduleId: module.id,
      });
    });
  }
  
  // 5. Conclusions / Statements
  if (payload.statements && Array.isArray(payload.statements)) {
    payload.statements.forEach((statement: string, index: number) => {
      children.push({
        id: `${module.id}-statement-${index}`,
        label: statement.substring(0, 50) + (statement.length > 50 ? '...' : ''),
        type: 'statement',
        icon: '✅',
        expanded: false,
        selected: false,
        data: statement,
        moduleId: module.id,
      });
    });
  }
  
  // 6. Investigation leads
  if (payload.leads && Array.isArray(payload.leads)) {
    payload.leads.forEach((lead: any, index: number) => {
      children.push({
        id: `${module.id}-lead-${index}`,
        label: lead.platform || lead.type || `Piste ${index + 1}`,
        type: 'lead',
        icon: getPriorityIcon(lead.priority),
        expanded: false,
        selected: false,
        data: lead,
        moduleId: module.id,
        badge: lead.priority,
        badgeType: getPriorityBadgeType(lead.priority),
      });
    });
  }
  
  // 7. Datasets (conservation des données)
  if (payload.datasets && Array.isArray(payload.datasets)) {
    payload.datasets.forEach((dataset: any, index: number) => {
      children.push({
        id: `${module.id}-dataset-${index}`,
        label: dataset.label || `Dataset ${index + 1}`,
        type: 'finding',
        icon: '💾',
        expanded: false,
        selected: false,
        data: dataset,
        moduleId: module.id,
      });
    });
  }
  
  // 8. Media items
  if (payload.items && Array.isArray(payload.items)) {
    payload.items.forEach((item: any, index: number) => {
      children.push({
        id: `${module.id}-media-${index}`,
        label: item.caption || `Média ${index + 1}`,
        type: 'finding',
        icon: '🖼️',
        expanded: false,
        selected: false,
        data: item,
        moduleId: module.id,
      });
    });
  }
  
  const moduleNodeId = `module-${module.id}`;
  
  return {
    id: module.id,
    label: module.title || getModuleLabel(module.type),
    type: 'module',
    icon: getModuleIcon(module.type),
    expanded: isExpanded(moduleNodeId),
    selected: props.selectedModuleId === module.id,
    data: module,
    includeInPdf: module.includeInPdf,
    badge: children.length > 0 ? children.length : undefined,
    children: children.length > 0 ? children : undefined,
  };
}

// Icône par type de module
function getModuleIcon(type: string): string {
  const meta = MODULE_TYPE_METADATA[type as ReportModuleType];
  return meta?.icon || '📦';
}

// Label par type de module
function getModuleLabel(type: string): string {
  const meta = MODULE_TYPE_METADATA[type as ReportModuleType];
  return meta?.label || type;
}

// Icône par type d'entité
function getEntityTypeIcon(type?: string): string {
  const icons: Record<string, string> = {
    PERSON: '👤',
    ORGANIZATION: '🏢',
    TELEPHONE: '📞',
    EMAIL: '📧',
    ACCOUNT: '🔐',
    ADDRESS: '📍',
    OTHER: '📄',
  };
  return icons[type || ''] || '👤';
}

// Icône par niveau de confiance
function getConfidenceIcon(confidence?: string): string {
  const icons: Record<string, string> = {
    confirmed: '✅',
    probable: '🔶',
    possible: '❓',
    unverified: '⚠️',
  };
  return icons[confidence || ''] || '🔍';
}

// Icône par plateforme/réseau social
function getPlatformIcon(platform?: string): string {
  if (!platform) return '🌐';
  
  const normalizedPlatform = platform.toLowerCase().trim();
  
  const icons: Record<string, string> = {
    facebook: '🔵',
    fb: '🔵',
    instagram: '📷',
    insta: '📷',
    ig: '📷',
    x: '✖️',
    twitter: '🐦',
    whatsapp: '📱',
    wa: '📱',
    telegram: '📨',
    tg: '📨',
    linkedin: '💼',
    tiktok: '🎵',
    snapchat: '👻',
    snap: '👻',
    youtube: '🔴',
    yt: '🔴',
    discord: '🎮',
    reddit: '🟠',
    pinterest: '📌',
    threads: '🧵',
    other: '🌐',
  };
  
  return icons[normalizedPlatform] || '🌐';
}

// Icône par priorité
function getPriorityIcon(priority?: string): string {
  const icons: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  return icons[priority || ''] || '🔗';
}

// Badge type par priorité
function getPriorityBadgeType(priority?: string): string {
  const types: Record<string, string> = {
    high: 'error',
    medium: 'warning',
    low: 'success',
  };
  return types[priority || ''] || 'ghost';
}

// Sélectionner un module
function selectModule(moduleId: string) {
  emit('select', moduleId);
}

// Gérer le drag-and-drop (vue liste)
function handleDragEnd() {
  const moduleIds = props.modules.map(m => m.id);
  emit('reorder', moduleIds);
}

// Gérer le drag-and-drop (vue arbre)
function handleTreeDragEnd(evt: any) {
  // evt contient oldIndex, newIndex et l'élément déplacé
  if (evt.oldIndex === evt.newIndex) return;
  
  const movedModuleId = evt.item?.__draggable_context?.element?.id;
  if (!movedModuleId) return;
  
  // Récupérer l'ordre actuel complet des IDs
  const allModuleIds = props.modules.map(m => m.id);
  
  // Trouver l'index actuel et le nouvel index dans la liste complète
  const currentIndex = allModuleIds.indexOf(movedModuleId);
  if (currentIndex === -1) return;
  
  // Calculer le nouvel index global basé sur le déplacement relatif
  const delta = evt.newIndex - evt.oldIndex;
  let newGlobalIndex = currentIndex + delta;
  
  // S'assurer que le nouvel index est dans les limites
  newGlobalIndex = Math.max(0, Math.min(allModuleIds.length - 1, newGlobalIndex));
  
  // Réorganiser
  const orderedIds = [...allModuleIds];
  orderedIds.splice(currentIndex, 1);
  orderedIds.splice(newGlobalIndex, 0, movedModuleId);
  
  emit('reorder', orderedIds);
}

// Récupérer les modules pour un dossier donné
function getModulesForFolder(folderId: string): ReportModule[] {
  if (folderId === 'folder-general') {
    return generalModules.value;
  }
  
  // Extraire l'entityId du folderId
  const entityId = folderId.replace('folder-entity-', '');
  const entityData = entityModulesMap.value.get(entityId);
  return entityData?.modules || [];
}

// Récupérer les enfants d'un module (findings, blocs texte, etc.)
interface ModuleChild {
  icon: string;
  label: string;
  tooltip: string;
  badge?: string;
  badgeType?: string;
}

function getModuleChildren(module: ReportModule): ModuleChild[] {
  const children: ModuleChild[] = [];
  const payload = module.payload || {};
  
  // Champs texte simples (summary, methodology, notes, context, etc.)
  // Ces champs apparaissent dans différents types de modules
  if (payload.summary && typeof payload.summary === 'string' && payload.summary.trim()) {
    children.push({
      icon: '📋',
      label: 'Résumé global',
      tooltip: 'Résumé global des recherches',
    });
  }
  
  if (payload.methodology && typeof payload.methodology === 'string' && payload.methodology.trim()) {
    children.push({
      icon: '⚙️',
      label: 'Méthodologie',
      tooltip: 'Méthodologie utilisée',
    });
  }
  
  if (payload.notes && typeof payload.notes === 'string' && payload.notes.trim()) {
    children.push({
      icon: '📝',
      label: 'Notes complémentaires',
      tooltip: 'Notes additionnelles',
    });
  }
  
  if (payload.context && typeof payload.context === 'string' && payload.context.trim()) {
    children.push({
      icon: '📖',
      label: 'Contexte',
      tooltip: 'Contexte de l\'analyse',
    });
  }
  
  // notFound (éléments non trouvés)
  if (payload.notFound && Array.isArray(payload.notFound) && payload.notFound.length > 0) {
    children.push({
      icon: '❌',
      label: `${payload.notFound.length} élément(s) non trouvé(s)`,
      tooltip: 'Éléments recherchés mais non trouvés',
    });
  }
  
  // Findings - utiliser l'icône de la plateforme pour platform_analysis
  if (payload.findings && Array.isArray(payload.findings)) {
    const isPlatformAnalysis = module.type === 'platform_analysis';
    // Chercher la plateforme dans payload.platform ou dans le titre du module
    let detectedPlatform = payload.platform;
    if (!detectedPlatform && isPlatformAnalysis && module.title) {
      // Essayer de détecter la plateforme dans le titre du module
      const titleLower = module.title.toLowerCase();
      const platforms = ['facebook', 'instagram', 'twitter', 'x', 'whatsapp', 'telegram', 'linkedin', 'tiktok', 'snapchat', 'youtube', 'discord', 'reddit'];
      detectedPlatform = platforms.find(p => titleLower.includes(p));
    }
    const platformIcon = isPlatformAnalysis ? getPlatformIcon(detectedPlatform) : null;
    
    (payload.findings as Finding[]).forEach((finding, i) => {
      children.push({
        icon: platformIcon || getConfidenceIcon(finding.confidence),
        label: finding.label || `Élément ${i + 1}`,
        tooltip: isPlatformAnalysis 
          ? `${detectedPlatform || 'Plateforme'} - ${finding.confidence || 'non vérifié'}`
          : 'Élément identifié',
        badge: finding.sources?.length ? `${finding.sources.length} src` : undefined,
      });
    });
  }
  
  // Entities
  if (payload.entities && Array.isArray(payload.entities)) {
    payload.entities.forEach((entity: any, i: number) => {
      children.push({
        icon: '👤',
        label: entity.label || entity.entityId || `Entité ${i + 1}`,
        tooltip: 'Entité concernée',
      });
    });
  }
  
  // Rich text blocks
  if (payload.richTextBlocks && Array.isArray(payload.richTextBlocks)) {
    (payload.richTextBlocks as RichTextBlock[]).forEach((block, i) => {
      children.push({
        icon: '📝',
        label: block.title || `Bloc ${i + 1}`,
        tooltip: 'Bloc de texte enrichi',
      });
    });
  }
  
  // Objectives
  if (payload.objectives && Array.isArray(payload.objectives)) {
    payload.objectives.forEach((obj: string, i: number) => {
      children.push({
        icon: '🎯',
        label: obj.substring(0, 40) + (obj.length > 40 ? '...' : ''),
        tooltip: 'Objectif',
      });
    });
  }
  
  // Statements / Conclusions
  if (payload.statements && Array.isArray(payload.statements)) {
    payload.statements.forEach((stmt: string, i: number) => {
      children.push({
        icon: '✅',
        label: stmt.substring(0, 40) + (stmt.length > 40 ? '...' : ''),
        tooltip: 'Conclusion',
      });
    });
  }
  
  // Leads
  if (payload.leads && Array.isArray(payload.leads)) {
    payload.leads.forEach((lead: any, i: number) => {
      children.push({
        icon: getPriorityIcon(lead.priority),
        label: lead.platform || lead.type || `Piste ${i + 1}`,
        tooltip: 'Piste d\'investigation',
        badge: lead.priority,
        badgeType: getPriorityBadgeType(lead.priority),
      });
    });
  }
  
  // Datasets
  if (payload.datasets && Array.isArray(payload.datasets)) {
    payload.datasets.forEach((ds: any, i: number) => {
      children.push({
        icon: '💾',
        label: ds.label || `Dataset ${i + 1}`,
        tooltip: 'Données conservées',
      });
    });
  }
  
  // Media items
  if (payload.items && Array.isArray(payload.items)) {
    payload.items.forEach((item: any, i: number) => {
      children.push({
        icon: '🖼️',
        label: item.caption || `Média ${i + 1}`,
        tooltip: 'Média',
      });
    });
  }
  
  return children;
}

// Filtrer par recherche
const filteredModules = computed(() => {
  if (!searchQuery.value.trim()) return props.modules;
  
  const query = searchQuery.value.toLowerCase();
  return props.modules.filter(m => 
    m.title?.toLowerCase().includes(query) ||
    getModuleLabel(m.type).toLowerCase().includes(query)
  );
});

// Nombre de modules inclus dans le PDF
const pdfModulesCount = computed(() => props.modules.filter(m => m.includeInPdf).length);

// Gérer le clic sur un module
function handleModuleClick(node: TreeNode) {
  if (node.type === 'module' && node.id) {
    selectModule(node.id);
  }
}

// Tooltip pour un enfant de module
function getChildTooltip(child: TreeNode): string {
  const tooltips: Record<NodeType, string> = {
    finding: 'Élément identifié',
    entity: 'Entité concernée',
    textblock: 'Bloc de texte enrichi',
    objective: 'Objectif de recherche',
    statement: 'Conclusion',
    lead: 'Piste d\'investigation',
    folder: 'Dossier',
    module: 'Module',
  };
  return tooltips[child.type] || '';
}

// Résumé du contenu d'un module (pour TreeNode)
function getModuleContentSummary(module: TreeNode | ReportModule): string {
  // Pour TreeNode
  if ('children' in module && module.children) {
    if (module.children.length === 0) return 'Module vide';
    
    const counts: Record<string, number> = {};
    for (const child of module.children) {
      const type = (child as TreeNode).type;
      counts[type] = (counts[type] || 0) + 1;
    }
    
    const labels: Record<string, string> = {
      finding: 'élément(s)',
      entity: 'entité(s)',
      textblock: 'bloc(s) de texte',
      objective: 'objectif(s)',
      statement: 'conclusion(s)',
      lead: 'piste(s)',
    };
    
    const parts: string[] = [];
    for (const [type, count] of Object.entries(counts)) {
      const label = labels[type] || type;
      parts.push(`${count} ${label}`);
    }
    
    return parts.join(', ');
  }
  
  // Pour ReportModule
  const payload = (module as ReportModule).payload || {};
  const items: string[] = [];
  
  if (payload.findings?.length) items.push(`${payload.findings.length} élément(s)`);
  if (payload.entities?.length) items.push(`${payload.entities.length} entité(s)`);
  if (payload.richTextBlocks?.length) items.push(`${payload.richTextBlocks.length} bloc(s) de texte`);
  if (payload.objectives?.length) items.push(`${payload.objectives.length} objectif(s)`);
  if (payload.statements?.length) items.push(`${payload.statements.length} conclusion(s)`);
  if (payload.leads?.length) items.push(`${payload.leads.length} piste(s)`);
  if (payload.datasets?.length) items.push(`${payload.datasets.length} dataset(s)`);
  if (payload.items?.length) items.push(`${payload.items.length} média(s)`);
  
  return items.length > 0 ? items.join(', ') : '';
}
</script>

<template>
  <div class="module-tree-sidebar flex flex-col h-full">
    <!-- Header -->
    <div class="px-3 py-2 border-b border-base-300 bg-base-200">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold text-sm flex items-center gap-2">
          <span>🌳</span>
          <span>Structure</span>
          <span class="text-xs font-normal text-base-content/60">({{ modules.length }})</span>
        </h3>
        <div class="flex items-center gap-1">
          <!-- Toggle vue arbre/liste -->
          <div class="btn-group btn-group-xs">
            <button 
              class="btn btn-xs"
              :class="{ 'btn-active': viewMode === 'tree' }"
              @click="viewMode = 'tree'"
              title="Vue arborescente"
            >
              🌳
            </button>
            <button 
              class="btn btn-xs"
              :class="{ 'btn-active': viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="Vue liste"
            >
              📋
            </button>
          </div>
          <button 
            v-if="!readonly" 
            class="btn btn-primary btn-xs" 
            @click="emit('add')"
          >
            +
          </button>
        </div>
      </div>
      
      <!-- Recherche -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher..."
          class="input input-xs input-bordered w-full pl-7"
        />
        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs">🔍</span>
      </div>
    </div>
    
    <!-- Infos PDF -->
    <div class="px-3 py-1.5 bg-base-100 border-b border-base-200 text-xs text-base-content/60">
      📄 {{ pdfModulesCount }}/{{ modules.length }} module(s) dans le PDF
    </div>

    <!-- Vue arborescente -->
    <div v-if="viewMode === 'tree'" class="flex-1 overflow-y-auto p-2">
      <div v-if="treeNodes.length === 0" class="text-center py-8 text-base-content/50 text-sm">
        Aucun module
      </div>
      
      <!-- Niveau 1: Dossiers (Modules généraux, Entités) -->
      <div v-for="folder in treeNodes" :key="folder.id" class="mb-2">
        <!-- En-tête du dossier -->
        <div 
          class="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
          @click="toggleNode(folder.id)"
        >
          <button class="w-4 h-4 flex items-center justify-center transition-transform duration-200"
                  :class="{ 'rotate-90': folder.expanded }">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <span class="text-base">{{ folder.icon }}</span>
          <span class="flex-1 text-sm font-medium truncate">{{ folder.label }}</span>
          <span v-if="folder.badge" class="badge badge-xs" :class="`badge-${folder.badgeType || 'primary'}`">{{ folder.badge }}</span>
        </div>
        
        <!-- Niveau 2: Modules avec drag-and-drop -->
        <Transition name="tree-expand">
          <div 
            v-if="folder.expanded && folder.children" 
            class="ml-4 pl-2 border-l border-base-300"
            :data-folder-id="folder.id"
          >
            <VueDraggable
              :model-value="getModulesForFolder(folder.id)"
              item-key="id"
              handle=".drag-handle"
              group="modules"
              :disabled="readonly"
              @end="handleTreeDragEnd"
              class="min-h-[20px]"
            >
              <template #item="{ element: moduleNode }">
                <div class="mt-0.5">
                  <!-- En-tête du module -->
                  <div 
                    class="group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                    :class="{
                      'bg-primary/10 border-l-2 border-primary': selectedModuleId === moduleNode.id,
                      'hover:bg-base-200': selectedModuleId !== moduleNode.id,
                    }"
                    @click.stop="selectModule(moduleNode.id)"
                  >
                    <!-- Chevron si enfants -->
                    <button 
                      v-if="getModuleChildren(moduleNode).length > 0"
                      class="w-4 h-4 flex items-center justify-center transition-transform duration-200"
                      :class="{ 'rotate-90': isExpanded(`module-${moduleNode.id}`) }"
                      @click.stop="toggleNode(`module-${moduleNode.id}`)"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <span v-else class="w-4"></span>
                    
                    <!-- Drag handle -->
                    <div v-if="!readonly" class="drag-handle cursor-move opacity-0 group-hover:opacity-50 hover:opacity-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                      </svg>
                    </div>
                    
                    <span class="text-base flex-shrink-0">{{ getModuleIcon(moduleNode.type) }}</span>
                    <span class="flex-1 text-sm truncate">{{ moduleNode.title || getModuleLabel(moduleNode.type) }}</span>
                    
                    <!-- Badge nombre d'enfants -->
                    <span v-if="getModuleChildren(moduleNode).length > 0" class="badge badge-xs badge-accent">
                      {{ getModuleChildren(moduleNode).length }}
                    </span>
                    
                    <!-- Checkbox PDF -->
                    <input 
                      v-if="!readonly"
                      type="checkbox" 
                      :checked="moduleNode.includeInPdf"
                      @click.stop="emit('toggle-pdf', moduleNode.id, !moduleNode.includeInPdf)"
                      class="checkbox checkbox-xs"
                      title="Inclure dans le PDF"
                    />
                    
                    <!-- Bouton supprimer -->
                    <button
                      v-if="!readonly"
                      class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 hover:text-error"
                      @click.stop="emit('delete', moduleNode.id)"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <!-- Niveau 3: Enfants du module (findings, blocs texte, etc.) -->
                  <Transition name="tree-expand">
                    <div 
                      v-if="getModuleChildren(moduleNode).length > 0 && isExpanded(`module-${moduleNode.id}`)" 
                      class="ml-6 pl-2 border-l border-base-200"
                    >
                      <div 
                        v-for="(child, childIndex) in getModuleChildren(moduleNode)" 
                        :key="`${moduleNode.id}-child-${childIndex}`"
                        class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-base-200 cursor-pointer transition-colors"
                        :title="child.tooltip"
                      >
                        <span class="flex-shrink-0">{{ child.icon }}</span>
                        <span class="flex-1 truncate text-base-content/80">{{ child.label }}</span>
                        <span v-if="child.badge" class="badge badge-xs" :class="`badge-${child.badgeType || 'ghost'}`">{{ child.badge }}</span>
                      </div>
                    </div>
                  </Transition>
                </div>
              </template>
            </VueDraggable>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Vue liste (mode classique) -->
    <div v-else class="flex-1 overflow-y-auto">
      <VueDraggable
        :model-value="filteredModules"
        item-key="id"
        handle=".drag-handle"
        @end="handleDragEnd"
        class="divide-y divide-base-200"
      >
        <template #item="{ element: module }">
          <div
            class="group p-3 cursor-pointer transition-colors hover:bg-base-200"
            :class="{ 'bg-primary/10 border-l-4 border-primary': selectedModuleId === module.id }"
            @click="selectModule(module.id)"
          >
            <div class="flex items-start gap-2">
              <div v-if="!readonly" class="drag-handle cursor-move mt-1 opacity-50 hover:opacity-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg">{{ getModuleIcon(module.type) }}</span>
                  <span class="font-semibold text-sm truncate">{{ module.title }}</span>
                </div>
                <div class="text-xs text-base-content/60 truncate">
                  {{ getModuleLabel(module.type) }}
                </div>
                <div v-if="module.entity" class="text-xs text-accent mt-1">
                  📌 {{ module.entity.label }}
                </div>
                <!-- Résumé du contenu -->
                <div class="text-xs text-base-content/50 mt-1">
                  {{ getModuleContentSummary(module) }}
                </div>
              </div>
              
              <div v-if="!readonly && module.type !== 'sign_off'" class="flex items-center gap-1">
                <input
                  type="checkbox"
                  :checked="module.includeInPdf"
                  @click.stop="emit('toggle-pdf', module.id, !module.includeInPdf)"
                  class="checkbox checkbox-sm"
                  title="Inclure dans le PDF"
                />
              </div>
              
              <button
                v-if="!readonly"
                class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 hover:text-error"
                @click.stop="emit('delete', module.id)"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
        </template>
      </VueDraggable>
    </div>
  </div>
</template>

<style scoped>
.module-tree-sidebar {
  background: oklch(var(--b1));
}

/* Animations d'expansion */
.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.tree-expand-enter-from,
.tree-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-4px);
}

.tree-expand-enter-to,
.tree-expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
