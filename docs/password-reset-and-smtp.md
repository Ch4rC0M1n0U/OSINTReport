# Implémentation de la récupération de mot de passe et configuration SMTP

## Résumé

Ce document décrit l'implémentation complète d'un système de récupération de mot de passe par email et la gestion de la configuration SMTP dans le panel admin pour l'application OSINTReport.

## Backend

### 1. Modèle de données (Prisma)

#### Tables ajoutées :

**SmtpConfig** : Stockage de la configuration du serveur SMTP
- `id` : UUID unique
- `host` : Hôte SMTP
- `port` : Port SMTP
- `secure` : SSL/TLS activé
- `username` : Nom d'utilisateur
- `password` : Mot de passe (stocké en clair, à chiffrer en production)
- `fromEmail` : Email expéditeur
- `fromName` : Nom expéditeur (optionnel)
- `active` : Configuration active ou non

**PasswordResetToken** : Gestion des tokens de réinitialisation
- `id` : UUID unique
- `userId` : Référence à l'utilisateur
- `tokenHash` : Token hashé pour sécurité
- `expiresAt` : Date d'expiration (1 heure)
- `usedAt` : Date d'utilisation (null si non utilisé)

**Migration** : `20251002003655_add_smtp_and_password_reset`

### 2. Service Email (`backend/src/modules/email/email.service.ts`)

Fonctionnalités :
- Récupération de la configuration SMTP active depuis la base
- Création d'un transporteur Nodemailer
- Envoi d'emails génériques
- Test de connexion SMTP
- Génération d'email de réinitialisation de mot de passe (HTML + texte)

### 3. Service d'authentification (Auth Service)

Nouvelles méthodes ajoutées :
- `requestPasswordReset(email)` : Génère un token et envoie l'email
- `resetPassword(token, newPassword)` : Valide le token et réinitialise le mot de passe

### 4. Routes API d'authentification

Nouvelles routes ajoutées :
- `POST /api/auth/forgot-password` : Demande de réinitialisation
- `POST /api/auth/reset-password` : Réinitialisation effective

### 5. Module SMTP Admin

#### Service SMTP (`backend/src/modules/smtp/smtp.service.ts`)
- `getActiveConfig()` : Récupère la config active
- `getAllConfigs()` : Liste toutes les configurations
- `createConfig(input)` : Crée une nouvelle configuration
- `updateConfig(id, input)` : Met à jour une configuration
- `deleteConfig(id)` : Supprime une configuration
- `testConnection(config)` : Teste la connexion SMTP
- `activateConfig(id)` : Active une configuration spécifique

#### Contrôleur SMTP (`backend/src/modules/smtp/smtp.controller.ts`)
Endpoints disponibles :
- `GET /api/smtp/config` : Config active
- `GET /api/smtp/configs` : Toutes les configs
- `POST /api/smtp/config` : Créer
- `PUT /api/smtp/config/:id` : Modifier
- `DELETE /api/smtp/config/:id` : Supprimer
- `POST /api/smtp/test` : Tester connexion
- `POST /api/smtp/config/:id/activate` : Activer

**Permissions requises** : `system:admin`

## Frontend

### 1. Page de mot de passe oublié (`ForgotPasswordPage.vue`)

Fonctionnalités :
- Formulaire de saisie d'email
- Appel API à `/auth/forgot-password`
- Message de confirmation (ne révèle pas si l'email existe)
- Lien de retour à la connexion

Route : `/forgot-password`

### 2. Page de réinitialisation (`ResetPasswordPage.vue`)

Fonctionnalités :
- Récupération du token depuis l'URL (`?token=...`)
- Double saisie du nouveau mot de passe
- Validation en temps réel :
  - Force du mot de passe (5 critères)
  - Correspondance des deux champs
  - Affichage visuel des critères
- Toggle de visibilité du mot de passe
- Appel API à `/auth/reset-password`
- Redirection automatique vers login après succès

Route : `/reset-password?token=XXX`

### 3. Page admin de configuration SMTP (`SmtpSettingsPage.vue`)

Fonctionnalités :
- Listing de toutes les configurations SMTP
- Formulaire de création/modification :
  - Hôte, port, sécurité SSL/TLS
  - Identifiants (username/password)
  - Email et nom expéditeur
  - Activation automatique
- Test de connexion SMTP en temps réel
- Activation/désactivation de configurations
- Suppression avec confirmation
- Indicateurs visuels (active/inactive)

Route : `/admin/smtp`
Permissions requises : `system:admin`

### 4. Mise à jour du routeur

Routes ajoutées :
- `/forgot-password` (publique)
- `/reset-password` (publique)
- `/admin/smtp` (admin seulement)

### 5. Modification de la page de login

Lien "Mot de passe oublié ?" mis à jour pour pointer vers `/forgot-password`

## Dépendances installées

- `nodemailer` : Envoi d'emails via SMTP
- `@types/nodemailer` : Types TypeScript

## Sécurité

### Bonnes pratiques implémentées :
1. **Tokens de réinitialisation** :
   - Tokens hashés en base de données
   - Expiration après 1 heure
   - Usage unique (marqués comme utilisés)
   - Invalidation des anciens tokens à chaque nouvelle demande

2. **Confidentialité** :
   - Ne révèle pas si un email existe dans le système
   - Réponse identique que l'email existe ou non

3. **Mot de passe** :
   - Validation stricte (12 caractères, majuscule, minuscule, chiffre, spécial)
   - Affichage de la force du mot de passe
   - Hachage avec bcrypt

4. **Sessions** :
   - Révocation de toutes les sessions après réinitialisation
   - Force l'utilisateur à se reconnecter

## Points d'amélioration pour la production

1. **Chiffrement du mot de passe SMTP** : 
   - Actuellement stocké en clair dans la base
   - Recommandation : utiliser le système de vault existant

2. **Rate limiting** :
   - Limiter les demandes de réinitialisation par IP
   - Prévention du spam

3. **Logs d'audit** :
   - Tracer les tentatives de réinitialisation
   - Alertes en cas d'activité suspecte

4. **Email de notification** :
   - Informer l'utilisateur même si l'email n'existe pas (après délai)
   - Email de confirmation après changement de mot de passe

5. **Configuration SMTP par défaut** :
   - Script de seed pour ajouter une config SMTP initiale

## Tests à effectuer

1. **Backend** :
   - ✅ Migration de la base de données
   - ⏸️ Tests des routes API
   - ⏸️ Tests du service email
   - ⏸️ Tests de validation des tokens

2. **Frontend** :
   - ⏸️ Navigation entre les pages
   - ⏸️ Validation des formulaires
   - ⏸️ Test de l'email de réinitialisation
   - ⏸️ Test du panel admin SMTP

3. **Intégration** :
   - ⏸️ Configuration d'un serveur SMTP de test
   - ⏸️ Flux complet de réinitialisation
   - ⏸️ Test avec différents fournisseurs SMTP

## Commandes utiles

```bash
# Créer la migration
cd backend && npx prisma migrate dev

# Regénérer le client Prisma
cd backend && npx prisma generate

# Démarrer le backend
cd backend && npm run dev

# Démarrer le frontend
cd frontend && npm run dev
```

## Documentation API

### POST /api/auth/forgot-password
```json
{
  "email": "user@police.belgium.eu"
}
```

### POST /api/auth/reset-password
```json
{
  "token": "xxx",
  "newPassword": "NewSecureP@ssw0rd!"
}
```

### POST /api/smtp/config
```json
{
  "host": "smtp.example.com",
  "port": 587,
  "secure": true,
  "username": "user",
  "password": "pass",
  "fromEmail": "noreply@police.belgium.eu",
  "fromName": "OSINT Report",
  "active": true
}
```

## Conclusion

Le système de récupération de mot de passe et la configuration SMTP sont maintenant complètement implémentés. Les utilisateurs peuvent réinitialiser leur mot de passe de manière sécurisée, et les administrateurs peuvent configurer les serveurs SMTP directement depuis l'interface admin.
