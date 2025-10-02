# Guide de configuration SMTP

## 🎯 Objectif

Ce guide explique comment configurer l'envoi d'emails via SMTP dans l'application OSINTReport, notamment pour la fonctionnalité de récupération de mot de passe.

## 📍 Accès à la configuration

### Via l'interface web

1. Connectez-vous en tant qu'administrateur
2. Dans le menu latéral, développez **Administration**
3. Cliquez sur **Configuration SMTP**
4. URL directe : http://localhost:5173/admin/smtp

### Permissions requises

- `system:admin` - Seuls les administrateurs système peuvent gérer les configurations SMTP

## 🔧 Créer une configuration SMTP

### Étape 1 : Cliquer sur "Nouvelle configuration"

### Étape 2 : Remplir le formulaire

#### Champs obligatoires :

- **Hôte SMTP** : Adresse du serveur SMTP (ex: `smtp.gmail.com`, `smtp.office365.com`)
- **Port** : Port de connexion (587 pour TLS, 465 pour SSL, 25 pour non sécurisé)
- **Nom d'utilisateur** : Identifiant du compte SMTP
- **Mot de passe** : Mot de passe du compte SMTP
- **Email expéditeur** : Adresse email qui apparaîtra comme expéditeur (ex: `noreply@police.belgium.eu`)

#### Champs optionnels :

- **Nom expéditeur** : Nom affiché comme expéditeur (ex: "OSINT Report")
- **Connexion sécurisée** : Active SSL/TLS (recommandé)
- **Configuration active** : Active cette configuration (désactive les autres automatiquement)

### Étape 3 : Tester la connexion

Avant de sauvegarder, cliquez sur **"Tester la connexion"** pour vérifier que les paramètres sont corrects.

### Étape 4 : Enregistrer

Cliquez sur **"Créer"** pour enregistrer la configuration.

## 📧 Exemples de configuration

### Gmail

```
Hôte SMTP:          smtp.gmail.com
Port:               587
Connexion sécurisée: ✓ (TLS)
Nom d'utilisateur:  votre-email@gmail.com
Mot de passe:       Mot de passe d'application (pas votre mot de passe Gmail)
Email expéditeur:   votre-email@gmail.com
```

> **Note** : Pour Gmail, vous devez créer un "Mot de passe d'application" dans les paramètres de sécurité Google.

### Office 365 / Outlook

```
Hôte SMTP:          smtp.office365.com
Port:               587
Connexion sécurisée: ✓ (TLS)
Nom d'utilisateur:  votre-email@outlook.com
Mot de passe:       Votre mot de passe Outlook
Email expéditeur:   votre-email@outlook.com
```

### Serveur SMTP personnalisé

```
Hôte SMTP:          mail.votre-domaine.be
Port:               587 ou 465
Connexion sécurisée: ✓ (recommandé)
Nom d'utilisateur:  noreply@votre-domaine.be
Mot de passe:       Mot de passe du compte
Email expéditeur:   noreply@votre-domaine.be
Nom expéditeur:     Police Fédérale - OSINT
```

## 🔄 Gérer les configurations

### Activer une configuration

1. Dans la liste des configurations, cliquez sur le bouton vert **"Activer"** (icône check)
2. La configuration devient active et les autres sont automatiquement désactivées
3. Seule une configuration peut être active à la fois

### Modifier une configuration

1. Cliquez sur le bouton **"Modifier"** (icône crayon)
2. Modifiez les champs nécessaires
3. Le mot de passe peut être laissé vide pour ne pas le changer
4. Cliquez sur **"Mettre à jour"**

### Supprimer une configuration

1. Cliquez sur le bouton rouge **"Supprimer"** (icône poubelle)
2. Confirmez la suppression

## 🧪 Tester l'envoi d'emails

### Test via la page de récupération de mot de passe

1. Assurez-vous qu'une configuration SMTP est **active**
2. Déconnectez-vous de l'application
3. Sur la page de login, cliquez sur **"Mot de passe oublié ?"**
4. Entrez l'email d'un utilisateur existant
5. Un email de réinitialisation devrait être envoyé

### Vérifier les logs backend

En cas de problème, vérifiez les logs du backend dans le terminal :

```bash
# Le backend affiche les erreurs d'envoi d'email
# Recherchez des messages contenant "Email" ou "SMTP"
```

## 🔐 Sécurité

### Bonnes pratiques

- ✅ **Toujours utiliser une connexion sécurisée** (SSL/TLS)
- ✅ **Utiliser un compte dédié** pour l'envoi d'emails (ex: `noreply@...`)
- ✅ **Limiter les permissions** du compte SMTP (envoi uniquement)
- ✅ **Utiliser des mots de passe d'application** quand disponibles (Gmail, Outlook)
- ⚠️ **Ne jamais partager** les identifiants SMTP

### Stockage des mots de passe

> ⚠️ **Important** : Actuellement, les mots de passe SMTP sont stockés en clair dans la base de données. Pour la production, il est recommandé d'implémenter le chiffrement avec le système de vault existant.

## 🐛 Dépannage

### "Erreur de connexion au serveur SMTP"

- Vérifiez l'hôte et le port
- Vérifiez que le firewall autorise la connexion sortante
- Testez avec `telnet smtp.example.com 587`

### "Authentification échouée"

- Vérifiez le nom d'utilisateur et le mot de passe
- Pour Gmail : utilisez un mot de passe d'application
- Vérifiez que le compte n'est pas bloqué

### "Connexion refusée"

- Le port est peut-être incorrect
- Essayez 587 (TLS) au lieu de 465 (SSL)
- Vérifiez la case "Connexion sécurisée"

### "Email non reçu"

- Vérifiez les spams/courrier indésirable
- Vérifiez les logs backend
- Testez avec un autre email
- Vérifiez que la configuration est bien **active**

## 📋 API Backend

### Endpoints disponibles

Tous les endpoints nécessitent l'authentification et la permission `system:admin`.

```
GET    /api/smtp/config          # Récupérer la config active
GET    /api/smtp/configs         # Liste toutes les configs
POST   /api/smtp/config          # Créer une nouvelle config
PUT    /api/smtp/config/:id      # Modifier une config
DELETE /api/smtp/config/:id      # Supprimer une config
POST   /api/smtp/test            # Tester une connexion SMTP
POST   /api/smtp/config/:id/activate  # Activer une config
```

### Exemple de requête (avec authentification)

```bash
# Lister les configurations
curl -X GET http://localhost:4000/api/smtp/configs \
  -H "Cookie: or_at=YOUR_ACCESS_TOKEN"

# Créer une configuration
curl -X POST http://localhost:4000/api/smtp/config \
  -H "Content-Type: application/json" \
  -H "Cookie: or_at=YOUR_ACCESS_TOKEN" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": true,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "fromEmail": "your-email@gmail.com",
    "fromName": "OSINT Report",
    "active": true
  }'
```

## 🚀 Flux de récupération de mot de passe

1. **Utilisateur oublie son mot de passe**
   - Accède à `/forgot-password`
   - Entre son email

2. **Backend traite la demande**
   - Génère un token sécurisé (expire en 1h)
   - Hashe le token avant stockage
   - Invalide les anciens tokens

3. **Email envoyé via SMTP**
   - Utilise la configuration active
   - Contient un lien avec le token
   - Template HTML professionnel

4. **Utilisateur clique sur le lien**
   - Redirigé vers `/reset-password?token=...`
   - Entre un nouveau mot de passe
   - Validation de force du mot de passe

5. **Mot de passe réinitialisé**
   - Token vérifié et validé
   - Mot de passe mis à jour (hashé)
   - Toutes les sessions révoquées

## 📝 Notes de développement

### Structure des fichiers

```
backend/
├── src/modules/smtp/
│   ├── smtp.service.ts       # Logique métier SMTP
│   ├── smtp.controller.ts    # Contrôleurs API
│   └── smtp.router.ts        # Routes Express
├── src/modules/email/
│   └── email.service.ts      # Service d'envoi d'emails
└── src/modules/auth/
    ├── auth.service.ts       # Logique de reset password
    └── auth.controller.ts    # Endpoints forgot/reset

frontend/
├── src/pages/
│   ├── ForgotPasswordPage.vue       # Demande de reset
│   ├── ResetPasswordPage.vue        # Nouveau mot de passe
│   └── admin/
│       └── SmtpSettingsPage.vue     # Config SMTP admin
└── src/router/index.ts              # Routes
```

### Modèles Prisma

```prisma
model SmtpConfig {
  id        String   @id @default(uuid())
  host      String
  port      Int
  secure    Boolean  @default(true)
  username  String
  password  String   // ⚠️ TODO: Chiffrer avec vault
  fromEmail String
  fromName  String?
  active    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    // Token hashé pour sécurité
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## ✅ Checklist de déploiement

Avant de passer en production :

- [ ] Chiffrer les mots de passe SMTP avec le vault
- [ ] Configurer un serveur SMTP de production
- [ ] Tester l'envoi d'emails en production
- [ ] Configurer le rate limiting sur `/forgot-password`
- [ ] Personnaliser le template HTML des emails
- [ ] Ajouter le logo de l'organisation dans les emails
- [ ] Vérifier que les emails ne tombent pas en spam
- [ ] Configurer SPF/DKIM/DMARC pour le domaine
- [ ] Documenter la procédure pour l'équipe

---

**Dernière mise à jour** : 2 octobre 2025  
**Version** : 1.0.0
