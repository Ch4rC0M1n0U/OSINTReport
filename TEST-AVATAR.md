# Guide de test - Fonctionnalité Avatar

## 🎯 Objectifs du test

Vérifier que :
1. ✅ L'upload d'avatar préserve les permissions et le rôle
2. ✅ La modification de profil avec URL préserve les permissions et le rôle
3. ✅ L'avatar s'affiche correctement dans toute l'application
4. ✅ Le nom du rôle reste visible sous le nom d'utilisateur

## 🧪 Scénarios de test

### Test 1 : Upload d'image

1. **Connexion**
   - Allez sur http://localhost:5173/login
   - Connectez-vous avec vos identifiants admin

2. **Vérification initiale**
   - Notez les liens visibles dans le menu de gauche (Administration, etc.)
   - Notez le texte du rôle sous votre nom (en haut à droite)

3. **Upload d'avatar**
   - Allez sur "Mon profil"
   - Cliquez sur "Choisir une image"
   - Sélectionnez une image PNG ou JPEG (max 5MB)
   - Attendez le message de succès

4. **Vérification après upload**
   - ✅ L'avatar s'affiche immédiatement dans le coin supérieur droit
   - ✅ L'avatar s'affiche sur la page de profil
   - ✅ Les liens du menu (Administration, etc.) sont toujours présents
   - ✅ Le texte du rôle (ex: "admin") est toujours visible sous votre nom

### Test 2 : URL d'avatar

1. **Modification avec URL**
   - Sur la page "Mon profil"
   - Dans le champ "URL de la photo de profil", collez :
     ```
     https://api.dicebear.com/7.x/avataaars/svg?seed=Felix
     ```
   - Cliquez sur "Enregistrer les modifications"

2. **Vérification après modification**
   - ✅ L'avatar s'affiche avec la nouvelle image
   - ✅ Les permissions sont préservées (menu Administration visible)
   - ✅ Le rôle est toujours affiché sous votre nom

### Test 3 : Navigation

1. **Test de persistance**
   - Naviguez vers "Rapports"
   - Revenez au "Tableau de bord"
   - ✅ L'avatar reste affiché partout
   - ✅ Le rôle reste visible

2. **Test après rafraîchissement**
   - Rafraîchissez la page (F5)
   - ✅ L'avatar reste affiché
   - ✅ Les permissions sont toujours actives

### Test 4 : Déconnexion/Reconnexion

1. **Déconnexion**
   - Cliquez sur votre avatar en haut à droite
   - Cliquez sur "Déconnexion"
   - ⚠️ **Normal** : L'avatar disparaît (session terminée)

2. **Reconnexion**
   - Reconnectez-vous
   - ✅ L'avatar est rechargé depuis la base de données
   - ✅ Toutes les permissions sont restaurées

## 🐛 Bugs connus (corrigés)

### ❌ Avant correction

- **Bug 1** : Après upload, les permissions disparaissaient
  - Symptôme : Menu "Administration" non visible
  - Cause : L'API ne retournait pas les permissions

- **Bug 2** : Le rôle disparaissait sous le nom
  - Symptôme : Texte "admin" manquant
  - Cause : `roleName` non retourné par l'API

### ✅ Après correction

- L'API utilise maintenant `AuthService.getAuthenticatedUser()` qui retourne :
  ```json
  {
    "user": {
      "id": "...",
      "firstName": "...",
      "lastName": "...",
      "email": "...",
      "matricule": "...",
      "avatarUrl": "...",
      "roleId": "...",
      "roleName": "admin",
      "permissions": ["reports:read", "reports:write", ...]
    }
  }
  ```

## 📊 Résultat attendu

Après tous les tests :

```
✅ Upload d'image : OK
✅ URL d'avatar : OK
✅ Préservation des permissions : OK
✅ Préservation du rôle : OK
✅ Affichage dans le header : OK
✅ Persistance après navigation : OK
✅ Rechargement après reconnexion : OK
```

## 🔧 En cas de problème

### L'avatar ne s'affiche pas

1. Vérifiez la console du navigateur (F12)
2. Vérifiez que l'URL de l'image est valide (pour les URLs)
3. Vérifiez que le fichier est bien PNG/JPEG (pour l'upload)

### Les permissions disparaissent

1. Ouvrez la console du navigateur (F12)
2. Dans l'onglet "Application" > "Cookies", vérifiez la présence de `or_at`
3. Vérifiez les logs du backend pour voir la requête

### Le backend ne démarre pas

```bash
cd /workspaces/OSINTReport/backend
npm run dev
```

### Le frontend ne démarre pas

```bash
cd /workspaces/OSINTReport/frontend
npm run dev
```

## 📝 Notes techniques

### Stockage de l'avatar

- **Upload** : Image redimensionnée à 512x512px, convertie en PNG, stockée en base64
  - ✅ Sauvegarde immédiate (pas besoin de cliquer sur "Enregistrer")
  - ✅ Persiste après déconnexion/reconnexion
  - 📦 Taille typique : 5-10 KB (base64)
  
- **URL** : URL directement stockée dans la base de données
  - ⚠️ Nécessite de cliquer sur "Enregistrer les modifications"
  - ⚠️ Remplacera l'image uploadée si vous sauvegardez le formulaire avec une URL
  
- **Champ DB** : `User.avatarUrl` (TEXT, nullable)

### ⚠️ Comportement important

Si vous uploadez une image puis que vous entrez une URL et cliquez sur "Enregistrer les modifications", **l'URL remplacera l'image uploadée**. 

**Bonne pratique** : Choisissez une seule méthode :
- Soit upload d'image (recommandé pour la persistance)
- Soit URL externe (utile pour des avatars dynamiques type Gravatar)

### Endpoints modifiés

- `POST /api/users/me/avatar` : Upload d'image
- `PATCH /api/users/me/profile` : Mise à jour du profil

Les deux retournent maintenant l'utilisateur complet avec permissions.
