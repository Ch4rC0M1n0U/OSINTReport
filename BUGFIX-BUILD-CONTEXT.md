# 🐛 BUGFIX - Build Context et Variables d'environnement

## 🔍 Problème identifié

Les services backend et frontend ne démarrent pas sur EasyPanel car :
1. Les fichiers des sous-répertoires ne sont pas accessibles
2. La variable `VITE_API_BASE_URL` n'est pas passée au build du frontend

## 🎯 Causes

### Problème 1 : Contexte de build

Dans `docker-compose.easypanel.yml`, les chemins sont relatifs :

```yaml
backend:
  build:
    context: ./backend  # ✅ Correct si le fichier est à la racine
    dockerfile: Dockerfile
```

**Vérification** : Le fichier `docker-compose.easypanel.yml` DOIT être à la racine du repository.

### Problème 2 : Variable d'environnement frontend

Vite (le bundler de Vue.js) a besoin de `VITE_API_BASE_URL` **au moment du build**, pas au runtime.

**Avant** (❌ Incorrect) :
```dockerfile
# Pas d'ARG, la variable n'est pas accessible pendant le build
RUN npm run build
```

**Après** (✅ Correct) :
```dockerfile
ARG VITE_API_BASE_URL=http://localhost:4000
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production
RUN npm run build
```

## ✅ Solutions appliquées

### 1. Dockerfile frontend modifié

**Fichier** : `frontend/Dockerfile`

```dockerfile
# Stage 1: Build de l'application Vue.js
FROM node:20-alpine AS builder

# Argument de build pour l'URL de l'API
ARG VITE_API_BASE_URL=http://localhost:4000

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Créer le fichier .env.production avec l'URL de l'API
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production

# Build de production (Vite utilisera la variable)
RUN npm run build
```

### 2. Docker Compose configuré correctement

**Fichier** : `docker-compose.easypanel.yml`

```yaml
frontend:
  build:
    context: ./frontend  # Chemin relatif depuis la racine
    dockerfile: Dockerfile
    args:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}  # Passé au build
  restart: unless-stopped
  expose:
    - "8080"
```

## 🧪 Test de validation

### Test local

```bash
# À la racine du projet
cd /workspaces/OSINTReport

# Build du frontend avec argument
docker build \
  --build-arg VITE_API_BASE_URL=https://api.votredomaine.com \
  -t test-frontend \
  ./frontend

# Vérifier que le build a réussi
docker run --rm test-frontend cat /usr/share/nginx/html/index.html | grep "votredomaine"
```

### Test du backend

```bash
# Build du backend
docker build -t test-backend ./backend

# Vérifier que le build a réussi
docker run --rm test-backend ls -la /app/dist
```

### Test du stack complet

```bash
# Avec docker-compose.easypanel.yml
export VITE_API_BASE_URL=https://api.votredomaine.com
docker-compose -f docker-compose.easypanel.yml build

# Vérifier les images
docker images | grep osint
```

## 📋 Checklist de déploiement EasyPanel

### Avant de déployer

- [ ] Le fichier `docker-compose.easypanel.yml` est à la racine du repository
- [ ] Les sous-répertoires `backend/` et `frontend/` existent
- [ ] Chaque sous-répertoire contient un `Dockerfile`
- [ ] Les `package-lock.json` sont présents et non exclus
- [ ] La variable `VITE_API_BASE_URL` est définie dans EasyPanel

### Structure du repository attendue

```
OSINTReport/                         ← Racine du repository
├── docker-compose.easypanel.yml     ← À LA RACINE
├── backend/
│   ├── Dockerfile                   ← Build context: ./backend
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma/
│   └── src/
├── frontend/
│   ├── Dockerfile                   ← Build context: ./frontend
│   ├── package.json
│   ├── package-lock.json
│   ├── nginx.conf
│   └── src/
└── ...
```

### Variables d'environnement dans EasyPanel

**Critiques pour le build** :
```env
VITE_API_BASE_URL=https://api.votredomaine.com
```

**Critiques pour le runtime** :
```env
POSTGRES_PASSWORD=<secret>
JWT_SECRET=<secret>
COOKIE_SECRET=<secret>
MEILI_MASTER_KEY=<secret>
ADMIN_EMAIL=admin@votreorganisation.be
ADMIN_PASSWORD=<secret>
FRONTEND_URL=https://votredomaine.com
```

## 🔍 Debugging

### Si le backend ne build pas

```bash
# Vérifier que les fichiers sont présents
ls -la backend/Dockerfile
ls -la backend/package.json
ls -la backend/package-lock.json

# Vérifier le contexte de build
docker build -t test-backend ./backend
```

**Erreurs communes** :
- `package-lock.json` exclu → Vérifier `.dockerignore`
- Prisma schema manquant → Vérifier que `prisma/` est copié
- Dépendances natives qui échouent → Installer `python3 make g++`

### Si le frontend ne build pas

```bash
# Vérifier la variable VITE_API_BASE_URL
docker build \
  --build-arg VITE_API_BASE_URL=https://api.test.com \
  -t test-frontend \
  ./frontend

# Vérifier le fichier .env.production créé
docker run --rm test-frontend sh -c "cat /app/.env.production" 2>/dev/null || echo "Build stage terminé"
```

**Erreurs communes** :
- Variable `VITE_API_BASE_URL` non passée → Vérifier docker-compose args
- Build Vite qui échoue → Vérifier les logs de build
- Nginx config manquante → Vérifier que `nginx.conf` existe

### Vérifier les logs sur EasyPanel

1. **Services** → **backend** → **Logs**
   - Rechercher : `Server is running on port 4000`
   - Erreur commune : `DATABASE_URL` mal formaté

2. **Services** → **frontend** → **Logs**
   - Rechercher : Nginx started
   - Erreur commune : Fichiers dist manquants

3. **Services** → **postgres** → **Logs**
   - Rechercher : `database system is ready`
   
4. **Services** → **meilisearch** → **Logs**
   - Rechercher : `Meilisearch is ready`

## 💡 Comment Vite gère les variables d'environnement

### Au moment du BUILD (important !)

```javascript
// Dans le code Vue.js
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

**Vite remplace** `import.meta.env.VITE_API_BASE_URL` par la valeur **pendant le build** :

```javascript
// Après build (dans dist/assets/index-abc123.js)
const API_URL = "https://api.votredomaine.com";
```

C'est pourquoi :
- ✅ La variable DOIT être définie avant `npm run build`
- ✅ Elle est "figée" dans le code JavaScript compilé
- ❌ Impossible de la changer après le build

### Fichier .env.production

```bash
# Créé pendant le build Docker
echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production
```

Vite lit automatiquement `.env.production` lors de `npm run build`.

## ✨ Résultat

Après ces corrections :
- ✅ Le frontend build avec la bonne URL de l'API
- ✅ Le backend build avec toutes les dépendances
- ✅ Les contextes de build sont corrects
- ✅ Les variables d'environnement sont passées correctement

## 📚 Fichiers modifiés

- `frontend/Dockerfile` - Ajout de l'ARG et création du .env.production

## 🔗 Références

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker ARG vs ENV](https://docs.docker.com/engine/reference/builder/#arg)
- [Docker Build Context](https://docs.docker.com/build/building/context/)

---

**Date de correction** : 7 octobre 2025  
**Impact** : Critique - empêchait le build du frontend  
**Statut** : ✅ Résolu
