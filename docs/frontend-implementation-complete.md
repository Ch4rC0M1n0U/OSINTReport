# 🎨 Interface Vue.js - Phase Frontend Complétée

## ✅ Réalisations - Session Task 6

### 1. **Services API Frontend**

Création de 3 nouveaux modules d'API client TypeScript :

#### `/services/api/reports.ts` (152 lignes)
- **Types TypeScript** : Report, ReportModule, ReportStats, CreateReportData
- **Méthodes implémentées** :
  - `list()` : Liste paginée avec filtres
  - `getById()` : Détails d'un rapport
  - `create()` : Création de rapport
  - `update()` : Modification
  - `delete()` : Suppression
  - `duplicate()` : Duplication complète
  - `updateStatus()` : Changement statut (DRAFT/PUBLISHED/ARCHIVED)
  - `getStats()` : Statistiques
  - `getDashboard()` : Vue d'ensemble
  - **Modules** : `listModules()`, `getModule()`, `createModule()`, `updateModule()`, `deleteModule()`, `reorderModules()`

#### `/services/api/entities.ts` (67 lignes)
- **Types** : Entity, EntityType, EntitySearchResult, CreateEntityData
- **Méthodes** :
  - `list()` : Liste avec pagination
  - `search()` : Autocomplétion (pour formulaires)
  - `getById()` : Détails
  - `create()` : Création
  - `update()` : Modification
  - `delete()` : Suppression
- **Types d'entités** : PERSON, ORGANIZATION, TELEPHONE, EMAIL, ACCOUNT, ADDRESS, OTHER

#### `/services/api/correlations.ts` (63 lignes)
- **Types** : Correlation, CorrelationType, CorrelationCheckResult
- **Méthodes** :
  - `check()` : Vérification temps réel
  - `detect()` : Détection automatique complète
  - `list()` : Liste des corrélations d'un rapport
  - `verify()` : Marquer comme vérifiée
  - `delete()` : Suppression

### 2. **Stores Pinia**

#### `/stores/entities.ts` (120 lignes)
- Gestion d'état centralisée pour les entités
- **Cache de recherche** : Map pour l'autocomplétion performante
- **Actions** :
  - `fetchEntities()` : Liste avec filtres
  - `search()` : Recherche avec cache
  - `getById()` : Récupération par ID
  - `create()`, `update()`, `deleteEntity()`
  - `clearCache()` : Invalidation du cache
- **État** : items, total, limit, offset, loading, error

#### `/stores/correlations.ts` (91 lignes)
- Gestion des corrélations et alertes temps réel
- **Actions** :
  - `checkRealtime()` : Vérification pendant la saisie
  - `detectAll()` : Détection automatique
  - `fetchCorrelations()` : Liste avec filtres
  - `verify()` : Validation par enquêteur
  - `deleteCorrelation()`
- **État** : correlations, realtimeCheckResult, checkInProgress

#### `/stores/reports.ts` (modifié)
- Mise à jour pour utiliser le nouveau service API
- Compatible avec les types Report étendus

### 3. **Composants Vue réutilisables**

#### `EntitySelector.vue` (210 lignes)
Composant d'autocomplétion intelligent pour sélectionner des entités.

**Fonctionnalités** :
- 🔍 Recherche debounced (300ms)
- ✨ Autocomplétion avec dropdown
- 🎨 Icônes par type d'entité
- ➕ Bouton "Créer une entité" intégré
- 🔄 Cache de recherche
- 🎯 Filtrage par type
- ⌨️ Support clavier

**Props** :
- `modelValue` : ID de l'entité sélectionnée
- `type` : Filtrer par type (optionnel)
- `label`, `placeholder`, `required`, `disabled`
- `allowCreate` : Afficher bouton de création

**Events** :
- `update:modelValue` : Changement de sélection
- `entity-selected` : Entité choisie
- `create-new` : Demande de création

**Usage** :
```vue
<EntitySelector
  v-model="selectedEntityId"
  type="PERSON"
  label="Suspect principal"
  @create-new="showEntityDialog = true"
/>
```

#### `CorrelationAlert.vue` (85 lignes)
Alerte visuelle pour les corrélations détectées en temps réel.

**Fonctionnalités** :
- ⚠️ Alerte contextuelle
- 🔄 Vérification automatique debounced (500ms)
- 📊 Liste des rapports liés (max 3 affichés)
- 🎯 Détection selon le type (PHONE, EMAIL, NAME, etc.)

**Props** :
- `reportId` : Rapport en cours
- `value` : Valeur à vérifier
- `type` : Type de corrélation
- `disabled` : Désactiver les vérifications

**Usage** :
```vue
<CorrelationAlert
  :reportId="report.id"
  :value="phoneNumber"
  type="PHONE"
/>
```

#### `EntityDialog.vue` (135 lignes)
Modal de création d'entité avec formulaire complet.

**Fonctionnalités** :
- 📝 Formulaire avec validation
- 🎨 Sélection visuelle du type (7 types)
- 📋 Champ notes optionnel
- ⚡ Création instantanée
- 🔄 Intégration avec le store

**Props** :
- `show` : Afficher/masquer
- `initialData` : Pré-remplissage (optionnel)

**Events** :
- `close` : Fermeture
- `saved` : Entité créée (retourne l'entité)

**Usage** :
```vue
<EntityDialog
  :show="showDialog"
  @close="showDialog = false"
  @saved="handleEntitySaved"
/>
```

### 4. **Pages principales**

#### `ReportCreatePage.vue` (330 lignes)
**Wizard multi-étapes** pour la création de rapports OSINT.

**Étapes** :
1. **Informations de base** (Étape 1/3)
   - Titre du rapport (requis)
   - Numéro de dossier
   - Service enquêteur
   - Mots-clés (ajout/suppression dynamique)

2. **Contexte et classification** (Étape 2/3)
   - Contexte de l'enquête (requis, textarea)
   - Base légale
   - Niveau d'urgence (ROUTINE/URGENT/CRITICAL)
   - Classification (PUBLIC/CONFIDENTIAL/SECRET)

3. **Validation** (Étape 3/3)
   - Récapitulatif visuel
   - Vérification avant création
   - Bouton de soumission

**Fonctionnalités** :
- ✅ Validation par étape
- 📊 Barre de progression
- ⏭️ Navigation Précédent/Suivant
- 🎨 Interface visuelle (badges, icônes)
- 🚫 Annulation avec confirmation
- ↪️ Redirection vers le détail après création

**Validation** :
- Étape 1 : Titre obligatoire
- Étape 2 : Contexte obligatoire
- Étape 3 : Soumission finale

#### `ReportDetailPage.vue` (380 lignes)
**Page de gestion complète** d'un rapport avec tous ses modules.

**Sections** :
1. **En-tête**
   - Titre du rapport
   - Badges : statut, dossier, urgence, classification
   - Menu Actions (dropdown)

2. **Informations du rapport**
   - Service enquêteur
   - Base légale
   - Contexte d'enquête
   - Mots-clés (badges)

3. **Liste des modules**
   - Affichage avec icônes par type
   - Lien vers l'entité associée
   - Bouton suppression par module
   - Bouton "+ Ajouter un module"

**Actions disponibles** :
- 📊 Statistiques : Modal avec counts (modules, entités, recherches, corrélations)
- 🔗 Voir corrélations : Modal listant toutes les corrélations
- 🔍 Détecter corrélations : Lancement détection automatique
- ✅ Publier (si DRAFT)
- 📦 Archiver (si PUBLISHED)
- 📋 Dupliquer

**Modals** :
- **Créer module** : Formulaire (type, titre, entité liée)
- **Statistiques** : Cartes stats visuelles
- **Corrélations** : Liste scrollable avec détails

**Types de modules** :
- 📞 Analyse téléphonique
- 📧 Analyse email
- 🌐 Réseaux sociaux
- 💰 Analyse financière
- 📍 Analyse adresse
- 🚗 Véhicule
- 📄 Document
- 📋 Autre

#### `ReportListPage.vue` (modifié)
Améliorations :
- ➕ Bouton "Créer un rapport" dans l'en-tête
- 🖱️ Lignes cliquables vers le détail
- 🔄 Utilisation du nouveau service API

### 5. **Routing**

Nouvelles routes ajoutées dans `/router/index.ts` :

```typescript
{
  path: "reports/new",
  name: "reports.create",
  component: ReportCreatePage,
  meta: {
    requiresAuth: true,
    permissions: ["reports:write"],
  },
},
{
  path: "reports/:id",
  name: "reports.detail",
  component: ReportDetailPage,
  meta: {
    requiresAuth: true,
    permissions: ["reports:read"],
  },
},
```

**Permissions** :
- `reports:read` : Voir les rapports
- `reports:write` : Créer/modifier les rapports

### 6. **Architecture technique**

#### Stack technologique
- **Framework** : Vue 3 (Composition API)
- **State Management** : Pinia
- **Routing** : Vue Router
- **HTTP Client** : Axios
- **UI Framework** : DaisyUI + Tailwind CSS
- **Utilities** : @vueuse/core (debounce, etc.)
- **Type Safety** : TypeScript strict

#### Patterns utilisés
1. **Composition API** : `<script setup>` pour tous les composants
2. **Reactive refs** : `ref()`, `computed()`
3. **Store pattern** : Pinia avec actions/getters
4. **Service layer** : Séparation API/Store/Components
5. **Props/Events** : Communication parent-enfant
6. **Error handling** : Try/catch avec messages utilisateur
7. **Loading states** : Spinners pendant les requêtes
8. **Optimistic updates** : Invalidation de cache après mutations

#### Flux de données

```
┌──────────────┐
│  Component   │
│   (Vue 3)    │
└──────┬───────┘
       │ uses
       ▼
┌──────────────┐
│  Pinia Store │
│   (State)    │
└──────┬───────┘
       │ calls
       ▼
┌──────────────┐
│ API Service  │
│  (HTTP)      │
└──────┬───────┘
       │ request
       ▼
┌──────────────┐
│   Backend    │
│  (Express)   │
└──────────────┘
```

## 📊 Statistiques

### Fichiers créés/modifiés

| Fichier | Type | Lignes | Description |
|---------|------|--------|-------------|
| `services/api/reports.ts` | Nouveau | 152 | Service API rapports |
| `services/api/entities.ts` | Nouveau | 67 | Service API entités |
| `services/api/correlations.ts` | Nouveau | 63 | Service API corrélations |
| `stores/entities.ts` | Nouveau | 120 | Store Pinia entités |
| `stores/correlations.ts` | Nouveau | 91 | Store Pinia corrélations |
| `stores/reports.ts` | Modifié | +15 | Migration vers nouveau service |
| `components/reports/EntitySelector.vue` | Nouveau | 210 | Autocomplétion entités |
| `components/reports/CorrelationAlert.vue` | Nouveau | 85 | Alerte corrélations |
| `components/reports/EntityDialog.vue` | Nouveau | 135 | Modal création entité |
| `pages/reports/ReportCreatePage.vue` | Nouveau | 330 | Wizard création rapport |
| `pages/reports/ReportDetailPage.vue` | Nouveau | 380 | Gestion complète rapport |
| `pages/reports/ReportListPage.vue` | Modifié | +10 | Ajout bouton création |
| `router/index.ts` | Modifié | +17 | Routes create/detail |
| **TOTAL** | **13 fichiers** | **~1660** | **Interface complète** |

### Fonctionnalités implémentées

✅ **Création de rapports** (wizard 3 étapes)
✅ **Gestion des modules** (CRUD complet)
✅ **Sélection d'entités** (autocomplétion)
✅ **Création d'entités** (modal inline)
✅ **Alertes de corrélation** (temps réel)
✅ **Statistiques de rapport** (modal)
✅ **Détection automatique** (corrélations)
✅ **Changement de statut** (workflow)
✅ **Duplication de rapport** (template)
✅ **Liste cliquable** (navigation)

## 🎯 Flux utilisateur complets

### Scénario 1 : Créer un nouveau rapport

1. L'utilisateur clique sur "**+ Créer un rapport**" depuis `/reports`
2. **Étape 1** : Remplit le titre, dossier, service, ajoute des mots-clés
3. Clique "**Suivant →**"
4. **Étape 2** : Décrit le contexte, choisit urgence (URGENT) et classification (CONFIDENTIAL)
5. Clique "**Suivant →**"
6. **Étape 3** : Vérifie le récapitulatif
7. Clique "**✓ Créer le rapport**"
8. ↪️ Redirigé vers `/reports/:id` (page de détail)

### Scénario 2 : Ajouter un module avec entité

1. Sur la page de détail du rapport
2. Clique "**+ Ajouter un module**"
3. Modal s'ouvre :
   - Sélectionne **Type** : "📞 Analyse téléphonique"
   - Saisit **Titre** : "Analyse CDR +32475123456"
   - Dans **Entité liée** : Tape "Jean" dans le champ
   - Autocomplétion propose "Jean Dupont"
   - Sélectionne l'entité ou clique "**+ Créer**"
4. Si création d'entité :
   - Modal `EntityDialog` s'ouvre
   - Saisit "Jean Suspect", type "PERSON"
   - Clique "**Créer l'entité**"
   - Entité créée, modal se ferme
   - Entité pré-sélectionnée dans le formulaire
5. Clique "**Créer le module**"
6. Module ajouté à la liste, page rechargée

### Scénario 3 : Vérifier les corrélations

1. Sur la page de détail
2. Clique "**Actions ▾**" → "**🔍 Détecter corrélations**"
3. Confirmation : "**OK**"
4. Backend analyse tous les modules
5. Alert : "**X corrélation(s) détectée(s) !**"
6. Modal "**Corrélations**" s'affiche automatiquement
7. Liste affiche :
   - Type (PHONE, EMAIL, etc.)
   - Valeur (téléphone, email)
   - Rapport lié (titre, dossier)
   - Score de confiance
   - Badge "✓" si vérifiée
8. L'utilisateur peut cliquer sur un rapport lié pour naviguer

### Scénario 4 : Publier un rapport

1. Rapport en statut "**DRAFT**" (badge warning)
2. Clique "**Actions ▾**" → "**✓ Publier**"
3. Confirmation : "**OK**"
4. Statut change vers "**PUBLISHED**" (badge success)
5. Badge dans l'en-tête mis à jour
6. Le rapport apparaît dans les filtres "Publiés"

## 🚀 Intégration API Backend

### Endpoints consommés

| Méthode | Endpoint | Composant | Fonction |
|---------|----------|-----------|----------|
| GET | `/reports` | ReportListPage | Liste paginée |
| GET | `/reports/:id` | ReportDetailPage | Détails |
| POST | `/reports` | ReportCreatePage | Création |
| PATCH | `/reports/:id/status` | ReportDetailPage | Changer statut |
| POST | `/reports/:id/duplicate` | ReportDetailPage | Dupliquer |
| GET | `/reports/:id/stats` | ReportDetailPage | Statistiques |
| GET | `/reports/:id/modules` | ReportDetailPage | Liste modules |
| POST | `/reports/:id/modules` | ReportDetailPage | Créer module |
| DELETE | `/reports/:id/modules/:mid` | ReportDetailPage | Supprimer module |
| GET | `/entities/search` | EntitySelector | Autocomplétion |
| POST | `/entities` | EntityDialog | Créer entité |
| POST | `/correlations/check` | CorrelationAlert | Vérification temps réel |
| POST | `/correlations/reports/:id/detect` | ReportDetailPage | Détection auto |
| GET | `/correlations/reports/:id` | ReportDetailPage | Liste corrélations |

**Total : 14 endpoints utilisés**

### Authentification

Toutes les requêtes utilisent :
- **Cookies** : `withCredentials: true`
- **Interceptor 401** : Redirection automatique vers `/login`
- **Permissions** : Vérifiées côté router (`reports:read`, `reports:write`)

## 🎨 Design System

### Composants DaisyUI utilisés

- `card` : Containers principaux
- `btn` : Boutons (primary, outline, ghost)
- `input`, `textarea`, `select` : Formulaires
- `badge` : Labels de statut
- `modal` : Dialogs
- `alert` : Messages d'erreur/warning
- `loading` : Spinners
- `dropdown` : Menus d'actions
- `join` : Groupes de boutons
- `progress` : Barres de progression
- `divider` : Séparateurs

### Tailwind classes clés

- Layout : `flex`, `grid`, `space-y-*`
- Responsive : `md:`, `xl:`
- States : `hover:`, `disabled:`
- Colors : `text-base-content`, `bg-base-100`, `border-base-300`
- Typography : `text-2xl`, `font-semibold`

## 🐛 Gestion des erreurs

### Patterns utilisés

1. **Try/catch global** :
```typescript
try {
  const data = await api.call();
  // success
} catch (err: any) {
  error.value = err.response?.data?.message || "Message par défaut";
  console.error(err);
}
```

2. **Loading states** :
```vue
<span v-if="loading" class="loading loading-spinner"></span>
<button :disabled="loading">Submit</button>
```

3. **Error displays** :
```vue
<div v-if="error" class="alert alert-error">
  <span>{{ error }}</span>
</div>
```

4. **Confirmations** :
```typescript
if (!confirm("Êtes-vous sûr ?")) return;
```

## 📱 Responsive Design

Tous les composants sont **mobile-first** :

- **Mobile** : Stack vertical, pleine largeur
- **Tablet (md:)** : Grid 2 colonnes
- **Desktop (xl:)** : Grid 3-4 colonnes

Exemples :
```vue
<div class="flex flex-col gap-4 md:flex-row md:items-end">
  <!-- Mobile: colonne, Desktop: ligne -->
</div>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
  <!-- Responsive grid -->
</div>
```

## ✨ Optimisations

### Performance

1. **Debouncing** : Recherche d'entités (300ms), vérification corrélations (500ms)
2. **Cache** : Map pour les résultats de recherche d'entités
3. **Lazy loading** : Routes chargées à la demande
4. **Pagination** : Limite 10-20 items par page

### UX

1. **Loading states** : Spinners pendant les requêtes
2. **Feedback visuel** : Badges, couleurs, icônes
3. **Keyboard support** : Enter pour ajouter mots-clés
4. **Hover effects** : Lignes de tableau cliquables
5. **Confirmations** : Avant actions destructives

## 🔜 Prochaines étapes

### Task 7 : Meilisearch et recherche (à faire)

**Composants à créer** :
- `SearchPage.vue` : Interface de recherche avancée
- `SearchService.ts` : Intégration Meilisearch
- `SearchFilters.vue` : Filtres facettés

**Fonctionnalités** :
- Recherche full-text dans les rapports
- Filtres par statut, urgence, service
- Highlighting des résultats
- Tri par pertinence/date

### Task 8 : Export PDF (à faire)

**Composants à créer** :
- `ExportButton.vue` : Bouton d'export dans ReportDetailPage
- `PDFService.ts` : Génération PDF côté backend
- Template PDF : Format police belge

**Fonctionnalités** :
- Génération PDF avec logo
- Inclusion graphe de corrélations
- Signature numérique
- Download automatique

## 🎉 Résumé

### ✅ Phase 6 complétée !

- **3 services API** créés
- **2 stores Pinia** créés
- **3 composants** réutilisables
- **2 pages** principales (wizard + détail)
- **14 endpoints** consommés
- **~1660 lignes** de code Vue/TS
- **Interface complète** et fonctionnelle

### 🚀 Prêt pour la phase suivante

Le système de rapports OSINT dispose maintenant d'une **interface utilisateur complète** permettant :
- La création guidée de rapports
- La gestion des modules et entités
- La détection de corrélations en temps réel
- Le workflow complet (DRAFT → PUBLISHED → ARCHIVED)
- La duplication de rapports comme templates

**Prochaine tâche** : Task 7 - Intégration Meilisearch pour la recherche avancée ! 🔍

---

**Session 6 - Durée:** ~2h  
**Date:** 2 octobre 2025 - 03:15 UTC  
**Développeur:** GitHub Copilot  
**Projet:** OSINTReport - Police Belge
