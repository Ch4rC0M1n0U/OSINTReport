# Guide de Dépannage - Erreur "Données invalides" lors de la Sauvegarde des Paramètres

## Problème Rencontré

**Erreur** : `PUT /api/settings 400 (Bad Request)` avec message "Données invalides"

**Cause** : La validation Zod côté backend rejette les données envoyées par le frontend.

## Solution Appliquée

### 1. Modification du Schéma de Validation Backend

**Fichier** : `backend/src/modules/settings/settings.controller.ts`

**Problème** :

- Zod validait strictement `z.string().datetime()` et `z.string().url()`
- Les chaînes vides `""` étaient rejetées au lieu d'être converties en `null`

**Solution** :

```typescript
// Avant
maintenanceMessage: z.string().max(500).nullable().optional(),
maintenanceScheduledAt: z.string().datetime().nullable().optional(),
teamsWebhookUrl: z.string().url().nullable().optional(),

// Après
maintenanceMessage: z.string().max(500).or(z.literal('')).nullable().optional(),
maintenanceScheduledAt: z.string().datetime().or(z.literal('')).nullable().optional(),
teamsWebhookUrl: z.string().url().or(z.literal('')).nullable().optional(),
```

**Explication** : `.or(z.literal(''))` permet d'accepter une chaîne vide en plus de la validation normale.

### 2. Nettoyage des Données dans le Contrôleur

**Fichier** : `backend/src/modules/settings/settings.controller.ts`

**Ajout de logique de nettoyage** :

```typescript
// Convertir les chaînes vides en null pour les champs optionnels
if (validatedData.maintenanceMessage === "") {
  data.maintenanceMessage = null;
}
if (validatedData.teamsWebhookUrl === "") {
  data.teamsWebhookUrl = null;
}

// Convertir maintenanceScheduledAt en Date si présent et non vide
if (
  validatedData.maintenanceScheduledAt &&
  validatedData.maintenanceScheduledAt !== ""
) {
  data.maintenanceScheduledAt = new Date(validatedData.maintenanceScheduledAt);
} else {
  data.maintenanceScheduledAt = null;
}
```

### 3. Nettoyage des Données Frontend

**Fichier** : `frontend/src/pages/admin/AdminSettingsPage.vue`

**Amélioration de la préparation des données** :

```typescript
// Préparer les données en nettoyant les valeurs vides
const payload = {
  maintenanceEnabled: generalSettings.value.maintenanceEnabled,
  maintenanceMessage: generalSettings.value.maintenanceMessage || null,
  maintenanceScheduledAt: generalSettings.value.maintenanceScheduledAt || null,
  lockUserCreation: generalSettings.value.lockUserCreation,
};
```

**Ajout de logging pour le débogage** :

```typescript
console.log("Envoi des paramètres généraux:", payload);
```

### 4. Meilleur Affichage des Erreurs

**Ajout de gestion détaillée des erreurs de validation** :

```typescript
if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
  const errorMessages = error.response.data.errors
    .map((e: any) => `${e.path?.join(".")}: ${e.message}`)
    .join(", ");
  errorText = `Validation échouée: ${errorMessages}`;
}
```

## Comment Déboguer Ce Type d'Erreur

### 1. Vérifier la Console du Navigateur

Ouvrez la console développeur (F12) et regardez les logs :

```javascript
console.log("Envoi des paramètres généraux:", payload);
```

**Vérifiez** :

- Les valeurs `null` vs `""` (chaînes vides)
- Le format des dates (doit être ISO 8601: `2025-10-26T22:00:00.000Z`)
- Les URLs (doivent commencer par `http://` ou `https://`)

### 2. Vérifier la Réponse du Serveur

Dans l'onglet "Réseau" (Network) de la console :

1. Cherchez la requête `PUT /api/settings`
2. Cliquez dessus
3. Regardez l'onglet "Réponse" (Response)

**Exemple de réponse d'erreur** :

```json
{
  "message": "Données invalides",
  "errors": [
    {
      "code": "invalid_string",
      "validation": "datetime",
      "path": ["maintenanceScheduledAt"],
      "message": "Invalid datetime"
    }
  ]
}
```

### 3. Vérifier les Logs Backend

Dans le terminal du backend, recherchez :

```
Erreur mise à jour paramètres
```

Les logs devraient afficher les détails de l'erreur Zod.

### 4. Tester avec cURL

Pour isoler le problème, testez directement l'API :

```bash
curl -X PUT http://localhost:4000/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=..." \
  -d '{
    "maintenanceEnabled": true,
    "maintenanceMessage": "Test",
    "maintenanceScheduledAt": null,
    "lockUserCreation": false
  }'
```

## Erreurs Courantes et Solutions

### Erreur : "Invalid datetime"

**Cause** : Format de date invalide

**Solutions** :

- Assurez-vous que le champ `<input type="datetime-local">` retourne une date valide
- Vérifiez que la date est au format ISO 8601
- Envoyez `null` au lieu d'une chaîne vide si pas de date

**Exemple de conversion** :

```typescript
// Frontend - Convertir datetime-local en ISO
const dateInput = "2025-10-26T22:00"; // Format datetime-local
const isoDate = new Date(dateInput).toISOString(); // "2025-10-26T22:00:00.000Z"
```

### Erreur : "Invalid url"

**Cause** : URL invalide ou chaîne vide

**Solutions** :

- Vérifiez que l'URL commence par `http://` ou `https://`
- Envoyez `null` au lieu d'une chaîne vide si pas d'URL
- Validez l'URL côté frontend avant l'envoi

**Validation frontend** :

```typescript
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Erreur : "Expected boolean, received string"

**Cause** : Les toggles retournent des chaînes au lieu de booléens

**Solution** :

```typescript
// Forcer la conversion en booléen
const payload = {
  maintenanceEnabled: Boolean(generalSettings.value.maintenanceEnabled),
  lockUserCreation: Boolean(generalSettings.value.lockUserCreation),
};
```

## Checklist de Vérification

Avant de sauvegarder les paramètres :

- [ ] **Chaînes vides** : Convertir en `null` pour les champs optionnels
- [ ] **Dates** : Format ISO 8601 ou `null`
- [ ] **URLs** : Format valide avec protocole ou `null`
- [ ] **Booléens** : Pas de chaînes `"true"` ou `"false"`
- [ ] **Nombres** : Pas de chaînes `"123"` au lieu de `123`

## Commandes Utiles

### Voir les erreurs de validation en détail

```bash
# Backend logs avec niveau debug
LOG_LEVEL=debug npm run dev
```

### Tester la validation Zod

```typescript
// Dans un fichier de test
const result = updateSettingsSchema.safeParse({
  maintenanceEnabled: true,
  maintenanceMessage: "",
  maintenanceScheduledAt: "",
});

if (!result.success) {
  console.log(result.error.issues);
}
```

## Prévention Future

### 1. Validation Frontend

Ajoutez des validations côté frontend avant l'envoi :

```typescript
function validateGeneralSettings() {
  const errors: string[] = [];

  if (generalSettings.value.maintenanceScheduledAt) {
    const date = new Date(generalSettings.value.maintenanceScheduledAt);
    if (isNaN(date.getTime())) {
      errors.push("Date de maintenance invalide");
    }
  }

  return errors;
}
```

### 2. Tests Unitaires

Créez des tests pour vérifier la validation :

```typescript
// backend/tests/settings.test.ts
describe("Settings Controller", () => {
  it("should accept empty maintenanceScheduledAt", async () => {
    const result = updateSettingsSchema.safeParse({
      maintenanceEnabled: true,
      maintenanceScheduledAt: "",
    });
    expect(result.success).toBe(true);
  });
});
```

### 3. Documentation des Formats

Documentez les formats attendus dans le code :

```typescript
const generalSettings = ref({
  maintenanceEnabled: false,
  maintenanceMessage: "", // String ou null
  maintenanceScheduledAt: null as string | null, // ISO 8601 datetime ou null
  lockUserCreation: false,
});
```

## Ressources

- [Zod Documentation](https://zod.dev/)
- [ISO 8601 DateTime Format](https://en.wikipedia.org/wiki/ISO_8601)
- [HTML datetime-local input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)

## Conclusion

Le problème a été résolu en :

1. Acceptant les chaînes vides dans le schéma Zod
2. Nettoyant les données avant sauvegarde
3. Améliorant les messages d'erreur

Si le problème persiste, vérifiez la console navigateur et les logs backend pour identifier exactement quel champ pose problème.
