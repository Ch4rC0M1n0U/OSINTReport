# 🕵️ OSINTReport - Police Belge

Plateforme complète de génération et de gestion de rapports OSINT pour services d'enquête. Système intégré de détection ## 📚 Documentation complète

### Guides utilisateur
- 🚀 **[Démarrage rapide](docs/QUICKSTART.md)** - Installation et premiers pas
- � **[Guide Données extraites](docs/QUICKSTART-EXTRACTED-DATA.md)** - Visualisation des données indexées
- �📖 **[Guide d'implémentation des corrélations](docs/correlation-implementation-guide.md)**

### Documentation technique
- 🏗️ **[Architecture](docs/architecture.md)** - Vue d'ensemble du système
- 🔌 **[API complète](docs/api-complete.md)** - 50+ endpoints documentés
- 🎨 **[Frontend Vue.js](docs/frontend-implementation-complete.md)** - Composants et stores
- ⚙️ **[Backend API](docs/api-implementation-complete.md)** - Services et contrôleurs
- 📊 **[Structure des rapports](docs/report-template.md)** - Modèle de données
- 🔐 **[Sécurité & Vault](docs/security/vault.md)** - Chiffrement AES-256-GCM
- 🔍 **[Recherche Meilisearch](docs/api-search.md)** - API de recherche full-text
- ✅ **[Task 7 Complète](docs/TASK-7-COMPLETE.md)** - Guide complet Meilisearch

### Résumés techniques
- ✅ **[Phase 1 - Corrélations](docs/correlation-system-phase1-summary.md)**
- 🔍 **[Solution Avatar](docs/avatar-solution.md)**
- � **[Données extraites](docs/FEATURE-EXTRACTED-DATA-DISPLAY.md)** - Extraction et affichage complet
- �📝 **[Session 6 Complète](docs/SESSION-6-COMPLETE-SUMMARY.md)** - Résumé session Meilisearch

## 🧩 Structure du projet

```
OSINTReport/
├── backend/              # API Express.js + TypeScript
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # Authentification JWT
│   │   │   ├── reports/         # Rapports + Modules + Entités
│   │   │   ├── correlations/    # Détection de liens
│   │   │   ├── users/           # Gestion utilisateurs
│   │   │   └── smtp/            # Configuration SMTP
│   │   ├── middleware/          # Auth, errors, notFound
│   │   └── routes/              # Routing principal
│   └── prisma/
│       ├── schema.prisma        # Modèle de données
│       └── migrations/          # Historique SQL
│
├── frontend/            # Interface Vue 3
│   ├── src/
│   │   ├── components/
│   │   │   └── reports/         # EntitySelector, CorrelationAlert, etc.
│   │   ├── pages/
│   │   │   ├── reports/         # Create, Detail, List
│   │   │   ├── dashboard/       # Dashboard home
│   │   │   └── admin/           # Gestion admin
│   │   ├── stores/              # Pinia (entities, correlations, reports)
│   │   ├── services/
│   │   │   └── api/             # Clients HTTP (reports, entities, correlations)
│   │   └── router/              # Vue Router config
│   └── public/
│       └── images/              # Avatars, backgrounds
│
├── docs/                # Documentation Markdown
├── postgres/            # Scripts init PostgreSQL
├── docker-compose.yml   # Services (PostgreSQL, Meilisearch)
└── .env.example         # Template variables d'environnement
```

## 🎯 Workflow d'utilisation

### 1. Créer un rapport OSINT

```
Interface → Wizard 3 étapes → API POST /reports → Database
```

1. **Étape 1** : Informations (titre, dossier, service, mots-clés)
2. **Étape 2** : Contexte légal + classification (PUBLIC/CONFIDENTIAL/SECRET)
3. **Étape 3** : Validation et création

### 2. Ajouter des modules d'analyse

```
Rapport → + Module → Choisir type → Lier entité → Créer
```

**Types disponibles** : Téléphone, Email, Réseaux sociaux, Financier, Adresse, Véhicule, Document, Autre

### 3. Détecter les corrélations

```
Actions → Détecter corrélations → Backend analyse → Alertes créées
```

Le système compare :
- 📞 Numéros de téléphone
- 📧 Adresses email
- 👤 Noms de personnes
- 📍 Adresses physiques
- 🔑 Comptes utilisateurs

### 4. Publier et archiver

```
DRAFT → Actions → Publier → PUBLISHED → Actions → Archiver → ARCHIVED
```

## 🔐 Sécurité

- **Authentification** : JWT tokens + cookies httpOnly
- **Permissions RBAC** : `reports:read`, `reports:write`, `users:read`, `users:write`, `system:admin`
- **Chiffrement** : AES-256-GCM pour données sensibles (via KeyStore + VaultItem)
- **Validation** : Zod schemas sur toutes les entrées
- **Audit logs** : Traçabilité des actions utilisateurs
- **CSRF Protection** : Cookies sécurisés
- **Rate limiting** : (À implémenter en production)

## 🚧 Roadmap

### ✅ Phase 1-6 (Complétées)
- ✅ Architecture et base de données
- ✅ Authentification et RBAC
- ✅ API complète (50+ endpoints)
- ✅ Système de corrélations
- ✅ Interface Vue.js complète
- ✅ Gestion d'entités et modules

### ✅ Phase 7 (Complétée)
- ✅ Intégration Meilisearch (recherche full-text)
- ✅ Interface de recherche avancée
- ✅ Filtres facettés et highlighting
- ✅ Store Pinia et service API
- ✅ Pagination et tri des résultats
- ✅ **Visualisation des données extraites** (téléphones, emails, entreprises, plateformes)
- ✅ **Filtrage et recherche** dans les données indexées

### 📋 Phase 8 (À venir)
- 📋 Export PDF avec template police belge
- 📋 Graphe de corrélations visuel
- 📋 Signatures numériques
- 📋 Queue de jobs asynchrones

### 🎯 Futures améliorations
- 🎯 Tests E2E (Playwright)
- 🎯 CI/CD avec GitHub Actions
- 🎯 Monitoring (Prometheus + Grafana)
- 🎯 Notifications en temps réel (WebSockets)
- 🎯 Mobile app (Capacitor)

## 🤝 Contribution

Le projet suit les standards TypeScript strict et les conventions Vue 3 Composition API.

### Commits
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

### Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📊 Statistiques du projet

- **Backend** : ~6000 lignes TypeScript
- **Frontend** : ~4500 lignes Vue/TS
- **API** : 54+ endpoints REST
- **Composants** : 25+ composants Vue réutilisables
- **Stores Pinia** : 5 stores (auth, reports, entities, correlations, search)
- **Migrations** : 5 migrations Prisma
- **Documentation** : 15+ documents Markdown

## 📞 Support

- **Email** : support@osintreport.police.belgium.eu
- **Issues** : GitHub Issues
- **Documentation** : `/docs`

## 📄 Licence

Propriétaire - Police Belge

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2 octobre 2025  
**Développé par** : Ch4rC0M1n0U with GitHub Copilot 🤖ue de corrélations entre enquêtes, gestion d'entités et workflow de publication.

## ✨ Fonctionnalités principales

- 📝 **Création de rapports guidée** : Wizard multi-étapes avec contexte légal, urgence et classification
- 🔗 **Détection automatique de corrélations** : Liens entre rapports basés sur téléphones, emails, noms, adresses et comptes
- 👥 **Gestion d'entités** : Personnes, organisations, contacts avec autocomplétion intelligente
- 📦 **Modules structurés** : Analyses téléphoniques, emails, réseaux sociaux, financières, etc.
- 🔄 **Workflow complet** : DRAFT → PUBLISHED → ARCHIVED avec duplication de templates
- 📊 **Statistiques en temps réel** : Dashboard analytique et vue d'ensemble des enquêtes
- � **Visualisation des données extraites** : Vue d'ensemble de toutes les données indexées (téléphones, emails, entreprises, plateformes) avec recherche et filtrage
- �🔐 **Sécurité renforcée** : Permissions RBAC, chiffrement AES-256-GCM, audit logs

## 🏗️ Architecture

- **Base de données** : PostgreSQL 16 avec Docker Compose
- **Backend** : Node.js 20, Express 5, Prisma ORM, TypeScript
- **Frontend** : Vue 3 (Composition API), Vite, Pinia, Vue Router
- **UI** : Tailwind CSS + DaisyUI, responsive mobile-first
- **Recherche** : Meilisearch 1.5 (indexation full-text)
- **Authentification** : JWT + Argon2, cookies httpOnly
- **Validation** : Zod schemas côté backend et frontend

## Prérequis

- Node.js ≥ 20 et npm (ou pnpm) pour le backend.
- Docker + Docker Compose pour la base PostgreSQL locale.
- `psql` (optionnel) pour diagnostiquer la base.

## 🚀 Démarrage rapide (3 minutes)

### 1. Services Docker (PostgreSQL + Meilisearch)

```bash
# Démarrer les services
docker-compose up -d

# Vérifier que tout tourne
docker-compose ps
```

### 2. Backend (API)

```bash
cd backend

# Installer et configurer
npm install
npx prisma migrate deploy
npx prisma generate

# Démarrer le serveur
npm run dev
# → http://localhost:4000
```

### 3. Frontend (Interface)

```bash
cd frontend

# Installer et démarrer
npm install
npm run dev
# → http://localhost:5173
```

### 4. Première connexion

- **Email** : `gaetan.minnekeer@police.belgium.eu`
- **Mot de passe** : `Admin123!`

📚 **Guide complet** : [`docs/QUICKSTART.md`](docs/QUICKSTART.md)

L’API écoute par défaut sur `http://localhost:4000` et expose `/health` pour une vérification rapide.

## Backend Node.js

### Scripts npm utiles

| Script | Description |
| --- | --- |
| `npm run dev` | Démarrage du serveur Express avec rechargement à chaud (ts-node-dev). |
| `npm run build` | Compilation TypeScript vers `dist/`. |
| `npm run start` | Exécution de la version compilée. |
| `npm run prisma:generate` | Génération du client Prisma. |
| `npm run prisma:migrate` | Application des migrations en base. |

### Bootstrap Auth & RBAC

Au démarrage, `bootstrapAuth()` crée les permissions, rôles et un compte administrateur à partir des variables suivantes (définies dans `backend/.env`) :

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FIRST_NAME`
- `ADMIN_LAST_NAME`

Assurez-vous de personnaliser ces valeurs avant la mise en production. Le compte est automatiquement activé et associé aux permissions complètes.

> ℹ️ **Cookies d'authentification** : laissez `COOKIE_DOMAIN` vide en développement (Codespaces, localhost…). Si vous définissez cette variable, utilisez un domaine réellement servi par le backend (ex. `api.exemple.fr`). Un domaine `localhost` empêcherait le navigateur de stocker les cookies lorsqu'il accède à l'API via une URL proxifiée (`*.github.dev`).

### État de la base de données

Les migrations Prisma se trouvent dans `backend/prisma/migrations`. Les dernières évolutions (dossier `20251001120000_reports_enhancements`) introduisent :

- Colonnes métadonnées supplémentaires sur `Report` (`caseNumber`, `reportNumber`, `issuedAt`, etc.).
- Champs `slug` et `title` sur `ReportModule`.
- Nouvelle table `ReportAttachment` pour tracer les pièces jointes liées aux modules ou au rapport global.
- Table `KeyStore` pour stocker les clés de chiffrement applicatif (clé active + historiques).
- Table `VaultItem` pour conserver les secrets chiffrés (références pièces jointes, données sensibles des modules, etc.).

Un schéma détaillé de la structure des rapports est disponible dans `docs/report-template.md`.

## API Rapports

Les routes sont montées sous `/reports` (voir `backend/src/routes/index.ts`) et protégées par les permissions `REPORTS_READ` / `REPORTS_WRITE`.

| Méthode | Route | Permission requise | Description |
| --- | --- | --- | --- |
| `GET` | `/reports` | `REPORTS_READ` | Liste paginée des rapports avec filtrage par statut ou texte. |
| `GET` | `/reports/dashboard` | `REPORTS_READ` | Résumé analytique (totaux, distribution des statuts, timeline 30 jours, rapports récents). |
| `POST` | `/reports` | `REPORTS_WRITE` | Création d’un rapport (métadonnées, objectifs, dates). |
| `GET` | `/reports/:reportId` | `REPORTS_READ` | Détail complet d’un rapport (modules, pièces jointes, entités liées). |
| `PATCH` | `/reports/:reportId` | `REPORTS_WRITE` | Mise à jour partielle d’un rapport. |
| `POST` | `/reports/:reportId/modules` | `REPORTS_WRITE` | Ajout d’un module structuré au rapport. |
| `PATCH` | `/reports/:reportId/modules/:moduleId` | `REPORTS_WRITE` | Mise à jour partielle d’un module (payload JSON, position, slug...). |
| `DELETE` | `/reports/:reportId/modules/:moduleId` | `REPORTS_WRITE` | Suppression d’un module et de ses ressources associées. |
| `POST` | `/reports/:reportId/attachments` | `REPORTS_WRITE` | Enregistrement d’une pièce jointe (clé de stockage, métadonnées, expiration). La clé est chiffrée côté serveur et stockée sous forme de pointeur vault. |

Les schémas Zod correspondants (`createReportSchema`, `updateReportSchema`, `createModuleSchema`, etc.) se trouvent dans `backend/src/modules/reports/report.validation.ts`. Une description détaillée des champs d’entrée/sortie est fournie dans `docs/api-reports.md`.

## PostgreSQL avec Docker Compose

1. Démarrage :
	```bash
	docker compose up -d postgres
	```
2. Vérification :
	```bash
	docker compose ps
	```
3. Scripts init : placez vos SQL dans `postgres/init/` (exécutés au premier lancement).
4. Arrêt :
	```bash
	docker compose down
	```
5. Purge des volumes :
	```bash
	docker compose down -v
	```

La base est exposée sur `localhost:${POSTGRES_PORT:-5432}` (par défaut 5432) avec l’utilisateur `osint_admin` et la base `osint_db`.

## Documentation complémentaire

- **Structure métier des rapports** : [`docs/report-template.md`](docs/report-template.md)
- **Spécification API rapports** : [`docs/api-reports.md`](docs/api-reports.md)
- **Chiffrement & coffre logiciel** : [`docs/security/vault.md`](docs/security/vault.md)
- **Frontend Vue 3** : [`frontend/README.md`](frontend/README.md)
- **Modules backend** : `backend/src/modules/`

Contribuez à la documentation dès que de nouveaux endpoints ou processus sont ajoutés afin de garder l’équipe alignée.