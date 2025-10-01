# Architecture fonctionnelle et technique

## Vue d’ensemble

L’application **OSINTReport** vise à industrialiser la rédaction de rapports OSINT conformes aux standards des services de police belges. Elle repose sur une architecture trois tiers moderne :

- **Frontend** : SPA Vue 3 (TypeScript) construite avec Vite, stylée par Tailwind CSS + DaisyUI pour offrir une ergonomie moderne tout en restant sobre et professionnelle.
- **Backend** : API RESTful Node.js (Express + TypeScript) exposant des endpoints sécurisés pour la gestion des comptes, des modules de rapport et l’export PDF.
- **Base de données** : PostgreSQL (via Docker) pour stocker les utilisateurs, rapports, entités et traces d’audit, avec prise en charge du chiffrement applicatif des données sensibles.

Un bus de messages n’est pas requis dans la version initiale, mais les échanges asynchrones (notifications email ou traitements lourds) pourront être intégrés ultérieurement grâce à une couche de workers indépendante.

## Modules fonctionnels

1. **Gestion des comptes et sessions**
	 - Création de comptes (Nom, Prénom, Matricule, Email `@police.belgium.eu`, mot de passe) avec validation stricte et mot de passe fort.
	 - Authentification sécurisée (JWT access + refresh, stockage httpOnly) et révocation.
	 - Gestion des profils : consultation des informations personnelles et changement de mot de passe.
	 - Rôles applicatifs : `reader`, `editor`, `admin` (défini par la configuration `.env` pour l’utilisateur initial), avec possibilité d’extension.

2. **Gestion des rapports OSINT**
	 - Définition des métadonnées : but de la recherche, dossiers connexes, plage temporelle, service demandeur, objectifs.
	 - Construction de modules dynamiques : entités concernées, recherches déployées (téléphone, email, réseaux sociaux, OSINT open web, etc.), possibilité d’associer chaque recherche à une entité et d’ajouter un sous-titre/contextualisation.
	 - Historisation des versions de rapport (brouillon/publié) et journalisation des modifications.

3. **Export PDF professionnel**
	 - Gabarit HTML + CSS conforme à un procès-verbal (logos, en-têtes-officiels, typographie lisible).
	 - Génération côté serveur via un moteur de templates (Handlebars/Nunjucks) rendu par Puppeteer/Chromium headless pour garantir la fidélité du rendu.
	 - Insertion d’un filigrane ou signature numérique éventuelle (extension future).

4. **Sécurité & conformité**
	 - Validation stricte des entrées, journalisation d’audit, rate limiting, détection d’activités suspectes.
	 - Chiffrement applicatif et/ou suppression des données sensibles selon les règles définies (voir § Chiffrement).
	 - Backups automatisés (snapshot volumes PostgreSQL) et politique de rétention configurable.

## Backend (Node.js + TypeScript)

### Pile technique

- **Framework** : Express.js avec TypeScript, structure modulaires par domaine (`modules/auth`, `modules/reports`, etc.).
- **ORM** : Prisma pour modéliser le schéma PostgreSQL, migrations versionnées et génération de types forte.
- **Validation** : Zod (ou Joi) pour valider les payloads.
- **Sécurité** : Helmet, CORS restreint, express-rate-limit, bcrypt/argon2 pour le hashing.
- **PDF** : Puppeteer pour générer un PDF à partir d’un template HTML/CSS.
- **Tâches asynchrones** : BullMQ + Redis (optionnel ultérieur) pour emails et traitements longs.

### Structure des dossiers

```
backend/
├─ src/
│  ├─ app.ts (bootstrap Express)
│  ├─ server.ts (entrypoint HTTP)
│  ├─ config/ (env, logger)
│  ├─ middleware/ (auth, validation, rbac, errors)
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ reports/
│  │  ├─ entities/
│  │  └─ pdf/
│  └─ shared/ (crypto, email, utils)
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ tests/
└─ package.json
```

### Flux API principaux

| Domaine | Endpoint | Description | Accès |
| --- | --- | --- | --- |
| Auth | `POST /auth/register` | Enregistrement (token d’activation optionnel) | Admin (pour créer d’autres comptes) |
| Auth | `POST /auth/login` | Authentification (tokens JWT + refresh) | Public |
| Auth | `POST /auth/logout` | Invalidation refresh token | Authentifié |
| Auth | `POST /auth/refresh` | Renouvellement token | Authentifié (refresh) |
| Users | `GET /users/me` | Lecture profil | Authentifié |
| Users | `PATCH /users/me/password` | Mise à jour mot de passe | Authentifié |
| Users | `GET /users` | Liste utilisateurs (filtrée) | Admin |
| Reports | `POST /reports` | Création rapport + modules | Rôle `editor` |
| Reports | `GET /reports` | Liste, recherche, pagination | Rôle `reader` min |
| Reports | `GET /reports/:id/pdf` | Génération + téléchargement PDF | Rôle `reader` min |
| Reports | `PUT /reports/:id` | Mise à jour | Rôle `editor` |
| Reports | `POST /reports/:id/archive` | Suppression/suppression chiffrée | Admin |
| Entities | CRUD entités & liaisons | Selon rôle |

### Schéma de données (Prisma / PostgreSQL)

```
User (id, firstName, lastName, matricule, email, passwordHash, role, status, createdAt, updatedAt)
UserSession (id, userId, refreshTokenHash, expiresAt, createdAt)
Role (id, name, description)
Permission (id, code)
RolePermission (roleId, permissionId)
Report (id, title, purpose, relatedCases, dateRangeStart, dateRangeEnd, requestingService, objectives, status, ownerId, createdAt, updatedAt)
ReportVersion (id, reportId, version, snapshotData JSONB, createdBy, createdAt)
ReportModule (id, reportId, type, headline, entityId, position, payload JSONB)
Entity (id, label, type, notes, createdAt)
ResearchType (id, code, label)
ResearchRecord (id, reportModuleId, entityId, researchTypeId, subtitle, details, sensitiveDataEncrypted, createdAt)
AuditLog (id, actorId, action, resourceType, resourceId, metadata JSONB, createdAt)
KeyStore (id, label, encryptedKey, createdAt, rotatedAt)
VaultItem (id, reportId, field, cipherText, keyId, createdAt)
```

- Les colonnes `payload`/`snapshotData` stockent des structures modulaires flexibles (JSONB) en restant validées côté applicatif.
- Les données sensibles (p. ex. Numéro de téléphone, email collectés) sont soit chiffrées (table `VaultItem`) soit supprimées après génération du rapport final selon la politique choisie.

### Authentification et RBAC

- Hash mot de passe : Argon2id avec paramètres calibrés.
- Tokens :
	- **Access token** (JWT signé, durée courte 15 min) transporté dans un cookie httpOnly + SameSite=strict pour éviter XSS/CSRF.
	- **Refresh token** stocké en base (`UserSession`) haché pour éviter la compromission, renouvelé à chaque refresh.
- RBAC : mapping rôle → permissions (lecture, écriture, administration). Les permissions sont vérifiées via middleware `requirePermission`.

### Chiffrement et gestion des secrets

- Clé maître AES-256 GCM stockée en variable d’environnement (sera à terme gérée par un KMS/Hashicorp Vault).
- Les champs sensibles sont chiffrés côté backend via un service `CryptoService` (AES-GCM + IV dédié + tag d’authentification, sérialisé en base64).
- Les clés de session courtes sont supprimées dès la fin de session.
- Option « suppression » : une tâche planifiée peut effacer les `VaultItem` après export PDF final pour minimiser la surface d’attaque.

### Observabilité et audit

- Winston/Pino pour les logs structurés (JSON) + rotation.
- Audit log obligatoire pour toute action importante (connexion, téléchargement PDF, modification rapport).
- Intégration future : exporter vers ELK/Graylog.

## Frontend (Vue 3 + DaisyUI)

### Pile technique

- Vite + Vue 3 (composition API, script setup) + TypeScript.
- Tailwind CSS + DaisyUI pour les composants (boutons, formulaires, tabs, timeline).
- Pinia pour l’état global (session utilisateur, brouillon de rapport).
- Vue Router pour la navigation sécurisée.
- Axios pour consommer l’API avec intercepteurs (auto refresh token, gestion erreurs).

### Structure projet

```
frontend/
├─ src/
│  ├─ main.ts
│  ├─ App.vue
│  ├─ router/
│  ├─ stores/
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ reports/
│  │  └─ settings/
│  ├─ components/
│  └─ styles/
├─ public/
└─ package.json
```

### Parcours utilisateur

1. **Connexion / Inscription** : formulaire multi-étapes avec validation matricule/email. Réinitialisation mot de passe via lien email (à ajouter plus tard).
2. **Tableau de bord** : vue listant les rapports, filtres par dossier, dates, statut. Cartes DaisyUI.
3. **Éditeur de rapport** :
	 - Wizard en onglets pour les métadonnées.
	 - Constructeur de modules avec drag & drop (via `vue-draggable-next`), composants DaisyUI (accordéons, badges).
	 - Prévisualisation en temps réel avec rendu HTML correspondant au template PDF.
4. **Profil utilisateur** : lecture des données, changement mot de passe.
5. **Administration** : gestion des rôles/utilisateurs (réservé admin).

### Sécurité frontend

- Utilise les cookies httpOnly pour JWT, mais maintient état d’authentification via endpoints `/auth/me`.
- Garde navigation pour vérifier les permissions avant chargement d’une route.
- Masque les fonctionnalités non autorisées et affiche messages de conformité.

## Génération PDF

- **Pipeline** :
	1. Backend reçoit requête `GET /reports/:id/pdf`.
	2. Agrège données du rapport, modules, entités (en clair ou déchiffrées temporairement en mémoire).
	3. Injecte dans un template HTML (Nunjucks) stylé pour impression.
	4. Puppeteer rend la page dans Chromium headless → PDF A4 (haute résolution, marges police).
	5. PDF stocké temporairement dans un bucket (filesystem ou S3 compatible) avec expiration courte.

- **Design** : Chartes couleurs sobres (bleu marine/gris), typographies officielles (Noto Sans/Serif), en-tête avec blason, pied de page daté.

## Infrastructure & déploiement

- **Docker Compose** (dev) orchestrant :
	- `postgres` (existant) + volume persistant `postgres-data`.
	- `backend` (Node) avec hot reload (ts-node-dev) et accès `.env` partagé.
	- `frontend` (Vite) servi via `npm run dev` + proxy reverse pour l’API.
	- `mailhog` (optionnel) pour tests email.

- **Environnements** :
	- Dev : docker compose local, données seed fictives.
	- Recette/Prod : images Docker publiées, orchestrées via Kubernetes/Swarm ou VM. Secrets gérés par Vault/Secret Manager.

- **CI/CD** : GitHub Actions envisagé pour lint/tests, migrations Prisma, build images, déploiement.

## Sécurité approfondie

- **Contrôles d’accès** :
	- Middleware backend chargé des permissions.
	- Habilitations fines par granularité (édition modules, export PDF).

- **Chiffrement** :
	- Données en transit (HTTPS obligatoire via reverse proxy Nginx/Traefik).
	- Données au repos : volume PostgreSQL chiffré (niveau infrastructure) + colonnes sensibles chiffrées applicatif.

- **Audit & conformité** :
	- Journalisation exhaustive, immuable (éventuellement stockée dans table `AuditLog` + export WORM).
	- Politique de rétention alignée sur les exigences légales (configurable).

- **Durcissement** :
	- Exécution backend dans conteneur non-root.
	- Analyse SAST/DAST (ESLint, npm audit, Snyk).
	- Tests de pénétration planifiés.

## Scalabilité et évolutivité

- Architecture prévue pour évoluer vers micro-services si nécessaire (extraction du module PDF ou des analytics).
- Prisma facilite l’ajout de nouveaux types de modules de rapport (structures JSON).
- Pinia + component library modulaire côté frontend pour ajouter facilement de nouveaux formulaires.
- Possibilité d’intégrer un moteur de workflows (Camunda/Temporal) si les processus de validation se complexifient.

---

Cette architecture fournit une base robuste et sécurisée pour implémenter l’application OSINTReport, tout en laissant de la marge pour des évolutions fonctionnelles et réglementaires futures.
