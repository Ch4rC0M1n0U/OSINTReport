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
| `npm run test` | Exécute les tests unitaires Vitest en mode CI. |
| `npm run test:watch` | Lance Vitest en mode observation interactif. |

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

- L’authentification repose sur le store `auth` (`src/stores/auth.ts`) qui sollicite `POST /auth/login`, `GET /auth/me` et `POST /auth/logout`.
- Le client Axios centralise les appels (`src/services/http.ts`) : toute réponse `401` purge la session et redirige vers `/login` en préservant la route cible.
- Les rapports sont gérés via le store `reports` (`src/stores/reports.ts`) qui encapsule recherche, pagination et état de chargement autour de `GET /api/reports`.
- Le tableau de bord analytique s’appuie sur le store `dashboard` (`src/stores/dashboard.ts`) qui consomme `GET /api/reports/dashboard` et expose totaux, distribution des statuts, timeline et rapports récents.
- Les styles utilisent DaisyUI avec un thème personnalisé `osint`.

### Tests et qualité

- Vitest est configuré (environnement jsdom) avec Testing Library pour tester les composants Vue.
- Les matchers DOM supplémentaires proviennent de `@testing-library/jest-dom/vitest` (cf. `tests/setup.ts`).
- Les fichiers de test (`*.spec.ts`) peuvent vivre à côté des composants ou dans `tests/`.
- La configuration `tsconfig.json` active `skipLibCheck` pour contourner les définitions tierces lourdes tout en gardant le strict mode sur le code applicatif.

## Étapes suivantes

- Brancher la création/édition de rapport (formulaires, drag & drop des modules).
- Enrichir le tableau de bord (filtres par équipe, graphiques avancés) et prévoir des tests d’intégration légers.
- Gérer les états de chargement/erreur globaux et notifications.
- Ajouter des tests end-to-end (Playwright/Cypress) lorsque le front se complexifiera.
