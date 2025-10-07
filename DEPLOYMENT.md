# 🚀 Déploiement Rapide - OSINTReport

Ce guide vous permet de déployer rapidement OSINTReport sur EasyPanel.

## 📋 Fichiers de déploiement créés

Tous les fichiers nécessaires pour le déploiement ont été préparés :

### Docker
- ✅ `backend/Dockerfile` - Image Docker du backend
- ✅ `frontend/Dockerfile` - Image Docker du frontend  
- ✅ `frontend/nginx.conf` - Configuration Nginx pour le frontend
- ✅ `backend/.dockerignore` - Exclusions Docker backend
- ✅ `frontend/.dockerignore` - Exclusions Docker frontend
- ✅ `.dockerignore` - Exclusions Docker racine

### Configuration
- ✅ `docker-compose.production.yml` - Orchestration des services
- ✅ `.env.production.example` - Template des variables d'environnement
- ✅ `easypanel.yml` - Configuration EasyPanel

### Documentation
- ✅ `docs/DEPLOYMENT-EASYPANEL.md` - Guide complet de déploiement

### Scripts
- ✅ `scripts/generate-secrets.sh` - Génération des clés secrètes

## 🎯 Démarrage rapide

### 1. Générer les secrets

```bash
./scripts/generate-secrets.sh
```

Copiez les valeurs générées et conservez-les en lieu sûr.

### 2. Préparer GitHub

```bash
# Ajouter tous les fichiers
git add .

# Commit
git commit -m "feat: Add deployment configuration for EasyPanel"

# Pousser sur GitHub
git push origin main
```

### 3. Déployer sur EasyPanel

Suivez le guide détaillé dans [`docs/DEPLOYMENT-EASYPANEL.md`](docs/DEPLOYMENT-EASYPANEL.md)

#### Résumé des étapes :

1. **Créer un projet** sur EasyPanel
2. **Connecter GitHub** (repository: `Ch4rC0M1n0U/OSINTReport`)
3. **Configurer les variables d'environnement** avec les secrets générés
4. **Déployer** avec Docker Compose ou service par service
5. **Vérifier** que tout fonctionne

## 📚 Variables d'environnement essentielles

### Secrets à générer (avec le script)
```env
POSTGRES_PASSWORD=<généré>
JWT_SECRET=<généré>
COOKIE_SECRET=<généré>
MEILI_MASTER_KEY=<généré>
ADMIN_PASSWORD=<généré>
```

### URLs et domaines
```env
FRONTEND_URL=https://votredomaine.com
VITE_API_BASE_URL=https://api.votredomaine.com
COOKIE_DOMAIN=
```

### Email (optionnel)
```env
ADMIN_EMAIL=admin@votreorganisation.be
SMTP_HOST=smtp.example.com
SMTP_USER=noreply@votreorganisation.be
SMTP_PASSWORD=<votre_mot_de_passe_smtp>
```

## 🔍 Architecture de déploiement

```
┌─────────────────────────────────────────┐
│           EasyPanel Platform            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌────────────────────┐  │
│  │PostgreSQL│  │   Meilisearch      │  │
│  │  :5432   │  │     :7700          │  │
│  └────┬─────┘  └─────────┬──────────┘  │
│       │                  │             │
│  ┌────┴──────────────────┴──────────┐  │
│  │     Backend API (Node.js)        │  │
│  │          :4000                    │  │
│  │  api.votredomaine.com            │  │
│  └──────────────┬───────────────────┘  │
│                 │                      │
│  ┌──────────────┴───────────────────┐  │
│  │   Frontend (Vue.js + Nginx)      │  │
│  │          :8080                    │  │
│  │    votredomaine.com              │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## ✅ Tests post-déploiement

### Test de santé API
```bash
curl https://api.votredomaine.com/health
# Réponse : {"status":"ok","timestamp":"..."}
```

### Test Frontend
```bash
curl https://votredomaine.com/
# Doit retourner le HTML
```

### Connexion à l'application
1. Ouvrir `https://votredomaine.com`
2. Se connecter avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## 🔧 Commandes utiles

### Voir les logs
```bash
# Dans EasyPanel
# Services → Backend → Logs
# Services → Frontend → Logs
```

### Redéployer après un commit
```bash
# Dans EasyPanel
# Services → Backend → Redeploy
# Services → Frontend → Redeploy
```

### Migrations Prisma manuelles
```bash
# Terminal dans le conteneur backend
npx prisma migrate deploy
```

## 🆘 Problèmes courants

### Erreur 502 Bad Gateway
➡️ Le backend n'est pas démarré ou inaccessible
- Vérifiez les logs du backend
- Vérifiez `VITE_API_BASE_URL`

### Erreur CORS
➡️ Configuration des domaines incorrecte
- Vérifiez `FRONTEND_URL` dans le backend
- Vérifiez `COOKIE_DOMAIN` (vide pour localhost)

### Base de données non accessible
➡️ Problème de connexion PostgreSQL
- Vérifiez `DATABASE_URL`
- Vérifiez que PostgreSQL est démarré

## 📖 Documentation complète

Pour plus de détails, consultez le guide complet :
**[docs/DEPLOYMENT-EASYPANEL.md](docs/DEPLOYMENT-EASYPANEL.md)**

## 🎉 C'est tout !

Votre application OSINTReport est prête à être déployée sur EasyPanel !

---

**Questions ?** Consultez la documentation ou ouvrez une issue sur GitHub.
