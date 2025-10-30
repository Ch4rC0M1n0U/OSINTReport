# 📝 Ajout de blocs de texte enrichi dans les modules de rapport

**Date :** 30 octobre 2025  
**Statut :** 🟡 En cours - 5/6 modules complétés

## 🎯 Objectif

Ajouter un bouton "Ajouter un texte" avec un éditeur de texte riche (WYSIWYG) permettant d'insérer des entités, findings, etc. dans les modules de rapport suivants :

1. ✅ Conservation des données (DataRetentionModule)
2. ✅ Pistes d'enquête (InvestigationLeadsModule)
3. ✅ Objectifs OSINT (ObjectivesModule)
4. ✅ Vue d'ensemble d'une entité / Entités identifiées (EntityOverviewModule)
5. ⚠️ Recherche d'identifiant (IdentifierLookupModule) - **À COMPLÉTER**
6. ⚠️ Résumé des recherches / Entités concernées (ResearchSummaryModule) - **À COMPLÉTER**

## ✅ Ce qui a été fait

### 1. Backend - Types et interfaces

**Fichier :** `backend/src/modules/reports/report.types.ts`

#### Ajout du type RichTextBlock

```typescript
export interface RichTextBlock {
  id: string;
  title: string;
  content: string; // HTML du WYSIWYG editor
}
```

#### Mise à jour des payloads

Ajout de `richTextBlocks?: RichTextBlock[]` aux interfaces suivantes :

- ✅ `DataRetentionPayload`
- ✅ `InvestigationLeadsPayload`
- ✅ `ObjectivesPayload`
- ✅ `ResearchSummaryPayload`
- ✅ `EntityOverviewPayload`
- ✅ `IdentifierLookupPayload`

### 2. Frontend - Composables et composants réutilisables

#### Composable `useRichTextBlocks`

**Fichier :** `frontend/src/composables/useRichTextBlocks.ts`

```typescript
export interface RichTextBlock {
  id: string;
  title: string;
  content: string;
}

export function useRichTextBlocks(
  initialBlocks: RichTextBlock[] = [],
  onUpdate?: () => void
) {
  const richTextBlocks = ref<RichTextBlock[]>(initialBlocks);

  function addRichTextBlock() { /* ... */ }
  function deleteBlock(index: number) { /* ... */ }
  function moveBlockUp(index: number) { /* ... */ }
  function moveBlockDown(index: number) { /* ... */ }
  function setBlocks(blocks: RichTextBlock[]) { /* ... */ }

  return {
    richTextBlocks,
    addRichTextBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    setBlocks,
  };
}
```

#### Composant `RichTextBlockList`

**Fichier :** `frontend/src/components/shared/RichTextBlockList.vue`

Composant réutilisable qui affiche une liste de blocs de texte riche avec :
- Titre optionnel pour chaque bloc
- Boutons de déplacement (↑/↓)
- Bouton de suppression
- Éditeur WYSIWYG avec insertion d'entités

**Props :**
- `blocks`: RichTextBlock[]
- `readonly?`: boolean
- `placeholder?`: string
- `enableEntityInsertion?`: boolean (défaut: true)
- `reportId?`: string
- `findings?`: Finding[]

**Events :**
- `update`: Émis lors de modification
- `delete`: Émis lors de suppression (index)
- `move-up`: Émis pour déplacer vers le haut (index)
- `move-down`: Émis pour déplacer vers le bas (index)

### 3. Modules de rapport mis à jour

#### ✅ DataRetentionModule.vue

**Changements :**
1. Import des composables et composants
2. Ajout du bouton "Ajouter un texte" dans l'en-tête
3. Badge montrant le nombre de blocs de texte
4. Affichage du composant `RichTextBlockList`
5. Gestion des blocs dans `emitUpdate()` et `saveChanges()`

**Template - En-tête :**
```vue
<div class="flex items-center gap-2">
  <span class="text-lg font-semibold">🗄️ Conservation des données</span>
  <span class="badge badge-neutral">{{ datasets.length }}</span>
  <span v-if="richTextBlocks.length > 0" class="badge badge-info">
    {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
  </span>
</div>
<div class="flex items-center gap-2">
  <button
    v-if="!readonly"
    type="button"
    class="btn btn-sm btn-outline gap-2"
    @click="addRichTextBlock"
    title="Ajouter un bloc de texte enrichi"
  >
    <span>📝</span>
    <span>Ajouter un texte</span>
  </button>
  <!-- ... bouton Modifier ... -->
</div>
```

**Script - Imports et setup :**
```typescript
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

// Injecter les findings
const findings = inject<Finding[]>('reportFindings', []);

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || [], emitUpdate);

// Synchronisation
watch(
  () => props.modelValue,
  (newValue) => {
    datasets.value = newValue.datasets || [];
    if (newValue.richTextBlocks) {
      setBlocks(newValue.richTextBlocks);
    }
  },
  { deep: true }
);

// Émission avec richTextBlocks
function emitUpdate() {
  emit('update:modelValue', {
    datasets: datasets.value,
    richTextBlocks: richTextBlocks.value,
  });
}
```

#### ✅ InvestigationLeadsModule.vue

Structure identique à DataRetentionModule :
- Bouton "Ajouter un texte"
- Badge nombre de blocs
- Composant RichTextBlockList
- Gestion complète dans script

#### ✅ ObjectivesModule.vue

**Particularité :** Mode lecture/édition distinct

En mode lecture :
- Affiche les blocs en readonly
- Badge discret montrant le nombre de blocs

En mode édition :
- Bouton "Ajouter un texte" visible
- Blocs éditables
- Sauvegarde inclut les richTextBlocks

#### ✅ EntityOverviewModule.vue

**Particularité :** Pas de mode édition global, juste les modales pour les entités

- Bouton "Ajouter un texte" toujours visible (si !readonly)
- Blocs de texte affichés avant la liste des entités
- Props ajoutée : `reportId?: string`
- Fonction `emitUpdate()` mise à jour pour inclure richTextBlocks

## ⚠️ À compléter

### Module : IdentifierLookupModule.vue

**Fichier :** `frontend/src/components/modules/IdentifierLookupModule.vue`

**Modifications à apporter :**

1. **Imports à ajouter :**
```typescript
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';
```

2. **Props à ajouter :**
```typescript
const props = defineProps<{
  modelValue: {
    findings?: Finding[];
    richTextBlocks?: RichTextBlock[]; // AJOUTER
  };
  readonly?: boolean;
  reportId?: string;
}>();
```

3. **Setup du composable :**
```typescript
// Injecter les findings
const findings = inject<Finding[]>('reportFindings', []);

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || [], emitUpdate);
```

4. **Watch à mettre à jour :**
```typescript
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue?.findings || [];
    if (newValue?.richTextBlocks) {
      setBlocks(newValue.richTextBlocks);
    }
  },
  { immediate: true, deep: true }
);
```

5. **Fonction emitUpdate :**
```typescript
function emitUpdate() {
  emit('update:modelValue', {
    findings: findings.value,
    richTextBlocks: richTextBlocks.value,
  });
}
```

6. **Template - En-tête à modifier :**
```vue
<div class="flex items-center justify-between mb-4">
  <div class="flex items-center gap-2">
    <span class="text-lg font-semibold">🔍 Recherche d'identifiants</span>
    <span class="badge badge-neutral">{{ findings.length }}</span>
    <span v-if="richTextBlocks.length > 0" class="badge badge-info">
      {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
    </span>
  </div>
  <div class="flex items-center gap-2">
    <button
      v-if="!readonly"
      type="button"
      class="btn btn-sm btn-outline gap-2"
      @click="addRichTextBlock"
      title="Ajouter un bloc de texte enrichi"
    >
      <span>📝</span>
      <span>Ajouter un texte</span>
    </button>
    <button
      v-if="!readonly"
      type="button"
      class="btn btn-sm btn-primary gap-2"
      @click="openCreateModal"
    >
      <span>➕</span>
      <span>Nouvel identifiant</span>
    </button>
  </div>
</div>
```

7. **Template - Ajouter RichTextBlockList après l'en-tête :**
```vue
<!-- Blocs de texte enrichi -->
<RichTextBlockList
  v-if="richTextBlocks.length > 0"
  :blocks="richTextBlocks"
  :readonly="readonly"
  :report-id="reportId"
  :findings="findings"
  placeholder="Ajoutez des informations sur la recherche d'identifiants... Utilisez le bouton 👤 pour insérer des entités."
  class="mb-4"
  @update="emitUpdate"
  @delete="deleteBlock"
  @move-up="moveBlockUp"
  @move-down="moveBlockDown"
/>
```

### Module : ResearchSummaryModule.vue

**Fichier :** `frontend/src/components/modules/ResearchSummaryModule.vue`

**Note :** Ce module a une structure différente avec mode lecture/édition.

**Modifications à apporter :**

1. **Imports à ajouter :**
```typescript
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';
```

2. **Setup du composable :**
```typescript
// Injecter les findings
const findings = inject<Finding[]>('reportFindings', []);

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || []);
```

3. **Fonction startEditing à mettre à jour :**
```typescript
function startEditing() {
  editablePayload.value = {
    summary: props.modelValue?.summary || '',
    notFound: props.modelValue?.notFound ? [...props.modelValue.notFound] : [],
    methodology: props.modelValue?.methodology || '',
    notes: props.modelValue?.notes || '',
    richTextBlocks: props.modelValue?.richTextBlocks || [], // AJOUTER
  };
  if (props.modelValue?.richTextBlocks) {
    setBlocks(props.modelValue.richTextBlocks);
  }
  isEditing.value = true;
}
```

4. **Fonction saveChanges à mettre à jour :**
```typescript
async function saveChanges() {
  emit("update:modelValue", {
    summary: editablePayload.value.summary,
    notFound: editablePayload.value.notFound,
    methodology: editablePayload.value.methodology,
    notes: editablePayload.value.notes,
    richTextBlocks: richTextBlocks.value, // AJOUTER
  });
  isEditing.value = false;
}
```

5. **Template - Mode lecture - Ajouter avant les sections existantes :**
```vue
<div v-if="!isEditing" class="space-y-4">
  <!-- Blocs de texte enrichi -->
  <RichTextBlockList
    v-if="richTextBlocks.length > 0"
    :blocks="richTextBlocks"
    :readonly="true"
    :report-id="reportId"
    :findings="findings"
    placeholder="Informations complémentaires..."
    class="mb-4"
  />

  <!-- ... reste du contenu ... -->
</div>
```

6. **Template - Mode édition - Ajouter bouton dans l'en-tête et liste :**
```vue
<div v-else class="space-y-6">
  <!-- Bouton ajouter texte -->
  <div class="flex justify-end">
    <button
      type="button"
      @click="addRichTextBlock"
      class="btn btn-sm btn-outline gap-2"
    >
      <span>📝</span>
      <span>Ajouter un bloc de texte</span>
    </button>
  </div>

  <!-- Blocs de texte enrichi -->
  <RichTextBlockList
    v-if="richTextBlocks.length > 0"
    :blocks="richTextBlocks"
    :readonly="false"
    :report-id="reportId"
    :findings="findings"
    placeholder="Ajoutez des informations complémentaires..."
    class="mb-4"
    @update="() => {}"
    @delete="deleteBlock"
    @move-up="moveBlockUp"
    @move-down="moveBlockDown"
  />

  <!-- ... reste du formulaire ... -->
</div>
```

## 🔧 Synchronisation des types frontend

**IMPORTANT :** Les types doivent être synchronisés du backend vers le frontend.

**Fichier à mettre à jour :** `frontend/src/services/api/reports.ts`

Ajouter l'interface et mettre à jour les payloads :

```typescript
export interface RichTextBlock {
  id: string;
  title: string;
  content: string;
}

export interface DataRetentionPayload {
  datasets: Dataset[];
  richTextBlocks?: RichTextBlock[]; // AJOUTER
}

export interface InvestigationLeadsPayload {
  leads: InvestigationLead[];
  richTextBlocks?: RichTextBlock[]; // AJOUTER
}

export interface ObjectivesPayload {
  objectives: string[];
  richTextBlocks?: RichTextBlock[]; // AJOUTER
}

export interface ResearchSummaryPayload {
  summary: string;
  notFound: string[];
  methodology?: string;
  notes?: string;
  richTextBlocks?: RichTextBlock[]; // AJOUTER
}

export interface EntityOverviewPayload {
  entityId: string;
  context: string;
  findings: Finding[];
  notes?: string;
  richTextBlocks?: RichTextBlock[]; // AJOUTER
}

export interface IdentifierLookupPayload {
  identifierType: "phone" | "email" | "username" | "rrn" | "alias" | "other";
  identifierValue: string;
  findings: Finding[];
  notes?: string;
  richTextBlocks?: RichTextBlock[]; // AJOUTER
}
```

## 📋 Checklist finale

- [x] Créer le composable `useRichTextBlocks`
- [x] Créer le composant `RichTextBlockList`
- [x] Ajouter le type `RichTextBlock` dans le backend
- [x] Mettre à jour les payloads backend
- [x] Mettre à jour DataRetentionModule
- [x] Mettre à jour InvestigationLeadsModule
- [x] Mettre à jour ObjectivesModule
- [x] Mettre à jour EntityOverviewModule
- [ ] Mettre à jour IdentifierLookupModule ⚠️
- [ ] Mettre à jour ResearchSummaryModule ⚠️
- [ ] Synchroniser les types frontend ⚠️
- [ ] Tester chaque module
- [ ] Vérifier la persistence en base de données

## 🧪 Tests à effectuer

1. **Création de blocs :**
   - Cliquer sur "Ajouter un texte"
   - Vérifier qu'un nouveau bloc vide est créé

2. **Édition de blocs :**
   - Ajouter un titre
   - Ajouter du contenu avec formatage
   - Insérer une entité via le bouton 👤
   - Vérifier que les modifications sont sauvegardées

3. **Organisation des blocs :**
   - Déplacer un bloc vers le haut
   - Déplacer un bloc vers le bas
   - Supprimer un bloc

4. **Persistence :**
   - Sauvegarder le rapport
   - Recharger la page
   - Vérifier que les blocs sont toujours présents

5. **Mode lecture :**
   - Vérifier l'affichage readonly des blocs
   - Vérifier que les boutons d'édition ne sont pas visibles

## 📝 Notes

- Le composant `WysiwygEditor` est utilisé pour l'édition du contenu
- L'option `enableEntityInsertion` est activée par défaut
- Les blocs sont identifiés par un UUID généré avec `crypto.randomUUID()`
- Les findings sont injectés via le contexte avec `inject('reportFindings', [])`
- Le `reportId` est passé en prop pour permettre l'upload d'images dans l'éditeur

## 🚀 Prochaines étapes

1. Compléter les 2 derniers modules (IdentifierLookupModule, ResearchSummaryModule)
2. Synchroniser les types frontend
3. Tester l'ensemble des fonctionnalités
4. Vérifier la compatibilité avec le système d'indexation Meilisearch
5. Mettre à jour la documentation utilisateur
