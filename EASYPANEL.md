# 🚀 Déploiement sur Easypanel

Ce guide vous explique comment déployer OSINTReport sur Easypanel.

## 📋 Prérequis

- Un compte Easypanel
- Un dépôt GitHub avec OSINTReport
- Un serveur avec Easypanel installé

## 🔧 Configuration Easypanel

### 1. Créer un nouveau projet

1. Connectez-vous à Easypanel
2. Cliquez sur "New Project"
3. Donnez un nom : `osintreport`

### 2. Variables d'environnement

Ajoutez ces variables d'environnement dans Easypanel :

```env
# PostgreSQL
POSTGRES_USER=osint_admin
POSTGRES_PASSWORD=votre_mot_de_passe_securise
POSTGRES_DB=osint_db

# Meilisearch
MEILI_MASTER_KEY=votre_cle_master_securisee_32_caracteres

# Backend
NODE_ENV=production
JWT_SECRET=votre_secret_jwt_64_caracteres
JWT_EXPIRES_IN=7d
COOKIE_SECRET=votre_secret_cookie_32_caracteres
COOKIE_DOMAIN=votre-domaine.com

# URLs
FRONTEND_URL=https://votre-domaine.com
VITE_API_BASE_URL=https://api.votre-domaine.com

# Admin
ADMIN_EMAIL=admin@votre-domaine.com
ADMIN_PASSWORD=mot_de_passe_admin_fort
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=System

# SMTP (optionnel)
SMTP_HOST=smtp.exemple.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_utilisateur
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM_EMAIL=noreply@votre-domaine.com
SMTP_FROM_NAME=OSINTReport
```

### 3. Déployer avec Docker Compose

#### Option A : Via le fichier Easypanel

1. Dans Easypanel, sélectionnez "Deploy with Docker Compose"
2. Utilisez le fichier `docker-compose.easypanel.yml`
3. Configurez les variables d'environnement
4. Déployez !

#### Option B : Via GitHub

1. Connectez votre dépôt GitHub
2. Sélectionnez la branche `main`
3. Easypanel détectera automatiquement le `docker-compose.easypanel.yml`
4. Configurez les variables d'environnement
5. Déployez !

### 4. Configurer les domaines

#### Frontend

- **Domaine** : `votre-domaine.com`
- **Service** : `frontend`
- **Port** : `8080`
- **HTTPS** : Activé (Let's Encrypt)

#### Backend (API)

- **Domaine** : `api.votre-domaine.com`
- **Service** : `backend`
- **Port** : `4000`
- **HTTPS** : Activé (Let's Encrypt)

### 5. Configurer les volumes persistants

Easypanel gérera automatiquement ces volumes :

- `postgres-data` : Données PostgreSQL
- `meilisearch-data` : Index Meilisearch
- `backend-uploads` : Fichiers uploadés
- `backend-logs` : Logs applicatifs

## 🔍 Vérification

### 1. Vérifier les services

```bash
# Dans le terminal Easypanel
docker ps
```

Vous devriez voir 4 conteneurs :

- osintreport-postgres
- osintreport-meilisearch
- osintreport-backend
- osintreport-frontend

### 2. Vérifier les logs

```bash
# Backend
docker logs osintreport-backend

# Frontend
docker logs osintreport-frontend

# PostgreSQL
docker logs osintreport-postgres

# Meilisearch
docker logs osintreport-meilisearch
```

### 3. Tester l'API

```bash
curl https://api.votre-domaine.com/health
```

### 4. Accéder à l'application

Ouvrez votre navigateur : `https://votre-domaine.com`

## 🔒 Sécurité

### 1. Secrets

Générez des secrets forts :

```bash
# JWT Secret (64 caractères)
openssl rand -base64 64

# Cookie Secret (32 caractères)
openssl rand -base64 32

# Meilisearch Master Key (32 caractères)
openssl rand -base64 32

# PostgreSQL Password (24 caractères)
openssl rand -base64 24
```

### 2. HTTPS

Easypanel gère automatiquement Let's Encrypt pour HTTPS.

Assurez-vous que :

- Vos domaines pointent vers votre serveur
- Les certificats sont générés et renouvelés automatiquement

### 3. Pare-feu

Configurez votre pare-feu pour autoriser uniquement :

- Port 80 (HTTP → HTTPS redirect)
- Port 443 (HTTPS)
- Port 22 (SSH pour administration)

## 🔄 Mise à jour

### Mise à jour automatique via GitHub

1. Poussez vos changements sur GitHub
2. Easypanel détectera automatiquement les changements
3. Rebuild et redéploiement automatique

### Mise à jour manuelle

```bash
# Dans Easypanel Terminal
docker compose pull
docker compose up -d --build
```

## 🐛 Dépannage

### Le backend ne démarre pas

1. Vérifiez les logs : `docker logs osintreport-backend`
2. Vérifiez que PostgreSQL est prêt
3. Vérifiez les variables d'environnement

### Erreur 502 Bad Gateway

1. Vérifiez que le backend est démarré
2. Vérifiez les logs du frontend
3. Vérifiez la configuration du proxy

### Base de données inaccessible

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez `DATABASE_URL`
3. Testez la connexion : `docker exec -it osintreport-postgres psql -U osint_admin -d osint_db`

### Meilisearch ne fonctionne pas

1. Vérifiez les logs : `docker logs osintreport-meilisearch`
2. Vérifiez `MEILI_MASTER_KEY`
3. Testez : `curl http://meilisearch:7700/health`

## 📊 Monitoring

Easypanel fournit des métriques de base :

- CPU et RAM utilisés
- Logs en temps réel
- État des conteneurs

Pour un monitoring avancé, installez :

- Prometheus + Grafana
- Uptime Kuma
- Sentry pour les erreurs

## 💾 Sauvegarde

### Sauvegarde PostgreSQL

```bash
# Backup
docker exec osintreport-postgres pg_dump -U osint_admin osint_db > backup_$(date +%Y%m%d).sql

# Restauration
docker exec -i osintreport-postgres psql -U osint_admin osint_db < backup_20231016.sql
```

### Sauvegarde des uploads

```bash
# Les fichiers sont dans le volume backend-uploads
docker run --rm -v osintreport_backend-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
```

## 📞 Support

Pour toute question :

- Documentation complète : `/docs/QUICKSTART.md`
- Documentation Docker : `/DOCKER.md`
- Issues GitHub : https://github.com/Ch4rC0M1n0U/OSINTReport/issues

## 🎯 Checklist de déploiement

- [ ] Serveur Easypanel configuré
- [ ] Dépôt GitHub connecté
- [ ] Variables d'environnement configurées
- [ ] Secrets générés et sécurisés
- [ ] Domaines configurés (frontend + backend)
- [ ] HTTPS activé (Let's Encrypt)
- [ ] Services démarrés (postgres, meilisearch, backend, frontend)
- [ ] Backend API accessible
- [ ] Frontend accessible
- [ ] Compte admin créé
- [ ] Connexion testée
- [ ] Sauvegarde configurée
- [ ] Monitoring configuré

✅ Déploiement terminé !
