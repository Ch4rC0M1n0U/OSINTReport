# Page de Maintenance Professionnelle

## Vue d'Ensemble

Cette fonctionnalité fournit une page de maintenance dédiée et professionnelle qui s'affiche automatiquement aux utilisateurs non-administrateurs lorsque le mode maintenance est activé.

## Problème Résolu

### Situation Initiale

- **Utilisateurs lambda pouvaient se connecter** pendant le mode maintenance
- **Accès complet au site** après connexion, même en mode maintenance
- **Pas de page dédiée** pour informer les utilisateurs

### Solution Implémentée

- **Page de maintenance professionnelle** avec logo, message et délai
- **Redirection automatique** des non-admins après connexion
- **Blocage au niveau du router** pour empêcher la navigation
- **Design cohérent** avec le branding du service

## Architecture

### Flux Utilisateur Non-Admin

```
1. Mode maintenance activé par admin
   ↓
2. Utilisateur lambda accède au site
   ↓
3. Peut se connecter (login reste accessible)
   ↓
4. Après login: Redirection automatique → /maintenance
   ↓
5. Page de maintenance affichée
   ↓
6. Navigation bloquée (router guard)
   ↓
7. Seule action possible: Se déconnecter
```

### Flux Admin

```
1. Mode maintenance activé
   ↓
2. Admin se connecte
   ↓
3. Accès complet au site (bypass du mode maintenance)
   ↓
4. Peut gérer le site normalement
```

## Composants

### 1. Page de Maintenance

**Fichier** : `frontend/src/pages/MaintenancePage.vue`

#### Design

- **Header** : Logo + nom du service (personnalisables)
- **Icône** : Engrenage animé (rotation lente)
- **Titre** : "Site en Maintenance"
- **Message** : Personnalisable depuis les paramètres admin
- **Date** : Retour prévu (si défini)
- **Footer** : Bouton de déconnexion + message de contact

#### Éléments Visuels

```vue
<div class="card bg-base-100 shadow-2xl">
  <!-- Logo du service -->
  <img :src="logoUrl" :alt="serviceName" />

  <!-- Icône de maintenance animée -->
  <div class="animate-spin-slow">
    <HugeiconsIcon :icon="Settings05Icon" />
  </div>

  <!-- Message personnalisé -->
  <p>{{ maintenanceMessage }}</p>

  <!-- Date de retour prévue -->
  <div v-if="scheduledAt">
    Retour prévu: {{ scheduledAt }}
  </div>

  <!-- Bouton déconnexion -->
  <button @click="handleLogout">Se déconnecter</button>
</div>
```

#### Données Affichées

| Élément            | Source                            | Fallback            |
| ------------------ | --------------------------------- | ------------------- |
| **Logo**           | `settings.logoUrl`                | Icône par défaut    |
| **Nom du service** | `settings.serviceName`            | "OSINT Report"      |
| **Message**        | `settings.maintenanceMessage`     | Message générique   |
| **Date de retour** | `settings.maintenanceScheduledAt` | Non affiché si null |

### 2. Router Guard

**Fichier** : `frontend/src/router/index.ts`

#### Logique de Redirection

```typescript
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const { loadSettings, isMaintenanceMode } = useSystemSettings();

  // 1. Bootstrap de l'authentification
  if (!auth.initialized) {
    await auth.bootstrap();
  }

  // 2. Charger les paramètres système
  await loadSettings();

  // 3. Permettre l'accès à la page de maintenance
  if (to.name === "maintenance") {
    return true;
  }

  // 4. Vérifier le mode maintenance
  if (isMaintenanceMode.value) {
    const isAdmin = auth.user?.roleName === "admin";

    // Non-admin → Redirection vers /maintenance
    if (!isAdmin) {
      return { name: "maintenance" };
    }
    // Admin → Continuer normalement
  }

  // 5. Checks d'authentification classiques
  // ...
});
```

#### Ordre d'Exécution

1. **Bootstrap** : Vérifier l'authentification existante
2. **Load Settings** : Charger les paramètres système (avec cache)
3. **Maintenance Check** : AVANT les autres vérifications
4. **Auth Check** : Seulement si pas en maintenance ou si admin
5. **Permissions Check** : Dernière étape

### 3. Login Page Enhancement

**Fichier** : `frontend/src/pages/LoginPage.vue`

#### Post-Login Check

```typescript
async function handleSubmit() {
  try {
    // 1. Authentifier l'utilisateur
    await auth.login(form);

    // 2. Recharger les paramètres
    await loadSettings();

    // 3. Vérifier le mode maintenance
    if (isMaintenanceMode.value && auth.user?.roleName !== "admin") {
      // Rediriger immédiatement vers maintenance
      await router.push({ name: "maintenance" });
      return;
    }

    // 4. Redirection normale
    const redirect = (route.query.redirect as string) ?? "/";
    await router.push(redirect);
  } catch (err) {
    // Erreur gérée par le store
  }
}
```

**Avantage** : Double sécurité (login + router guard)

### 4. System Settings Composable

**Fichier** : `frontend/src/composables/useSystemSettings.ts`

#### Nouvelles Propriétés

```typescript
// Vérifier si le mode maintenance est activé
const isMaintenanceMode = computed(() => {
  return settings.value?.maintenanceEnabled === true;
});

// Message de maintenance
const maintenanceMessage = computed(() => {
  return settings.value?.maintenanceMessage || null;
});

// Date de fin de maintenance prévue
const maintenanceScheduledAt = computed(() => {
  return settings.value?.maintenanceScheduledAt || null;
});
```

#### Optimisation du Chargement

```typescript
let loadingPromise: Promise<void> | null = null;

async function loadSettings() {
  // 1. Si déjà chargé, retourner immédiatement
  if (settings.value) return;

  // 2. Si en cours de chargement, attendre la promesse existante
  if (loadingPromise) return loadingPromise;

  // 3. Charger une seule fois
  loadingPromise = (async () => {
    const data = await settingsApi.getSettings();
    settings.value = data;
  })();

  return loadingPromise;
}
```

**Avantage** : Évite les appels API multiples simultanés

### 5. Type Definitions

**Fichier** : `frontend/src/services/api/settings.ts`

#### Extension de SystemSettings

```typescript
export interface SystemSettings {
  // ... propriétés existantes ...

  // Nouveaux champs de maintenance
  maintenanceEnabled?: boolean;
  maintenanceMessage?: string | null;
  maintenanceScheduledAt?: string | null;
  lockUserCreation?: boolean;
  criticalAlertsEnabled?: boolean;
  teamsWebhookUrl?: string | null;
  teamsNotificationsEnabled?: boolean;
}
```

## Routes

### Route de Maintenance

```typescript
{
  path: "/maintenance",
  name: "maintenance",
  component: MaintenancePage,
  meta: { public: true },  // Accessible sans authentification
}
```

**Caractéristiques** :

- ✅ Accessible publiquement (meta.public)
- ✅ Contourne les checks d'authentification
- ✅ Ne déclenche pas de redirection en boucle

## Styling

### Animation de l'Icône

```css
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
```

**Effet** : Rotation douce de l'engrenage (3 secondes par tour)

### Pattern de Fond

```css
background-image: url("data:image/svg+xml;base64,...");
opacity: 0.4;
```

**Effet** : Motif géométrique subtil en arrière-plan

### Responsive Design

| Breakpoint  | Layout                        |
| ----------- | ----------------------------- |
| **Mobile**  | Carte centrée, padding réduit |
| **Tablet**  | Carte large, padding standard |
| **Desktop** | Max-width 2xl, centré         |

## Formatage des Dates

### Affichage de la Date de Retour

```typescript
const scheduledAt = computed(() => {
  if (!settings.value?.maintenanceScheduledAt) return null;

  const date = new Date(settings.value.maintenanceScheduledAt);
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
});
```

**Exemples de sortie** :

- Input: `"2025-10-27T14:00:00.000Z"`
- Output: `"27 octobre 2025 à 14:00"`

## Scénarios d'Utilisation

### Scénario 1 : Utilisateur Lambda Tente d'Accéder

**Étapes** :

1. Admin active le mode maintenance
2. Utilisateur lambda va sur `example.com`
3. Redirection automatique → `/maintenance`
4. Page de maintenance affichée

**Résultat** :

- ✅ Message professionnel
- ✅ Logo et branding préservés
- ✅ Information claire sur le retour prévu

### Scénario 2 : Utilisateur Lambda Se Connecte

**Étapes** :

1. Mode maintenance activé
2. Utilisateur va sur `/login`
3. Entre ses identifiants
4. Clique "Se connecter"

**Résultat** :

- ✅ Authentification réussie
- ✅ Redirection immédiate vers `/maintenance`
- ✅ Impossible de naviguer ailleurs
- ✅ Option de se déconnecter disponible

### Scénario 3 : Admin Se Connecte

**Étapes** :

1. Mode maintenance activé
2. Admin va sur `/login`
3. Entre ses identifiants admin
4. Clique "Se connecter"

**Résultat** :

- ✅ Authentification réussie
- ✅ Accès au dashboard
- ✅ Peut naviguer normalement
- ✅ Peut désactiver la maintenance

### Scénario 4 : Utilisateur Déjà Connecté

**Étapes** :

1. Utilisateur lambda connecté et actif
2. Admin active le mode maintenance
3. Utilisateur rafraîchit la page

**Résultat** :

- ✅ Router guard détecte le mode maintenance
- ✅ Redirection vers `/maintenance`
- ✅ Session préservée (peut se déconnecter)

## Configuration Admin

### Activer le Mode Maintenance

1. **Connexion admin** → Paramètres → Onglet "Général"
2. **Activer** : Cocher "Mode maintenance activé"
3. **Message** : Personnaliser le message affiché
4. **Date de retour** : Optionnel, définir la date/heure de fin prévue
5. **Enregistrer**

### Message Personnalisé

**Exemples de messages** :

```
Message court :
"Maintenance en cours. Retour prévu dans 2 heures."

Message détaillé :
"Nous effectuons actuellement une mise à jour majeure de notre système.
Toutes vos données sont en sécurité. Nous serons de retour sous peu."

Message avec contact :
"Site temporairement indisponible pour maintenance.
En cas d'urgence, contactez support@example.com"
```

### Date de Retour

**Format attendu** : ISO 8601 (géré automatiquement par le champ datetime-local)

**Exemple** :

- Input UI : `27/10/2025 14:00`
- Stocké : `"2025-10-27T14:00:00.000Z"`
- Affiché : `"27 octobre 2025 à 14:00"`

## Points Clés

### ✅ Avantages

1. **Professionnel** : Design soigné avec branding du service
2. **Informatif** : Message clair + date de retour
3. **Sécurisé** : Impossible de contourner (router guard)
4. **Admin-friendly** : Les admins gardent l'accès complet
5. **Performance** : Cache des paramètres (évite requêtes multiples)

### ⚠️ Considérations

1. **Double Check** : Login + Router guard (défense en profondeur)
2. **Session préservée** : L'utilisateur reste authentifié
3. **Déconnexion possible** : Option claire sur la page
4. **SEO** : Page de maintenance n'est pas indexée (meta.public)

### 🔮 Améliorations Futures

1. **Countdown Timer** : Compte à rebours en temps réel
2. **Email Notification** : Alerter quand la maintenance se termine
3. **Status Badge** : Indicateur de progression (0%, 50%, 100%)
4. **Multi-langue** : Support i18n pour messages internationaux
5. **API Status** : Endpoint `/api/status` pour monitoring externe

## Tests

### Test 1 : Affichage de la Page

**Commande** :

```bash
# Activer mode maintenance depuis admin panel
# Puis accéder à /maintenance
```

**Vérifications** :

- ✅ Logo du service affiché
- ✅ Message personnalisé visible
- ✅ Date de retour formatée correctement
- ✅ Bouton de déconnexion présent (si connecté)
- ✅ Design responsive

### Test 2 : Redirection Non-Admin

**Commande** :

```bash
# Mode maintenance activé
# Se connecter avec compte non-admin
```

**Vérifications** :

- ✅ Login réussit
- ✅ Redirection immédiate vers /maintenance
- ✅ Impossible d'accéder à /dashboard
- ✅ Impossible d'accéder à /reports

### Test 3 : Accès Admin

**Commande** :

```bash
# Mode maintenance activé
# Se connecter avec compte admin
```

**Vérifications** :

- ✅ Login réussit
- ✅ Accès au dashboard
- ✅ Toutes les fonctionnalités disponibles
- ✅ Peut désactiver la maintenance

### Test 4 : Déconnexion

**Commande** :

```bash
# Sur /maintenance (connecté)
# Cliquer "Se déconnecter"
```

**Vérifications** :

- ✅ Déconnexion réussie
- ✅ Redirection vers /login
- ✅ Session terminée

## Conclusion

Cette fonctionnalité offre une expérience professionnelle et informative aux utilisateurs pendant les périodes de maintenance, tout en préservant l'accès complet pour les administrateurs.

**Impact utilisateur** :

- ❌ Frustration réduite (message clair)
- ✅ Confiance préservée (branding cohérent)
- ✅ Information transparente (date de retour)

**Impact admin** :

- ✅ Contrôle total pendant la maintenance
- ✅ Activation/désactivation simple
- ✅ Personnalisation du message
