# Configuration Meilisearch pour OSINTReport

## 📋 Vue d'ensemble

Ce document décrit la configuration complète de Meilisearch pour le système OSINTReport.

---

## 🔑 Variables d'environnement

### Fichier : `backend/.env`

```env
# Meilisearch Configuration
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey123456789
```

### Fichier racine : `.env`

```env
# Meilisearch Configuration
MEILI_MASTER_KEY=masterKey123456789
MEILI_ENV=development
MEILI_NO_ANALYTICS=true
MEILI_PORT=7700
MEILI_HOST=http://localhost:7700
```

---

## 🐳 Configuration Docker

Le service Meilisearch est défini dans `docker-compose.yml` :

```yaml
meilisearch:
  image: getmeili/meilisearch:v1.5
  container_name: osintreport-meilisearch
  restart: unless-stopped
  env_file:
    - .env
  environment:
    MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:-masterKey123456789}
    MEILI_ENV: ${MEILI_ENV:-development}
    MEILI_NO_ANALYTICS: ${MEILI_NO_ANALYTICS:-true}
  ports:
    - "${MEILI_PORT:-7700}:7700"
  volumes:
    - meilisearch-data:/meili_data
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:7700/health"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
```

---

## 🚀 Démarrage

### 1. Démarrer Meilisearch

```bash
# Depuis la racine du projet
docker-compose up -d meilisearch

# Vérifier le statut
docker-compose ps meilisearch

# Voir les logs
docker-compose logs -f meilisearch
```

### 2. Vérifier la santé du service

```bash
# Test de santé
curl http://localhost:7700/health

# Devrait retourner :
# {"status":"available"}
```

### 3. Tester l'API avec la clé

```bash
# Obtenir les statistiques (nécessite la clé API)
curl http://localhost:7700/stats \
  -H "Authorization: Bearer masterKey123456789"

# Lister les index
curl http://localhost:7700/indexes \
  -H "Authorization: Bearer masterKey123456789"
```

---

## ⚙️ Configuration Backend

Le backend utilise les variables d'environnement via le module `env.ts` :

```typescript
// backend/src/config/env.ts
const envSchema = z.object({
  // ... autres variables
  MEILISEARCH_HOST: z.string().default("http://localhost:7700"),
  MEILISEARCH_API_KEY: z.string().default("masterKey"),
});
```

Le `SearchService` utilise ces variables :

```typescript
// backend/src/modules/search/search.service.ts
import { env } from "@/config/env";

const MEILISEARCH_HOST = env.MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = env.MEILISEARCH_API_KEY;

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});
```

---

## 🔐 Sécurité

### En développement

- Clé API par défaut : `masterKey123456789`
- Accessible uniquement sur `localhost:7700`
- Analytics désactivés (`MEILI_NO_ANALYTICS=true`)

### En production

**⚠️ IMPORTANT** : Changez la clé API avant la mise en production !

1. Générez une clé sécurisée :

```bash
# Générer une clé aléatoire de 32 caractères
openssl rand -base64 32
```

2. Mettez à jour les fichiers `.env` :

```env
# .env (racine)
MEILI_MASTER_KEY=<votre_clé_générée>

# backend/.env
MEILISEARCH_API_KEY=<votre_clé_générée>
```

3. Configurez les restrictions réseau :
   - Utilisez un pare-feu pour limiter l'accès
   - Utilisez HTTPS en production
   - Limitez les connexions au backend uniquement

---

## 📊 Initialisation de l'index

Au démarrage du backend, l'index `reports` est automatiquement configuré :

```typescript
// backend/src/server.ts
import { SearchService } from "./modules/search/search.service";

async function bootstrap() {
  // ... autres initialisations
  
  try {
    await SearchService.initializeIndexes();
    logger.info("Index Meilisearch configuré avec succès");
  } catch (error) {
    logger.warn("Meilisearch non disponible - fonctionnalités de recherche désactivées");
  }
}
```

**Configuration de l'index** :
- **Attributs searchable** : title, caseNumber, summary, keywords, modulesContent
- **Attributs filterable** : status, urgencyLevel, classification, ownerId
- **Attributs sortable** : createdAt, updatedAt, issuedAt, title

---

## 🧪 Tests

### Tester la connexion depuis le backend

```bash
# Démarrer le backend
cd backend
npm run dev

# Vérifier les logs - devrait afficher :
# [INFO] Index Meilisearch configuré avec succès
```

### Tester l'API de recherche

```bash
# Obtenir les statistiques (admin uniquement)
curl http://localhost:4000/api/search/stats \
  -H "Cookie: or_at=<votre_token_jwt>"

# Rechercher des rapports
curl "http://localhost:4000/api/search?q=cyber" \
  -H "Cookie: or_at=<votre_token_jwt>"
```

---

## 🐛 Dépannage

### Problème : "Connection refused"

**Cause** : Meilisearch n'est pas démarré

**Solution** :
```bash
docker-compose up -d meilisearch
docker-compose logs meilisearch
```

---

### Problème : "Invalid API key"

**Cause** : Clé API incorrecte dans `backend/.env`

**Solution** :
1. Vérifiez que `MEILISEARCH_API_KEY` dans `backend/.env` correspond à `MEILI_MASTER_KEY` dans `.env` (racine)
2. Redémarrez le backend :
```bash
cd backend
npm run dev
```

---

### Problème : "Index not found"

**Cause** : L'index n'a pas été initialisé

**Solution** :
```bash
# Réindexer tous les rapports (admin uniquement)
curl -X POST http://localhost:4000/api/search/reindex \
  -H "Cookie: or_at=<votre_token_jwt>"
```

---

## 📈 Monitoring

### Dashboard Meilisearch (développement uniquement)

Accédez au dashboard : http://localhost:7700

**Fonctionnalités** :
- Vue des index
- Aperçu des documents
- Testeur de recherche en direct
- Configuration des attributs

---

## 🔄 Maintenance

### Réindexer tous les rapports

**Via l'interface** (admin uniquement) :
1. Allez sur `/search`
2. Section "Statistiques de l'index"
3. Cliquez sur "Réindexer tout"

**Via API** :
```bash
curl -X POST http://localhost:4000/api/search/reindex \
  -H "Cookie: or_at=<votre_token_jwt>"
```

**Via script Node.js** :
```typescript
import { SearchService } from './modules/search/search.service';

await SearchService.reindexAll();
console.log('Réindexation terminée');
```

---

### Supprimer et recréer l'index

```bash
# Supprimer l'index
curl -X DELETE http://localhost:7700/indexes/reports \
  -H "Authorization: Bearer masterKey123456789"

# Redémarrer le backend pour recréer l'index
cd backend
npm run dev
```

---

## 📚 Ressources

- [Documentation Meilisearch](https://docs.meilisearch.com/)
- [Guide d'installation](https://docs.meilisearch.com/learn/getting_started/installation.html)
- [Configuration avancée](https://docs.meilisearch.com/learn/configuration/instance_options.html)
- [Sécurité et clés API](https://docs.meilisearch.com/learn/security/master_api_keys.html)

---

## ✅ Checklist de configuration

- [x] `.env` (racine) avec `MEILI_MASTER_KEY`
- [x] `backend/.env` avec `MEILISEARCH_HOST` et `MEILISEARCH_API_KEY`
- [x] `backend/src/config/env.ts` avec validation Zod
- [x] `docker-compose.yml` avec service Meilisearch
- [x] Backend utilise `env.MEILISEARCH_*` au lieu de `process.env.*`
- [ ] Meilisearch démarré (`docker-compose up -d meilisearch`)
- [ ] Backend démarré et index initialisé
- [ ] Rapports indexés (automatiquement ou via réindexation)

---

**Dernière mise à jour** : 2 octobre 2025, 04:30 UTC  
**Version Meilisearch** : 1.5  
**Auteur** : GitHub Copilot + Ch4rC0M1n0U
