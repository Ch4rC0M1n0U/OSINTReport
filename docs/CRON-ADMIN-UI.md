# Interface d'Administration des Tâches CRON

## 📋 Vue d'Ensemble

Interface graphique dans la page **Réglages d'administration** permettant de visualiser et gérer les tâches CRON automatiques du système.

### Accès

**Route :** `/admin/settings` (Section "Tâches automatiques (CRON)")  
**Permission requise :** `system:settings` (Administrateurs uniquement)

---

## 🎨 Interface Utilisateur

### Emplacement

La section CRON est située dans la page **Réglages d'administration**, en bas de page après la section "Fonctionnalités bêta".

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🗓️ Tâches automatiques (CRON)            [🔄 Actualiser]  │
│  Surveillance et gestion des tâches planifiées du système   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Screenshot URL Regeneration CRON        [✅ active]   │ │
│  │ Régénère automatiquement les URLs signées...          │ │
│  │                                                       │ │
│  │ 🗓️ Planification:  Tous les jours à 03:00           │ │
│  │ ⚠️  Seuil:          30 jours avant expiration        │ │
│  │ ✅ Expiration:      180 jours (6 mois)               │ │
│  │                                                       │ │
│  │ [▶️ Exécuter maintenant]                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ℹ️  À propos de la régénération automatique               │
│  Le CRON s'exécute automatiquement tous les jours...       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Fonctionnalités

### 1. Visualisation du Status

**Informations affichées :**
- ✅ **Service** : Nom de la tâche CRON
- ✅ **Status** : Badge (active/inactive)
- ✅ **Planification** : Schedule d'exécution
- ✅ **Seuil de régénération** : Quand la tâche se déclenche
- ✅ **Durée d'expiration** : Nouvelle durée après régénération

**API Backend :**
```http
GET /api/cron/screenshot-urls/status
Authorization: Bearer <token>
Permission: system:settings

Response 200:
{
  "service": "Screenshot URL Regeneration CRON",
  "schedule": "Tous les jours à 03:00 (Europe/Brussels)",
  "regenerationThreshold": "30 jours avant expiration",
  "newExpirationDuration": "180 jours (6 mois)",
  "status": "active"
}
```

### 2. Exécution Manuelle

**Bouton :** "▶️ Exécuter maintenant"

**Comportement :**
1. Clic sur le bouton → État "Exécution en cours..."
2. Appel API POST `/api/cron/screenshot-urls/regenerate`
3. Tâche lancée en arrière-plan (réponse 202 Accepted)
4. Message de succès affiché pendant 2 secondes
5. Actualisation automatique du status

**API Backend :**
```http
POST /api/cron/screenshot-urls/regenerate
Authorization: Bearer <token>
Permission: system:settings

Response 202:
{
  "message": "Régénération des URLs démarrée",
  "info": "Le processus s'exécute en arrière-plan..."
}
```

**États du bouton :**
- ✅ Normal : "▶️ Exécuter maintenant"
- 🔄 En cours : "Exécution en cours..." (spinner animé, bouton désactivé)
- ✅ Succès : Message vert avec icône checkmark (2 sec)
- ❌ Erreur : Message rouge avec icône alerte (5 sec)

### 3. Actualisation

**Bouton :** "🔄 Actualiser"

**Comportement :**
- Recharge le status depuis l'API
- Spinner animé pendant le chargement
- Bouton désactivé pendant le chargement

---

## 💻 Implémentation Technique

### Fichier Modifié

**`frontend/src/pages/admin/AdminSettingsPage.vue`**

### Imports

```typescript
import { ref, onMounted } from 'vue';
import { HugeiconsIcon } from '@hugeicons/vue';
import { 
  Calendar03Icon, 
  Loading02Icon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon 
} from '@hugeicons/core-free-icons';
import { api } from '@/services/http';
```

### État Réactif

```typescript
const cronStatus = ref<any>(null);           // Status de la tâche CRON
const loadingCronStatus = ref(false);        // Chargement en cours
const regeneratingUrls = ref(false);         // Régénération en cours
const regenerationSuccess = ref(false);      // Message de succès
const regenerationError = ref<string | null>(null); // Message d'erreur
```

### Fonctions

#### `loadCronStatus()`

Charge le status depuis l'API backend.

```typescript
async function loadCronStatus() {
  loadingCronStatus.value = true;
  try {
    const response = await api.get('/cron/screenshot-urls/status');
    cronStatus.value = response.data;
  } catch (error: any) {
    console.error('Erreur chargement status CRON:', error);
    cronStatus.value = null;
  } finally {
    loadingCronStatus.value = false;
  }
}
```

**Appelée :**
- Au montage du composant (`onMounted`)
- Lors du clic sur "Actualiser"
- Après une régénération manuelle réussie (avec délai de 2s)

#### `triggerManualRegeneration()`

Déclenche une régénération manuelle.

```typescript
async function triggerManualRegeneration() {
  regeneratingUrls.value = true;
  regenerationSuccess.value = false;
  regenerationError.value = null;

  try {
    await api.post('/cron/screenshot-urls/regenerate');
    regenerationSuccess.value = true;
    
    // Rafraîchir le status après 2 secondes
    setTimeout(() => {
      loadCronStatus();
      regenerationSuccess.value = false;
    }, 2000);
  } catch (error: any) {
    console.error('Erreur régénération URLs:', error);
    regenerationError.value = error.response?.data?.message || 'Erreur lors de la régénération';
    
    setTimeout(() => {
      regenerationError.value = null;
    }, 5000);
  } finally {
    regeneratingUrls.value = false;
  }
}
```

**Gestion des erreurs :**
- Erreur 403 : Permissions insuffisantes
- Erreur 500 : Erreur serveur
- Message d'erreur affiché pendant 5 secondes

---

## 🎨 Styles et Design

### Carte CRON

```vue
<div class="card bg-base-100 shadow">
  <div class="card-body space-y-4">
    <!-- Contenu -->
  </div>
</div>
```

**Classes DaisyUI :**
- `card` : Conteneur principal
- `bg-base-100` : Fond blanc/clair
- `shadow` : Ombre portée
- `card-body` : Padding et espacement

### Badge de Status

```vue
<span class="badge badge-success badge-sm">active</span>
```

**Variantes :**
- `badge-success` : Vert (active)
- `badge-error` : Rouge (erreur)
- `badge-warning` : Orange (warning)

### Icônes

**HugeIcons utilisés :**
- 🗓️ `Calendar03Icon` : Planification
- 🔄 `Loading02Icon` : Chargement (avec animation `animate-spin`)
- ✅ `CheckmarkCircle02Icon` : Succès
- ⚠️ `AlertCircleIcon` : Avertissement/Erreur

**Tailles :**
- Titre : `w-5 h-5`
- Détails : `w-4 h-4`
- Spinner principal : `w-8 h-8`

### Layout Responsive

**Desktop (≥640px) :**
```
[Planification] [Seuil] [Expiration]
[Bouton Exécuter] [Message succès/erreur]
```

**Mobile (<640px) :**
```
[Planification]
[Seuil]
[Expiration]

[Bouton Exécuter]
[Message succès/erreur]
```

**Classes Tailwind :**
- `grid grid-cols-1 sm:grid-cols-3` : Grille responsive
- `flex-col sm:flex-row` : Direction responsive

---

## 🔐 Sécurité

### Permissions

**Permission requise :** `system:settings`

**Vérification côté backend :**
```typescript
router.post(
  '/screenshot-urls/regenerate',
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  async (req, res) => { /* ... */ }
);
```

**Comportement si non autorisé :**
- API retourne 403 Forbidden
- Frontend affiche : "Impossible de charger le status des tâches CRON"
- Message : "Vérifiez que vous avez les permissions nécessaires"

### Validation

**Frontend :**
- Bouton désactivé pendant l'exécution (évite double-clic)
- Timeout sur les messages d'erreur (5 sec)
- Timeout sur les messages de succès (2 sec)

**Backend :**
- Authentification requise (requireAuth)
- Permissions vérifiées (requirePermissions)
- Exécution asynchrone (pas de blocage)

---

## 🧪 Tests

### Test 1 : Chargement du Status

```bash
# 1. Se connecter en tant qu'admin (permission system:settings)
# 2. Naviguer vers /admin/settings
# 3. Scroller jusqu'à la section "Tâches automatiques (CRON)"

Attendu :
✅ Section visible avec status "active"
✅ Informations affichées correctement
✅ Pas d'erreur dans la console
```

### Test 2 : Exécution Manuelle

```bash
# 1. Cliquer sur "Exécuter maintenant"

Attendu :
✅ Bouton change en "Exécution en cours..." avec spinner
✅ Bouton désactivé pendant l'exécution
✅ Message de succès affiché après ~1-2 secondes
✅ Status actualisé après 2 secondes
✅ Logs backend montrent l'exécution :
   "✅ [API] Régénération manuelle déclenchée par user-xxx"
```

### Test 3 : Actualisation

```bash
# 1. Cliquer sur "Actualiser"

Attendu :
✅ Spinner animé sur le bouton
✅ Bouton désactivé pendant le chargement
✅ Données rechargées depuis l'API
```

### Test 4 : Permissions

```bash
# 1. Se connecter en tant qu'utilisateur NON-admin
# 2. Naviguer vers /admin/settings (si accessible)
# 3. Vérifier la section CRON

Attendu :
✅ Erreur affichée : "Impossible de charger le status des tâches CRON"
✅ Message : "Veuillez vérifier que vous avez les permissions nécessaires"
✅ API retourne 403 Forbidden
```

### Test 5 : Gestion d'Erreur

```bash
# 1. Simuler une erreur backend (ex: arrêter le serveur)
# 2. Cliquer sur "Exécuter maintenant"

Attendu :
✅ Message d'erreur affiché en rouge
✅ Icône d'alerte visible
✅ Message disparaît après 5 secondes
✅ Bouton redevient cliquable
```

---

## 📊 Scénarios d'Utilisation

### Scénario 1 : Consultation Quotidienne

**Utilisateur :** Administrateur système  
**Objectif :** Vérifier que les tâches CRON fonctionnent

```
1. Connexion en tant qu'admin
2. Navigation vers Réglages d'administration
3. Scroll vers section CRON
4. Vérification du status : "active"
5. Consultation de la dernière exécution (si ajouté)
```

### Scénario 2 : Régénération Urgente

**Utilisateur :** Administrateur système  
**Objectif :** Forcer la régénération avant la prochaine exécution automatique

```
1. Rapport signalé avec images cassées
2. Connexion en tant qu'admin
3. Navigation vers Réglages > Tâches CRON
4. Clic sur "Exécuter maintenant"
5. Attente du message de succès
6. Vérification dans les logs backend :
   "✅ [CRON] 15 URLs de screenshots régénérées"
7. Retour au rapport → Images fonctionnelles
```

### Scénario 3 : Dépannage

**Utilisateur :** Administrateur système  
**Objectif :** Diagnostiquer un problème de CRON

```
1. Utilisateurs signalent des images manquantes
2. Connexion en tant qu'admin
3. Vérification section CRON :
   - Status : active ✅
   - Schedule : Tous les jours à 03:00 ✅
4. Exécution manuelle pour tester
5. Si erreur → Consulter les logs backend
6. Si succès → Vérifier la configuration du schedule
```

---

## 🔮 Améliorations Futures

### 1. Historique d'Exécution

Afficher les dernières exécutions :

```vue
<div class="space-y-2">
  <h5 class="font-medium text-sm">Historique (7 derniers jours)</h5>
  <ul class="text-xs space-y-1">
    <li>✅ 13/10/2025 03:00 - 5 URLs régénérées</li>
    <li>✅ 12/10/2025 03:00 - 3 URLs régénérées</li>
    <li>✅ 11/10/2025 03:00 - Aucune régénération nécessaire</li>
  </ul>
</div>
```

**Backend requis :**
- Stocker les exécutions en DB (table `cron_executions`)
- Endpoint GET `/api/cron/screenshot-urls/history`

### 2. Statistiques

Afficher des métriques :

```vue
<div class="stats stats-vertical lg:stats-horizontal shadow">
  <div class="stat">
    <div class="stat-title">URLs actives</div>
    <div class="stat-value">1,234</div>
  </div>
  <div class="stat">
    <div class="stat-title">Régénérations (7j)</div>
    <div class="stat-value">45</div>
  </div>
  <div class="stat">
    <div class="stat-title">Prochain run</div>
    <div class="stat-value text-lg">Dans 8h</div>
  </div>
</div>
```

### 3. Notifications

Recevoir une alerte si le CRON échoue :

```vue
<div class="form-control">
  <label class="label cursor-pointer">
    <span class="label-text">M'alerter en cas d'échec</span>
    <input type="checkbox" class="toggle toggle-primary" />
  </label>
</div>
```

### 4. Configuration Dynamique

Modifier le schedule sans redéployer :

```vue
<div class="form-control">
  <label class="label">
    <span class="label-text">Horaire d'exécution</span>
  </label>
  <input type="time" value="03:00" class="input input-bordered" />
</div>
```

### 5. Gestion Multi-Tâches

Liste de toutes les tâches CRON :

```vue
<div class="space-y-3">
  <CronTaskCard 
    v-for="task in cronTasks" 
    :key="task.id"
    :task="task"
  />
</div>
```

**Tâches potentielles :**
- Régénération URLs screenshots
- Nettoyage des rapports supprimés
- Sauvegarde de la base de données
- Envoi de rapports par email
- Synchronisation avec services externes

---

## 📚 Ressources

**Fichiers modifiés :**
- `frontend/src/pages/admin/AdminSettingsPage.vue` (section CRON ajoutée)

**Fichiers backend utilisés :**
- `backend/src/modules/cron/cron.router.ts` (endpoints API)
- `backend/src/modules/cron/screenshot-url.cron.ts` (service CRON)

**Documentation connexe :**
- `BUGFIX-SCREENSHOT-EXPIRATION.md` : Contexte du problème résolu
- `SCREENSHOT-CRON-IMPLEMENTATION.md` : Implémentation technique CRON
- `docs/AI-API-EXAMPLES.md` : Pattern d'API similaire

**Permissions :**
- `system:settings` : Définie dans `backend/src/modules/auth/auth.constants.ts`

---

**Implémenté le :** 13 octobre 2025  
**Auteur :** GitHub Copilot  
**Version :** 1.0.0  
**Status :** ✅ Production Ready
