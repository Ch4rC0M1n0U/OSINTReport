# Sélecteur de Base Légale - Code d'Instruction Criminelle Belge

## 📋 Vue d'ensemble

Le système de sélection de base légale permet aux enquêteurs de référencer les articles du **Code d'Instruction Criminelle (CIC) belge** applicables à leurs investigations OSINT.

## 🎯 Objectifs

- ✅ Faciliter la référence aux articles légaux pertinents
- ✅ Garantir la conformité juridique des investigations OSINT
- ✅ Traçabilité et documentation des fondements légaux
- ✅ Sélection multiple d'articles (optionnelle)
- ✅ Interface intuitive avec recherche et filtres

## 📚 Articles du CIC inclus

### Méthodes Particulières de Recherche (MPR)

| Article | Titre | Description |
|---------|-------|-------------|
| **Art. 28bis CIC** | Méthodes particulières de recherche | Cadre général des MPR - Observation, infiltration, contrôle visuel discret |
| **Art. 46bis CIC** | Observation | Observation systématique de personnes, lieux ou choses |
| **Art. 46bis §2 CIC** | Observation via Internet | Observation sur Internet et réseaux sociaux sans interaction |
| **Art. 47ter CIC** | Infiltration | Infiltration et techniques spéciales de recherche |
| **Art. 47sexies CIC** | Contrôle visuel discret | Pénétration discrète dans lieux privés ou non accessibles au public |

### Surveillance et Mini-instruction

| Article | Titre | Description |
|---------|-------|-------------|
| **Art. 90ter CIC** | Mesures de surveillance | Mini-instruction - Mesures de surveillance ordonnées par le juge d'instruction |
| **Art. 90quater CIC** | Surveillance par moyens techniques | Surveillance via moyens techniques (géolocalisation, écoutes, etc.) |

### Perquisition et Saisie

| Article | Titre | Description |
|---------|-------|-------------|
| **Art. 56 CIC** | Perquisition et saisie | Perquisition et saisie de documents ou données |
| **Art. 89bis CIC** | Perquisition en flagrance | Perquisition en cas de crime ou délit flagrant |

### Données Télécom et Numériques

| Article | Titre | Description |
|---------|-------|-------------|
| **Art. 39bis CIC** | Réquisition de données télécoms | Réquisition de données d'identification et de trafic auprès des opérateurs |
| **Art. 88sexies CIC** | Analyse de données téléphoniques | Analyse et corrélation de données téléphoniques (CDR) |

### Procédure

| Article | Titre | Description |
|---------|-------|-------------|
| **Art. 88bis CIC** | Enquête proactive | Recherche proactive d'infractions - Collecte d'informations OSINT |
| **Art. 127 CIC** | Information du juge d'instruction | Information du juge d'instruction sur les recherches effectuées |

### Protection des données

| Article | Titre | Description |
|---------|-------|-------------|
| **Art. 44/11/3 Loi Pol.** | Traitement de données - Loi sur la fonction de police | Traitement de données à caractère personnel par les services de police |

## 🎨 Interface utilisateur

### Composant `LegalBasisSelector`

**Emplacement**: `/frontend/src/components/shared/LegalBasisSelector.vue`

**Fonctionnalités** :
- ✅ **Sélection multiple** : Plusieurs articles peuvent être sélectionnés
- ✅ **Recherche en temps réel** : Recherche par code, titre ou description
- ✅ **Filtres par catégorie** : MPR, Surveillance, Perquisition, Données, Procédure
- ✅ **Badges cliquables** : Affichage visuel des articles sélectionnés
- ✅ **Dropdown interactif** : Menu déroulant avec scroll
- ✅ **Pas obligatoire** : Champ optionnel

### Exemple d'utilisation

```vue
<template>
  <LegalBasisSelector
    v-model="form.legalBasis"
    hint="Sélectionnez les articles du Code d'Instruction Criminelle belge applicables"
  />
</template>

<script setup lang="ts">
import LegalBasisSelector from "@/components/shared/LegalBasisSelector.vue";
import { ref } from "vue";

const form = ref({
  legalBasis: "", // Format: "Art. 28bis CIC • Art. 46bis CIC • Art. 90ter CIC"
});
</script>
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `modelValue` | `string \| null` | `null` | Valeur liée (format: articles séparés par ` • `) |
| `label` | `string` | `"Base légale"` | Label du champ |
| `placeholder` | `string` | `"Sélectionnez un ou plusieurs articles..."` | Placeholder |
| `hint` | `string` | `"Articles du Code d'Instruction Criminelle belge"` | Texte d'aide |
| `error` | `string` | - | Message d'erreur |
| `required` | `boolean` | `false` | Champ requis ou non |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| null` | Émis lors de la modification de la sélection |

## 💾 Stockage des données

### Format de stockage

Les articles sélectionnés sont stockés sous forme de **chaîne de caractères** avec séparateur ` • ` :

```typescript
// Exemple de valeur stockée
"Art. 28bis CIC • Art. 46bis CIC • Art. 90ter CIC"
```

### Fonctions utilitaires

**Emplacement**: `/frontend/src/data/legal-basis.ts`

```typescript
// Parser une chaîne en tableau
parseLegalBasis("Art. 28bis CIC • Art. 46bis CIC")
// => ["Art. 28bis CIC", "Art. 46bis CIC"]

// Sérialiser un tableau en chaîne
serializeLegalBasis(["Art. 28bis CIC", "Art. 46bis CIC"])
// => "Art. 28bis CIC • Art. 46bis CIC"

// Formatter pour affichage
formatLegalBasis(["Art. 28bis CIC", "Art. 46bis CIC"])
// => "Art. 28bis CIC • Art. 46bis CIC"
```

## 📄 Schéma de données

### Backend - Prisma Schema

Le champ `legalBasis` existe déjà dans le modèle `Report` :

```prisma
model Report {
  // ...
  legalBasis String? // Stockage texte des articles
  // ...
}
```

### Frontend - TypeScript Interface

```typescript
interface Report {
  legalBasis?: string | null; // Format: "Art. 28bis CIC • Art. 46bis CIC"
}

interface CreateReportData {
  legalBasis?: string;
}
```

## 🔧 Intégration

### Page de création de rapport

**Fichier**: `/frontend/src/pages/reports/ReportCreatePage.vue`

```vue
<!-- Étape 2: Contexte et classification -->
<LegalBasisSelector
  v-model="form.legalBasis"
  hint="Sélectionnez les articles du Code d'Instruction Criminelle belge applicables"
/>
```

### Page de modification de rapport

**Fichier**: `/frontend/src/pages/reports/ReportDetailPage.vue`

**Modal de modification** :
```vue
<LegalBasisSelector
  v-model="editInfoForm.legalBasis"
  hint="Sélectionnez les articles du Code d'Instruction Criminelle belge applicables"
/>
```

**Affichage dans les infos** :
```vue
<div class="md:col-span-2">
  <div class="text-sm opacity-70 mb-2">Base légale</div>
  <div v-if="report.legalBasis" class="flex flex-wrap gap-2">
    <span
      v-for="article in parseLegalBasis(report.legalBasis)"
      :key="article"
      class="badge badge-primary badge-sm font-mono"
    >
      {{ article }}
    </span>
  </div>
  <div v-else class="font-medium">—</div>
</div>
```

## 🎬 Workflow utilisateur

### 1. Création d'un rapport

1. **Étape 2 : Contexte et classification**
2. Cliquer sur le champ **Base légale**
3. Le dropdown s'ouvre avec 15 articles
4. **Rechercher** : Taper "observation" → filtre les articles
5. **Filtrer** : Cliquer sur "MPR" → affiche uniquement les MPR
6. **Sélectionner** : Cocher "Art. 46bis CIC - Observation"
7. **Ajouter d'autres** : Cocher "Art. 90ter CIC - Mesures de surveillance"
8. **Fermer** : Cliquer sur "Fermer" ou cliquer à l'extérieur
9. Les badges s'affichent : `Art. 46bis CIC` `Art. 90ter CIC`

### 2. Modification d'un rapport

1. Ouvrir un rapport existant
2. **Actions** → **Modifier les informations**
3. Dans la modal, champ **Base légale**
4. Les articles déjà sélectionnés apparaissent sous forme de badges
5. Ajouter/retirer des articles
6. **Enregistrer**

### 3. Visualisation

Les articles sélectionnés apparaissent dans la section **Informations du rapport** sous forme de **badges primaires** avec police monospace.

## 🔒 Conformité juridique

### Cadre légal belge

Le système fait référence aux articles du **Code d'Instruction Criminelle belge** et de la **Loi sur la fonction de police** :

- **MPR** : Méthodes Particulières de Recherche (Art. 28bis et suivants)
- **Observation passive OSINT** : Art. 46bis §2 CIC (observation sans interaction)
- **Enquête proactive** : Art. 88bis CIC (collecte d'informations)
- **Protection des données** : Art. 44/11/3 Loi Pol. (RGPD compliance)

### Bonnes pratiques

1. ✅ **Toujours documenter la base légale** pour les investigations sensibles
2. ✅ **Sélectionner les articles pertinents** selon le type de recherche OSINT
3. ✅ **Respecter les limites** : l'observation OSINT ne doit pas impliquer d'interaction
4. ✅ **Information du juge** : Art. 127 CIC en cas d'instruction judiciaire

## 📊 Statistiques

- **15 articles** du CIC belge inclus
- **5 catégories** : MPR, Surveillance, Perquisition, Données, Procédure
- **Sélection multiple** : Aucune limite
- **Recherche temps réel** : 3 champs indexés (code, titre, description)

## 🚀 Améliorations futures

- [ ] Ajouter des **liens vers Juridat** (jurisprudence belge)
- [ ] **Tooltips explicatifs** avec jurisprudence récente
- [ ] **Suggestions intelligentes** selon le type d'investigation
- [ ] **Export PDF** avec références légales complètes
- [ ] **Historique** des articles les plus utilisés
- [ ] **Alertes** si base légale manquante pour classification CONFIDENTIEL/SECRET

## 📝 Notes de développement

### Sources juridiques

- **Code d'Instruction Criminelle belge** (version consolidée 2024)
- **Loi du 5 août 1992** sur la fonction de police
- **Jurisprudence** : Cour de Cassation belge, CEDH

### Validation

Les articles ont été vérifiés par rapport à la **législation belge en vigueur** (octobre 2025).

---

**Date de création** : 3 octobre 2025  
**Dernière mise à jour** : 3 octobre 2025  
**Version** : 1.0.0
