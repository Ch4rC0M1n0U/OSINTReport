# 🚀 Guide de Démarrage Rapide - OSINTReport

## 📋 Prérequis

- Docker & Docker Compose
- Node.js 18+
- npm ou yarn

## 🏁 Démarrage en 3 minutes

### 1. Cloner et lancer les services

```bash
# Cloner le projet
git clone <repository-url>
cd OSINTReport

# Démarrer les services Docker (PostgreSQL, Meilisearch)
docker-compose up -d

# Attendre 5 secondes que PostgreSQL soit prêt
sleep 5
```

### 2. Backend (API)

```bash
cd backend

# Installer les dépendances
npm install

# Lancer les migrations Prisma
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Démarrer le serveur backend
npm run dev

# Backend disponible sur: http://localhost:4000
```

### 3. Frontend (Interface)

```bash
# Dans un nouveau terminal
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Frontend disponible sur: http://localhost:5173 (ou 5174)
```

## 🔐 Connexion

### Utilisateur admin par défaut

- **Email**: `gaetan.minnekeer@police.belgium.eu`
- **Mot de passe**: `Admin123!`

### Créer un nouveau compte

1. Aller sur `/register`
2. Remplir le formulaire
3. Se connecter avec les credentials

## 📚 Fonctionnalités disponibles

### ✅ Créer un rapport OSINT

1. Se connecter
2. Aller sur "**Rapports**" dans le menu
3. Cliquer "**+ Créer un rapport**"
4. Suivre le wizard en 3 étapes :
   - **Étape 1** : Titre, dossier, service, mots-clés
   - **Étape 2** : Contexte, base légale, urgence, classification
   - **Étape 3** : Validation et création

### ✅ Ajouter des modules

1. Sur la page du rapport
2. Cliquer "**+ Ajouter un module**"
3. Choisir le type (téléphone, email, réseaux sociaux, etc.)
4. Saisir un titre
5. (Optionnel) Lier une entité

### ✅ Créer des entités

Deux méthodes :

**Méthode 1 : Via le sélecteur**
- Dans le formulaire de module, commencer à taper dans "Entité liée"
- Cliquer "**+ Créer**"
- Remplir le formulaire modal

**Méthode 2 : Direct**
- (À venir : page dédiée `/entities`)

### ✅ Détecter les corrélations

1. Sur la page du rapport
2. Cliquer "**Actions ▾**"
3. Sélectionner "**🔍 Détecter corrélations**"
4. Le système analyse automatiquement :
   - Numéros de téléphone
   - Adresses email
   - Noms de personnes
   - Adresses physiques
   - Comptes utilisateurs

### ✅ Gérer le workflow

**Publier un rapport** :
- Actions → "✓ Publier"
- Change le statut de DRAFT → PUBLISHED

**Archiver un rapport** :
- Actions → "📦 Archiver"
- Change le statut de PUBLISHED → ARCHIVED

**Dupliquer un rapport** :
- Actions → "📋 Dupliquer"
- Crée une copie en mode DRAFT
- Utile pour créer des templates

### ✅ Voir les statistiques

1. Actions → "📊 Statistiques"
2. Modal affiche :
   - Nombre de modules
   - Nombre d'entités
   - Nombre d'enregistrements de recherche
   - Nombre de corrélations détectées

## 🎯 Workflows types

### Scénario 1 : Enquête fraude bancaire

```
1. Créer rapport "Fraude carte bancaire #2024-001"
   - Classification: CONFIDENTIAL
   - Urgence: URGENT
   - Mots-clés: fraude, bancaire, phishing

2. Créer entité "John Doe" (PERSON)

3. Ajouter module "Analyse téléphonique"
   - Type: phone_analysis
   - Entité: John Doe
   - Payload: { phoneNumber: "+32475123456" }

4. Ajouter module "Analyse email"
   - Type: email_analysis
   - Entité: John Doe
   - Payload: { email: "john.doe@suspect.com" }

5. Détecter corrélations
   → Si ce numéro/email apparaît dans d'autres rapports,
     le système crée automatiquement des liens

6. Vérifier les corrélations
   - Voir quels autres rapports sont liés
   - Marquer comme vérifiées si pertinent

7. Publier le rapport
   - Change statut vers PUBLISHED
   - Visible par toute l'équipe
```

### Scénario 2 : Analyse réseaux sociaux

```
1. Créer rapport "Investigation profil Facebook suspect"

2. Créer entités :
   - "Jean Suspect" (PERSON)
   - "jean.suspect@gmail.com" (EMAIL)
   - "Entreprise XYZ" (ORGANIZATION)

3. Ajouter module "Réseaux sociaux"
   - Type: social_media
   - Entité: Jean Suspect
   - Payload: {
       platform: "Facebook",
       profileUrl: "facebook.com/jean.suspect",
       followers: 1247
     }

4. Ajouter module "Analyse adresse"
   - Type: address_analysis
   - Entité: Jean Suspect
   - Payload: {
       address: "Rue de la Loi 155, 1040 Bruxelles"
     }

5. Détecter corrélations automatiques

6. Dupliquer le rapport pour une nouvelle investigation similaire
```

## 🛠️ Développement

### Structure du projet

```
OSINTReport/
├── backend/              # API Express.js + Prisma
│   ├── src/
│   │   ├── modules/     # Modules métier
│   │   │   ├── auth/
│   │   │   ├── reports/
│   │   │   ├── correlations/
│   │   │   └── users/
│   │   ├── middleware/
│   │   └── routes/
│   └── prisma/
│       └── schema.prisma
│
├── frontend/            # Interface Vue 3
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   ├── stores/      # Stores Pinia
│   │   ├── services/    # Services API
│   │   └── router/      # Configuration routes
│   └── package.json
│
├── docker-compose.yml   # Services (PostgreSQL, Meilisearch)
└── docs/                # Documentation
```

### Scripts utiles

#### Backend

```bash
# Développement avec hot-reload
npm run dev

# Build production
npm run build

# Lancer les tests
npm test

# Créer une migration Prisma
npx prisma migrate dev --name nom_migration

# Accéder à Prisma Studio (GUI base de données)
npx prisma studio
```

#### Frontend

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview du build
npm run preview

# Linter
npm run lint

# Tests
npm test
```

### Variables d'environnement

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://osint:osint_password@localhost:55432/osintreport?schema=public"

# Server
PORT=4000
NODE_ENV=development

# Authentication
JWT_SECRET="votre-secret-jwt-ultra-securise"
JWT_EXPIRES_IN="7d"

# SMTP (pour reset password)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@police.belgium.eu
SMTP_PASS=password

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey
```

#### Frontend (.env)

```env
# API Backend
VITE_API_URL=http://localhost:4000
```

## 📡 Ports utilisés

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173-5174 | http://localhost:5173 |
| Backend | 4000 | http://localhost:4000 |
| PostgreSQL | 55432 | localhost:55432 |
| Meilisearch | 7700 | http://localhost:7700 |

## 🔍 Endpoints API principaux

### Authentification

```bash
# Login
POST /api/auth/login
Body: { email, password }

# Register
POST /api/auth/register
Body: { email, password, firstName, lastName, matricule }

# Logout
POST /api/auth/logout

# Forgot password
POST /api/auth/forgot-password
Body: { email }

# Reset password
POST /api/auth/reset-password
Body: { token, password }
```

### Rapports

```bash
# Liste
GET /api/reports?limit=10&offset=0&status=DRAFT&search=query

# Détails
GET /api/reports/:id

# Créer
POST /api/reports
Body: { title, investigationContext, urgencyLevel, classification, ... }

# Modifier
PATCH /api/reports/:id

# Supprimer
DELETE /api/reports/:id

# Statistiques
GET /api/reports/:id/stats

# Dupliquer
POST /api/reports/:id/duplicate

# Changer statut
PATCH /api/reports/:id/status
Body: { status: "PUBLISHED" }
```

### Modules

```bash
# Liste modules d'un rapport
GET /api/reports/:reportId/modules

# Créer module
POST /api/reports/:reportId/modules
Body: { type, title, entityId?, payload? }

# Modifier module
PATCH /api/reports/:reportId/modules/:moduleId

# Supprimer module
DELETE /api/reports/:reportId/modules/:moduleId

# Réorganiser modules
POST /api/reports/:reportId/modules/reorder
Body: { moduleIds: ["id1", "id2", "id3"] }
```

### Entités

```bash
# Liste
GET /api/entities?limit=20&type=PERSON&search=query

# Recherche (autocomplétion)
GET /api/entities/search?q=jean&type=PERSON&limit=10

# Détails
GET /api/entities/:id

# Créer
POST /api/entities
Body: { label, type, notes? }

# Modifier
PATCH /api/entities/:id

# Supprimer
DELETE /api/entities/:id
```

### Corrélations

```bash
# Vérifier une valeur (temps réel)
POST /api/correlations/check
Body: { reportId, value, type: "PHONE" }

# Détecter automatiquement
POST /api/correlations/reports/:reportId/detect

# Liste corrélations d'un rapport
GET /api/correlations/reports/:reportId?type=PHONE&verified=true

# Vérifier une corrélation
PATCH /api/correlations/:id/verify
Body: { notes? }

# Supprimer
DELETE /api/correlations/:id
```

## 🐛 Debugging

### Backend ne démarre pas

```bash
# Vérifier que PostgreSQL est prêt
docker ps | grep postgres

# Vérifier les logs Docker
docker-compose logs postgres

# Réinitialiser la base de données
cd backend
npx prisma migrate reset
npx prisma migrate deploy
npx prisma generate
```

### Frontend ne se connecte pas au backend

1. Vérifier que le backend tourne : `curl http://localhost:4000/api/health`
2. Vérifier `.env` frontend : `VITE_API_URL=http://localhost:4000`
3. Vérifier la console navigateur (F12) pour les erreurs CORS

### Erreur 401 (Unauthorized)

1. Se reconnecter : `/login`
2. Vérifier que les cookies sont activés
3. Vérifier `JWT_SECRET` dans `.env` backend

### Prisma errors

```bash
# Régénérer le client
npx prisma generate

# Synchroniser le schéma avec la DB
npx prisma db push

# Voir l'état des migrations
npx prisma migrate status
```

## 📚 Documentation complète

- **API** : `docs/api-complete.md`
- **Architecture** : `docs/architecture.md`
- **Corrélations** : `docs/correlation-implementation-guide.md`
- **Frontend** : `docs/frontend-implementation-complete.md`
- **Backend** : `docs/api-implementation-complete.md`

## 🤝 Support

Pour toute question ou problème :
1. Consulter la documentation dans `/docs`
2. Vérifier les logs backend/frontend
3. Ouvrir une issue sur GitHub

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser **OSINTReport**, le système de gestion de rapports OSINT pour la police belge ! 🇧🇪

---

**Version:** 1.0.0  
**Date:** 2 octobre 2025  
**Auteur:** Ch4rC0M1n0U with GitHub Copilot
