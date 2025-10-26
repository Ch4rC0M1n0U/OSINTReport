# Correction : Accès Admin en Mode Maintenance

## Problème Rencontré

### Symptômes

- **Mode maintenance activé** → Admin ne peut plus se connecter
- **Erreurs 503** sur toutes les requêtes, y compris `/api/auth/me`, `/api/auth/login`
- **Impossible d'accéder aux rapports et recherches** même avec un compte admin
- **Blocage total** du site, y compris pour les administrateurs

### Logs d'Erreur

```
GET /api/auth/me 503 (Service Unavailable)
GET /api/settings 503 (Service Unavailable)
GET /api/reports 503 (Service Unavailable)
```

### Cause Racine

Le middleware de maintenance était appliqué **avant l'authentification** :

```typescript
// ❌ PROBLÈME : Middleware global appliqué avant les routes
app.use(checkMaintenanceMode); // Bloque tout avant l'auth
app.use("/api", router);
```

**Conséquence** :

1. Le middleware vérifie `req.user?.roleName === "admin"`
2. Mais `req.user` n'existe pas encore (pas encore authentifié)
3. Tous les utilisateurs sont considérés comme non-admin
4. Même les admins sont bloqués avec une erreur 503

## Solution Implémentée

### Stratégie

Appliquer le middleware de maintenance **après l'authentification** dans chaque router protégé.

### Architecture

```
Requête → Router Principal → Router Spécifique → Middleware d'auth → Middleware de maintenance → Routes
                              (ex: /reports)         (requireAuth)      (checkMaintenanceMode)
```

### Modifications Apportées

#### 1. Retrait du Middleware Global

**Fichier** : `backend/src/app.ts`

**AVANT** :

```typescript
import { checkMaintenanceMode } from "@middleware/maintenance";

// ...
app.use(checkMaintenanceMode); // ❌ Trop tôt
app.use("/api", router);
```

**APRÈS** :

```typescript
// Pas d'import ni d'utilisation globale
app.use("/api", router);
```

#### 2. Application du Middleware par Router

Le middleware est maintenant appliqué **localement** dans chaque router, **après** `requireAuth`.

**Pattern utilisé** :

```typescript
import { checkMaintenanceMode } from "@middleware/maintenance";

const router = Router();

// 1. D'abord authentifier
router.use(requireAuth);

// 2. Ensuite vérifier le mode maintenance
router.use(checkMaintenanceMode);

// 3. Enfin les routes spécifiques
router.get("/", controller.list);
```

**Routers modifiés** :

1. **`backend/src/modules/reports/report.router.ts`**

   ```typescript
   reportRouter.use(requireAuth);
   reportRouter.use(checkMaintenanceMode); // ✅ Après auth
   ```

2. **`backend/src/modules/reports/entity.router.ts`**

   ```typescript
   entityRouter.use(requireAuth);
   entityRouter.use(checkMaintenanceMode);
   ```

3. **`backend/src/modules/search/search.router.ts`**

   ```typescript
   router.use(requireAuth);
   router.use(checkMaintenanceMode);
   ```

4. **`backend/src/modules/correlations/correlation.router.ts`**

   ```typescript
   router.use(requireAuth);
   router.use(checkMaintenanceMode);
   ```

5. **`backend/src/modules/pdf/pdf.router.ts`**

   ```typescript
   router.use(requireAuth);
   router.use(checkMaintenanceMode);
   ```

6. **`backend/src/modules/media/media.router.ts`**

   ```typescript
   router.use(requireAuth);
   router.use(checkMaintenanceMode);
   ```

7. **`backend/src/modules/users/user.router.ts`**

   ```typescript
   userRouter.use(requireAuth);
   userRouter.use(checkMaintenanceMode);
   ```

8. **`backend/src/modules/smtp/smtp.router.ts`**

   ```typescript
   smtpRouter.use(requireAuth, requirePermissions(PermissionCode.ADMIN));
   smtpRouter.use(checkMaintenanceMode);
   ```

9. **`backend/src/modules/ai/ai.router.ts`**

   ```typescript
   router.use(requireAuth);
   router.use(checkMaintenanceMode);
   ```

10. **`backend/src/modules/cron/cron.router.ts`**
    ```typescript
    router.use(requireAuth);
    router.use(checkMaintenanceMode);
    ```

**Routers publics** (pas de middleware de maintenance) :

- `auth.router.ts` - Authentification toujours accessible
- `settings.router.ts` - Paramètres publics (pour bannière)

#### 3. Simplification du Middleware

**Fichier** : `backend/src/middleware/maintenance.ts`

**AVANT** :

```typescript
// Liste de routes publiques hardcodées
const publicRoutes = [
  "/api/auth/login",
  "/api/auth/me",
  "/api/settings",
  // ...
];

if (publicRoutes.some((route) => req.path.startsWith(route))) {
  next();
  return;
}
```

**APRÈS** :

```typescript
// Plus de liste de routes publiques
// Le middleware suppose que req.user existe déjà

const isAdmin = req.user?.roleName === "admin";
if (isAdmin) {
  next();
  return;
}

// Bloquer les non-admins
res.status(503).json({ message: "..." });
```

**Avantages** :

- ✅ Plus simple et plus maintenable
- ✅ Pas de liste hardcodée à maintenir
- ✅ `req.user` est garanti d'exister (après `requireAuth`)

## Flux d'Exécution

### Utilisateur Admin

```
1. GET /api/reports
   ↓
2. reportRouter.use(requireAuth)
   → Vérifie JWT, définit req.user = { roleName: "admin", ... }
   ↓
3. reportRouter.use(checkMaintenanceMode)
   → Vérifie settings.maintenanceEnabled = true
   → Vérifie req.user.roleName === "admin" ✅
   → AUTORISER (next())
   ↓
4. Route spécifique exécutée
   → ✅ Accès accordé
```

### Utilisateur Non-Admin

```
1. GET /api/reports
   ↓
2. reportRouter.use(requireAuth)
   → Vérifie JWT, définit req.user = { roleName: "analyst", ... }
   ↓
3. reportRouter.use(checkMaintenanceMode)
   → Vérifie settings.maintenanceEnabled = true
   → Vérifie req.user.roleName === "admin" ❌
   → BLOQUER (503)
   ↓
4. Réponse 503 avec message de maintenance
```

### Utilisateur Non Authentifié

```
1. GET /api/reports
   ↓
2. reportRouter.use(requireAuth)
   → Pas de JWT valide
   → BLOQUER (401 Unauthorized)
   ↓
3. Réponse 401 (n'arrive jamais au middleware de maintenance)
```

## Comportement Attendu

### Mode Maintenance Activé

| Utilisateur | Route             | Résultat    | Code HTTP |
| ----------- | ----------------- | ----------- | --------- |
| **Admin**   | `/api/auth/login` | ✅ Autorisé | 200       |
| **Admin**   | `/api/auth/me`    | ✅ Autorisé | 200       |
| **Admin**   | `/api/reports`    | ✅ Autorisé | 200       |
| **Admin**   | `/api/search`     | ✅ Autorisé | 200       |
| **Analyst** | `/api/auth/login` | ✅ Autorisé | 200       |
| **Analyst** | `/api/auth/me`    | ✅ Autorisé | 200       |
| **Analyst** | `/api/reports`    | ❌ Bloqué   | 503       |
| **Analyst** | `/api/search`     | ❌ Bloqué   | 503       |
| **Public**  | `/api/settings`   | ✅ Autorisé | 200       |
| **Public**  | `/api/health`     | ✅ Autorisé | 200       |

### Mode Maintenance Désactivé

| Utilisateur | Route          | Résultat         | Code HTTP |
| ----------- | -------------- | ---------------- | --------- |
| **Admin**   | `/api/reports` | ✅ Autorisé      | 200       |
| **Analyst** | `/api/reports` | ✅ Autorisé      | 200       |
| **Public**  | `/api/reports` | ❌ Bloqué (auth) | 401       |

## Tests de Validation

### Test 1 : Admin se Connecte en Mode Maintenance

**Étapes** :

1. Activer le mode maintenance depuis les paramètres admin
2. Se déconnecter
3. Se reconnecter avec un compte admin

**Résultat Attendu** :

- ✅ Connexion réussie
- ✅ Dashboard accessible
- ✅ Rapports accessibles
- ✅ Recherches accessibles
- ✅ Paramètres accessibles

### Test 2 : Admin Accède aux Données en Mode Maintenance

**Étapes** :

1. Mode maintenance activé
2. Connecté en tant qu'admin
3. Aller sur la page Rapports
4. Créer un nouveau rapport
5. Effectuer une recherche

**Résultat Attendu** :

- ✅ Toutes les fonctionnalités accessibles
- ✅ Pas d'erreur 503
- ✅ Log serveur : "Admin accède au site en mode maintenance"

### Test 3 : Utilisateur Non-Admin Bloqué

**Étapes** :

1. Mode maintenance activé
2. Se connecter avec un compte analyste
3. Tenter d'accéder aux rapports

**Résultat Attendu** :

- ✅ Connexion réussie (`/api/auth/login` est public)
- ✅ Profil chargé (`/api/auth/me` est public)
- ❌ Accès aux rapports bloqué (503)
- ❌ Message : "Le site est actuellement en maintenance"

### Test 4 : Routes Publiques Toujours Accessibles

**Étapes** :

1. Mode maintenance activé
2. Accéder sans authentification
3. Requête vers `/api/health`
4. Requête vers `/api/settings`

**Résultat Attendu** :

- ✅ `/api/health` retourne 200
- ✅ `/api/settings` retourne 200 (pour afficher la bannière)

## Logging Amélioré

Le middleware inclut maintenant des logs plus détaillés :

```typescript
// Admin accède
logger.debug(
  { userId: req.user?.id, path: req.path },
  "Admin accède au site en mode maintenance"
);

// Non-admin bloqué
logger.info(
  {
    userId: req.user?.id,
    path: req.path,
    maintenanceScheduledAt: settings.maintenanceScheduledAt,
  },
  "Accès bloqué - Mode maintenance activé"
);
```

**Exemple de sortie** :

```json
{
  "level": "debug",
  "time": "2025-10-26T14:30:00.000Z",
  "userId": 1,
  "path": "/api/reports",
  "msg": "Admin accède au site en mode maintenance"
}

{
  "level": "info",
  "time": "2025-10-26T14:31:00.000Z",
  "userId": 5,
  "path": "/api/reports",
  "maintenanceScheduledAt": "2025-10-27T14:00:00.000Z",
  "msg": "Accès bloqué - Mode maintenance activé"
}
```

## Points Clés de la Solution

### ✅ Avantages

1. **Admin toujours accessible** : Les admins peuvent se connecter et gérer le site
2. **Granularité** : Le middleware s'applique route par route
3. **Maintenabilité** : Pas de liste hardcodée de routes publiques
4. **Sécurité** : L'authentification reste prioritaire
5. **Logging** : Traçabilité complète des accès

### ⚠️ Limitations Connues

1. **Duplication** : Le middleware doit être ajouté dans chaque router
2. **Oubli potentiel** : Un nouveau router pourrait oublier le middleware
3. **Performance** : Requête DB pour chaque route (cache recommandé)

### 🔮 Améliorations Futures

#### 1. Cache des Paramètres Système

Éviter de requêter la DB à chaque requête :

```typescript
import NodeCache from "node-cache";

const settingsCache = new NodeCache({ stdTTL: 60 }); // Cache 60s

export async function checkMaintenanceMode(req, res, next) {
  let settings = settingsCache.get("systemSettings");

  if (!settings) {
    settings = await SettingsService.getSettings();
    settingsCache.set("systemSettings", settings);
  }

  // Suite du middleware...
}
```

#### 2. Middleware d'Enregistrement Automatique

Créer un helper pour éviter la duplication :

```typescript
// helpers/protectedRouter.ts
export function createProtectedRouter(): Router {
  const router = Router();
  router.use(requireAuth);
  router.use(checkMaintenanceMode);
  return router;
}

// Utilisation
const reportRouter = createProtectedRouter();
```

#### 3. Décorateur TypeScript

Pour une syntaxe plus élégante :

```typescript
@RequireAuth
@CheckMaintenance
class ReportController {
  @Get('/')
  async list() { ... }
}
```

## Conclusion

Le mode maintenance fonctionne maintenant correctement :

- ✅ Les admins ont un accès complet, même en mode maintenance
- ✅ Les utilisateurs non-admin sont correctement bloqués
- ✅ Les routes publiques restent accessibles
- ✅ L'authentification fonctionne normalement
- ✅ Le système est maintenable et traçable

Les administrateurs peuvent activer le mode maintenance en toute sécurité, sachant qu'ils conserveront l'accès complet pour gérer le site et résoudre les problèmes.
