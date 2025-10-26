# Fonctionnalité de Signature Manuscrite

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs d'ajouter une signature manuscrite à leur profil, qui sera utilisée pour signer les rapports OSINT générés.

## Date de livraison

26 octobre 2025

## Modifications apportées

### 1. Base de données (Backend)

#### Schéma Prisma

- **Fichier modifié** : `backend/prisma/schema.prisma`
- **Changement** : Ajout du champ `signatureUrl` (String?) au modèle `User`
- **Migration** : `20251026075057_add_signature_to_user`

```prisma
model User {
  // ... autres champs
  avatarUrl    String?
  signatureUrl String?  // ✨ NOUVEAU
  // ... autres champs
}
```

### 2. API Backend

#### Routes ajoutées

- **POST** `/users/me/signature` - Upload d'une nouvelle signature
  - Accepte un fichier image (PNG/JPEG)
  - Traite l'image (redimensionnement max 600x200px, fond transparent)
  - Stocke dans `/frontend/public/images/signatures/`
  - Retourne l'utilisateur mis à jour avec le nouveau `signatureUrl`

#### Contrôleur mis à jour

- **Fichier** : `backend/src/modules/users/user.controller.ts`
- **Nouvelles méthodes** :
  - `uploadSignature()` - Gère l'upload et le traitement de la signature
  - Met à jour `updateProfile()` pour accepter `signatureUrl`

#### Router mis à jour

- **Fichier** : `backend/src/modules/users/user.router.ts`
- Nouvelle route configurée avec multer pour l'upload de fichiers

### 3. Frontend (Vue.js)

#### Nouveau composant : SignaturePad

- **Fichier** : `frontend/src/components/SignaturePad.vue`
- **Fonctionnalités** :
  - Canvas HTML5 pour dessiner
  - Support tactile (mobile/tablette) et souris
  - **Correction du décalage du curseur** avec calcul de scale
  - Boutons Effacer/Annuler/Enregistrer
  - Export en PNG transparent
  - Responsive et accessible

**Props** :

- `width` (number, optionnel) - Largeur du canvas (défaut: 600)
- `height` (number, optionnel) - Hauteur du canvas (défaut: 200)

**Events** :

- `@save` - Émis avec le data URL de la signature quand l'utilisateur enregistre
- `@cancel` - Émis quand l'utilisateur annule

#### Nouveau composant : ProtectedSignature

- **Fichier** : `frontend/src/components/ProtectedSignature.vue`
- **Fonctionnalités** :
  - **Protection contre les captures d'écran** (Print Screen, Windows Snip, etc.)
  - **Empêche le clic droit** et le menu contextuel
  - **Bloque le glisser-déposer** de l'image
  - **Désactive la sélection** et le copier-coller
  - **Filigrane "PROTÉGÉ"** en arrière-plan
  - **Indicateur de protection** au survol
  - Overlay transparent pour bloquer les interactions

**Props** :

- `src` (string, requis) - URL de la signature
- `alt` (string, optionnel) - Texte alternatif
- `maxHeight` (string, optionnel) - Hauteur maximale de l'affichage

#### Page de profil mise à jour

- **Fichier** : `frontend/src/pages/ProfilePage.vue`
- **Ajouts** :
  - Nouvelle section "Signature manuscrite"
  - Affichage protégé de la signature actuelle
  - Bouton pour ajouter/modifier la signature
  - Bouton pour supprimer la signature
  - Intégration du composant `SignaturePad`
  - Utilisation du composant `ProtectedSignature`

#### Menu utilisateur mis à jour

- **Fichier** : `frontend/src/pages/DashboardPage.vue`
- **Ajouts** :
  - **Affichage de la signature dans le menu déroulant du profil**
  - Protection de la signature avec le composant `ProtectedSignature`
  - Signature visible uniquement si définie

#### Store Auth mis à jour

- **Fichier** : `frontend/src/stores/auth.ts`
- **Changement** : Ajout de `signatureUrl: string | null` à l'interface `UserInfo`

### 4. Stockage des fichiers

#### Nouveau dossier

- **Chemin** : `frontend/public/images/signatures/`
- **Contenu** : Images PNG des signatures des utilisateurs
- **Nommage** : `signature-{userId}-{random}.png`

### 5. Protection et Sécurité Avancée

#### Protections contre les captures et vols

- ✅ **Détection des raccourcis clavier** : Print Screen, Ctrl+Shift+S, Win+Shift+S
- ✅ **Blocage du clic droit** : Menu contextuel désactivé
- ✅ **Empêche le glisser-déposer** : Impossible de drag & drop l'image
- ✅ **Désactive la sélection** : user-select: none sur tous les navigateurs
- ✅ **Overlay de protection** : Couche transparente bloquant les interactions
- ✅ **Filigrane visible** : Texte "PROTÉGÉ" en arrière-plan
- ✅ **Indicateur de sécurité** : Badge "🔒 Signature protégée" au survol
- ✅ **Alert utilisateur** : Message si tentative de capture d'écran détectée

#### Protections serveur

- ✅ Authentification requise pour toutes les opérations
- ✅ Validation des types de fichiers (PNG/JPEG uniquement)
- ✅ Limite de taille : 5MB
- ✅ Noms de fichiers uniques et aléatoires
- ✅ Suppression automatique de l'ancienne signature

## Utilisation

### Pour l'utilisateur

1. Accéder à la page "Mon profil"
2. Descendre jusqu'à la section "Signature manuscrite"
3. Cliquer sur "Ajouter une signature" ou "Modifier la signature"
4. Dessiner la signature dans le canvas avec la souris ou le doigt
5. Utiliser "Effacer" pour recommencer si nécessaire
6. Cliquer sur "Enregistrer" pour sauvegarder
7. La signature apparaît immédiatement dans le profil

### Pour supprimer une signature

1. Dans la section "Signature manuscrite"
2. Cliquer sur "Supprimer la signature"
3. Confirmer l'action

## Sécurité

- ✅ Authentification requise pour toutes les opérations
- ✅ Validation du type de fichier (PNG/JPEG uniquement)
- ✅ Limite de taille de fichier : 5MB
- ✅ Traitement d'image côté serveur avec Sharp
- ✅ Suppression automatique de l'ancienne signature lors de l'upload d'une nouvelle
- ✅ Noms de fichiers uniques avec crypto.randomBytes()

## Traitement d'image

Le backend utilise Sharp pour :

- Redimensionner la signature (max 600x200px, préserve le ratio)
- Maintenir le fond transparent
- Convertir en PNG optimisé
- Assurer une qualité cohérente

## Intégration future avec les rapports

La signature stockée dans `user.signatureUrl` pourra être utilisée dans :

- Les rapports PDF générés
- Les exports de documents
- Les validations officielles

Format d'utilisation recommandé :

```typescript
// Dans la génération de rapport
if (user.signatureUrl) {
  // Insérer l'image de signature
  const signatureImage = await loadImage(user.signatureUrl);
  // Positionner en bas du rapport avec le nom et grade
}
```

## Tests suggérés

1. ✅ Upload d'une signature manuscrite
2. ✅ Modification d'une signature existante
3. ✅ Suppression d'une signature
4. ✅ Validation des formats d'image
5. ✅ Support tactile sur mobile/tablette
6. ✅ Responsive design
7. ✅ Gestion des erreurs réseau

## Notes techniques

- Le composant `SignaturePad` utilise l'API Canvas native
- Les événements tactiles sont gérés avec `touchstart`, `touchmove`, `touchend`
- Le state `hasDrawn` empêche la sauvegarde d'un canvas vide
- Les data URLs sont converties en Blob côté frontend avant l'upload
- Le backend ne stocke que le chemin relatif dans la BDD

## Dépendances

### Backend

- `sharp` - Traitement d'image (déjà installé)
- `multer` - Upload de fichiers (déjà installé)

### Frontend

- Canvas API (natif)
- `@hugeicons/vue` - Icônes (déjà installé)

## Migration

Pour appliquer cette fonctionnalité sur un environnement existant :

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Compatibilité

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Android)
- ✅ Tablette (iPad, Android tablets)
- ✅ Accessible au clavier

## Auteur

Implémenté le 26 octobre 2025
