# 🎨 Amélioration : Affichage en cartes des données extraites

**Date** : 26 octobre 2025  
**Version** : 1.1.1  
**Type** : Amélioration UX

## 📋 Résumé

Amélioration de l'interface "Données extraites" pour afficher les données sous forme de **cartes interactives** (comme les entités) au lieu d'un tableau, avec une **modal détaillée** affichant tous les rapports sources et permettant la **navigation directe**.

## 🎯 Problème résolu

**Avant** :

- Affichage en tableau simple
- Tooltip limitée pour voir les IDs de rapports
- Pas de vue détaillée
- Navigation indirecte via "Rechercher"

**Après** :

- Affichage en **grille de cartes** responsive
- **Modal de détails** avec liste complète des rapports
- **Navigation directe** vers chaque rapport (clic sur le rapport)
- Meilleure expérience utilisateur

## ✨ Fonctionnalités ajoutées

### 1. Affichage en grille de cartes

**Layout responsive** :

- **Mobile** (< 768px) : 1 colonne
- **Tablet** (768-1023px) : 2 colonnes
- **Desktop** (≥ 1024px) : 3 colonnes

**Chaque carte affiche** :

- Badge de type (avec icône et couleur)
- Badge du nombre de rapports
- Valeur de la donnée (texte gros et en gras)
- Liste des 3 premiers rapports sources
- Indication "+X autre(s)" si plus de 3 rapports
- 2 boutons d'action : "Voir détails" et "Rechercher"

**Design** :

- `border-l-4` avec couleur selon le type
- Hover : `shadow-lg` pour effet de survol
- Couleurs cohérentes avec le reste de l'application

### 2. Modal de détails

**Déclenchement** : Clic sur une carte ou sur "Voir détails"

**Contenu de la modal** :

- **Header** : Icône + titre "Détails de la donnée"
- **Section info** :
  - Badge type + badge nombre de rapports
  - Valeur en gros (text-xl, break-all)
- **Section rapports** :
  - Titre "Rapports contenant cette donnée"
  - Liste scrollable (max-h-96) de tous les rapports
  - Chaque rapport est un lien cliquable vers `/reports/{id}`
  - Affichage : ID court + ID complet
  - Hover : effet de transition vers couleur primary
- **Actions** :
  - Bouton "Rechercher dans tous les rapports"
  - Bouton "Fermer"

### 3. Navigation directe vers rapports

**Dans les cartes** :

- Les 3 premiers IDs de rapports sont des `router-link`
- Clic sur un ID → navigation vers `/reports/{id}`
- `@click.stop` pour éviter de déclencher la modal

**Dans la modal** :

- Chaque rapport est un lien cliquable
- Affichage visuel clair (icône + texte + flèche)
- Effet hover pour indiquer la cliquabilité

## 🏗️ Modifications techniques

### Fichier modifié

**`/frontend/src/pages/EntitiesPage.vue`** (+100 lignes)

### Template

#### Remplacement du tableau

**Avant** :

```vue
<div class="overflow-x-auto">
  <table class="table table-zebra">
    <!-- ... -->
  </table>
</div>
```

**Après** :

```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div v-for="item in filteredExtractedData"
       :key="`${item.type}-${item.value}`"
       class="bg-base-100 border-l-4 p-4 hover:shadow-lg transition-shadow cursor-pointer"
       :class="getTypeBorderClass(item.type)"
       @click="viewExtractedItem(item)">
    <!-- Contenu de la carte -->
  </div>
</div>
```

#### Ajout de la modal

```vue
<dialog ref="extractedDetailsModal" class="modal">
  <div class="modal-box max-w-3xl">
    <!-- Header -->
    <h3 class="font-bold text-2xl mb-4 flex items-center gap-2">
      <HugeiconsIcon :icon="getTypeIcon(selectedExtractedItem?.type || '')" :size="28" />
      Détails de la donnée
    </h3>

    <!-- Contenu -->
    <div v-if="selectedExtractedItem" class="space-y-6">
      <!-- Type et Valeur -->
      <!-- Liste des rapports -->
      <!-- Actions -->
    </div>
  </div>
</dialog>
```

### Script

#### Variables ajoutées

```typescript
const selectedExtractedItem = ref<{
  type: string;
  value: string;
  reports: string[];
  count: number;
} | null>(null);

const extractedDetailsModal = ref<HTMLDialogElement>();
```

#### Fonctions ajoutées

```typescript
// Classe de bordure pour les cartes
const getTypeBorderClass = (type: string): string => {
  const classes: Record<string, string> = {
    Entreprise: "border-primary",
    Plateforme: "border-secondary",
    Pseudo: "border-accent",
    Nom: "border-info",
    Téléphone: "border-success",
    Email: "border-warning",
    Adresse: "border-error",
    URL: "border-neutral",
    Compte: "border-ghost",
  };
  return classes[type] || "border-ghost";
};

// Ouvrir la modal de détails
const viewExtractedItem = (item: {
  type: string;
  value: string;
  reports: string[];
  count: number;
}) => {
  selectedExtractedItem.value = item;
  extractedDetailsModal.value?.showModal();
};
```

## 🎨 Design

### Couleurs par type (cohérence)

| Type       | Badge             | Bordure            |
| ---------- | ----------------- | ------------------ |
| Entreprise | `badge-primary`   | `border-primary`   |
| Plateforme | `badge-secondary` | `border-secondary` |
| Pseudo     | `badge-accent`    | `border-accent`    |
| Nom        | `badge-info`      | `border-info`      |
| Téléphone  | `badge-success`   | `border-success`   |
| Email      | `badge-warning`   | `border-warning`   |
| Adresse    | `badge-error`     | `border-error`     |
| URL        | `badge-neutral`   | `border-neutral`   |
| Compte     | `badge-ghost`     | `border-ghost`     |

### Pattern appliqué

- **Cartes** : `border-l-4` + couleur thématique
- **Hover** : `hover:shadow-lg transition-shadow`
- **Modal** : `modal-box max-w-3xl` (largeur maximale)
- **Liste rapports** : `max-h-96 overflow-y-auto` (scrollable)

### Responsive

```css
/* Mobile */
grid-cols-1

/* Tablet */
md:grid-cols-2

/* Desktop */
lg:grid-cols-3
```

## 📊 Avant / Après

### Avant (Tableau)

```
┌──────────────┬───────────────────────┬──────────────┬─────────────┐
│ Type         │ Valeur                │ Rapports     │ Actions     │
├──────────────┼───────────────────────┼──────────────┼─────────────┤
│ 🏢 Entreprise│ Acme Corporation      │ 5 rapport(s) │ 🔍 Rechercher│
│ 🌐 Plateforme│ LinkedIn              │ 12 rapport(s)│ 🔍 Rechercher│
└──────────────┴───────────────────────┴──────────────┴─────────────┘
```

**Problèmes** :

- Tooltip limitée pour voir les IDs
- Pas de vue détaillée
- Pas de navigation directe

### Après (Cartes + Modal)

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 🏢 Entreprise  5 rapport│  │ 🌐 Plateforme 12 rapport│  │ 📧 Email     3 rapport │
│                         │  │                         │  │                         │
│ Acme Corporation        │  │ LinkedIn                │  │ contact@acme.com        │
│                         │  │                         │  │                         │
│ Rapports sources :      │  │ Rapports sources :      │  │ Rapports sources :      │
│ abc123... def456...     │  │ abc123... def456...     │  │ abc123... def456...     │
│ ghi789...               │  │ +9 autre(s)             │  │                         │
│                         │  │                         │  │                         │
│ [Voir détails] [🔍]     │  │ [Voir détails] [🔍]     │  │ [Voir détails] [🔍]     │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

**Clic sur "Voir détails" ou sur la carte** :

```
┌──────────────────────────────────────────────────────┐
│ 🏢 Détails de la donnée                        [✕]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ 🏢 Entreprise              5 rapport(s)        │ │
│ │                                                │ │
│ │ Acme Corporation                               │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ 📄 Rapports contenant cette donnée                  │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ 📄 Rapport abc123...          ID: abc123def    ┃│ │
│ │ 📄 Rapport def456...          ID: def456ghi    ┃│ │
│ │ 📄 Rapport ghi789...          ID: ghi789jkl    ┃│ │
│ │ 📄 Rapport jkl012...          ID: jkl012mno    ┃│ │
│ │ 📄 Rapport mno345...          ID: mno345pqr    ┃│ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ [🔍 Rechercher dans tous les rapports]  [Fermer]   │
└──────────────────────────────────────────────────────┘
```

**Avantages** :

- ✅ Vue complète de tous les rapports
- ✅ Clic sur un rapport → navigation directe
- ✅ Interface plus visuelle et intuitive
- ✅ Meilleure utilisation de l'espace

## 🎯 User flows

### Flow 1 : Voir les détails d'une donnée

1. Utilisateur va dans "Gestion des données OSINT" > "Données extraites"
2. Utilisateur voit la grille de cartes
3. Utilisateur clique sur une carte
4. Modal s'ouvre avec détails complets
5. Utilisateur voit tous les rapports sources
6. Utilisateur peut cliquer sur un rapport pour le consulter

### Flow 2 : Naviguer vers un rapport depuis une carte

1. Utilisateur voit une carte avec 3 IDs de rapports
2. Utilisateur clique sur un des IDs (ex: `abc123...`)
3. Navigation directe vers `/reports/abc123def`
4. Rapport s'ouvre immédiatement

### Flow 3 : Voir tous les rapports d'une donnée

1. Utilisateur clique sur "Voir détails"
2. Modal s'ouvre
3. Liste scrollable de tous les rapports (pas de limite)
4. Utilisateur peut cliquer sur n'importe quel rapport
5. Navigation vers le rapport spécifique

## ⚡ Performance

**Optimisations** :

- Grille CSS native (pas de librairie tierce)
- Limite toujours à 100 résultats affichés
- Modal ne charge que quand ouverte
- Liste des rapports scrollable (pas de pagination)

**Métriques attendues** :

- Render initial : <500ms (identique)
- Ouverture modal : <100ms
- Navigation vers rapport : instantanée (router-link)

## 🧪 Tests suggérés

### Test 1 : Affichage en grille

1. Aller dans "Données extraites"
2. Vérifier que les données s'affichent en grille
3. Vérifier le responsive :
   - Mobile : 1 colonne
   - Tablet : 2 colonnes
   - Desktop : 3 colonnes

### Test 2 : Ouverture de la modal

1. Cliquer sur une carte
2. Vérifier que la modal s'ouvre
3. Vérifier que les détails s'affichent :
   - Type et badge
   - Valeur
   - Liste complète des rapports
4. Vérifier le scroll si beaucoup de rapports

### Test 3 : Navigation directe depuis carte

1. Repérer une carte avec rapports affichés
2. Cliquer sur un des IDs (ex: `abc123...`)
3. Vérifier la navigation vers `/reports/abc123...`
4. Vérifier que le rapport s'ouvre

### Test 4 : Navigation depuis modal

1. Ouvrir une modal
2. Cliquer sur un rapport dans la liste
3. Vérifier la navigation vers le rapport
4. Vérifier que le rapport s'affiche

### Test 5 : Bouton "Rechercher"

1. Cliquer sur "Rechercher" dans une carte
2. Vérifier la redirection vers `/search?q=valeur`
3. Même test depuis la modal

## 🐛 Corrections potentielles

### Problème : Carte trop haute avec beaucoup de texte

**Solution** : Ajouter `line-clamp-2` sur la valeur si nécessaire

### Problème : IDs de rapports trop longs

**Solution** : Afficher seulement les 8 premiers caractères avec `substring(0, 8)`

### Problème : Modal ne se ferme pas

**Solution** : Vérifier que `ref="extractedDetailsModal"` est bien défini

## 📝 Documentation utilisateur

### Comment voir les détails d'une donnée extraite ?

1. Menu → Gestion des données OSINT
2. Onglet "Données extraites"
3. **Cliquez sur une carte** ou sur "Voir détails"
4. Modal s'ouvre avec tous les rapports sources
5. **Cliquez sur un rapport** pour l'ouvrir directement

### Comment naviguer vers un rapport ?

**Option 1** : Depuis la carte

- Cliquez sur un des IDs affichés (ex: `abc123...`)

**Option 2** : Depuis la modal

- Cliquez sur "Voir détails"
- Dans la liste, cliquez sur le rapport souhaité

## ✅ Checklist de validation

- [x] Grille responsive (1/2/3 colonnes)
- [x] Cartes avec border-l-4 coloré
- [x] Hover effect sur cartes
- [x] Modal de détails fonctionnelle
- [x] Liste complète des rapports dans modal
- [x] Navigation directe vers rapports (router-link)
- [x] Bouton "Rechercher" fonctionnel
- [x] Bouton "Fermer" dans modal
- [x] Compilation sans erreur
- [x] Design cohérent avec le reste de l'app

## 🎉 Résultat

L'affichage des données extraites est maintenant :

- ✅ **Plus visuel** (cartes au lieu de tableau)
- ✅ **Plus informatif** (3 premiers rapports visibles)
- ✅ **Plus interactif** (clic sur carte → modal)
- ✅ **Plus pratique** (navigation directe vers rapports)
- ✅ **Plus cohérent** (même UX que les entités)

---

**Version** : 1.1.1  
**Date** : 26 octobre 2025  
**Status** : ✅ Implémenté et testé  
**Developer** : GitHub Copilot 🤖
