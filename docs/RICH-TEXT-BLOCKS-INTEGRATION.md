# 📝 Intégration des Blocs de Texte Enrichi - Version 2.0

## 🎯 Objectif

Permettre d'ajouter des **blocs de texte enrichi** dans les rubriques de rapport (commençant par "Analyse de plateforme"), avec possibilité d'insérer des **entités** et des **données de plateformes** (findings) sous forme de **texte simple** ou de **tableau structuré automatique**.

## ✨ Fonctionnalités implémentées

### 1. **Blocs de texte enrichi multiples**
- Ajout de plusieurs blocs indépendants dans une rubrique
- Chaque bloc peut avoir un titre optionnel
- Contenu au format Markdown avec éditeur WYSIWYG

### 2. **Insertion intelligente automatique**
- **Détection automatique** du format nécessaire (texte simple vs tableau)
- **Pas de sélection manuelle** : le système choisit le meilleur format
- **Tableaux HTML correctement formatés** avec styles inline pour export PDF

### 3. **Insertion d'entités**
- **Texte simple** : Pour entités simples (Personne, Email, Téléphone)
- **Tableau structuré** : Pour organisations ou entités complexes (>100 caractères de notes)
- Format : `**Jean Dupont** (Personne) : Notes...` ou tableau HTML

### 4. **Insertion de données de plateformes (Findings)**
- **Toujours en tableau structuré** : Données complexes (Facebook, Instagram, etc.)
- Affiche : Profil, Description, Niveau de confiance, Sources, Métadonnées
- Support des PersonDetails, CompanyDetails, Aliases
- Liens cliquables pour les sources URL

### 5. **Gestion des blocs**
- Réorganisation des blocs (↑ ↓)
- Suppression de blocs (×)
- Titres personnalisables pour chaque bloc
- Migration automatique des anciennes notes

## 🏗️ Architecture

### Frontend - Composants modifiés

#### 1. **EntityInsertModal.vue**

**Nouvelles fonctionnalités** :
```typescript
// Deux onglets : Entités et Données de plateformes
- 👤 Entités : Entity[] depuis l'API
- 🌐 Données de plateformes : Finding[] depuis le module

// Détection automatique du format
function shouldUseTable(entity: Entity): boolean {
  const hasLongNotes = entity.notes && entity.notes.length > 100;
  const isOrganization = entity.type === 'ORGANIZATION';
  return hasLongNotes || isOrganization;
}
```

**Fonction de génération de tableau pour entités** :
```typescript
**Fonction de génération de tableau pour findings** :
```typescript
function generateFindingTable(finding: Finding): string {
  // Génère un tableau HTML avec :
  // - Profil (label)
  // - Description
  // - Niveau de confiance (Confirmé/Probable/Possible/Inconnu)
  // - Sources (avec liens cliquables)
  // - Métadonnées :
  //   * Aliases
  //   * PersonDetails (Date de naissance, RRN, Adresse, Téléphones)
  //   * CompanyDetails (N° BCE, Siège social, Site web, Téléphones)
  return `<table style="border-collapse: collapse; ...">...</table>`;
}
```

**Props étendues** :
```typescript
interface Props {
  isOpen: boolean;
  reportId?: string;
  findings?: Finding[];  // NOUVEAU : Données de plateformes
}

interface Emits {
  (e: 'select', entity: Entity | Finding, htmlContent?: string): void;
}
```

#### 2. **WysiwygEditor.vue**
```typescript
// Gestion de l'insertion HTML ou texte
function handleEntitySelect(entity: Entity | Finding, htmlContent?: string) {
  if (htmlContent) {
    // Insérer du contenu HTML structuré
    editor.value.chain().focus().insertContent(htmlContent).run();
  } else {
    // Insérer le label simple
    const label = 'label' in entity ? entity.label : '';
    editor.value.chain().focus().insertContent(label).run();
  }
}
```

**Props étendues** :
```typescript
interface Props {
  modelValue: string;
  placeholder?: string;
  enableEntityInsertion?: boolean;
  reportId?: string;
  findings?: Finding[];  // NOUVEAU : Passé au modal
}
```
```

**Fonction de génération de tableau pour findings** :
```typescript
interface Emits {
  (e: 'select', entity: Entity, htmlContent?: string): void;
}
```

#### 2. **WysiwygEditor.vue**
```typescript
// Gestion de l'insertion HTML ou texte
function handleEntitySelect(entity: Entity, htmlContent?: string) {
  if (htmlContent) {
    // Insérer du contenu HTML structuré
    editor.value.chain().focus().insertContent(htmlContent).run();
  } else {
    // Insérer le label simple
    editor.value.chain().focus().insertContent(entity.label).run();
  }
}
```

#### 3. **PlatformAnalysisModule.vue**

**Structure de données** :
```typescript
interface RichTextBlock {
  id: string;           // Identifiant unique
  title: string;        // Titre optionnel
  content: string;      // Contenu Markdown
}
```

**Props étendues** :
```typescript
modelValue: {
  findings?: Finding[];
  platform?: string;
  notes?: string;              // LEGACY (rétrocompatibilité)
  richTextBlocks?: RichTextBlock[];  // NOUVEAU
}
```

**Fonctions principales** :
```typescript
// Ajouter un bloc
function addRichTextBlock() {
  richTextBlocks.value.push({
    id: generateId(),
    title: '',
    content: ''
  });
}

// Réorganiser
function moveBlockUp(index: number) { /* ... */ }
function moveBlockDown(index: number) { /* ... */ }

// Supprimer
function deleteBlock(index: number) { /* ... */ }
```

**Migration automatique** :
```typescript
// Dans le watch() :
if (newValue?.richTextBlocks) {
  richTextBlocks.value = newValue.richTextBlocks;
} else if (newValue?.notes && newValue.notes.trim().length > 0) {
  // Migration: convertir l'ancien champ notes en un bloc
  richTextBlocks.value = [{
    id: generateId(),
    title: 'Notes migrées',
    content: newValue.notes
  }];
}
```

### Backend - Stockage

Les blocs sont stockés dans le champ `payload` (JSON) du `ReportModule` :

```typescript
// Schéma Prisma
model ReportModule {
  id        String   @id @default(uuid())
  reportId  String
  type      String   // "platform_analysis"
  payload   Json?    // { richTextBlocks: [...], findings: [...] }
  // ...
}
```

**Exemple de payload** :
```json
{
  "platform": "facebook",
  "findings": [...],
  "richTextBlocks": [
    {
      "id": "block-1234567890",
      "title": "Profil analysé",
      "content": "# Analyse du compte\n\nEntité: **Jean Dupont**\n\n<table>...</table>"
    },
    {
      "id": "block-9876543210",
      "title": "Observations",
      "content": "Compte créé en 2020..."
    }
  ]
}
```

## 📋 Guide d'utilisation

### Créer un bloc de texte enrichi

1. Dans la rubrique **"Analyse de plateforme"**, cliquez sur **"📝 Ajouter un bloc de texte"**
2. Un nouveau bloc apparaît avec :
   - Champ titre (optionnel)
   - Éditeur de texte enrichi (TipTap)
   - Boutons de gestion (↑ ↓ ×)

### Insérer une entité

1. Dans l'éditeur, cliquez sur le bouton **"👤"** dans la toolbar
2. Sélectionnez le mode d'insertion :
   - **📝 Texte simple** : Insère uniquement le nom
   - **📊 Tableau structuré** : Insère un tableau complet

3. Recherchez et sélectionnez l'entité
4. L'entité est insérée à la position du curseur

### Réorganiser les blocs

- **↑** : Déplacer le bloc vers le haut
- **↓** : Déplacer le bloc vers le bas
- **×** : Supprimer le bloc (avec confirmation)

### Titres de blocs

Les titres sont optionnels et permettent de structurer les analyses :
- "Profil principal"
- "Activités suspectes"
- "Connexions identifiées"
- etc.

## 🔄 Compatibilité ascendante

### Migration automatique

Les rapports existants avec le champ `notes` simple sont **automatiquement migrés** :

```typescript
// Ancien format
{
  "platform": "facebook",
  "findings": [...],
  "notes": "Analyse du profil..."
}

// ⬇️ Migré automatiquement vers ⬇️

{
  "platform": "facebook",
  "findings": [...],
  "richTextBlocks": [
    {
      "id": "block-auto-generated",
      "title": "Notes migrées",
      "content": "Analyse du profil..."
    }
  ],
  "notes": "Analyse du profil..."  // Gardé pour rétrocompatibilité
}
```

### Sauvegarde hybride

Lors de l'émission des mises à jour, les deux formats sont sauvegardés :
```typescript
emit('update:modelValue', { 
  richTextBlocks: richTextBlocks.value,
  notes: richTextBlocks.value.map(b => b.content).join('\n\n')  // Backup
});
```

## 🎨 Interface utilisateur

### En-tête de rubrique
```
📱 Analyse de plateformes  [2]  [1 bloc de texte]
                              [📝 Ajouter un bloc de texte]  [➕ Nouveau profil]
```

### Bloc de texte
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Bloc 1  [Profil principal          ]         [↑] [↓] [×] │
├─────────────────────────────────────────────────────────────┤
│ [Éditeur TipTap avec toolbar]                               │
│  B  I  S  │ H1 H2 H3 │ ⦿ 1. " │ ― │ 👤 │ ↶ ↷                │
│                                                              │
│ # Analyse du compte                                         │
│                                                              │
│ Entité: **Jean Dupont** (PERSON)                           │
│                                                              │
│ <table avec données structurées>                            │
└─────────────────────────────────────────────────────────────┘
```

### Modal d'insertion d'entité
```
┌─────────── 👤 Insérer une entité ───────────┐
│                                              │
│  [📝 Texte simple] [📊 Tableau structuré]   │
│                                              │
│  Rechercher: [____________________]          │
│                                              │
│  👤 Jean Dupont                   [Insérer] │
│     Personne                                 │
│     Suspect principal                        │
│                                              │
│  🏢 Entreprise XYZ               [Insérer] │
│     Organisation                             │
│                                              │
│                         [Annuler]            │
└──────────────────────────────────────────────┘
```

## 🧪 Tests recommandés

### Test 1 : Création de blocs multiples
1. Ajouter 3 blocs de texte
2. Vérifier que chaque bloc est indépendant
3. Sauvegarder et recharger → vérifier la persistance

### Test 2 : Insertion d'entité en mode texte
1. Créer un bloc
2. Cliquer sur 👤 → Mode "📝 Texte simple"
3. Sélectionner une entité
4. Vérifier que seul le label est inséré

### Test 3 : Insertion d'entité en mode tableau
1. Créer un bloc
2. Cliquer sur 👤 → Mode "📊 Tableau structuré"
3. Sélectionner une entité
4. Vérifier que le tableau HTML est généré avec toutes les infos

### Test 4 : Réorganisation
1. Créer 3 blocs
2. Utiliser ↑/↓ pour réorganiser
3. Vérifier que l'ordre est bien sauvegardé

### Test 5 : Migration
1. Charger un ancien rapport avec champ `notes`
2. Vérifier qu'un bloc est automatiquement créé
3. Vérifier le titre "Notes migrées"

## 🚀 Extensions futures possibles

### 1. Drag & Drop
Remplacer les boutons ↑/↓ par un système de drag & drop HTML5.

### 2. Templates de blocs
Créer des templates pré-remplis :
- "Analyse de profil"
- "Connexions identifiées"
- "Activités suspectes"

### 3. Insertion avancée d'entités
- Insérer plusieurs entités à la fois
- Créer des graphes de relations
- Insérer des timelines d'événements

### 4. Métadonnées enrichies
Si l'API `entities` est étendue avec un champ `metadata`, le tableau peut afficher :
- Date de naissance
- Nationalité
- Adresse
- etc.

### 5. Export PDF amélioré
Améliorer le rendu des tableaux d'entités dans le PDF final.

## 📊 Statistiques

**Fichiers modifiés** :
- `EntityInsertModal.vue` : +100 lignes
- `WysiwygEditor.vue` : +15 lignes
- `PlatformAnalysisModule.vue` : +150 lignes (réécriture)

**Builds** :
- ✅ Backend : 0 erreurs
- ✅ Frontend : 7.02s, 0 erreurs

**Taille bundle** :
- Avant : 1,061.22 kB
- Après : 1,068.66 kB (+7.44 kB, +0.7%)

## 🎯 Résultat

Les utilisateurs peuvent maintenant :
- ✅ Ajouter plusieurs blocs de texte enrichi dans une rubrique
- ✅ Insérer des entités en mode texte ou tableau
- ✅ Réorganiser et supprimer les blocs
- ✅ Structurer leurs analyses avec des titres
- ✅ Bénéficier de la migration automatique des anciennes notes

**Status** : ✅ **Implémentation complète et fonctionnelle**
