# 🐳 Déploiement Docker - OSINTReport

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- 4 GB RAM minimum
- 10 GB espace disque

## 🚀 Démarrage rapide

### 1. Configuration

Copiez le fichier d'exemple et configurez vos variables :

```bash
cp .env.docker.example .env
nano .env  # Modifiez les valeurs
```

**⚠️ IMPORTANT** : Changez tous les secrets et mots de passe !

### 2. Générer des secrets forts

```bash
# JWT Secret
openssl rand -base64 64

# Cookie Secret
openssl rand -base64 32

# Meilisearch Master Key
openssl rand -base64 32

# Password PostgreSQL
openssl rand -base64 24
```

### 3. Lancer l'application

```bash
# Construire et démarrer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f

# Vérifier le statut
docker compose ps
```

### 4. Accéder à l'application

- **Frontend** : http://localhost:8080
- **Backend API** : http://localhost:4000
- **Meilisearch** : http://localhost:7700

## 📦 Architecture des services

```
┌─────────────────────────────────────┐
│   Frontend (Vue.js + Nginx)        │
│   Port: 8080                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Backend (Node.js + Express)      │
│   Port: 4000                        │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────┐
│  PostgreSQL  │  │   Meilisearch   │
│  Port: 5432  │  │   Port: 7700    │
└──────────────┘  └──────────────────┘
```

## 🔧 Commandes utiles

```bash
# Redémarrer un service
docker compose restart backend

# Voir les logs d'un service spécifique
docker compose logs -f backend

# Reconstruire après modification du code
docker compose up -d --build

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (⚠️ perte de données)
docker compose down -v

# Exécuter une commande dans un conteneur
docker compose exec backend sh
docker compose exec postgres psql -U osint_admin -d osint_db

# Voir l'utilisation des ressources
docker stats
```

## 🔍 Vérifications de santé

```bash
# Backend health
curl http://localhost:4000/health

# Meilisearch health
curl http://localhost:7700/health

# PostgreSQL
docker compose exec postgres pg_isready -U osint_admin
```

## 📊 Volumes persistants

Les données sont stockées dans des volumes Docker :

- `postgres-data` : Base de données
- `meilisearch-data` : Index de recherche
- `backend-uploads` : Fichiers uploadés
- `backend-logs` : Logs applicatifs

### Sauvegarde

```bash
# Backup PostgreSQL
docker compose exec -T postgres pg_dump -U osint_admin osint_db > backup_$(date +%Y%m%d).sql

# Restaurer
docker compose exec -T postgres psql -U osint_admin osint_db < backup_20231016.sql
```

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker compose logs backend

# Vérifier que PostgreSQL est prêt
docker compose logs postgres

# Recréer le conteneur
docker compose up -d --force-recreate backend
```

### Erreur de migration Prisma

```bash
# Exécuter les migrations manuellement
docker compose exec backend npx prisma migrate deploy

# Reset de la base (⚠️ perte de données)
docker compose exec backend npx prisma migrate reset
```

### Le frontend ne trouve pas l'API

Vérifiez que `VITE_API_BASE_URL` dans `.env` pointe vers la bonne URL.

### Problème de permissions

```bash
# Vérifier les permissions des volumes
docker compose exec backend ls -la /app/uploads
docker compose exec backend ls -la /app/logs
```

## 🔒 Production

Pour un déploiement en production :

### 1. Sécurité

- Changez TOUS les secrets
- Utilisez HTTPS (reverse proxy Nginx/Traefik)
- Configurez un firewall
- Limitez l'accès aux ports

### 2. Configuration

```env
NODE_ENV=production
MEILI_ENV=production
COOKIE_DOMAIN=votre-domaine.com
FRONTEND_URL=https://votre-domaine.com
VITE_API_BASE_URL=https://api.votre-domaine.com
```

### 3. Reverse Proxy (exemple Nginx)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Monitoring

```bash
# Installer Prometheus et Grafana
# Configurer des alertes
# Surveiller les logs
```

## 🔄 Mise à jour

```bash
# 1. Sauvegarder les données
docker compose exec -T postgres pg_dump -U osint_admin osint_db > backup.sql

# 2. Mettre à jour le code
git pull

# 3. Reconstruire les images
docker compose build

# 4. Redémarrer les services
docker compose up -d

# 5. Vérifier les migrations
docker compose logs backend | grep -i migration
```

## 📞 Support

Pour toute question, consultez la documentation principale dans `/docs`.
