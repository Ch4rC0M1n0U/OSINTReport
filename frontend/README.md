# OSINTReport Frontend

Application Vue 3 (Vite + TypeScript + Tailwind/DaisyUI) pour la gestion des rapports OSINT.

## Scripts principaux

| Commande | Description |
| --- | --- |
| `npm install` | Installe les dépendances. |
| `npm run dev` | Lance le serveur de développement (http://localhost:5173). |
| `npm run build` | Construit la version de production. |
| `npm run preview` | Prévisualise la build. |
| `npm run type-check` | Vérifie les types via `vue-tsc`. |

## Variables d’environnement

Créer un fichier `.env` à la racine du frontend si besoin :

```
VITE_API_URL=http://localhost:4000
VITE_DEV_SERVER_HOST=0.0.0.0
VITE_DEV_SERVER_PORT=5173
```

Par défaut, l’API est supposée accessible sur `http://localhost:4000`. Le proxy `/api` est configuré dans `vite.config.ts`.

## Structure simplifiée

```
frontend/
├─ src/
│  ├─ assets/            # Styles Tailwind & DaisyUI
│  ├─ components/        # Composants UI génériques
│  ├─ pages/             # Pages (login, dashboard, rapports)
│  ├─ router/            # Vue Router
│  ├─ services/          # Clients HTTP
│  └─ stores/            # Pinia stores
├─ public/               # Fichiers statiques
├─ index.html            # Point d’entrée Vite
├─ package.json
└─ tailwind.config.cjs
```

## Intégration avec le backend

- L’authentification repose sur le store `auth` qui sollicite `POST /auth/login` et `GET /auth/me`.
- Les rapports sont récupérés via `GET /api/reports` avec filtres (gestion basique de la pagination et du statut).
- Les styles utilisent DaisyUI avec un thème personnalisé `osint`.

## Étapes suivantes

- Brancher la création/édition de rapport (formulaires, drag & drop des modules).
- Gérer les états de chargement/erreur globaux et notifications.
- Ajouter des tests end-to-end (Playwright/Cypress) lorsque le front se complexifiera.
