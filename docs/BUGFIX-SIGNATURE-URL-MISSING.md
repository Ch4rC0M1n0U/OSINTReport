# 🐛 Correction du bug : signatureUrl manquant dans la réponse API

**Date** : 26 octobre 2025  
**Statut** : ✅ Corrigé

## Problème identifié

Lors de l'enregistrement d'une signature, l'upload fonctionnait correctement mais le champ `signatureUrl` n'était **pas retourné** dans la réponse de l'API, ce qui empêchait l'affichage de la signature dans l'interface.

### Symptômes observés

```typescript
// Console logs
📝 Upload response: {user: {…}, message: 'Signature mise à jour avec succès'}
📝 User updated, signatureUrl:    // <- VIDE !
```

La signature était bien sauvegardée en base de données et sur le disque, mais l'interface ne la récupérait pas.

## Cause du problème

Le champ `signatureUrl` était **absent de plusieurs types TypeScript** utilisés pour l'authentification :

1. ❌ `AuthenticatedUser` (dans `auth.service.ts`)
2. ❌ `UserPayload` (dans `types/express/index.d.ts`)
3. ❌ `getUserWithRoleByEmail()` select clause
4. ❌ `buildAuthenticatedUser()` return object
5. ❌ `requireAuth()` middleware user mapping

Même si la base de données avait le champ et que le contrôleur l'enregistrait correctement, le système d'authentification ne le renvoyait pas dans les réponses API.

## Solution appliquée

### 1. Ajout de `signatureUrl` au type `AuthenticatedUser`

**Fichier** : `/workspaces/OSINTReport/backend/src/modules/auth/auth.service.ts`

```typescript
export type AuthenticatedUser = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  phone: string | null;
  grade: string | null;
  avatarUrl: string | null;
  signatureUrl: string | null; // ✅ AJOUTÉ
  roleId: string;
  roleName: string;
  permissions: PermissionCode[];
};
```

### 2. Ajout de `signatureUrl` au select de `getUserWithRoleByEmail()`

**Fichier** : `/workspaces/OSINTReport/backend/src/modules/auth/auth.service.ts`

```typescript
async function getUserWithRoleByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      matricule: true,
      email: true,
      phone: true,
      grade: true,
      avatarUrl: true,
      signatureUrl: true, // ✅ AJOUTÉ
      passwordHash: true,
      roleId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
}
```

### 3. Ajout de `signatureUrl` à `buildAuthenticatedUser()`

**Fichier** : `/workspaces/OSINTReport/backend/src/modules/auth/auth.service.ts`

```typescript
function buildAuthenticatedUser(user: UserWithRole): AuthenticatedUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    matricule: user.matricule,
    email: user.email,
    phone: user.phone,
    grade: user.grade,
    avatarUrl: user.avatarUrl,
    signatureUrl: user.signatureUrl, // ✅ AJOUTÉ
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: mapPermissions(user.role.permissions),
  };
}
```

### 4. Ajout de `signatureUrl` au type `UserPayload`

**Fichier** : `/workspaces/OSINTReport/backend/src/types/express/index.d.ts`

```typescript
interface UserPayload {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  phone: string | null;
  grade: string | null;
  avatarUrl: string | null;
  signatureUrl: string | null; // ✅ AJOUTÉ
  roleId: string;
  roleName: string;
  permissions: PermissionCode[];
}
```

### 5. Ajout de `signatureUrl` dans le middleware `requireAuth()`

**Fichier** : `/workspaces/OSINTReport/backend/src/middleware/authenticate.ts`

```typescript
req.user = {
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  matricule: user.matricule,
  email: user.email,
  phone: user.phone,
  grade: user.grade,
  avatarUrl: user.avatarUrl,
  signatureUrl: user.signatureUrl, // ✅ AJOUTÉ
  roleId: user.roleId,
  roleName: user.roleName,
  permissions: user.permissions,
};
```

## Résultat attendu

Après ces corrections, lors de l'upload d'une signature :

```typescript
// Console logs
📝 Upload response: {user: {…}, message: 'Signature mise à jour avec succès'}
📝 User updated, signatureUrl: /images/signatures/signature-64a915d4-...-abc123.png  // ✅ REMPLI !
```

La signature devrait maintenant :

- ✅ S'afficher dans la page Profil
- ✅ S'afficher dans le menu déroulant du profil
- ✅ Être protégée contre les captures d'écran
- ✅ Être disponible pour les rapports

## Vérification

Pour vérifier que tout fonctionne :

1. Allez sur http://localhost:5173
2. Connectez-vous
3. Allez sur la page Profil
4. Cliquez sur "Ajouter une signature"
5. Dessinez quelque chose
6. Cliquez sur "Enregistrer"
7. Vérifiez que :
   - La signature s'affiche dans la section "Signature"
   - Le bouton change en "Modifier la signature" et "Supprimer la signature"
   - La signature apparaît dans le menu profil (en haut à droite)
   - Les logs console montrent un `signatureUrl` valide

## Leçons apprises

### Problème de cohérence des types

Quand on ajoute un nouveau champ à un modèle de données, il faut **toujours** vérifier :

1. ✅ Le schéma Prisma (`schema.prisma`)
2. ✅ Les migrations de base de données
3. ✅ Les types TypeScript (`AuthenticatedUser`, `UserPayload`, etc.)
4. ✅ Les fonctions de mapping (`buildAuthenticatedUser()`, etc.)
5. ✅ Les clauses `select` dans les requêtes Prisma
6. ✅ Les middlewares qui manipulent ces données
7. ✅ Le frontend (stores, interfaces)

### Point d'attention

Ce bug montre l'importance de :

- ✅ **Vérifier les types de bout en bout** (DB → Backend → Frontend)
- ✅ **Tester les réponses API** avec des logs détaillés
- ✅ **Ne pas supposer** que si un champ existe en DB, il sera automatiquement retourné

## Impact

- **Backend** : 5 fichiers modifiés
- **Frontend** : Aucune modification nécessaire (déjà prêt)
- **Base de données** : Aucune modification nécessaire (déjà prête)
- **Temps de correction** : ~10 minutes
- **Gravité** : Moyenne (fonctionnalité non fonctionnelle mais pas de perte de données)

## Fichiers modifiés

1. `/workspaces/OSINTReport/backend/src/modules/auth/auth.service.ts`
2. `/workspaces/OSINTReport/backend/src/types/express/index.d.ts`
3. `/workspaces/OSINTReport/backend/src/middleware/authenticate.ts`

---

**Résolu par** : GitHub Copilot  
**Testé par** : En attente de validation utilisateur  
**Version** : 1.0.0
