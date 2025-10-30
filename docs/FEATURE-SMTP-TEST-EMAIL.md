# Fonctionnalité : Email de test SMTP automatique

## 📋 Vue d'ensemble

Lors de l'enregistrement, de la mise à jour ou de l'activation d'une configuration SMTP, le système envoie automatiquement un email de test pour vérifier que la configuration fonctionne correctement.

## ✨ Fonctionnalités

### 1. Email de test automatique

L'email de test est envoyé automatiquement dans les cas suivants :

- **Création** d'une nouvelle configuration SMTP active
- **Mise à jour** d'une configuration SMTP active
- **Activation** d'une configuration SMTP existante

### 2. Destinataire de l'email de test

L'email de test est envoyé à l'adresse email définie comme **adresse d'expédition** (`fromEmail`) de la configuration SMTP. Cela permet de vérifier que :

- La configuration SMTP fonctionne
- L'adresse d'expédition est valide
- Les emails peuvent être envoyés et reçus

### 3. Contenu de l'email de test

L'email de test contient :

- ✅ Un message de confirmation que la configuration fonctionne
- Les détails de la configuration (serveur, port, sécurité, utilisateur)
- La date et l'heure de l'envoi
- Un design professionnel avec version HTML et texte

## 🔧 Implémentation technique

### Backend

#### 1. Nouvelle méthode dans `EmailService`

**Fichier :** `backend/src/modules/email/email.service.ts`

```typescript
static async sendTestEmail(
  config: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    fromName?: string;
  },
  recipientEmail: string
): Promise<void>
```

Cette méthode :

- Crée un transporteur nodemailer avec la configuration fournie
- Génère un email de test au format HTML et texte
- Envoie l'email au destinataire spécifié
- Log le succès de l'envoi

#### 2. Modifications dans `SmtpService`

**Fichier :** `backend/src/modules/smtp/smtp.service.ts`

Les méthodes suivantes ont été modifiées pour envoyer automatiquement un email de test :

##### `createConfig()`

```typescript
// Envoyer un email de test si la configuration est active
if (config.active) {
  try {
    await EmailService.sendTestEmail({ ... }, config.fromEmail);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de test:", error);
  }
}
```

##### `updateConfig()`

```typescript
// Envoyer un email de test si la configuration est active
if (config.active) {
  try {
    await EmailService.sendTestEmail({ ... }, config.fromEmail);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de test:", error);
  }
}
```

##### `activateConfig()`

```typescript
// Envoyer un email de test lors de l'activation
try {
  await EmailService.sendTestEmail({ ... }, config.fromEmail);
} catch (error) {
  console.error("Erreur lors de l'envoi de l'email de test:", error);
}
```

## 🎯 Comportement

### Succès

1. L'utilisateur enregistre ou active une configuration SMTP
2. La configuration est sauvegardée dans la base de données
3. Un email de test est envoyé automatiquement
4. L'utilisateur reçoit l'email de confirmation
5. La configuration est validée comme fonctionnelle

### Gestion des erreurs

- Si l'envoi de l'email de test échoue, **l'erreur est loggée** mais **ne bloque pas** l'enregistrement de la configuration
- Cela permet de sauvegarder la configuration même si l'email de test ne peut pas être envoyé
- L'utilisateur peut ensuite utiliser le bouton "Tester la connexion" pour diagnostiquer le problème

## 💡 Avantages

1. **Validation immédiate** : L'utilisateur sait immédiatement si sa configuration fonctionne
2. **Réduction des erreurs** : Détecte rapidement les problèmes de configuration
3. **Confiance** : L'utilisateur est assuré que les emails seront bien envoyés
4. **Diagnostic** : Fournit des informations détaillées sur la configuration testée
5. **Expérience utilisateur** : Feedback instantané et automatique

## 📧 Format de l'email de test

### Objet

```
✅ Test de configuration SMTP - OSINTReport
```

### Contenu HTML

- En-tête vert avec icône de validation
- Message de félicitations
- Détails de la configuration (serveur, port, sécurité, utilisateur)
- Footer avec date/heure et copyright

### Contenu texte

Version texte brut pour les clients email qui ne supportent pas le HTML

## 🔍 Points techniques importants

1. **Non-bloquant** : L'échec de l'email de test n'empêche pas la sauvegarde de la configuration
2. **Logging** : Tous les envois (succès et échecs) sont loggés pour faciliter le débogage
3. **Sécurité** : Le mot de passe SMTP n'est jamais retourné dans les réponses API
4. **Destinataire** : L'email est envoyé à `fromEmail` pour vérifier que cette adresse est valide et accessible

## 🚀 Utilisation

### Via l'interface d'administration

1. Aller dans **Paramètres système** > **Configuration SMTP**
2. Remplir le formulaire avec les détails SMTP
3. Cocher "Configuration active" si vous souhaitez l'activer immédiatement
4. Cliquer sur "Enregistrer"
5. ✅ Un email de test sera automatiquement envoyé à l'adresse d'expédition configurée

### Via l'API

```bash
# Créer une configuration SMTP active
POST /api/smtp/config
{
  "host": "smtp.example.com",
  "port": 587,
  "secure": false,
  "username": "user@example.com",
  "password": "secret",
  "fromEmail": "noreply@example.com",
  "fromName": "OSINTReport",
  "active": true
}
# → Email de test envoyé automatiquement

# Activer une configuration existante
POST /api/smtp/config/:id/activate
# → Email de test envoyé automatiquement
```

## 📊 Logs

Les logs incluent :

- Succès de l'envoi avec destinataire et serveur SMTP
- Erreurs d'envoi avec détails de l'exception
- Informations de débogage pour diagnostiquer les problèmes

Exemple de log :

```
INFO: Email de test SMTP envoyé avec succès
  to: noreply@example.com
  host: smtp.example.com
```

## ✅ Tests manuels effectués

- [x] Création d'une configuration SMTP active → Email de test reçu
- [x] Mise à jour d'une configuration SMTP active → Email de test reçu
- [x] Activation d'une configuration SMTP → Email de test reçu
- [x] Création d'une configuration SMTP inactive → Pas d'email de test
- [x] Gestion des erreurs SMTP → Configuration sauvegardée malgré l'échec
- [x] Compilation TypeScript → Aucune erreur

## 📝 Notes

- L'email de test utilise la même méthode de transport que les emails de production
- Le design de l'email est cohérent avec celui des autres emails système (réinitialisation de mot de passe)
- La fonctionnalité est compatible avec tous les serveurs SMTP standards
- Aucune modification de la base de données n'a été nécessaire

---

**Date de mise en œuvre :** 30 octobre 2025
**Status :** ✅ Implémenté et testé
