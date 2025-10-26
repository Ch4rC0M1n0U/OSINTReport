# Correctif - Erreur 400 "Données invalides" lors de la Sauvegarde des Paramètres

## Problème Identifié

**Erreur** : `PUT /api/settings 400 (Bad Request)` avec message "Données invalides"

**Cause Racine** :

- Le schéma de validation Zod était trop strict
- Les chaînes vides `""` des champs de formulaire vides étaient rejetées
- Zod attendait soit une valeur valide, soit `null`, mais pas `""`

## Modifications Apportées

### 1. Backend - Schéma de Validation Assoupli

**Fichier** : `backend/src/modules/settings/settings.controller.ts`

**Lignes modifiées** :

```typescript
// Avant (strict)
maintenanceMessage: z.string().max(500).nullable().optional(),
maintenanceScheduledAt: z.string().datetime().nullable().optional(),
teamsWebhookUrl: z.string().url().nullable().optional(),

// Après (accepte les chaînes vides)
maintenanceMessage: z.string().max(500).or(z.literal('')).nullable().optional(),
maintenanceScheduledAt: z.string().datetime().or(z.literal('')).nullable().optional(),
teamsWebhookUrl: z.string().url().or(z.literal('')).nullable().optional(),
```

**Pourquoi** : `.or(z.literal(''))` permet d'accepter explicitement les chaînes vides qui seront ensuite converties en `null`.

### 2. Backend - Nettoyage des Données

**Fichier** : `backend/src/modules/settings/settings.controller.ts`

**Fonction `updateSettings` améliorée** :

```typescript
// Nettoyer les chaînes vides et convertir les dates
const data: any = { ...validatedData };

// Convertir maintenanceScheduledAt en Date si présent et non vide
if (
  validatedData.maintenanceScheduledAt &&
  validatedData.maintenanceScheduledAt !== ""
) {
  data.maintenanceScheduledAt = new Date(validatedData.maintenanceScheduledAt);
} else {
  data.maintenanceScheduledAt = null;
}

// Convertir les chaînes vides en null pour les champs optionnels
if (validatedData.maintenanceMessage === "") {
  data.maintenanceMessage = null;
}
if (validatedData.teamsWebhookUrl === "") {
  data.teamsWebhookUrl = null;
}
```

**Pourquoi** : Assure que les chaînes vides sont toujours converties en `null` avant sauvegarde en base de données.

### 3. Frontend - Nettoyage des Payloads

**Fichier** : `frontend/src/pages/admin/AdminSettingsPage.vue`

**Fonction `saveGeneralSettings`** :

```typescript
// Préparer les données en nettoyant les valeurs vides
const payload = {
  maintenanceEnabled: generalSettings.value.maintenanceEnabled,
  maintenanceMessage: generalSettings.value.maintenanceMessage || null,
  maintenanceScheduledAt: generalSettings.value.maintenanceScheduledAt || null,
  lockUserCreation: generalSettings.value.lockUserCreation,
};

console.log("Envoi des paramètres généraux:", payload);
```

**Fonction `saveNotificationSettings`** :

```typescript
// Préparer les données en nettoyant les valeurs vides
const payload = {
  criticalAlertsEnabled: notificationSettings.value.criticalAlertsEnabled,
  teamsWebhookUrl: notificationSettings.value.teamsWebhookUrl || null,
  teamsNotificationsEnabled:
    notificationSettings.value.teamsNotificationsEnabled,
};

console.log("Envoi des paramètres de notification:", payload);
```

**Pourquoi** : Convertit explicitement les chaînes vides en `null` avant l'envoi, et ajoute du logging pour faciliter le débogage.

### 4. Frontend - Meilleurs Messages d'Erreur

**Fichier** : `frontend/src/pages/admin/AdminSettingsPage.vue`

**Affichage détaillé des erreurs de validation** :

```typescript
if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
  const errorMessages = error.response.data.errors
    .map((e: any) => `${e.path?.join(".")}: ${e.message}`)
    .join(", ");
  errorText = `Validation échouée: ${errorMessages}`;
} else if (error.response?.data?.message) {
  errorText = error.response.data.message;
}
```

**Pourquoi** : Permet de voir exactement quel champ et quelle validation a échoué.

## Test de la Correction

### Scénario 1 : Mode Maintenance sans Date

**Action** :

1. Activer "Maintenance programmée"
2. Ne pas remplir la date
3. Cliquer "Enregistrer"

**Résultat Attendu** : ✅ Sauvegarde réussie avec `maintenanceScheduledAt: null`

### Scénario 2 : Mode Maintenance avec Date

**Action** :

1. Activer "Maintenance programmée"
2. Remplir la date et l'heure
3. Cliquer "Enregistrer"

**Résultat Attendu** : ✅ Sauvegarde réussie avec date en format ISO 8601

### Scénario 3 : Notifications Teams sans URL

**Action** :

1. Activer "Notifications Microsoft Teams"
2. Laisser le champ URL vide
3. Cliquer "Mettre à jour"

**Résultat Attendu** : ✅ Sauvegarde réussie avec `teamsWebhookUrl: null`

### Scénario 4 : Notifications Teams avec URL Invalide

**Action** :

1. Activer "Notifications Microsoft Teams"
2. Saisir une URL invalide (ex: "test")
3. Cliquer "Mettre à jour"

**Résultat Attendu** : ❌ Erreur de validation affichée avec détails

## Vérification Post-Correctif

### Console Navigateur

Vérifiez que vous voyez les logs :

```
Envoi des paramètres généraux: {maintenanceEnabled: true, ...}
```

### Base de Données

Vérifiez que les valeurs sont correctement sauvegardées :

```sql
SELECT maintenanceEnabled, maintenanceMessage, maintenanceScheduledAt, lockUserCreation
FROM "SystemSettings";
```

**Valeurs attendues** :

- `maintenanceEnabled`: `true` ou `false`
- `maintenanceMessage`: `NULL` ou texte
- `maintenanceScheduledAt`: `NULL` ou timestamp
- `lockUserCreation`: `true` ou `false`

## Débogage

Si le problème persiste :

1. **Ouvrez la console développeur** (F12)
2. **Vérifiez les logs** : Recherchez "Envoi des paramètres généraux"
3. **Vérifiez la requête réseau** : Onglet Network → PUT /api/settings
4. **Regardez la réponse** : Onglet Response pour voir l'erreur exacte
5. **Consultez** : `docs/TROUBLESHOOTING-SETTINGS-VALIDATION.md`

## Impact des Modifications

### Fichiers Modifiés

- ✅ `backend/src/modules/settings/settings.controller.ts` (schéma + logique)
- ✅ `frontend/src/pages/admin/AdminSettingsPage.vue` (2 fonctions + affichage erreurs)

### Fichiers Créés

- ✅ `docs/TROUBLESHOOTING-SETTINGS-VALIDATION.md` (guide de dépannage complet)
- ✅ `docs/BUGFIX-SETTINGS-VALIDATION.md` (ce document)

### Rétrocompatibilité

- ✅ Aucun impact sur les données existantes
- ✅ Aucun changement de schema Prisma requis
- ✅ Compatible avec les anciennes valeurs en base

## Leçons Apprises

### 1. Validation Stricte vs Pratique

**Problème** : Zod était trop strict pour gérer les formulaires HTML standard

**Solution** : Accepter les chaînes vides et les nettoyer ensuite

**Best Practice** : Utiliser `.or(z.literal(''))` pour les champs de formulaire optionnels

### 2. Double Nettoyage

**Approche** : Nettoyer à la fois frontend et backend

**Avantage** :

- Frontend : Envoie des données propres
- Backend : Sécurité supplémentaire

**Best Practice** : Ne jamais faire confiance aux données frontend, toujours valider côté serveur

### 3. Messages d'Erreur Explicites

**Problème** : Message générique "Données invalides" peu utile

**Solution** : Afficher les détails de validation Zod

**Best Practice** : Logger les payloads pour faciliter le débogage

## Prévention Future

Pour éviter ce type de problème à l'avenir :

1. **Tester avec des champs vides** lors de la création de formulaires
2. **Logger les payloads** avant envoi API
3. **Afficher les erreurs de validation** détaillées
4. **Utiliser `.or(z.literal(''))` systématiquement** pour les champs optionnels de formulaires

## Statut

✅ **CORRIGÉ** - La sauvegarde des paramètres d'administration fonctionne maintenant correctement.

Les utilisateurs peuvent :

- Activer/désactiver le mode maintenance
- Ajouter ou non une date de maintenance
- Activer/désactiver les notifications Teams
- Ajouter ou non une URL de webhook

Tous les cas sont gérés correctement avec des messages d'erreur explicites en cas de problème.
