# 🚀 Résumé de la Configuration Docker

## ✅ Fichiers créés/modifiés

### Configuration Docker
- ✅ `docker-compose.yml` - Configuration principale Docker Compose
- ✅ `docker-compose.easypanel.yml` - Configuration optimisée pour Easypanel
- ✅ `backend/Dockerfile` - Image Docker du backend (multi-stage)
- ✅ `frontend/Dockerfile` - Image Docker du frontend (multi-stage)

### Documentation
- ✅ `DOCKER.md` - Guide complet de déploiement Docker
- ✅ `EASYPANEL.md` - Guide de déploiement sur Easypanel
- ✅ `.env.docker.example` - Template des variables d'environnement

### Scripts
- ✅ `test-docker-setup.sh` - Script de vérification de la configuration

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Frontend (Vue.js + Nginx)        │
│   Port: 8080                        │
│   - Multi-stage build               │
│   - Nginx Alpine                    │
│   - Healthcheck                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Backend (Node.js + Express)      │
│   Port: 4000                        │
│   - Multi-stage build               │
│   - Prisma migrations auto          │
│   - Chromium (Puppeteer)            │
│   - Healthcheck                     │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────┐
│  PostgreSQL  │  │   Meilisearch   │
│  Port: 5432  │  │   Port: 7700    │
│  Alpine 16   │  │   v1.5          │
│  Healthcheck │  │   Healthcheck   │
└──────────────┘  └──────────────────┘
```

## 🔄 Ordre de démarrage

1. **PostgreSQL** : Démarre en premier avec healthcheck
2. **Meilisearch** : Démarre en parallèle avec healthcheck
3. **Backend** : Attend que postgres ET meilisearch soient healthy
   - Lance les migrations Prisma
   - Crée le compte admin
   - Démarre le serveur
4. **Frontend** : Démarre après le backend
   - Utilise l'URL de l'API configurée

## 📦 Volumes persistants

- `postgres-data` : Données PostgreSQL
- `meilisearch-data` : Index de recherche
- `backend-uploads` : Fichiers uploadés (screenshots, logos, etc.)
- `backend-logs` : Logs de l'application

## �� Sécurité

- ✅ Multi-stage builds (images optimisées)
- ✅ Utilisateurs non-root dans les conteneurs
- ✅ Healthchecks configurés
- ✅ Variables d'environnement externalisées
- ✅ Secrets non committés (.env dans .gitignore)
- ✅ Chromium inclus pour Puppeteer (screenshots)

## 🚀 Déploiement

### Local / Développement

```bash
# 1. Copier l'exemple d'environnement
cp .env.docker.example .env

# 2. Générer les secrets
./scripts/generate-secrets.sh  # ou manuellement avec openssl

# 3. Modifier .env avec vos valeurs
nano .env

# 4. Démarrer les services
docker compose up -d

# 5. Voir les logs
docker compose logs -f

# 6. Accéder à l'application
# Frontend: http://localhost:8080
# Backend: http://localhost:4000
# Meilisearch: http://localhost:7700
```

### Easypanel

```bash
# 1. Pousser le code sur GitHub
git push origin main

# 2. Dans Easypanel :
#    - Créer un nouveau projet
#    - Connecter le dépôt GitHub
#    - Utiliser docker-compose.easypanel.yml
#    - Configurer les variables d'environnement
#    - Configurer les domaines
#    - Déployer !

# 3. Accéder via vos domaines
# Frontend: https://votre-domaine.com
# Backend: https://api.votre-domaine.com
```

## 🧪 Tests

```bash
# Vérifier la configuration
./test-docker-setup.sh

# Tester le health du backend
curl http://localhost:4000/health

# Tester le health de Meilisearch
curl http://localhost:7700/health

# Tester PostgreSQL
docker compose exec postgres pg_isready -U osint_admin

# Voir les logs d'un service
docker compose logs -f backend
```

## 🔧 Commandes utiles

```bash
# Reconstruire après changement de code
docker compose up -d --build

# Redémarrer un service
docker compose restart backend

# Voir le statut
docker compose ps

# Exécuter une commande dans un conteneur
docker compose exec backend sh
docker compose exec postgres psql -U osint_admin -d osint_db

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (⚠️ PERTE DE DONNÉES)
docker compose down -v

# Backup de la base de données
docker compose exec -T postgres pg_dump -U osint_admin osint_db > backup.sql

# Voir l'utilisation des ressources
docker stats
```

## 📚 Documentation

- **Guide complet Docker** : `DOCKER.md`
- **Guide Easypanel** : `EASYPANEL.md`
- **Démarrage rapide** : `docs/QUICKSTART.md`
- **Architecture** : `docs/architecture.md`

## 🎯 Prochaines étapes

1. ✅ Configuration Docker terminée
2. ⏭️ Tester localement avec `docker compose up -d`
3. ⏭️ Configurer les secrets de production
4. ⏭️ Déployer sur Easypanel
5. ⏭️ Configurer les domaines et HTTPS
6. ⏭️ Configurer les sauvegardes automatiques
7. ⏭️ Configurer le monitoring

## ⚠️ Important

- **Ne committez JAMAIS** le fichier `.env` avec les vrais secrets
- **Changez TOUS** les mots de passe par défaut
- **Utilisez HTTPS** en production
- **Configurez des sauvegardes** régulières
- **Surveillez les logs** pour détecter les erreurs

## 🆘 Support

En cas de problème :
1. Consultez les logs : `docker compose logs -f`
2. Vérifiez la documentation : `DOCKER.md` et `EASYPANEL.md`
3. Vérifiez les issues GitHub
4. Créez une nouvelle issue si nécessaire

---

**Configuration créée le** : 16 octobre 2025  
**Version Docker** : 3.8  
**Node.js** : 20-alpine  
**PostgreSQL** : 16-alpine  
**Meilisearch** : v1.5  
**Nginx** : alpine
