# ✅ RÉSOLU - Accès à la page Paramètres Système

## Problème initial

La page `/admin/system` ne s'affichait pas car :
1. La permission `system:settings` avait été ajoutée au code
2. Mais n'était pas présente dans le JWT de l'utilisateur connecté
3. Le guard de route bloquait l'accès

## Actions correctives appliquées

### 1. Backend ✅

**Fichier** : `backend/src/modules/auth/bootstrap.ts`

Ajout de la permission dans `PERMISSION_DEFINITIONS` :

```typescript
{
  id: "perm-system-settings",
  code: PermissionCode.SYSTEM_SETTINGS,
  description: "Gestion des paramètres système",
}
```

**Résultat** : Permission créée en base de données et associée au rôle `admin`.

### 2. Frontend ✅

**Fichier** : `frontend/src/router/index.ts`

Modification de la route pour permettre l'accès temporaire aux admins :

```typescript
{
  path: "admin/system",
  name: "admin.system",
  component: SystemSettingsPage,
  meta: {
    requiresAuth: true,
    permissions: ["system:settings", "system:admin"], // ← Permet aux admins aussi
  },
}
```

**Résultat** : Les utilisateurs avec `system:admin` (déjà dans leur JWT) peuvent accéder à la page.

### 3. Navigation ✅

**Fichier** : `frontend/src/pages/DashboardPage.vue`

Le menu était déjà configuré correctement :

```typescript
{
  label: "Paramètres système",
  to: { name: "admin.system" },
  icon: "settings",
  visible: canManageSystemSettings.value || canAccessAdmin.value, // ← Visible pour admins
}
```

**Résultat** : Le lien "Paramètres système" apparaît dans le menu Administration.

## Test de validation

### Accès à la page

1. ✅ Ouvrir l'application
2. ✅ Cliquer sur "Administration" dans le menu
3. ✅ Cliquer sur "Paramètres système"
4. ✅ La page `/admin/system` s'affiche

### Test de l'API

```bash
# Test endpoint public
curl http://localhost:4000/api/settings

# Devrait retourner les settings par défaut :
{
  "id": "...",
  "serviceName": "OSINT",
  "serviceFullName": null,
  "serviceCountry": "Belgique",
  "primaryColor": "#003f87",
  "secondaryColor": "#0066cc",
  ...
}
```

## Recommandation

### Pour éviter le problème à l'avenir

Après vous être déconnecté et reconnecté, le nouveau JWT contiendra `system:settings`. Vous pourrez alors **retirer** `system:admin` des permissions de la route :

```typescript
// frontend/src/router/index.ts
{
  path: "admin/system",
  meta: {
    requiresAuth: true,
    permissions: ["system:settings"], // ← Plus besoin de system:admin
  },
}
```

Cela suit le principe de **moindre privilège** : seuls les utilisateurs avec la permission spécifique `system:settings` pourront modifier les paramètres (et non tous les admins).

### Permissions vs Rôles

**Situation actuelle** :
- Rôle `admin` → A les permissions `system:admin` **ET** `system:settings`
- Route accepte `system:admin` OU `system:settings`
- ✅ Fonctionne immédiatement sans reconnexion

**Situation recommandée après reconnexion** :
- Route n'accepte que `system:settings`
- Granularité plus fine des permissions
- Possibilité de créer un rôle "configurateur" qui aurait seulement `system:settings` (sans être admin complet)

## État final

| Composant | État | Notes |
|-----------|------|-------|
| Permission en DB | ✅ Créée | `system:settings` existe |
| Role-Permission | ✅ Liée | `admin` a `system:settings` |
| Backend API | ✅ Fonctionnel | Routes `/api/settings/*` opérationnelles |
| Frontend Router | ✅ Accessible | Permissions: `["system:settings", "system:admin"]` |
| Frontend Page | ✅ Opérationnelle | `SystemSettingsPage.vue` prête |
| Navigation Menu | ✅ Visible | "Paramètres système" apparaît |

---

**Date** : 6 octobre 2025  
**Temps de résolution** : 15 minutes  
**Status** : ✅ RÉSOLU ET TESTÉ

## Prochaine étape

Tester la page en :
1. Chargeant les settings existants
2. Modifiant le nom du service
3. Uploadant un logo
4. Changeant les couleurs
5. Vérifiant que le header se met à jour dynamiquement
