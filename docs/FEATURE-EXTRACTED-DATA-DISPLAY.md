# Fonctionnalité : Affichage des données extraites

**Date de livraison** : 2025-01-XX  
**Version** : 1.0  
**Type** : Nouvelle fonctionnalité

## 📋 Résumé

Implémentation de l'onglet "Données extraites" dans la page **Gestion des données OSINT**, permettant de visualiser et rechercher toutes les données extraites automatiquement des rapports (entreprises, plateformes, pseudos, téléphones, emails, adresses, URLs, comptes utilisateurs).

## 🎯 Objectif

Donner une visibilité complète sur les données indexées par MeiliSearch, en permettant aux utilisateurs de :
- Consulter en temps réel les statistiques d'extraction
- Filtrer les données par type (entreprise, plateforme, etc.)
- Rechercher dans les données extraites
- Identifier les rapports sources de chaque donnée
- Lancer une recherche directement depuis une donnée

## 🚀 Fonctionnalités implémentées

### 1. Backend - Extraction et agrégation des données

#### Fichier : `/backend/src/modules/search/search.service.ts`

**Méthode principale** : `getExtractedData()`

```typescript
static async getExtractedData(): Promise<{
  phones: Array<{ value: string; reports: string[]; count: number }>;
  emails: Array<{ value: string; reports: string[]; count: number }>;
  companies: Array<{ value: string; reports: string[]; count: number }>;
  platforms: Array<{ value: string; reports: string[]; count: number }>;
  aliases: Array<{ value: string; reports: string[]; count: number }>;
  names: Array<{ value: string; reports: string[]; count: number }>;
  addresses: Array<{ value: string; reports: string[]; count: number }>;
  urls: Array<{ value: string; reports: string[]; count: number }>;
  accounts: Array<{ value: string; reports: string[]; count: number }>;
  stats: {
    totalPhones: number;
    totalEmails: number;
    totalCompanies: number;
    // ... etc
    totalReports: number;
  };
}>
```

**Logique d'extraction** :
1. Récupère tous les rapports avec leurs modules
2. Pour chaque rapport, appelle `extractEntities()` (déjà amélioré précédemment)
3. Agrège les données dans des `Map<string, Set<string>>` pour :
   - Éviter les doublons
   - Compter les occurrences
   - Tracer les rapports sources
4. Retourne des tableaux triés par fréquence (count décroissant)

**Sources de données extraites** :
- `phones` : personDetails.phone, companyDetails.phone, metadata.phones
- `emails` : personDetails.email, companyDetails.email, metadata.emails
- `companies` : companyDetails.legalName, companyDetails.tradeName
- `platforms` : platform_analysis (name, category, url)
- `aliases` : metadata.aliases, usernames
- `names` : personDetails (firstName, lastName, birthName)
- `addresses` : addresses (address, city, postalCode, country)
- `urls` : websites, platform urls
- `accounts` : usernames, account handles

#### Fichiers modifiés :

**`search.controller.ts`** :
```typescript
static async getExtractedData(req: Request, res: Response): Promise<void> {
  const data = await SearchService.getExtractedData();
  res.json(data);
}
```

**`search.router.ts`** :
```typescript
router.get("/extracted", 
  requirePermissions("reports:read"),
  SearchController.getExtractedData
);
```

### 2. Frontend - Interface utilisateur

#### Fichier : `/frontend/src/services/api/search.ts`

**Interfaces TypeScript** :
```typescript
export interface ExtractedItem {
  value: string;
  reports: string[];
  count: number;
}

export interface ExtractedData {
  phones: ExtractedItem[];
  emails: ExtractedItem[];
  companies: ExtractedItem[];
  platforms: ExtractedItem[];
  aliases: ExtractedItem[];
  names: ExtractedItem[];
  addresses: ExtractedItem[];
  urls: ExtractedItem[];
  accounts: ExtractedItem[];
  stats: {
    totalPhones: number;
    totalEmails: number;
    totalCompanies: number;
    totalPlatforms: number;
    totalAliases: number;
    totalNames: number;
    totalAddresses: number;
    totalUrls: number;
    totalAccounts: number;
    totalReports: number;
  };
}
```

**Service** :
```typescript
async getExtractedData(): Promise<ExtractedData> {
  const response = await api.get("/search/extracted");
  return response.data;
}
```

#### Fichier : `/frontend/src/pages/EntitiesPage.vue`

**Nouveaux composants** :

1. **Système d'onglets** :
   - "Entités" : gestion manuelle des entités
   - "Données extraites" : visualisation des données des rapports

2. **Section statistiques** (6 cartes interactives) :
   ```
   📱 Téléphones    | 📧 Emails        | 🏢 Entreprises
   🌐 Plateformes   | 👤 Pseudos       | 📍 Adresses
   ```
   - Affichage des totaux en temps réel
   - Cartes cliquables pour filtrer par type
   - Skeleton loading pendant le chargement

3. **Barre de recherche** :
   - Recherche en temps réel dans les valeurs
   - Recherche dans les IDs de rapports
   - Bouton d'effacement rapide
   - Bouton "Actualiser"

4. **Tableau de données** :
   
   | Type | Valeur | Rapports | Actions |
   |------|--------|----------|---------|
   | 🏢 Entreprise | Acme Corp | 3 rapport(s) | 🔍 Rechercher |
   | 🌐 Plateforme | LinkedIn | 5 rapport(s) | 🔍 Rechercher |
   
   - Badges colorés par type
   - Tooltip sur le nombre de rapports (affiche les IDs)
   - Bouton "Rechercher" redirige vers `/search?q=valeur`
   - Limite à 100 résultats avec message si dépassé

5. **États gérés** :
   - **Loading** : Skeleton avec animation
   - **Erreur** : Message d'erreur + bouton réessayer
   - **Vide** : Message explicatif + boutons CTA
   - **Données** : Tableau interactif

**Fonctionnalités** :

```typescript
// Filtrage par type (cliquable depuis les stats)
const extractedFilter = ref<string>('all'); // all | phones | emails | companies...

// Recherche textuelle
const extractedSearch = ref<string>('');

// Computed property pour filtrage
const filteredExtractedData = computed(() => {
  // 1. Filtre par type
  // 2. Filtre par recherche (value ou reportId)
  // 3. Limite à 100 résultats
});

// Chargement des données
const loadExtractedData = async () => {
  try {
    loadingExtracted.value = true;
    extractedData.value = await searchService.getExtractedData();
  } catch (err) {
    errorExtracted.value = err.message;
  } finally {
    loadingExtracted.value = false;
  }
};

// Auto-chargement au changement d'onglet
watch(currentView, (newView) => {
  if (newView === 'extracted' && !extractedData.value) {
    loadExtractedData();
  }
});
```

## 🎨 Design

Suivant le pattern `border-l-4` utilisé dans toute l'application :

- **Stats cards** : `bg-base-100 border-l-4 border-{color}` (primary, secondary, accent, info, success, warning)
- **Tableau** : DaisyUI `table-zebra` pour meilleure lisibilité
- **Badges type** : Colorés selon le type de donnée
- **États vides** : Icônes HugeIcons + texte explicatif + CTA

## 📊 Volumétrie

- **Limite affichage** : 100 résultats maximum
- **Message si dépassement** : Suggestion d'utiliser les filtres
- **Performance** : Utilisation de `Map` et `Set` côté backend pour agrégation efficace
- **Tri** : Par fréquence (count décroissant) pour prioriser les données les plus présentes

## 🔐 Sécurité

- **Permission requise** : `reports:read`
- **Données personnelles** : Pas de sanitization ici (cf. `DATA-PRIVACY-SANITIZATION.md`)
- **Accès** : Uniquement utilisateurs authentifiés avec droits de lecture sur les rapports

## 🧪 Tests suggérés

### Test 1 : Affichage des statistiques
1. Créer 3 rapports avec module `platform_analysis` (LinkedIn, Facebook)
2. Aller dans "Gestion des données OSINT" > "Données extraites"
3. Vérifier que la carte "Plateformes" affiche "2"
4. Cliquer sur la carte → tableau filtré sur plateformes uniquement

### Test 2 : Recherche
1. Dans l'onglet "Données extraites", chercher "LinkedIn"
2. Vérifier que seule la ligne LinkedIn apparaît
3. Voir le nombre de rapports (tooltip sur hover)
4. Cliquer sur "Rechercher" → redirection vers `/search?q=LinkedIn`

### Test 3 : Filtrage par type
1. Cliquer sur la carte "📧 Emails"
2. Vérifier que seuls les emails s'affichent
3. Cliquer sur "Voir tout" pour réinitialiser le filtre

### Test 4 : États vides
1. Sur une instance vierge (aucun rapport)
2. Vérifier l'affichage du message "Aucune donnée extraite"
3. Vérifier les boutons CTA ("Créer un rapport", "Rechercher")

### Test 5 : Performance avec gros volume
1. Créer 50 rapports avec multiples modules
2. Vérifier le temps de chargement des stats (<2s)
3. Vérifier que seuls 100 résultats max s'affichent
4. Vérifier le message de limite atteinte

## 📝 Notes techniques

### Différence avec l'onglet "Entités"

| Aspect | Entités | Données extraites |
|--------|---------|-------------------|
| Source | Table `Entity` (création manuelle) | Extraction automatique des rapports |
| CRUD | Créer, modifier, supprimer | Lecture seule (auto-généré) |
| Utilité | Marquage manuel, suivi | Visualisation de l'indexation |
| Backend | `/entities` API | `/search/extracted` API |

### Points d'attention

1. **Cache** : Pas de cache implémenté, chaque appel refait l'agrégation complète
   - → Optimisation future possible avec Redis
   
2. **Temps réel** : Les données ne se mettent pas à jour automatiquement
   - → Nécessite un clic sur "Actualiser"
   - → Optimisation future : WebSocket ou polling

3. **Doublons** : Utilisation de `Map` + `Set` pour éviter les doublons
   - Exemple : "LinkedIn" apparaît dans 5 rapports → 1 seule ligne avec count=5

4. **Casse** : Pas de normalisation de la casse
   - "linkedin" ≠ "LinkedIn" → 2 entrées distinctes
   - → Optimisation future : normalisation côté backend

## 🔄 Intégration avec MeiliSearch

Cette fonctionnalité complète l'indexation MeiliSearch :

1. **MeiliSearch** : Index les données pour la recherche rapide
2. **Extracted Data** : Affiche ce qui est indexé (visibilité)
3. **Search Page** : Utilise l'index pour rechercher

**Workflow complet** :
```
Rapport créé
    ↓
extractEntities() extrait les données
    ↓
MeiliSearch indexe (searchableAttributes + metadata)
    ↓
Données visibles dans "Données extraites"
    ↓
Utilisateur recherche dans "Recherche"
    ↓
MeiliSearch retourne les résultats
```

## 🚧 Améliorations futures possibles

1. **Export CSV/Excel** des données extraites
2. **Graphiques** de répartition (camembert par type)
3. **Historique** des évolutions (timeline)
4. **Déduplication intelligente** (normalisation)
5. **Cache Redis** pour les statistiques
6. **WebSocket** pour mise à jour temps réel
7. **Pagination** côté backend (actuellement limite à 100 frontend)
8. **Filtres avancés** (par date, par auteur de rapport)
9. **Click sur rapport** → ouvrir directement le rapport
10. **Highlight** de la donnée dans le rapport source

## 📚 Documentation liée

- `AI-INTEGRATION-COMPLETE.md` : Extraction initiale des entités
- `DATA-PRIVACY-SANITIZATION.md` : Sanitization des données sensibles
- `FEATURE-ENTITY-IMAGE-UPLOAD.md` : Gestion des images d'entités
- `architecture.md` : Architecture globale de l'application

## ✅ Checklist de livraison

- [x] Backend : méthode `getExtractedData()` implémentée
- [x] Backend : route `/search/extracted` avec permission
- [x] Frontend : interfaces TypeScript créées
- [x] Frontend : service API intégré
- [x] Frontend : onglet "Données extraites" dans EntitiesPage
- [x] Frontend : stats interactives (6 cartes)
- [x] Frontend : barre de recherche
- [x] Frontend : tableau de données avec filtrage
- [x] Frontend : états loading/error/empty
- [x] Frontend : bouton "Rechercher" vers search page
- [x] Design : pattern border-l-4 respecté
- [x] Icons : HugeIcons utilisés partout
- [x] Sécurité : permission `reports:read` requise
- [x] Documentation : Ce fichier créé

## 🎉 Résultat

L'utilisateur peut maintenant :
1. Voir en temps réel ce qui est indexé par MeiliSearch
2. Filtrer par type de donnée (entreprise, plateforme, email...)
3. Rechercher dans les données extraites
4. Identifier les rapports sources de chaque donnée
5. Lancer une recherche directement depuis une donnée

**Exemple concret** :
- L'utilisateur a 20 rapports mentionnant "LinkedIn"
- Il va dans "Données extraites" > clique sur "Plateformes"
- Il voit "LinkedIn" avec "20 rapport(s)"
- Il clique sur "Rechercher" → tous les rapports contenant LinkedIn s'affichent

---

**Auteur** : GitHub Copilot  
**Validé par** : À compléter  
**Mis en production** : À compléter
