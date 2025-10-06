# 🐛 BUGFIX - Page Paramètres Système non accessible

## Symptôme

La page `/admin/system` ne s'affiche pas - le dashboard reste visible sans changement de route.

## Cause racine

La permission `system:settings` a été ajoutée **après** la connexion de l'utilisateur. Le JWT (token) dans le cookie ne contient donc pas cette nouvelle permission.

### Détails techniques

1. **Token JWT actuel** dans le cookie :
   ```json
   {
     "permissions": [
       "reports:read",
       "reports:write", 
       "users:read",
       "users:write",
       "system:admin"
     ]
   }
   ```

2. **Permission requise** pour `/admin/system` :
   ```typescript
   {
     path: "admin/system",
     meta: {
       permissions: ["system:settings"]  // ← Cette permission manque dans le JWT
     }
   }
   ```

3. **Guard de route** bloque l'accès :
   - Le router vérifie si l'utilisateur a la permission `system:settings`
   - JWT ne contient pas cette permission
   - Redirection silencieuse vers la route précédente (dashboard)

## Solution ✅

### Option 1 : Se déconnecter et se reconnecter (RECOMMANDÉ)

1. Cliquer sur le menu utilisateur (en haut à droite)
2. Cliquer sur "Déconnexion"
3. Se reconnecter avec les mêmes identifiants
4. Le nouveau JWT contiendra automatiquement `system:settings`

### Option 2 : Supprimer les cookies manuellement

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Application" → "Cookies"
3. Supprimer `or_at` et `or_rt`
4. Recharger la page
5. Se reconnecter

### Option 3 : Utiliser le système de permissions `system:admin`

**Modification temporaire** du router pour permettre l'accès aux admins :

```typescript
// frontend/src/router/index.ts
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

⚠️ **Note** : Cette modification n'est pas nécessaire si vous suivez l'option 1.

## Vérification backend

La permission a bien été créée en base de données :

```sql
SELECT * FROM "Permission" WHERE code = 'system:settings';
```

Résultat attendu :
```
id                   | code             | description
---------------------|------------------|---------------------------
perm-system-settings | system:settings  | Gestion des paramètres système
```

La relation role-permission est également configurée :

```sql
SELECT r.name, p.code 
FROM "RolePermission" rp
JOIN "Role" r ON r.id = rp."roleId"
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE r.name = 'admin';
```

Résultat attendu (6 permissions) :
```
name  | code
------|------------------
admin | reports:read
admin | reports:write
admin | users:read
admin | users:write
admin | system:admin
admin | system:settings ✅
```

## Prévention future

### Refresh automatique du JWT

**TODO** : Implémenter un mécanisme de refresh automatique quand de nouvelles permissions sont ajoutées au rôle.

**Approche suggérée** :

1. Endpoint `POST /api/auth/refresh-permissions`
2. Vérifier les permissions en DB
3. Si différences détectées → générer nouveau JWT
4. Retourner nouveau token

**Code d'exemple** :

```typescript
// backend/src/modules/auth/auth.controller.ts
static async refreshPermissions(req, res) {
  const userId = req.user!.id;
  
  // Récupérer permissions actuelles depuis DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } }
  });
  
  // Comparer avec JWT actuel
  const currentPerms = req.user!.permissions;
  const dbPerms = user.role.permissions.map(p => p.code);
  
  if (JSON.stringify(currentPerms) !== JSON.stringify(dbPerms)) {
    // Générer nouveau JWT
    const { accessToken, refreshToken } = await AuthService.generateTokens(user);
    
    res.cookie('or_at', accessToken, { /* options */ });
    res.cookie('or_rt', refreshToken, { /* options */ });
    
    return res.json({ refreshed: true });
  }
  
  return res.json({ refreshed: false });
}
```

**Frontend** : Appeler automatiquement au chargement de l'app :

```typescript
// frontend/src/composables/useAuth.ts
onMounted(async () => {
  await authApi.refreshPermissions();
  await loadCurrentUser();
});
```

## Logs de diagnostic

Backend démarre correctement avec la nouvelle permission :

```
[09:02:38] DEBUG: Prisma query
  INSERT INTO "Permission" (id, code, description)
  VALUES ('perm-system-settings', 'system:settings', 'Gestion des paramètres système')
  ON CONFLICT (code) DO UPDATE SET description = ...

[09:02:38] DEBUG: Prisma query
  INSERT INTO "RolePermission" (roleId, permissionId)
  VALUES ('role-admin', 'perm-system-settings')
  ON CONFLICT DO NOTHING
```

## Résolution appliquée

1. ✅ Permission `system:settings` ajoutée à `auth.constants.ts`
2. ✅ Permission ajoutée à `PERMISSION_DEFINITIONS` dans `bootstrap.ts`
3. ✅ Permission associée au rôle `admin` dans `ROLE_DEFINITIONS`
4. ✅ Backend redémarré → Permission créée en DB
5. ⚠️ **Action utilisateur requise** : Se déconnecter et se reconnecter

## Fichiers modifiés

- `backend/src/modules/auth/bootstrap.ts` - Ajout de la permission dans PERMISSION_DEFINITIONS
- `backend/src/modules/auth/auth.constants.ts` - Déjà contient SYSTEM_SETTINGS
- `backend/src/routes/index.ts` - Settings router déjà enregistré
- `frontend/src/router/index.ts` - Route `/admin/system` déjà configurée

---

**Date** : 6 octobre 2025  
**Session** : 9  
**Status** : ✅ RÉSOLU (nécessite reconnexion utilisateur)
