/**
 * Types pour les composants d'arborescence
 */

export interface TreeNodeData {
  id: string;
  label: string;
  type: 'report' | 'entity' | 'module' | 'finding' | 'folder';
  icon?: string;
  children?: TreeNodeData[];
  data?: Record<string, any>;
  draggable?: boolean;
  droppable?: boolean;
  expanded?: boolean;
  selected?: boolean;
  badge?: string | number;
  badgeType?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
}

export interface TreeContextMenuEvent {
  node: TreeNodeData;
  position: { x: number; y: number };
}

export interface DragDropResult {
  success: boolean;
  action: 'move' | 'reorder' | 'insert';
  source: TreeNodeData;
  target: TreeNodeData;
  position: 'before' | 'after' | 'inside';
}
