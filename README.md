# OSINTReport

Plateforme de génération et de diffusion de rapports OSINT pour services d’enquête. Le projet repose sur une API Node.js/Express avec Prisma, une base PostgreSQL et un futur frontend Vue + DaisyUI.

## Vue d’ensemble

- **Base de données** : PostgreSQL 16 orchestré via Docker Compose.
- **Backend** : Node.js (TypeScript), Express 5, Prisma ORM, Zod pour la validation, Argon2 + JWT pour l’authentification.
- **Sécurité** : Permissions RBAC, journalisation Pino, chiffrement applicatif des données sensibles (AES-256-GCM via coffre logiciel).
- **Rapports OSINT** : Modélisation Prisma des rapports, modules dynamiques, pièces jointes et versions. Les schémas de validation sont décrits dans `backend/src/modules/reports` et la structure métier détaillée dans `docs/report-template.md`.

## Prérequis

- Node.js ≥ 20 et npm (ou pnpm) pour le backend.
- Docker + Docker Compose pour la base PostgreSQL locale.
- `psql` (optionnel) pour diagnostiquer la base.

## Démarrage rapide

1. Cloner ce dépôt puis copier les variables d’environnement :
	```bash
	cp .env.example .env
	```
2. Vérifier/adapter les variables PostgreSQL (`POSTGRES_PASSWORD`, port, etc.) dans `.env` et `backend/.env`.
3. Lancer la base de données :
	```bash
	docker compose up -d postgres
	```
4. Installer les dépendances backend et générer le client Prisma :
	```bash
	cd backend
	npm install
	npx prisma generate
	```
5. Appliquer les migrations :
	```bash
	npm run prisma:migrate
	```
6. Démarrer l’API en mode développement :
	```bash
	npm run dev
	```

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
- **Modules backend** : `backend/src/modules/`

Contribuez à la documentation dès que de nouveaux endpoints ou processus sont ajoutés afin de garder l’équipe alignée.