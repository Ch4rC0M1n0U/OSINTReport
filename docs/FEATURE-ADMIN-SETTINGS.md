# Fonctionnalité : Paramètres d'Administration

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de gérer les paramètres globaux de la plateforme OSINT, incluant le mode maintenance, le verrouillage de création de comptes, et les notifications Microsoft Teams.

## Fonctionnalités implémentées

### 1. Paramètres Généraux

#### Mode Maintenance Programmée

- **Activation/désactivation** : Toggle pour activer le mode maintenance
- **Message personnalisé** : Message affiché aux utilisateurs pendant la maintenance
- **Date/heure planifiée** : Permet de définir quand la maintenance aura lieu
- **Accès administrateur** : Les administrateurs peuvent toujours accéder au site
- **Bannière d'avertissement** : Bannière jaune affichée en haut du site pour rappeler aux admins que le mode maintenance est activé

**Comportement** :

- Lorsque activé, les utilisateurs non-administrateurs ne peuvent plus accéder au site
- Code HTTP 503 (Service Unavailable) retourné aux non-admins
- Message personnalisé affiché aux utilisateurs
- Les routes publiques (login, health check) restent accessibles

#### Verrouillage de Création de Comptes

- **Activation/désactivation** : Toggle pour verrouiller la création de nouveaux comptes
- **Restriction** : Seuls les administrateurs peuvent inviter de nouveaux utilisateurs
- **Indicateur visuel** : Bannière bleue pour rappeler aux admins que la création est verrouillée

**Comportement** :

- L'indicateur s'affiche sur la page d'inscription (à implémenter côté frontend)
- Les administrateurs voient une bannière bleue dans l'interface

### 2. Notifications

#### Alertes Critiques

- **Activation/désactivation** : Toggle pour activer les alertes critiques par email
- **Usage** : Envoie un email aux responsables lors d'incidents majeurs

#### Notifications Microsoft Teams

- **Activation/désactivation** : Toggle pour activer les notifications Teams
- **URL du webhook** : Champ pour saisir l'URL du webhook Microsoft Teams
- **Test de connexion** : Bouton pour tester le webhook
- **Lien d'aide** : Documentation Microsoft sur la création de webhooks

**Pourquoi Microsoft Teams plutôt que Slack ?**

- ✅ **Pas besoin d'accès Azure Console** : Les webhooks Teams peuvent être créés directement depuis un canal Teams
- ✅ **Simple à configurer** : Aucune application ou permission Azure requise
- ✅ **Gratuit** : Fonctionne avec la version gratuite de Teams
- ✅ **Compatible** : Fonctionne même dans des environnements d'entreprise verrouillés

**Comment créer un webhook Teams :**

1. Ouvrir Microsoft Teams
2. Accéder au canal souhaité
3. Cliquer sur "••• Plus d'options" → "Connecteurs"
4. Rechercher "Incoming Webhook"
5. Configurer le webhook et copier l'URL
6. Coller l'URL dans les paramètres OSINT Report

## Modifications de la Base de Données

### Schema Prisma - SystemSettings

Ajout de nouveaux champs au modèle `SystemSettings` :

```prisma
model SystemSettings {
  // ... champs existants ...

  // Paramètres généraux d'administration
  maintenanceEnabled    Boolean   @default(false)
  maintenanceMessage    String?
  maintenanceScheduledAt DateTime?
  lockUserCreation      Boolean   @default(false)

  // Notifications
  criticalAlertsEnabled Boolean   @default(true)
  teamsWebhookUrl       String?
  teamsNotificationsEnabled Boolean @default(false)
}
```

## Architecture Backend

### 1. Middleware de Maintenance

**`backend/src/middleware/maintenance.ts`**

Middleware qui vérifie à chaque requête si le mode maintenance est activé :

- ✅ Laisse passer les routes publiques (login, health, maintenance-status)
- ✅ Laisse passer les administrateurs
- ❌ Bloque les utilisateurs non-admin avec code HTTP 503

### 2. Service de Notifications Teams

**`backend/src/modules/notifications/teams.service.ts`**

Service pour envoyer des notifications via Microsoft Teams :

```typescript
// Envoyer une notification simple
await TeamsNotificationService.send({
  title: "Titre",
  message: "Message",
  severity: "info" | "warning" | "error" | "success",
  facts: [{ name: "Détail", value: "Valeur" }],
});

// Envoyer une alerte critique
await TeamsNotificationService.sendCriticalAlert("Titre", "Message", {
  Utilisateur: "admin@example.com",
});

// Tester le webhook
await TeamsNotificationService.testWebhook(webhookUrl);
```

**Format des messages** : MessageCard (compatible Teams)

### 3. Contrôleur et Routes

**Routes ajoutées** :

- `GET /api/settings/maintenance-status` (public) - Vérifier le statut de maintenance
- `POST /api/settings/teams/test` (admin) - Tester le webhook Teams

**Contrôleur mis à jour** :

- `SettingsController.getMaintenanceStatus()` - Retourne l'état de maintenance
- `SettingsController.testTeamsWebhook()` - Teste le webhook Teams

### 4. Application

**`backend/src/app.ts`**

Le middleware de maintenance est appliqué globalement :

```typescript
// Middleware de vérification du mode maintenance
app.use(checkMaintenanceMode);

app.use("/api", router);
```

## Architecture Frontend

### 1. Page d'Administration

**`frontend/src/pages/admin/AdminSettingsPage.vue`**

Interface complète pour gérer tous les paramètres :

**État réactif** :

```typescript
const generalSettings = ref({
  maintenanceEnabled: false,
  maintenanceMessage: "",
  maintenanceScheduledAt: null,
  lockUserCreation: false,
});

const notificationSettings = ref({
  criticalAlertsEnabled: true,
  teamsWebhookUrl: "",
  teamsNotificationsEnabled: false,
});
```

**Fonctions** :

- `loadSettings()` - Charge les paramètres depuis l'API
- `saveGeneralSettings()` - Sauvegarde les paramètres généraux
- `saveNotificationSettings()` - Sauvegarde les paramètres de notification
- `testTeamsWebhook()` - Teste le webhook Teams

### 2. Bannières dans AppShell

**`frontend/src/components/layout/AppShell.vue`**

Deux bannières conditionnelles affichées uniquement aux administrateurs :

**Bannière de Maintenance (jaune)** :

- Affichée quand `maintenanceEnabled = true`
- Contient : icône d'avertissement, message, date/heure, bouton "Gérer"
- Rappelle à l'admin de désactiver la maintenance

**Bannière de Verrouillage (bleue)** :

- Affichée quand `lockUserCreation = true`
- Contient : icône de cadenas, message informatif
- Rappelle que la création de comptes est verrouillée

**Vérification du statut** :

```typescript
// Au chargement de AppShell
async function checkMaintenanceStatus() {
  const response = await api.get("/settings/maintenance-status");
  maintenanceStatus.value = response.data;
}
```

## Flux de Données

### Activation du Mode Maintenance

1. **Admin** accède à `/admin/settings`
2. **Admin** active "Maintenance programmée"
3. **Admin** saisit un message et une date (optionnel)
4. **Admin** clique sur "Enregistrer"
5. **Frontend** envoie `PUT /api/settings` avec `maintenanceEnabled: true`
6. **Backend** met à jour `SystemSettings` dans la DB
7. **Middleware** commence à bloquer les non-admins
8. **Bannière** s'affiche pour rappeler aux admins

### Envoi de Notification Teams

1. **Admin** configure l'URL du webhook
2. **Admin** active les notifications Teams
3. **Admin** clique sur "Tester"
4. **Frontend** envoie `POST /api/settings/teams/test`
5. **Backend** utilise `TeamsNotificationService.testWebhook()`
6. **Teams** reçoit une notification de test
7. **Admin** vérifie le canal Teams
8. **Admin** sauvegarde les paramètres

### Vérification du Statut de Maintenance

1. **AppShell** se charge
2. **Frontend** appelle `GET /api/settings/maintenance-status`
3. **Backend** retourne :
   ```json
   {
     "maintenanceEnabled": true,
     "maintenanceMessage": "Maintenance prévue...",
     "maintenanceScheduledAt": "2025-10-26T22:00:00Z",
     "lockUserCreation": false
   }
   ```
4. **Frontend** affiche les bannières selon les valeurs

## Cas d'Usage

### Scénario 1 : Maintenance Planifiée

**Contexte** : L'administrateur doit effectuer une mise à jour critique le weekend

**Actions** :

1. Vendredi 17h : Admin active le mode maintenance avec date = Samedi 10h
2. Samedi 9h45 : Admin se connecte (bannière jaune visible)
3. Samedi 10h : Mode maintenance bloque les utilisateurs normaux
4. Samedi 10h-12h : Admin effectue la mise à jour
5. Samedi 12h : Admin désactive le mode maintenance
6. Utilisateurs peuvent à nouveau accéder au site

### Scénario 2 : Incident de Sécurité

**Contexte** : Un compte suspect a été détecté

**Actions** :

1. Admin active le verrouillage de création de comptes
2. Bannière bleue s'affiche
3. Page d'inscription affiche un message (à implémenter)
4. Seuls les admins peuvent inviter de nouveaux utilisateurs
5. Une fois la situation résolue, admin désactive le verrouillage

### Scénario 3 : Alertes Teams

**Contexte** : L'équipe souhaite recevoir des notifications sur un canal Teams

**Actions** :

1. Admin crée un webhook dans Teams
2. Admin colle l'URL dans les paramètres
3. Admin clique sur "Tester"
4. Teams reçoit : "🔔 Test de connexion - Si vous voyez ce message..."
5. Admin active les notifications Teams
6. Admin sauvegarde
7. Dès maintenant, les alertes critiques sont envoyées sur Teams

## Tests

### Test du Mode Maintenance

```bash
# 1. Activer le mode maintenance via l'interface admin
# 2. Se déconnecter
# 3. Essayer de se connecter avec un compte non-admin
# Résultat attendu : Accès refusé avec message de maintenance

# 4. Se connecter avec un compte admin
# Résultat attendu : Accès autorisé avec bannière jaune visible

# 5. Désactiver le mode maintenance
# 6. Se connecter avec un compte non-admin
# Résultat attendu : Accès normal sans restriction
```

### Test des Notifications Teams

```bash
# 1. Créer un webhook Teams (voir documentation Microsoft)
# 2. Copier l'URL du webhook
# 3. Dans /admin/settings, coller l'URL
# 4. Cliquer sur "Tester"
# Résultat attendu : Message de test visible dans le canal Teams

# 5. Activer les notifications Teams
# 6. Sauvegarder
# 7. Déclencher une alerte critique (à implémenter dans le code)
# Résultat attendu : Notification sur Teams
```

## Sécurité

### Contrôle d'Accès

- ✅ Seuls les administrateurs peuvent modifier les paramètres
- ✅ Permission `SYSTEM_SETTINGS` requise
- ✅ Middleware `requireAuth` + `requirePermissions`

### Protection des Données

- ✅ Webhook URL stocké en texte brut (non sensible, URL publique à usage unique)
- ✅ Validation de l'URL avant sauvegarde
- ✅ Test de connexion avant activation

### Résilience

- ✅ En cas d'erreur du middleware maintenance, le site reste accessible
- ✅ Logs détaillés des actions administratives
- ✅ Route de health check toujours accessible

## Améliorations Futures

- [ ] Planification automatique de maintenance (activer/désactiver à une date précise)
- [ ] Historique des maintenances
- [ ] Templates de messages de maintenance prédéfinis
- [ ] Notifications par email lors de l'activation du mode maintenance
- [ ] Statistiques d'utilisation des notifications Teams
- [ ] Support de plusieurs webhooks Teams (par type d'alerte)
- [ ] Interface de gestion des alertes critiques
- [ ] Logs d'audit pour toutes les modifications de paramètres
- [ ] Export des paramètres en JSON
- [ ] Import/export de configurations

## Dépannage

### Le mode maintenance ne bloque pas les utilisateurs

**Vérification** :

1. Vérifier que `maintenanceEnabled = true` dans la base de données
2. Vérifier les logs backend pour voir si le middleware est appelé
3. Vérifier que l'utilisateur n'est pas administrateur
4. Vérifier que la route n'est pas dans la liste des routes publiques

### Les notifications Teams ne fonctionnent pas

**Vérification** :

1. Vérifier que l'URL du webhook est correcte
2. Vérifier que le webhook n'a pas été supprimé dans Teams
3. Vérifier les logs backend pour voir les erreurs
4. Utiliser le bouton "Tester" pour diagnostiquer
5. Vérifier que Teams accepte les requêtes (pas de blocage firewall)

### La bannière ne s'affiche pas

**Vérification** :

1. Vérifier que l'utilisateur est administrateur
2. Vérifier que `AppShell.vue` charge bien le statut de maintenance
3. Ouvrir la console navigateur pour voir les erreurs
4. Vérifier que l'API `/settings/maintenance-status` répond

## Documentation Microsoft Teams

- [Créer un webhook Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Format MessageCard](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference)
- [Webhooks Teams - Guide complet](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/what-are-webhooks-and-connectors)

## Conclusion

Cette fonctionnalité offre aux administrateurs un contrôle total sur la disponibilité du site et les notifications critiques, tout en restant simple à utiliser et sécurisée. L'intégration avec Microsoft Teams permet une communication efficace sans nécessiter d'accès à Azure Console, ce qui est idéal pour les organisations avec des restrictions d'accès.
