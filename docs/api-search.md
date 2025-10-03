# Documentation API - Recherche Meilisearch

## Vue d'ensemble

Le service de recherche utilise **Meilisearch 1.5** pour fournir une recherche full-text rapide et pertinente sur les rapports OSINT. Le système indexe automatiquement les rapports avec leur contenu, métadonnées et modules.

## Configuration

### Variables d'environnement

```env
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey
```

### Docker Compose

```yaml
meilisearch:
  image: getmeili/meilisearch:v1.5
  ports:
    - "7700:7700"
  environment:
    - MEILI_MASTER_KEY=masterKey
    - MEILI_ENV=development
  volumes:
    - meilisearch_data:/meili_data
```

## Architecture

### Fichiers

- `backend/src/modules/search/search.service.ts` - Service principal Meilisearch
- `backend/src/modules/search/search.controller.ts` - Contrôleurs HTTP
- `backend/src/modules/search/search.router.ts` - Routes API
- `backend/src/modules/search/search.validation.ts` - Schémas de validation Zod

### Index Meilisearch

**Index name:** `reports`

**Primary key:** `id`

#### Attributs indexés (searchable)
- `title` - Titre du rapport
- `caseNumber` - Numéro de dossier
- `reportNumber` - Numéro de rapport  
- `purpose` - Objectif du rapport
- `summary` - Résumé
- `investigationContext` - Contexte de l'enquête
- `keywords` - Mots-clés
- `modulesContent` - Contenu textuel des modules
- `ownerName` - Nom du propriétaire

#### Attributs filtrables
- `status` - Statut du rapport (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- `urgencyLevel` - Niveau d'urgence (ROUTINE, URGENT, CRITICAL)
- `classification` - Classification (PUBLIC, RESTRICTED, CONFIDENTIAL, SECRET)
- `ownerId` - ID du propriétaire
- `createdAt` - Date de création (ISO 8601)
- `issuedAt` - Date d'émission (ISO 8601)

#### Attributs triables
- `createdAt`
- `updatedAt`
- `issuedAt`
- `title`

## API Endpoints

### Base URL
```
/api/search
```

### Authentication
Toutes les routes nécessitent un token JWT valide dans le header `Authorization: Bearer <token>`.

---

### 1. Rechercher des rapports

```http
GET /api/search?q=...&status=...&limit=20&offset=0
```

#### Permissions requises
- `reports:read`

#### Query Parameters

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `q` | string | Non | Requête de recherche full-text |
| `status` | enum | Non | `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED` |
| `urgencyLevel` | enum | Non | `ROUTINE`, `URGENT`, `CRITICAL` |
| `classification` | enum | Non | `PUBLIC`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET` |
| `sort` | string | Non | Tri: `createdAt:asc`, `createdAt:desc`, `title:asc`, etc. |
| `limit` | number | Non | Nombre de résultats (1-100, défaut: 20) |
| `offset` | number | Non | Décalage pour pagination (défaut: 0) |

#### Réponse

```json
{
  "hits": [
    {
      "id": "uuid",
      "title": "Rapport d'enquête...",
      "caseNumber": "CASE-2025-001",
      "reportNumber": "RPT-001",
      "purpose": "Analyse de...",
      "summary": "Ce rapport examine...",
      "investigationService": "Brigade Cyber",
      "investigationContext": "Fraude en ligne",
      "legalBasis": "Article 323-1",
      "keywords": ["phishing", "cybercriminalité"],
      "status": "PUBLISHED",
      "urgencyLevel": "URGENT",
      "classification": "CONFIDENTIAL",
      "ownerName": "Jean Dupont",
      "ownerEmail": "jean.dupont@example.com",
      "ownerId": "uuid",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z",
      "issuedAt": "2025-01-15T14:00:00.000Z",
      "modulesCount": 5,
      "modulesContent": "Module 1: Analyse technique...",
      "_formatted": {
        "title": "Rapport d'<mark>enquête</mark>...",
        "summary": "Ce rapport <mark>examine</mark>..."
      }
    }
  ],
  "estimatedTotalHits": 42,
  "limit": 20,
  "offset": 0,
  "processingTimeMs": 12
}
```

#### Exemple de requête

```bash
curl -X GET "http://localhost:5000/api/search?q=cybercriminalit%C3%A9&status=PUBLISHED&urgencyLevel=URGENT&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. Obtenir les facettes

```http
GET /api/search/facets?q=...
```

#### Permissions requises
- `reports:read`

#### Query Parameters

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `q` | string | Non | Requête de recherche (pour filtrer les facettes) |

#### Réponse

```json
{
  "facets": {
    "status": {
      "DRAFT": 15,
      "REVIEW": 8,
      "PUBLISHED": 42,
      "ARCHIVED": 3
    },
    "urgencyLevel": {
      "ROUTINE": 35,
      "URGENT": 25,
      "CRITICAL": 8
    },
    "classification": {
      "PUBLIC": 10,
      "RESTRICTED": 20,
      "CONFIDENTIAL": 30,
      "SECRET": 8
    }
  }
}
```

#### Usage

Utiliser les facettes pour construire des filtres dynamiques dans l'interface utilisateur :

```javascript
// Frontend: Afficher le nombre de rapports par statut
facets.status.PUBLISHED // => 42 rapports publiés
```

---

### 3. Réindexer tous les rapports

```http
POST /api/search/reindex
```

#### Permissions requises
- `system:admin`

#### Corps de la requête
Aucun

#### Réponse

```json
{
  "message": "Réindexation terminée avec succès"
}
```

#### Notes
- Cette opération est **lourde** et doit être utilisée avec précaution
- Elle supprime tous les documents de l'index et réindexe tous les rapports
- Utilisée pour :
  - Initialiser l'index après une migration
  - Corriger des problèmes d'indexation
  - Appliquer de nouveaux paramètres d'index

---

### 4. Obtenir les statistiques de l'index

```http
GET /api/search/stats
```

#### Permissions requises
- `system:admin`

#### Réponse

```json
{
  "stats": {
    "numberOfDocuments": 68,
    "isIndexing": false,
    "fieldDistribution": {
      "id": 68,
      "title": 68,
      "status": 68,
      "createdAt": 68,
      "keywords": 45,
      "summary": 62
    }
  }
}
```

#### Interprétation

- `numberOfDocuments` : Nombre total de rapports indexés
- `isIndexing` : Indique si une indexation est en cours
- `fieldDistribution` : Nombre de documents contenant chaque champ

---

## Service SearchService

### Méthodes disponibles

#### `initializeIndexes(): Promise<void>`

Initialise l'index Meilisearch avec la configuration.

```typescript
await SearchService.initializeIndexes();
```

**Utilisé au démarrage du serveur** dans `src/server.ts`.

---

#### `indexReport(reportId: string): Promise<boolean>`

Indexe un rapport spécifique.

```typescript
const success = await SearchService.indexReport("uuid-report");
```

**Appeler après** :
- Création d'un rapport
- Modification d'un rapport
- Modification des modules d'un rapport

---

#### `deleteReport(reportId: string): Promise<boolean>`

Supprime un rapport de l'index.

```typescript
await SearchService.deleteReport("uuid-report");
```

**Appeler après** :
- Suppression d'un rapport

---

#### `reindexAll(): Promise<number>`

Réindexe tous les rapports de la base de données.

```typescript
const count = await SearchService.reindexAll();
console.log(`${count} rapports réindexés`);
```

---

#### `search(query: string, options?: SearchOptions): Promise<SearchResult>`

Effectue une recherche full-text.

```typescript
const results = await SearchService.search("cybercriminalité", {
  filter: 'status = "PUBLISHED" AND urgencyLevel = "URGENT"',
  sort: ["createdAt:desc"],
  limit: 20,
  offset: 0,
});
```

**Options de filtrage** (syntaxe Meilisearch) :

```typescript
// Filtre simple
filter: 'status = "PUBLISHED"'

// Plusieurs conditions (AND)
filter: 'status = "PUBLISHED" AND urgencyLevel = "URGENT"'

// Plusieurs conditions (OR)
filter: 'status = "PUBLISHED" OR status = "REVIEW"'

// Comparaisons numériques
filter: 'createdAt > "2025-01-01T00:00:00.000Z"'

// IN operator
filter: 'status IN ["PUBLISHED", "REVIEW"]'
```

---

#### `getFacets(query?: string): Promise<any>`

Obtient la distribution des facettes.

```typescript
const facets = await SearchService.getFacets("cyber");
console.log(facets.status.PUBLISHED); // 42
```

---

#### `getStats(): Promise<any>`

Obtient les statistiques de l'index.

```typescript
const stats = await SearchService.getStats();
console.log(`${stats.numberOfDocuments} rapports indexés`);
```

---

## Auto-indexation (TODO)

### Middleware Prisma

Pour auto-indexer lors des opérations CRUD, ajouter un middleware Prisma :

```typescript
// backend/src/config/prisma.ts

import { SearchService } from "@modules/search/search.service";

prisma.$use(async (params, next) => {
  const result = await next(params);

  if (params.model === "Report") {
    const reportId = result.id || params.args.where?.id;

    if (params.action === "create" || params.action === "update") {
      // Indexer après création/modification
      await SearchService.indexReport(reportId);
    }

    if (params.action === "delete") {
      // Supprimer de l'index
      await SearchService.deleteReport(reportId);
    }
  }

  return result;
});
```

---

## Dépannage

### Erreur : "The provided API key is invalid"

**Cause** : Meilisearch n'est pas démarré ou la clé API est incorrecte.

**Solution** :
1. Vérifier que Meilisearch est démarré : `docker ps | grep meilisearch`
2. Vérifier `MEILISEARCH_API_KEY` dans `.env`
3. Vérifier `MEILI_MASTER_KEY` dans `docker-compose.yml`

---

### Erreur : "Index not found"

**Cause** : L'index n'a pas été créé.

**Solution** :
```bash
# Redémarrer le serveur pour initialiser l'index
npm run dev

# Ou appeler manuellement
curl -X POST http://localhost:5000/api/search/reindex \
  -H "Authorization: Bearer <admin-token>"
```

---

### Les résultats ne correspondent pas

**Cause** : Index désynchronisé.

**Solution** :
```bash
# Réindexer tous les rapports
curl -X POST http://localhost:5000/api/search/reindex \
  -H "Authorization: Bearer <admin-token>"
```

---

## Performance

### Temps de recherche

Meilisearch est optimisé pour la rapidité :
- Recherche moyenne : **< 50ms**
- Indexation : **~100ms par rapport**

### Optimisations

1. **Limiter les champs retournés** :
```typescript
const results = await index.search(query, {
  attributesToRetrieve: ["id", "title", "status"],
});
```

2. **Utiliser la pagination** :
```typescript
// Charger 20 résultats à la fois
const results = await SearchService.search(query, { limit: 20, offset: 0 });
```

3. **Filtrer avant de rechercher** :
```typescript
// Filtrer par statut réduit l'espace de recherche
const results = await SearchService.search(query, {
  filter: 'status = "PUBLISHED"',
});
```

---

## Frontend Integration (TODO)

### Composants à créer

1. **SearchPage.vue** - Page principale de recherche
2. **SearchFilters.vue** - Composant de filtres (statut, urgence, classification)
3. **SearchResults.vue** - Liste des résultats avec highlighting
4. **SearchBar.vue** - Barre de recherche globale

### Service API Frontend

```typescript
// frontend/src/services/api/search.ts

export const searchApi = {
  search: async (params: SearchParams) => {
    const query = new URLSearchParams(params as any);
    return http.get(`/search?${query}`);
  },

  getFacets: async (query?: string) => {
    return http.get(`/search/facets${query ? `?q=${query}` : ""}`);
  },

  reindex: async () => {
    return http.post("/search/reindex");
  },

  getStats: async () => {
    return http.get("/search/stats");
  },
};
```

### Store Pinia

```typescript
// frontend/src/stores/search.ts

export const useSearchStore = defineStore("search", {
  state: () => ({
    query: "",
    results: [],
    facets: {},
    loading: false,
  }),

  actions: {
    async search(params: SearchParams) {
      this.loading = true;
      try {
        const { data } = await searchApi.search(params);
        this.results = data.hits;
      } finally {
        this.loading = false;
      }
    },
  },
});
```

---

## Tests

### Tests unitaires

```typescript
// backend/tests/modules/search/search.service.spec.ts

describe("SearchService", () => {
  it("should index a report", async () => {
    const reportId = "test-uuid";
    const success = await SearchService.indexReport(reportId);
    expect(success).toBe(true);
  });

  it("should search reports", async () => {
    const results = await SearchService.search("test");
    expect(results.hits).toBeDefined();
    expect(results.estimatedTotalHits).toBeGreaterThan(0);
  });
});
```

### Tests d'intégration

```bash
# Tester la recherche via API
curl -X GET "http://localhost:5000/api/search?q=test&limit=5" \
  -H "Authorization: Bearer <token>" | jq
```

---

## Ressources

- [Documentation Meilisearch](https://docs.meilisearch.com/)
- [Meilisearch Node.js Client](https://github.com/meilisearch/meilisearch-js)
- [Filtering Guide](https://docs.meilisearch.com/learn/filtering_and_sorting/filter_search_results.html)

---

**Dernière mise à jour :** 2025-01-XX
**Version API :** 1.0.0
