# Accès au menu de configuration SMTP

## 🎯 Navigation rapide

### Menu Administration → Configuration SMTP

```
Application OSINTReport
│
├─ 📊 Tableau de bord
├─ 📄 Rapports
│
└─ 🛡️ Administration (uniquement pour les admins)
   │
   ├─ ⚙️  Réglages
   ├─ 👥 Gestion des utilisateurs  
   └─ ✉️  Configuration SMTP  ← NOUVEAU !
```

## 📸 Capture d'écran du menu

```
┌────────────────────────────────────┐
│  🏠 OSINT Report                   │
├────────────────────────────────────┤
│  📊 Tableau de bord                │
│  📄 Rapports                       │
│                                    │
│  ─────────────────────────────────│
│                                    │
│  🛡️ Administration ▼              │
│     ⚙️  Réglages                  │
│     👥 Gestion des utilisateurs    │
│     ✉️  Configuration SMTP         │ ← Cliquez ici
│                                    │
└────────────────────────────────────┘
```

## 🔑 Permissions requises

Pour voir et accéder au menu "Configuration SMTP" :

- ✅ **Permission requise** : `system:admin`
- ✅ **Rôle** : Administrateur système
- ❌ Les éditeurs et lecteurs ne verront pas ce menu

## 🚀 Accès direct par URL

Si vous êtes déjà connecté en tant qu'administrateur :

```
http://localhost:5173/admin/smtp
```

## 📋 Étapes pour accéder à la configuration

### 1. Connexion

- Allez sur http://localhost:5173
- Connectez-vous avec un compte **administrateur**
  - Email : `admin@police.belgium.eu`
  - Mot de passe : (votre mot de passe admin)

### 2. Navigation

- Dans le menu latéral gauche
- Cliquez sur **"Administration"** pour développer le sous-menu
- Cliquez sur **"Configuration SMTP"**

### 3. Configuration

Vous arrivez sur la page de gestion SMTP avec :

- 📝 **Formulaire de création** de configuration SMTP
- 📋 **Liste des configurations** existantes
- 🧪 **Bouton de test** de connexion
- ⚡ **Activation/Désactivation** rapide

## 🎨 Interface de configuration SMTP

```
╔═══════════════════════════════════════════════════════════╗
║  ✉️  Configuration SMTP                [+ Nouvelle config]║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📋 Configurations existantes                             ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Hôte         Port  Expéditeur       Statut  Actions │ ║
║  ├─────────────────────────────────────────────────────┤ ║
║  │ smtp.gmail   587   noreply@...     ✅ Active  🔧 🗑️ │ ║
║  │ smtp.office  587   alerts@...      ⚪ Inactive 🔧 🗑️│ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 🔄 Fonctionnalités disponibles

### Boutons d'action

| Icône | Action | Description |
|-------|--------|-------------|
| ✅ | Activer | Active cette configuration (désactive les autres) |
| 🔧 | Modifier | Édite la configuration |
| 🗑️ | Supprimer | Supprime la configuration |
| 🧪 | Tester | Teste la connexion SMTP |

### Formulaire de création/édition

- **Hôte SMTP** : Serveur mail (ex: smtp.gmail.com)
- **Port** : Port de connexion (587 recommandé)
- **Nom d'utilisateur** : Login du compte SMTP
- **Mot de passe** : Mot de passe ou app password
- **Email expéditeur** : Adresse email d'envoi
- **Nom expéditeur** : Nom affiché (optionnel)
- **Connexion sécurisée** : Active SSL/TLS
- **Configuration active** : Active automatiquement

## ✨ Nouvelles fonctionnalités ajoutées

### Backend

✅ Module SMTP complet (`/backend/src/modules/smtp/`)
  - `smtp.service.ts` - Logique métier
  - `smtp.controller.ts` - API REST
  - `smtp.router.ts` - Routes Express

✅ Service d'email (`/backend/src/modules/email/email.service.ts`)
  - Intégration Nodemailer
  - Support SSL/TLS
  - Templates HTML
  - Test de connexion

✅ API endpoints (`/api/smtp/*`)
  - GET `/configs` - Liste des configs
  - POST `/config` - Créer une config
  - PUT `/config/:id` - Modifier une config
  - DELETE `/config/:id` - Supprimer une config
  - POST `/test` - Tester une connexion
  - POST `/config/:id/activate` - Activer une config

### Frontend

✅ Page d'administration SMTP
  - Interface moderne avec DaisyUI
  - Formulaire de création/édition
  - Liste des configurations
  - Gestion multi-configs
  - Test de connexion en temps réel

✅ Intégration dans le menu
  - Nouveau lien "Configuration SMTP"
  - Visible uniquement pour les admins
  - Route protégée par permission

### Base de données

✅ Nouvelle table `SmtpConfig`
```sql
id, host, port, secure, username, password,
fromEmail, fromName, active, createdAt, updatedAt
```

✅ Table `PasswordResetToken` pour les tokens de reset
```sql
id, userId, tokenHash, expiresAt, usedAt, createdAt
```

## 🧪 Test rapide

### 1. Vérifier l'accès au menu

```bash
# Ouvrir l'application
open http://localhost:5173

# Ou avec curl
curl -s http://localhost:5173/admin/smtp
```

### 2. Tester l'API (avec authentification)

```bash
# Santé de l'API
curl http://localhost:4000/api/health

# Endpoint SMTP (nécessite auth)
curl http://localhost:4000/api/smtp/configs
# Devrait retourner : {"status":401,"message":"Authentification requise"}
```

### 3. Créer une configuration de test

1. Connectez-vous en tant qu'admin
2. Allez dans Administration → Configuration SMTP
3. Cliquez sur "Nouvelle configuration"
4. Remplissez avec vos identifiants SMTP
5. Testez la connexion
6. Enregistrez

### 4. Tester l'envoi d'email

1. Déconnectez-vous
2. Sur la page de login, cliquez "Mot de passe oublié ?"
3. Entrez votre email
4. Vérifiez la réception de l'email

## 📚 Documentation complète

Pour plus de détails, consultez :

- [Guide de configuration SMTP](/docs/smtp-configuration-guide.md)
- [Documentation API](/docs/api-reports.md)
- [Architecture](/docs/architecture.md)

## ⚠️ Notes importantes

### Sécurité

- 🔒 Les mots de passe SMTP sont actuellement **en clair** dans la DB
- 🔐 TODO : Implémenter le chiffrement avec le vault existant
- 🛡️ Seuls les admins système peuvent accéder à la config SMTP

### Production

Avant le déploiement en production :

- [ ] Chiffrer les mots de passe SMTP
- [ ] Configurer un serveur SMTP dédié
- [ ] Ajouter le rate limiting sur `/forgot-password`
- [ ] Personnaliser les templates d'emails
- [ ] Configurer SPF/DKIM/DMARC

## 🎉 Résumé

✅ **Menu "Configuration SMTP" ajouté** dans Administration  
✅ **Page de gestion complète** avec CRUD  
✅ **API backend sécurisée** avec permissions  
✅ **Tests de connexion** intégrés  
✅ **Multi-configurations** avec activation simple  
✅ **Documentation complète** disponible  

Tout est prêt pour configurer et utiliser l'envoi d'emails ! 🚀

---

**Dernière mise à jour** : 2 octobre 2025  
**Commit** : Ajout du menu Configuration SMTP dans le panel admin
