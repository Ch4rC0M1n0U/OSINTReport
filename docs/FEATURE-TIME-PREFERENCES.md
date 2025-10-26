# Fonctionnalité : Préférences de Temps

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de personnaliser leurs préférences temporelles via la page de profil. Les préférences incluent :

- **Fuseau horaire** : Choix du fuseau horaire de l'utilisateur
- **Format d'heure** : 12h (AM/PM) ou 24h
- **Premier jour de la semaine** : Dimanche, Lundi ou Samedi

## Modifications de la base de données

### Schema Prisma

Ajout de trois nouveaux champs au modèle `User` :

```prisma
model User {
  // ... champs existants ...

  timezone        String?   @default("Europe/Brussels")
  dateFormat      String?   @default("24h")
  firstDayOfWeek  String?   @default("monday")
}
```

### Valeurs par défaut

- `timezone`: "Europe/Brussels" (GMT+1:00 - Brussels CET)
- `dateFormat`: "24h" (Format 24 heures)
- `firstDayOfWeek`: "monday" (Lundi)

## Modifications du Backend

### 1. Types TypeScript

**`backend/src/modules/auth/auth.service.ts`**

- Ajout des champs dans le type `AuthenticatedUser`
- Mise à jour de `getUserWithRoleByEmail()` pour sélectionner les nouveaux champs
- Mise à jour de `buildAuthenticatedUser()` pour retourner les nouveaux champs

**`backend/src/types/express/index.d.ts`**

- Ajout des champs dans l'interface `UserPayload`

### 2. Middleware

**`backend/src/middleware/authenticate.ts`**

- Ajout de `timezone`, `dateFormat` et `firstDayOfWeek` dans l'objet `req.user`

### 3. Contrôleur Utilisateur

**`backend/src/modules/users/user.controller.ts`**

- Modification de `updateProfile()` pour accepter les nouveaux champs
- Sauvegarde des préférences dans la base de données
- Retour des préférences dans la réponse API

## Modifications du Frontend

### 1. Store d'authentification

**`frontend/src/stores/auth.ts`**

- Ajout des champs dans l'interface `UserInfo` :
  ```typescript
  interface UserInfo {
    // ... champs existants ...
    timezone: string | null;
    dateFormat: string | null;
    firstDayOfWeek: string | null;
  }
  ```

### 2. Page de profil

**`frontend/src/pages/ProfilePage.vue`**

#### Initialisation au chargement

```typescript
onMounted(() => {
  if (authStore.user) {
    // ... champs existants ...

    // Charger les préférences de temps
    timeForm.timezone = authStore.user.timezone || "Europe/Brussels";
    timeForm.dateFormat = authStore.user.dateFormat || "24h";
    timeForm.firstDayOfWeek = authStore.user.firstDayOfWeek || "monday";
  }
});
```

#### Sauvegarde des préférences

```typescript
async function handleTimePreferencesUpdate() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      timezone: timeForm.timezone,
      dateFormat: timeForm.dateFormat,
      firstDayOfWeek: timeForm.firstDayOfWeek,
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);

      message.value = {
        type: "success",
        text: "Préférences de temps mises à jour avec succès",
      };
    }
  } catch (err: any) {
    message.value = {
      type: "error",
      text:
        err.response?.data?.message ||
        "Erreur lors de la mise à jour des préférences",
    };
  } finally {
    saving.value = false;
  }
}
```

## Options disponibles

### Fuseaux horaires

- Europe/Brussels (GMT+1:00 - Brussels CET) - **par défaut**
- Europe/Paris (GMT+1:00 - Paris CET)
- Europe/London (GMT+0:00 - London GMT)
- America/New_York (GMT-5:00 - New York EST)
- America/Los_Angeles (GMT-8:00 - Los Angeles PST)
- Asia/Tokyo (GMT+9:00 - Tokyo JST)
- Australia/Sydney (GMT+11:00 - Sydney AEDT)

### Formats d'heure

- 12h (12-hour AM/PM)
- 24h (24-hour) - **par défaut**

### Premier jour de la semaine

- Dimanche (sunday)
- Lundi (monday) - **par défaut**
- Samedi (saturday)

## Flux de données

1. **Chargement initial** :

   - L'utilisateur charge la page de profil
   - Les préférences sont récupérées depuis `authStore.user`
   - Le formulaire `timeForm` est initialisé avec ces valeurs

2. **Modification** :

   - L'utilisateur modifie une ou plusieurs préférences dans l'interface
   - Les modifications sont stockées dans l'état réactif `timeForm`

3. **Sauvegarde** :

   - L'utilisateur clique sur "Mettre à jour"
   - Une requête PATCH est envoyée à `/users/me/profile`
   - Le backend met à jour les champs dans la base de données
   - La réponse contient les données utilisateur mises à jour
   - Le store d'authentification est mis à jour
   - Un message de succès s'affiche

4. **Persistance** :
   - Les préférences sont stockées dans la base de données PostgreSQL
   - Elles sont automatiquement chargées à chaque connexion
   - Elles sont incluses dans le token JWT (via req.user)

## Tests

Pour tester la fonctionnalité :

1. **Se connecter** à l'application
2. **Accéder** à la page de profil
3. **Modifier** les préférences de temps :
   - Changer le fuseau horaire
   - Sélectionner un format d'heure différent
   - Choisir un autre premier jour de la semaine
4. **Cliquer** sur "Mettre à jour"
5. **Vérifier** que le message de succès s'affiche
6. **Rafraîchir** la page
7. **Vérifier** que les préférences sont bien persistées

## Notes techniques

- Les champs sont optionnels (nullable) avec des valeurs par défaut
- La validation est minimale côté backend (accepte toutes les valeurs de chaîne)
- Les préférences sont stockées en tant que chaînes de caractères
- L'implémentation actuelle ne formate pas encore les dates/heures selon ces préférences (à implémenter dans une future version)

## Améliorations futures

- [ ] Utiliser les préférences pour formater les dates/heures dans l'application
- [ ] Ajouter plus de fuseaux horaires
- [ ] Validation stricte des valeurs (enum dans Prisma)
- [ ] Aperçu en temps réel du format sélectionné
- [ ] Application automatique des préférences dans tous les composants de date/heure
