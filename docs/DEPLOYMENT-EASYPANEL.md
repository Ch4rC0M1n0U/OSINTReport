# 🚀 Guide de Déploiement EasyPanel - OSINTReport

Guide complet pour déployer OSINTReport sur EasyPanel via GitHub.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Préparation du repository GitHub](#préparation-du-repository-github)
3. [Configuration EasyPanel](#configuration-easypanel)
4. [Variables d'environnement](#variables-denvironnement)
5. [Déploiement](#déploiement)
6. [Vérifications post-déploiement](#vérifications-post-déploiement)
7. [Résolution des problèmes](#résolution-des-problèmes)

---

## 🎯 Prérequis

### Compte et accès

- ✅ Compte EasyPanel actif
- ✅ Accès au repository GitHub `Ch4rC0M1n0U/OSINTReport`
- ✅ Nom de domaine configuré (optionnel mais recommandé)

### Connaissances requises

- Base de Docker et Docker Compose
- Variables d'environnement
- Gestion DNS (si domaine personnalisé)

---

## 📦 Préparation du repository GitHub

### 1. Vérifier que les fichiers de déploiement sont présents

Assurez-vous que votre repository contient les fichiers suivants :

```
OSINTReport/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ... (code backend)
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── ... (code frontend)
├── docker-compose.production.yml    # Version complète avec healthchecks
├── docker-compose.easypanel.yml     # Version simplifiée pour EasyPanel (recommandé)
├── .env.production.example
└── easypanel.yml
```

### 2. Pousser les changements sur GitHub

```bash
# Ajouter tous les fichiers de déploiement
git add .

# Commit
git commit -m "feat: Add deployment configuration for EasyPanel"

# Pousser sur la branche main
git push origin main
```

### 3. Créer un tag de version (optionnel mais recommandé)

```bash
git tag -a v1.0.0 -m "Version 1.0.0 - Déploiement initial"
git push origin v1.0.0
```

---

## ⚙️ Configuration EasyPanel

### 1. Connexion à EasyPanel

1. Connectez-vous à votre instance EasyPanel : `https://votre-easypanel.com`
2. Accédez à votre projet ou créez-en un nouveau

### 2. Créer un nouveau projet

1. Cliquez sur **"New Project"**
2. Nom du projet : `osintreport`
3. Cliquez sur **"Create"**

### 3. Connecter GitHub

1. Dans votre projet, allez dans **Settings** → **GitHub**
2. Cliquez sur **"Connect GitHub"**
3. Autorisez EasyPanel à accéder à votre repository
4. Sélectionnez le repository `Ch4rC0M1n0U/OSINTReport`
5. Branche : `main`

---

## 🔐 Variables d'environnement

### 1. Générer des secrets sécurisés

Avant de déployer, générez des clés aléatoires sécurisées :

```bash
# Générer JWT_SECRET (32 caractères minimum)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Générer COOKIE_SECRET (32 caractères minimum)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Générer MEILI_MASTER_KEY (16 caractères minimum)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Générer POSTGRES_PASSWORD
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 2. Configurer les variables dans EasyPanel

Accédez à **Settings** → **Environment Variables** et ajoutez :

#### Base de données PostgreSQL

```env
POSTGRES_USER=osint_admin
POSTGRES_PASSWORD=<généré précédemment>
POSTGRES_DB=osint_db
```

#### Backend API

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://osint_admin:<POSTGRES_PASSWORD>@postgres:5432/osint_db?schema=public
JWT_SECRET=<généré précédemment>
JWT_EXPIRES_IN=7d
COOKIE_SECRET=<généré précédemment>
COOKIE_DOMAIN=
FRONTEND_URL=https://votredomaine.com
```

#### Meilisearch

```env
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=<généré précédemment>
MEILI_ENV=production
MEILI_NO_ANALYTICS=true
```

#### Compte administrateur

```env
ADMIN_EMAIL=admin@votreorganisation.be
ADMIN_PASSWORD=<mot de passe fort>
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=System
```

#### SMTP (optionnel)

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@votreorganisation.be
SMTP_PASSWORD=<mot de passe SMTP>
SMTP_FROM_EMAIL=noreply@votreorganisation.be
SMTP_FROM_NAME=OSINTReport
```

#### Frontend

```env
VITE_API_BASE_URL=https://api.votredomaine.com
```

---

## 🚢 Déploiement

### ⚡ Quelle version Docker Compose utiliser ?

**Deux fichiers sont disponibles** :

#### 🎯 `docker-compose.easypanel.yml` (RECOMMANDÉ pour EasyPanel)
- ✅ Version simplifiée sans healthchecks stricts
- ✅ Meilleure compatibilité avec EasyPanel
- ✅ Démarrage plus rapide
- ✅ Moins de problèmes de configuration
- ⚠️ Pas de détection automatique de santé des services

**Utilisez ce fichier si** :
- Vous déployez sur EasyPanel
- Vous rencontrez des erreurs "unhealthy"
- Vous voulez une configuration simple et robuste

#### 🔧 `docker-compose.production.yml` (Production auto-hébergée)
- ✅ Healthchecks complets pour tous les services
- ✅ Meilleure détection des problèmes
- ✅ Redémarrage automatique si unhealthy
- ⚠️ Peut nécessiter plus de configuration
- ⚠️ Certaines plateformes peuvent avoir des problèmes

**Utilisez ce fichier si** :
- Vous déployez sur votre propre serveur
- Vous voulez un monitoring fin des services
- Vous avez besoin de healthchecks stricts

---

### Option 1 : Déploiement avec Docker Compose (Recommandé)

#### Méthode A : Version EasyPanel (Simplifiée)

1. Dans EasyPanel, allez dans **Services**
2. Cliquez sur **"Add Service"** → **"Docker Compose"**
3. **Copiez le contenu de `docker-compose.easypanel.yml`** ✅
4. Cliquez sur **"Deploy"**

#### Méthode B : Version Production (Avec healthchecks)

1. Dans EasyPanel, allez dans **Services**
2. Cliquez sur **"Add Service"** → **"Docker Compose"**
3. Copiez le contenu de `docker-compose.production.yml`
4. Cliquez sur **"Deploy"**

💡 **Astuce** : Si vous rencontrez des erreurs de healthcheck, utilisez la Méthode A.

### Option 2 : Déploiement manuel service par service

#### A. Déployer PostgreSQL

1. **Add Service** → **Database** → **PostgreSQL 16**
2. Nom : `postgres`
3. Volume : `/var/lib/postgresql/data`
4. Variables d'environnement : (voir section précédente)

#### B. Déployer Meilisearch

1. **Add Service** → **Application**
2. Image : `getmeili/meilisearch:v1.5`
3. Nom : `meilisearch`
4. Port : `7700`
5. Volume : `/meili_data`
6. Variables d'environnement : (voir section précédente)

#### C. Déployer le Backend

1. **Add Service** → **Application** → **From GitHub**
2. Repository : `Ch4rC0M1n0U/OSINTReport`
3. Path : `backend`
4. Dockerfile : `backend/Dockerfile`
5. Port : `4000`
6. Domaine : `api.votredomaine.com`
7. Variables d'environnement : (voir section précédente)
8. Volumes :
   - `/app/uploads` → `backend-uploads`
   - `/app/logs` → `backend-logs`

#### D. Déployer le Frontend

1. **Add Service** → **Application** → **From GitHub**
2. Repository : `Ch4rC0M1n0U/OSINTReport`
3. Path : `frontend`
4. Dockerfile : `frontend/Dockerfile`
5. Build Args : `VITE_API_BASE_URL=https://api.votredomaine.com`
6. Port : `8080`
7. Domaine : `votredomaine.com`

---

## ✅ Vérifications post-déploiement

### 1. Vérifier les services

Dans EasyPanel, vérifiez que tous les services sont **Running** :

- ✅ postgres
- ✅ meilisearch
- ✅ backend
- ✅ frontend

### 2. Vérifier les logs

#### Backend

```bash
# Dans EasyPanel, accédez aux logs du backend
# Recherchez :
✅ "Server is running on port 4000"
✅ "Connected to PostgreSQL database"
✅ "Prisma migrations applied successfully"
✅ "Meilisearch connection successful"
```

#### Frontend

```bash
# Logs du frontend
✅ "Nginx started successfully"
```

### 3. Tests de connectivité

#### Test API Backend

```bash
curl https://api.votredomaine.com/health
# Réponse attendue: {"status": "ok", "timestamp": "..."}
```

#### Test Frontend

```bash
curl https://votredomaine.com/
# Doit retourner le HTML de la page
```

### 4. Connexion à l'application

1. Ouvrez votre navigateur
2. Accédez à `https://votredomaine.com`
3. Connectez-vous avec les identifiants admin :
   - Email : `admin@votreorganisation.be`
   - Mot de passe : celui défini dans `ADMIN_PASSWORD`

---

## 🔧 Résolution des problèmes

### Problème : Le backend ne démarre pas

**Symptôme** : Service backend en erreur, logs montrent une erreur de connexion DB

**Solution** :
1. Vérifiez que PostgreSQL est démarré et accessible
2. Vérifiez `DATABASE_URL` dans les variables d'environnement
3. Testez la connexion :
   ```bash
   # Dans le conteneur backend
   npx prisma db pull
   ```

### Problème : Erreur 502 Bad Gateway

**Symptôme** : Le frontend affiche une erreur 502

**Solution** :
1. Vérifiez que le backend est en cours d'exécution
2. Vérifiez `VITE_API_BASE_URL` dans les variables d'environnement du frontend
3. Vérifiez les logs du backend pour détecter les erreurs

### Problème : Erreur CORS

**Symptôme** : Le navigateur bloque les requêtes API avec une erreur CORS

**Solution** :
1. Vérifiez `FRONTEND_URL` dans le backend
2. Assurez-vous que `COOKIE_DOMAIN` est correctement configuré
3. Pour un domaine personnalisé : `COOKIE_DOMAIN=.votredomaine.com`
4. Pour localhost : `COOKIE_DOMAIN=` (vide)

### Problème : Les migrations Prisma échouent

**Symptôme** : Le backend démarre mais ne peut pas accéder à la base de données

**Solution** :
1. Exécutez manuellement les migrations :
   ```bash
   # Dans EasyPanel, ouvrez un terminal dans le conteneur backend
   npx prisma migrate deploy
   ```
2. Si nécessaire, réinitialisez la base :
   ```bash
   npx prisma migrate reset --force
   ```

### Problème : Les uploads ne fonctionnent pas

**Symptôme** : Les fichiers uploadés disparaissent après un redémarrage

**Solution** :
1. Vérifiez que le volume `backend-uploads` est bien monté sur `/app/uploads`
2. Vérifiez les permissions :
   ```bash
   # Dans le conteneur backend
   ls -la /app/uploads
   # Doit être accessible en écriture
   ```

### Problème : Meilisearch ne fonctionne pas

**Symptôme** : La recherche ne retourne aucun résultat

**Solution** :
1. Vérifiez que Meilisearch est accessible :
   ```bash
   curl http://meilisearch:7700/health
   ```
2. Vérifiez `MEILI_MASTER_KEY` dans backend et meilisearch (doit être identique)
3. Réindexez manuellement :
   ```bash
   # Via l'API backend
   curl -X POST https://api.votredomaine.com/search/reindex \
     -H "Authorization: Bearer <votre_token>"
   ```

---

## 🔄 Mise à jour de l'application

### Déploiement d'une nouvelle version

1. Poussez vos changements sur GitHub :
   ```bash
   git add .
   git commit -m "feat: nouvelle fonctionnalité"
   git push origin main
   ```

2. Dans EasyPanel :
   - Méthode automatique : EasyPanel redéploie automatiquement si configuré
   - Méthode manuelle : Cliquez sur **"Redeploy"** pour chaque service

3. Surveillez les logs pour vérifier que le déploiement s'est bien passé

### Rollback en cas de problème

1. Dans GitHub, identifiez le dernier commit stable
2. Dans EasyPanel, redéployez avec le commit/tag précédent
3. Ou utilisez :
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

---

## 📊 Monitoring et Maintenance

### Logs

- Accédez aux logs de chaque service dans EasyPanel → **Services** → **Logs**
- Logs du backend : `/app/logs/` (persistés dans le volume)

### Backups

#### Base de données PostgreSQL

```bash
# Backup
docker exec osintreport-postgres pg_dump -U osint_admin osint_db > backup.sql

# Restore
docker exec -i osintreport-postgres psql -U osint_admin osint_db < backup.sql
```

#### Uploads

```bash
# Les fichiers sont dans le volume backend-uploads
# Configurez une sauvegarde automatique dans EasyPanel
```

### Mise à l'échelle

Pour augmenter les performances :

1. **Backend** : Augmentez le nombre d'instances dans EasyPanel
2. **PostgreSQL** : Augmentez les ressources (CPU/RAM)
3. **Meilisearch** : Augmentez la RAM allouée

---

## 🔐 Sécurité en Production

### Checklist de sécurité

- ✅ Toutes les variables d'environnement sensibles sont définies
- ✅ `NODE_ENV=production`
- ✅ HTTPS activé sur tous les domaines
- ✅ `COOKIE_SECURE=true` si HTTPS
- ✅ Mots de passe forts pour admin et base de données
- ✅ Backups automatiques configurés
- ✅ Monitoring des logs activé
- ✅ Rate limiting activé (via Nginx ou middleware)

### Recommandations

1. **Changez tous les mots de passe par défaut**
2. **Activez l'authentification à deux facteurs** pour EasyPanel et GitHub
3. **Configurez des alertes** pour les erreurs critiques
4. **Mettez en place un WAF** (Web Application Firewall) si possible
5. **Scannez régulièrement** les vulnérabilités avec `npm audit`

---

## 📞 Support

### Ressources

- **Documentation OSINTReport** : `/docs` dans le repository
- **EasyPanel Documentation** : https://easypanel.io/docs
- **Issues GitHub** : https://github.com/Ch4rC0M1n0U/OSINTReport/issues

### Contacts

- **Email** : support@osintreport.police.belgium.eu
- **GitHub** : @Ch4rC0M1n0U

---

## ✨ Félicitations !

Votre application OSINTReport est maintenant déployée sur EasyPanel ! 🎉

**Prochaines étapes** :
1. Configurez votre domaine personnalisé
2. Activez HTTPS avec Let's Encrypt
3. Créez des comptes utilisateurs
4. Importez vos données
5. Profitez de votre plateforme OSINT !

---

**Version du guide** : 1.0.0  
**Dernière mise à jour** : 7 octobre 2025  
**Auteur** : Ch4rC0M1n0U
