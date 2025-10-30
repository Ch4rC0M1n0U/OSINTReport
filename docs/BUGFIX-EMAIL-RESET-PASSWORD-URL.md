# 🔧 Correction : URLs dans les emails de récupération de mot de passe

**Date :** 30 octobre 2025  
**Statut :** ✅ Résolu

## 🐛 Problème

Les emails de récupération de mot de passe contenaient des liens avec `localhost` au lieu de l'URL publique du serveur :

```
http://localhost:5173/reset-password?token=xxx
```

❌ **Conséquence** : Les utilisateurs ne peuvent pas cliquer sur le lien pour réinitialiser leur mot de passe depuis leur messagerie.

## 🔍 Cause racine

Les variables d'environnement `FRONTEND_URL` et `BACKEND_URL` n'étaient pas configurées correctement dans le fichier `.env`.

### Configuration par défaut

Dans `backend/src/config/env.ts` :

```typescript
FRONTEND_URL: z.string().default("http://localhost:5173"),
BACKEND_URL: z.string().default("http://localhost:4000"),
```

Ces valeurs par défaut sont utilisées si les variables ne sont pas définies dans `.env`, ce qui est approprié pour le développement local mais **pas pour la production ou GitHub Codespaces**.

### Utilisation dans le code

Dans `backend/src/modules/auth/auth.service.ts` (méthode `forgotPassword`) :

```typescript
await EmailService.sendPasswordResetEmail(
  user.email,
  user.firstName,
  resetToken,
  env.FRONTEND_URL  // ← Utilise la valeur de .env ou le défaut
);
```

Dans `backend/src/modules/email/email.service.ts` :

```typescript
const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
```

## ✅ Solution

### 1. Script automatique de détection d'environnement

Création du script `scripts/update-env-urls.sh` qui :
- ✅ Détecte automatiquement l'environnement (local vs GitHub Codespaces vs production)
- ✅ Construit les URLs appropriées
- ✅ Met à jour le fichier `.env` automatiquement

**Détection GitHub Codespaces :**
```bash
if [ -n "$CODESPACE_NAME" ] && [ -n "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
    FRONTEND_URL="https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    BACKEND_URL="https://${CODESPACE_NAME}-4000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
fi
```

**Utilisation :**
```bash
./scripts/update-env-urls.sh
```

### 2. Documentation améliorée

Mise à jour de `.env.example` avec des commentaires explicatifs :

```bash
# URLs de l'application
# IMPORTANT : Ces URLs sont utilisées pour :
#   - Les liens dans les emails (réinitialisation de mot de passe, etc.)
#   - Les cookies (CORS)
#   - Les tokens JWT (issuer/audience)
# 
# En environnement local :
#   FRONTEND_URL=http://localhost:5173
#   BACKEND_URL=http://localhost:4000
#
# En production / GitHub Codespaces, utilisez les URLs publiques :
#   FRONTEND_URL=https://votre-domaine.com
#   BACKEND_URL=https://api.votre-domaine.com
#
# Astuce : Exécutez ./scripts/update-env-urls.sh pour détecter automatiquement
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

### 3. Configuration appliquée

Pour le Codespace actuel (`fuzzy-halibut-97wgwqvrqgg379r7`) :

```bash
FRONTEND_URL=https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev
BACKEND_URL=https://fuzzy-halibut-97wgwqvrqgg379r7-4000.app.github.dev
```

## 📧 Impact sur les emails

### Avant
```html
<a href="http://localhost:5173/reset-password?token=abc123">
  Réinitialiser mon mot de passe
</a>
```
❌ Lien non fonctionnel depuis l'extérieur

### Après
```html
<a href="https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev/reset-password?token=abc123">
  Réinitialiser mon mot de passe
</a>
```
✅ Lien fonctionnel depuis n'importe où

## 🔄 Autres usages de ces variables

Les variables `FRONTEND_URL` et `BACKEND_URL` sont également utilisées pour :

1. **JWT Tokens** (`backend/src/shared/token.ts`)
   ```typescript
   const jwtIssuer = env.BACKEND_URL;
   const jwtAudience = env.FRONTEND_URL;
   ```

2. **Cookies** (`backend/src/config/cookies.ts`)
   - Configuration du domaine des cookies
   - Configuration CORS

3. **Emails**
   - Liens de réinitialisation de mot de passe ✅ Corrigé
   - Autres emails futurs avec des liens

## 📋 Fichiers modifiés

### Nouveau fichier
- ✅ `scripts/update-env-urls.sh` - Script de détection et configuration automatique

### Fichiers mis à jour
- ✅ `.env` - URLs configurées pour GitHub Codespaces
- ✅ `.env.example` - Documentation améliorée avec commentaires explicatifs

## 🚀 Déploiement

### Pour les développeurs

**Sur GitHub Codespaces :**
```bash
./scripts/update-env-urls.sh
npm run dev
```

**En local :**
```bash
# Pas besoin du script, les valeurs par défaut fonctionnent
npm run dev
```

### Pour la production

1. Configurer manuellement dans `.env` :
   ```bash
   FRONTEND_URL=https://votre-domaine.com
   BACKEND_URL=https://api.votre-domaine.com
   ```

2. Ou utiliser des variables d'environnement du serveur

3. Redémarrer l'application

## ✅ Vérification

Pour tester que les URLs sont correctes :

1. **Vérifier les variables :**
   ```bash
   grep -E "^(FRONTEND_URL|BACKEND_URL)" .env
   ```

2. **Tester l'email de récupération :**
   - Demander une réinitialisation de mot de passe
   - Vérifier que le lien dans l'email contient l'URL publique
   - Cliquer sur le lien pour confirmer qu'il fonctionne

3. **Vérifier les logs backend :**
   ```bash
   # Le backend affiche les URLs au démarrage
   npm run dev
   ```

## 📚 Références

- Configuration : `backend/src/config/env.ts`
- Service email : `backend/src/modules/email/email.service.ts`
- Service auth : `backend/src/modules/auth/auth.service.ts`
- Script : `scripts/update-env-urls.sh`
- Documentation env : `.env.example`
