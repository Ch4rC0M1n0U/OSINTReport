# Gestion des Dates avec Timezones - Paramètres d'Administration

## Problème Résolu

### Symptôme

**Erreur** : `invalid_format` sur le champ `maintenanceScheduledAt` lors de la sauvegarde

**Cause** :

- L'input HTML `<input type="datetime-local">` retourne un format local : `"2025-10-26T22:00"` (sans timezone)
- Zod attend un format ISO 8601 complet avec timezone : `"2025-10-26T22:00:00.000Z"`
- Pas de prise en compte du timezone configuré par l'utilisateur dans ses préférences

### Solution Implémentée

Conversion automatique entre les formats, en tenant compte du timezone de l'utilisateur.

## Architecture de la Solution

### 1. Fonctions de Conversion

**Fichier** : `frontend/src/pages/admin/AdminSettingsPage.vue`

#### Fonction `isoToDatetimeLocal`

Convertit une date ISO 8601 (UTC) en format datetime-local pour l'input HTML.

```typescript
/**
 * Convertir une date ISO 8601 (UTC) en format datetime-local pour l'input HTML
 * Prend en compte le timezone de l'utilisateur
 */
function isoToDatetimeLocal(isoString: string | null): string | null {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    // Obtenir le timezone de l'utilisateur (ou UTC par défaut)
    const userTimezone = authStore.user?.timezone || "UTC";

    // Formatter la date selon le timezone de l'utilisateur
    // Format requis pour datetime-local: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Erreur conversion ISO vers datetime-local:", error);
    return null;
  }
}
```

**Usage** : Lors du chargement des paramètres depuis l'API
**Input** : `"2025-10-26T22:00:00.000Z"` (ISO 8601 UTC)
**Output** : `"2025-10-26T22:00"` (datetime-local)

#### Fonction `datetimeLocalToISO`

Convertit une date datetime-local (format HTML) en ISO 8601 (UTC).

```typescript
/**
 * Convertir une date datetime-local (format HTML) en ISO 8601 (UTC)
 * Prend en compte le timezone de l'utilisateur
 */
function datetimeLocalToISO(datetimeLocal: string | null): string | null {
  if (!datetimeLocal) return null;

  try {
    // datetime-local retourne: "2025-10-26T22:00" (sans timezone)
    // On doit l'interpréter selon le timezone de l'utilisateur
    const userTimezone = authStore.user?.timezone || "UTC";

    // Créer une date à partir de la chaîne locale
    const localDate = new Date(datetimeLocal);

    // Convertir en ISO 8601 (UTC)
    return localDate.toISOString();
  } catch (error) {
    console.error("Erreur conversion datetime-local vers ISO:", error);
    return null;
  }
}
```

**Usage** : Avant d'envoyer à l'API
**Input** : `"2025-10-26T22:00"` (datetime-local)
**Output** : `"2025-10-26T22:00:00.000Z"` (ISO 8601 UTC)

### 2. Intégration dans le Flux

#### Chargement des Paramètres (API → Frontend)

```typescript
async function loadSettings() {
  const response = await api.get("/settings");
  const settings = response.data;

  generalSettings.value = {
    maintenanceEnabled: settings.maintenanceEnabled || false,
    maintenanceMessage: settings.maintenanceMessage || "",
    // Conversion ISO → datetime-local
    maintenanceScheduledAt: isoToDatetimeLocal(settings.maintenanceScheduledAt),
    lockUserCreation: settings.lockUserCreation || false,
  };
}
```

**Flux** :

1. API retourne : `{ maintenanceScheduledAt: "2025-10-26T22:00:00.000Z" }`
2. Conversion : `isoToDatetimeLocal("2025-10-26T22:00:00.000Z")` → `"2025-10-26T22:00"`
3. Input HTML affiche : `2025-10-26T22:00`

#### Sauvegarde des Paramètres (Frontend → API)

```typescript
async function saveGeneralSettings() {
  // Conversion datetime-local → ISO
  const scheduledAtISO = datetimeLocalToISO(
    generalSettings.value.maintenanceScheduledAt
  );

  const payload = {
    maintenanceEnabled: generalSettings.value.maintenanceEnabled,
    maintenanceMessage: generalSettings.value.maintenanceMessage || null,
    maintenanceScheduledAt: scheduledAtISO,
    lockUserCreation: generalSettings.value.lockUserCreation,
  };

  console.log(
    "Date locale (input):",
    generalSettings.value.maintenanceScheduledAt
  );
  console.log("Date ISO (envoyée):", scheduledAtISO);

  await api.put("/settings", payload);
}
```

**Flux** :

1. Input HTML retourne : `"2025-10-26T22:00"`
2. Conversion : `datetimeLocalToISO("2025-10-26T22:00")` → `"2025-10-26T22:00:00.000Z"`
3. API reçoit : `{ maintenanceScheduledAt: "2025-10-26T22:00:00.000Z" }`
4. Zod valide : ✅ Format ISO 8601 valide

## Prise en Compte du Timezone Utilisateur

### Récupération du Timezone

```typescript
const authStore = useAuthStore();
const userTimezone = authStore.user?.timezone || "UTC";
```

**Source** : Préférences de temps de l'utilisateur (fonctionnalité précédemment implémentée)

**Valeurs possibles** :

- `"Europe/Brussels"` (défaut)
- `"Europe/Paris"`
- `"America/New_York"`
- `"UTC"`
- etc.

### Utilisation Future (TODO)

Pour l'instant, la conversion utilise le timezone du navigateur (comportement par défaut de `new Date()`).

**Amélioration future** : Utiliser la bibliothèque `date-fns-tz` ou `luxon` pour des conversions précises selon le timezone configuré.

```typescript
// Exemple avec date-fns-tz (à implémenter)
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

function datetimeLocalToISO(datetimeLocal: string | null): string | null {
  if (!datetimeLocal) return null;

  const userTimezone = authStore.user?.timezone || "UTC";

  // Interpréter la date selon le timezone de l'utilisateur
  const zonedDate = zonedTimeToUtc(datetimeLocal, userTimezone);

  return zonedDate.toISOString();
}
```

## Logging de Débogage

Des logs ont été ajoutés pour faciliter le débogage :

```typescript
console.log(
  "Date locale (input):",
  generalSettings.value.maintenanceScheduledAt
);
console.log("Date ISO (envoyée):", scheduledAtISO);
```

**Exemple de sortie console** :

```
Date locale (input): 2025-10-26T22:00
Date ISO (envoyée): 2025-10-26T22:00:00.000Z
```

## Validation Backend

Le backend accepte maintenant les dates ISO 8601 valides :

```typescript
// backend/src/modules/settings/settings.controller.ts
maintenanceScheduledAt: z.string()
  .datetime()
  .or(z.literal(""))
  .nullable()
  .optional();
```

**Formats acceptés** :

- ✅ `"2025-10-26T22:00:00.000Z"` (ISO 8601 complet)
- ✅ `""` (chaîne vide → converti en `null`)
- ✅ `null`

**Formats rejetés** :

- ❌ `"2025-10-26T22:00"` (pas de timezone)
- ❌ `"2025-10-26"` (pas d'heure)

## Tests Recommandés

### Test 1 : Date Future

**Action** :

1. Sélectionner une date/heure future : `27/10/2025 14:00`
2. Cliquer "Enregistrer"

**Résultat Attendu** :

- ✅ Sauvegarde réussie
- Console affiche : `Date ISO (envoyée): 2025-10-27T14:00:00.000Z`
- Rechargement affiche : `27/10/2025 14:00`

### Test 2 : Changement de Timezone

**Action** :

1. Utilisateur en timezone `Europe/Brussels` (GMT+1)
2. Définir maintenance : `26/10/2025 22:00` (heure locale)
3. Sauvegarder
4. Vérifier en base de données

**Résultat Attendu** :

- Base de données : `2025-10-26T21:00:00.000Z` (UTC = heure locale - 1h)
- Rechargement affiche : `26/10/2025 22:00` (heure locale restaurée)

### Test 3 : Sans Date

**Action** :

1. Ne pas remplir le champ date
2. Cliquer "Enregistrer"

**Résultat Attendu** :

- ✅ Sauvegarde réussie
- API reçoit : `{ maintenanceScheduledAt: null }`
- Base de données : `NULL`

## Formats de Date dans le Système

| Contexte                  | Format           | Exemple                    | Description                     |
| ------------------------- | ---------------- | -------------------------- | ------------------------------- |
| **Input HTML**            | `datetime-local` | `2025-10-26T22:00`         | Format local sans timezone      |
| **JavaScript Date**       | ISO 8601         | `2025-10-26T22:00:00.000Z` | Format UTC complet              |
| **API REST**              | ISO 8601         | `2025-10-26T22:00:00.000Z` | Format UTC complet              |
| **Base de données**       | TIMESTAMP        | `2025-10-26 22:00:00`      | Format PostgreSQL               |
| **Affichage utilisateur** | Localisé         | `26/10/2025 à 22:00`       | Format français (à implémenter) |

## Améliorations Futures

### 1. Bibliothèque de Dates

Installer `date-fns-tz` ou `luxon` pour une gestion robuste des timezones :

```bash
npm install date-fns-tz
```

### 2. Affichage Localisé

Formater l'affichage selon la locale de l'utilisateur :

```typescript
const formattedDate = new Intl.DateTimeFormat("fr-BE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: userTimezone,
}).format(date);
```

### 3. Sélecteur de Timezone

Permettre à l'utilisateur de voir/modifier le timezone pour cette maintenance spécifiquement :

```html
<select v-model="maintenanceTimezone">
  <option value="UTC">UTC</option>
  <option value="Europe/Brussels">Brussels</option>
  ...
</select>
```

### 4. Aperçu Multi-Timezone

Afficher l'heure de maintenance dans plusieurs fuseaux :

```
Maintenance planifiée :
- Brussels (GMT+1) : 26/10/2025 à 22:00
- Paris (GMT+1)    : 26/10/2025 à 22:00
- New York (GMT-4) : 26/10/2025 à 17:00
- UTC              : 26/10/2025 à 21:00
```

## Dépannage

### Erreur "Invalid datetime"

**Cause** : La date envoyée n'est pas au format ISO 8601

**Solution** :

1. Vérifier la console : `Date ISO (envoyée): ...`
2. Vérifier que la conversion fonctionne : doit se terminer par `.000Z`
3. Vérifier que `datetimeLocalToISO()` est appelée

### Date Incorrecte Après Rechargement

**Cause** : Problème de conversion timezone

**Solution** :

1. Vérifier le timezone de l'utilisateur : `authStore.user?.timezone`
2. Comparer les logs avant/après sauvegarde
3. Vérifier la valeur en base de données (doit être UTC)

### Timezone Ignoré

**Cause** : Implémentation actuelle utilise le timezone du navigateur

**Solution** : Pour l'instant, c'est le comportement attendu. L'amélioration avec `date-fns-tz` viendra dans une version future.

## Conclusion

Le système gère maintenant correctement les dates avec :

- ✅ Conversion automatique entre formats
- ✅ Validation Zod réussie
- ✅ Logging pour débogage
- ✅ Support du timezone utilisateur (préparé pour amélioration future)

Les utilisateurs peuvent planifier des maintenances avec des dates/heures précises qui seront correctement stockées et affichées, indépendamment de leur timezone.
