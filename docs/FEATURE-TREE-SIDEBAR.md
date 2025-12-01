# 🌳 Gestion arborescente des modules OSINT

## Vue d'ensemble

Cette mise à jour ajoute une interface de gestion arborescente pour les entités, modules et findings dans les rapports OSINT. L'objectif est de faciliter la navigation et la réorganisation des éléments du rapport.

## Nouveaux composants

### 1. ModuleTreeSidebar (`/frontend/src/components/reports/ModuleTreeSidebar.vue`)

Composant principal qui remplace la liste linéaire des modules par une vue arborescente.

**Fonctionnalités :**

- 🔍 **Recherche intégrée** : Filtrer les modules par nom
- 🌳 **Vue arborescente** : Organisation hiérarchique par entité
- 📋 **Vue liste** : Mode classique pour compatibilité
- 🎯 **Drag-and-drop** : Réorganiser les modules par glisser-déposer
- 📄 **Gestion PDF** : Cocher/décocher les modules à inclure dans le PDF
- ➕ **Actions rapides** : Ajouter, supprimer des modules

**Structure de l'arbre :**

```
📋 Rapport OSINT
├── 📁 Modules généraux
│   ├── 📝 Résumé
│   ├── 🎯 Objectifs
│   └── ✅ Conclusions
├── 👤 John Doe (Personne)
│   ├── 👤 Vue d'ensemble
│   │   ├── ✅ Profil LinkedIn confirmé
│   │   └── 🔶 Compte Twitter probable
│   └── 🌐 Analyse Facebook
└── 🏢 ACME Corp (Organisation)
    └── 🌐 Site web
```

### 2. TreeNode (`/frontend/src/components/tree/TreeNode.vue`)

Composant récursif pour l'affichage d'un nœud de l'arbre.

**Props :**

- `node` : Données du nœud
- `level` : Niveau de profondeur (pour l'indentation)
- `isDragging` : État de drag en cours

**Événements :**

- `select` : Sélection d'un nœud
- `toggle` : Expansion/réduction
- `drag-start/end` : Début/fin du drag
- `drop` : Élément déposé
- `context-menu` : Menu contextuel

### 3. TreeContextMenu (`/frontend/src/components/tree/TreeContextMenu.vue`)

Menu contextuel avec actions selon le type de nœud.

**Actions disponibles :**
| Type | Actions |
|------|---------|
| Rapport | Ajouter module, Ajouter entité |
| Dossier | Ajouter élément |
| Entité | Ajouter module, Modifier, Supprimer |
| Module | Ajouter finding, Dupliquer, PDF, Supprimer |
| Finding | Modifier, Déplacer, Supprimer |

### 4. useTreeDragDrop (`/frontend/src/composables/useTreeDragDrop.ts`)

Composable pour la gestion du drag-and-drop.

**Fonctionnalités :**

- Contraintes de déplacement par type
- Feedback visuel
- Support multi-niveaux

## Utilisation

### Dans ReportDetailPage.vue

```vue
<ModuleTreeSidebar
  :modules="modules"
  :selected-module-id="selectedModuleId"
  :readonly="report?.isLocked"
  @select="selectModule"
  @delete="handleDeleteModule"
  @toggle-pdf="toggleIncludeInPdf"
  @reorder="handleReorderModulesFromTree"
  @add="openModuleDialog"
/>
```

## Basculer entre les modes

Deux modes de visualisation sont disponibles :

1. **Mode arbre** 🌳 : Organisation hiérarchique avec dossiers
2. **Mode liste** 📋 : Liste plate (comportement précédent)

Utilisez les boutons en haut de la sidebar pour basculer.

## Drag-and-drop

### Déplacer un module

1. Survolez le module
2. Cliquez sur l'icône de grip (≡)
3. Glissez vers la nouvelle position
4. Relâchez

### Contraintes

- Les modules ne peuvent être déplacés que vers des entités ou le dossier général
- Les findings ne peuvent être déplacés qu'entre modules
- Les entités ne peuvent pas être réorganisées (ordre alphabétique)

## API de types

```typescript
interface TreeNodeData {
  id: string;
  label: string;
  type: "report" | "entity" | "module" | "finding" | "folder";
  icon?: string;
  children?: TreeNodeData[];
  data?: Record<string, any>;
  draggable?: boolean;
  droppable?: boolean;
  expanded?: boolean;
  selected?: boolean;
  badge?: string | number;
  badgeType?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
}
```

## Améliorations futures

- [ ] Recherche avec mise en surbrillance des résultats
- [ ] Filtrage par type de module
- [ ] Multi-sélection pour actions groupées
- [ ] Raccourcis clavier (Ctrl+C/V pour copier/coller)
- [ ] Historique d'annulation (Ctrl+Z)
- [ ] Aperçu au survol
- [ ] Export de la structure en JSON/Markdown

## Tests

```bash
cd frontend
npm run test -- --grep "ModuleTreeSidebar"
```

## Compatibilité

- Vue 3.x
- TypeScript 5.x
- DaisyUI / TailwindCSS
- vuedraggable 4.x
