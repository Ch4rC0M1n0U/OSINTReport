# Guide Rapide : Configurer Microsoft Teams pour OSINT Report

## Pourquoi Microsoft Teams ?

✅ **Pas besoin d'accès Azure Console** - Vous pouvez créer des webhooks directement depuis Teams  
✅ **Simple et rapide** - Configuration en moins de 5 minutes  
✅ **Gratuit** - Fonctionne avec la version gratuite de Teams  
✅ **Sécurisé** - Pas besoin de créer des applications ou des permissions Azure

## Étape 1 : Créer un Webhook dans Teams

### 1.1 Ouvrir Microsoft Teams

- Lancez l'application Microsoft Teams (bureau ou web)
- Connectez-vous avec votre compte professionnel ou personnel

### 1.2 Sélectionner un Canal

- Choisissez l'équipe et le canal où vous voulez recevoir les notifications
- Exemple : Équipe "Sécurité" → Canal "Alertes OSINT"

### 1.3 Configurer le Connecteur

1. Cliquez sur **••• (Plus d'options)** à côté du nom du canal
2. Sélectionnez **Connecteurs** (ou **Connectors**)
3. Recherchez **"Incoming Webhook"**
4. Cliquez sur **Configurer** (ou **Configure**)

### 1.4 Créer le Webhook

1. Donnez un nom au webhook : `OSINT Report`
2. (Optionnel) Téléchargez une image pour l'icône
3. Cliquez sur **Créer**
4. **COPIEZ L'URL** qui apparaît (ressemble à `https://outlook.office.com/webhook/...`)
5. Cliquez sur **Terminé**

⚠️ **IMPORTANT** : Sauvegardez cette URL en lieu sûr. Vous ne pourrez plus la voir après avoir fermé la fenêtre.

## Étape 2 : Configurer OSINT Report

### 2.1 Accéder aux Paramètres

1. Connectez-vous à OSINT Report en tant qu'administrateur
2. Allez dans **Réglages d'administration**

### 2.2 Activer les Notifications Teams

1. Dans la section **Notifications**, activez le toggle **"Notifications Microsoft Teams"**
2. Collez l'URL du webhook que vous avez copiée
3. Cliquez sur **"Tester"** pour envoyer un message de test
4. Vérifiez que le message apparaît dans votre canal Teams
5. Cliquez sur **"Mettre à jour"** pour sauvegarder

## Étape 3 : Test de Fonctionnement

### Message de Test Attendu

Vous devriez voir apparaître dans Teams :

```
🔔 Test de connexion

Si vous voyez ce message, votre webhook Microsoft Teams est correctement configuré !

Application: OSINT Report
Date: [Date et heure actuelles]
```

### Si le Test Échoue

**Vérifications** :

1. ✅ L'URL du webhook est complète et correcte
2. ✅ Le webhook n'a pas été supprimé dans Teams
3. ✅ Vous avez bien accès au canal Teams
4. ✅ Pas de blocage firewall/proxy

**Réessayer** :

1. Supprimez le webhook dans Teams (Plus d'options → Connecteurs → Configurer → Supprimer)
2. Créez-en un nouveau
3. Copiez la nouvelle URL
4. Retestez

## Format des Notifications

### Alerte Critique

```
🚨 ALERTE CRITIQUE: Titre de l'alerte

Message détaillé de l'alerte

Utilisateur: admin@example.com
Heure: 26/10/2025 14:30:15
```

### Notification d'Information

```
ℹ️ Titre de la notification

Message informatif

Détail 1: Valeur 1
Détail 2: Valeur 2
```

## Exemples d'Utilisation

### 1. Alertes de Sécurité

Configurez le webhook pour recevoir des alertes en cas de :

- Tentatives de connexion suspectes
- Modifications de paramètres critiques
- Erreurs système graves

### 2. Notifications d'Activité

Recevez des notifications pour :

- Nouveaux rapports créés
- Rapports publiés
- Utilisateurs ajoutés/supprimés

### 3. Maintenance

Informez l'équipe lors de :

- Activation du mode maintenance
- Mises à jour système
- Sauvegardes effectuées

## Gestion des Webhooks

### Modifier un Webhook

1. Allez dans le canal Teams
2. Plus d'options → Connecteurs
3. Trouvez "Incoming Webhook"
4. Cliquez sur "Configurer"
5. Modifiez le nom ou l'image
6. L'URL reste la même

### Supprimer un Webhook

1. Allez dans le canal Teams
2. Plus d'options → Connecteurs
3. Trouvez "Incoming Webhook"
4. Cliquez sur "Configurer"
5. Cliquez sur "Supprimer"
6. ⚠️ Mettez à jour OSINT Report pour désactiver les notifications

### Créer Plusieurs Webhooks

Vous pouvez créer plusieurs webhooks pour différents types d'alertes :

- Webhook 1 : Alertes critiques → Canal "Sécurité"
- Webhook 2 : Notifications générales → Canal "OSINT"
- Webhook 3 : Rapports → Canal "Publications"

⚠️ **Note** : Pour l'instant, OSINT Report ne supporte qu'un seul webhook. Cette fonctionnalité sera ajoutée dans une version future.

## Sécurité

### Bonnes Pratiques

- ✅ Ne partagez jamais l'URL du webhook publiquement
- ✅ Créez un canal dédié pour les notifications OSINT
- ✅ Limitez l'accès au canal aux membres autorisés
- ✅ Utilisez des webhooks différents pour chaque environnement (dev/prod)

### Que Faire si l'URL est Compromise ?

1. Supprimez immédiatement le webhook dans Teams
2. Créez un nouveau webhook avec une nouvelle URL
3. Mettez à jour l'URL dans OSINT Report
4. Vérifiez les logs pour détecter tout usage malveillant

## Limitations

- **Débit** : Teams limite les webhooks à environ 4 messages/seconde
- **Taille** : Messages limités à 28 KB
- **Format** : Supporte uniquement MessageCard (pas Adaptive Cards pour les webhooks)

## Dépannage

### Erreur "URL invalide"

➡️ Vérifiez que l'URL commence par `https://outlook.office.com/webhook/`

### Erreur "Échec de l'envoi"

➡️ Le webhook a peut-être été supprimé. Créez-en un nouveau.

### Messages non reçus

➡️ Vérifiez que vous êtes membre du canal Teams et que les notifications sont activées.

### Caractères bizarres dans les messages

➡️ Problème d'encodage. Vérifiez que vos messages utilisent UTF-8.

## Ressources

- [Documentation officielle Microsoft](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Exemples de MessageCard](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference)
- [Playground MessageCard](https://messagecardplayground.azurewebsites.net/)

## Support

Besoin d'aide ? Contactez votre administrateur OSINT Report ou consultez la documentation complète dans `docs/FEATURE-ADMIN-SETTINGS.md`.
