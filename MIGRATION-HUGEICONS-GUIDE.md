# Migration Globale HugeIcons - Correspondances

## 📦 Icônes Material → HugeIcons

### Icônes générales
| Material Icons | HugeIcons | Contexte |
|----------------|-----------|----------|
| `search_insights` | `SearchVisualIcon` | Logo application |
| `dashboard` | `DashboardSpeed01Icon` | Tableau de bord |
| `assignment` / `description` | `FileAttachmentIcon` | Rapports/Documents |
| `group_work` | `UserGroupIcon` | Entités/Groupes |
| `search` | `Search01Icon` | Recherche |
| `add` | `Add01Icon` | Ajouter |
| `edit` | `Edit02Icon` | Modifier |
| `delete` | `Delete02Icon` | Supprimer |
| `close` | `Cancel01Icon` | Fermer |
| `check` / `check_circle` | `CheckmarkCircle01Icon` | Validation |
| `error` | `AlertCircleIcon` | Erreur |
| `info` | `InformationCircleIcon` | Information |
| `warning` | `Alert01Icon` | Avertissement |

### Navigation & UI
| Material Icons | HugeIcons | Contexte |
|----------------|-----------|----------|
| `arrow_back` | `ArrowLeft01Icon` | Retour |
| `arrow_forward` | `ArrowRight01Icon` | Suivant |
| `expand_more` | `ArrowDown01Icon` | Dérouler |
| `expand_less` | `ArrowUp01Icon` | Réduire |
| `chevron_left` | `ArrowLeft01Icon` | Pagination gauche |
| `chevron_right` | `ArrowRight01Icon` | Pagination droite |
| `more_vert` | `MoreVerticalIcon` | Menu options |
| `menu` | `Menu01Icon` | Menu hamburger |

### Utilisateurs & Auth
| Material Icons | HugeIcons | Contexte |
|----------------|-----------|----------|
| `person` | `User02Icon` | Utilisateur |
| `person_add` | `UserAdd01Icon` | Ajouter utilisateur |
| `group` | `UserMultiple02Icon` | Groupe utilisateurs |
| `shield_person` | `ShieldUserIcon` | Admin/Shield |
| `lock` | `LockIcon` | Verrouillage |
| `lock_reset` | `LockPasswordIcon` | Réinitialisation MDP |
| `password` | `PasswordIcon` | Mot de passe |
| `visibility` | `View01Icon` | Voir |
| `visibility_off` | `ViewOffIcon` | Masquer |
| `login` | `Login01Icon` | Connexion |
| `logout` | `Logout01Icon` | Déconnexion |
| `verified` | `SecurityCheckIcon` | Vérifié/Sécurisé |
| `verified_user` | `UserShield01Icon` | Utilisateur vérifié |

### Paramètres & Administration
| Material Icons | HugeIcons | Contexte |
|----------------|-----------|----------|
| `settings` | `Settings02Icon` | Paramètres |
| `tune` | `Settings02Icon` | Réglages |
| `mail` | `Mail01Icon` | Email |
| `mail_off` | `MailRemove01Icon` | Email désactivé |
| `dns` | `DatabaseIcon` | DNS/Base de données |
| `psychology` | `ArtificialIntelligence01Icon` | IA/Psychology |
| `manage_search` | `SearchingIcon` | Gestion recherche |
| `team_dashboard` | `DashboardSpeed01Icon` | Dashboard équipe |
| `table_view` | `Table01Icon` | Vue tableau |

### Actions & États
| Material Icons | HugeIcons | Contexte |
|----------------|-----------|----------|
| `send` | `SentIcon` | Envoyer |
| `upload` | `Upload01Icon` | Télécharger |
| `download` | `Download01Icon` | Télécharger |
| `save` | `Save01Icon` | Sauvegarder |
| `refresh` | `RefreshIcon` | Rafraîchir |
| `network_check` | `WifiConnected01Icon` | Vérifier réseau |
| `loading` | `Loading01Icon` | Chargement (spinner) |

## 🔧 Pattern de remplacement

### Icône simple (statique)
```vue
<!-- AVANT -->
<span class="material-symbols-rounded">add</span>

<!-- APRÈS -->
<HugeiconsIcon :icon="Add01Icon" :size="20" />
```

### Icône avec classes
```vue
<!-- AVANT -->
<span class="material-symbols-rounded text-4xl text-primary">search_insights</span>

<!-- APRÈS -->
<HugeiconsIcon :icon="SearchVisualIcon" :size="40" class="text-primary" />
```

### Icône dynamique
```vue
<!-- AVANT -->
<span class="material-symbols-rounded text-xl">{{ item.icon }}</span>

<!-- APRÈS -->
<!-- 1. Modifier la configuration pour stocker le composant -->
const items = [
  { icon: Add01Icon, label: "Ajouter" }
];

<!-- 2. Utiliser le composant -->
<HugeiconsIcon :icon="item.icon" :size="20" />
```

### Icône avec animation
```vue
<!-- AVANT -->
<span class="material-symbols-rounded" :class="{ 'animate-spin': loading }">
  refresh
</span>

<!-- APRÈS -->
<HugeiconsIcon :icon="RefreshIcon" :size="20" :class="{ 'animate-spin': loading }" />
```

### Icône dans input (position absolute)
```vue
<!-- AVANT -->
<span class="absolute left-3 top-3.5 material-symbols-rounded text-base-content/40">
  email
</span>

<!-- APRÈS -->
<HugeiconsIcon 
  :icon="Mail01Icon" 
  :size="20" 
  class="absolute left-3 top-3.5 text-base-content/40" 
/>
```

## 📋 Fichiers à migrer

### Pages principales ✅
- [x] `EntitiesPage.vue` - FAIT
- [x] `DashboardPage.vue` - FAIT
- [ ] `LoginPage.vue`
- [ ] `ForgotPasswordPage.vue`
- [ ] `ResetPasswordPage.vue`
- [ ] `ProfilePage.vue`

### Pages Dashboard
- [ ] `DashboardHomePage.vue`

### Pages Admin
- [ ] `AdminUsersPage.vue`
- [ ] `AdminUserDetailPage.vue`
- [ ] `AdminUserEditPage.vue`
- [ ] `AdminUserCreatePage.vue`
- [ ] `SmtpSettingsPage.vue`
- [ ] `SystemSettingsPage.vue`
- [ ] `SearchManagementPage.vue`

### Composants
- [ ] `AIGenerateButton.vue`
- [ ] `AIGenerationModal.vue`

## 🚀 Imports nécessaires

```typescript
// Import composant
import { HugeiconsIcon } from "@hugeicons/vue";

// Import icônes (exemples communs)
import {
  // Général
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  Search01Icon,
  SearchVisualIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  Alert01Icon,
  
  // Navigation
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  MoreVerticalIcon,
  Menu01Icon,
  
  // Utilisateurs
  User02Icon,
  UserAdd01Icon,
  UserMultiple02Icon,
  UserGroupIcon,
  ShieldUserIcon,
  UserShield01Icon,
  
  // Auth & Sécurité
  LockIcon,
  LockPasswordIcon,
  PasswordIcon,
  View01Icon,
  ViewOffIcon,
  Login01Icon,
  Logout01Icon,
  SecurityCheckIcon,
  
  // Paramètres
  Settings02Icon,
  SettingsError02Icon,
  Mail01Icon,
  MailRemove01Icon,
  DatabaseIcon,
  ArtificialIntelligence01Icon,
  SearchingIcon,
  
  // Dashboard & Vues
  DashboardSpeed01Icon,
  FileAttachmentIcon,
  Table01Icon,
  
  // Actions
  SentIcon,
  Upload01Icon,
  Download01Icon,
  Save01Icon,
  RefreshIcon,
  WifiConnected01Icon,
} from "@hugeicons/core-free-icons";
```

## 📏 Tailles recommandées

| Contexte | Taille Material | Taille HugeIcons |
|----------|----------------|------------------|
| Icône normale | `text-lg` (1.125rem) | `:size="18"` |
| Icône moyenne | `text-xl` (1.25rem) | `:size="20"` |
| Icône grande | `text-2xl` (1.5rem) | `:size="24"` |
| Icône très grande | `text-4xl` (2.25rem) | `:size="36"` ou `40` |
| Icône géante | `text-5xl` (3rem) | `:size="48"` |
| Icône énorme | `text-6xl` (3.75rem) | `:size="60"` ou `64` |

## ⚠️ Cas spéciaux

### Icône de chargement
Material utilise souvent `animate-spin` avec `refresh`.  
HugeIcons : Même principe
```vue
<HugeiconsIcon :icon="RefreshIcon" :size="20" class="animate-spin" />
```

### Icône conditionnelle (toggle)
```vue
<!-- AVANT -->
<span class="material-symbols-rounded">
  {{ showPassword ? 'visibility' : 'visibility_off' }}
</span>

<!-- APRÈS -->
<HugeiconsIcon 
  :icon="showPassword ? View01Icon : ViewOffIcon" 
  :size="20" 
/>
```

### Logo personnalisé (fallback)
```vue
<!-- Logo custom ou icône par défaut -->
<img v-if="logoUrl" :src="logoUrl" alt="Logo" class="h-16" />
<HugeiconsIcon v-else :icon="SearchVisualIcon" :size="64" class="text-primary" />
```

## ✅ Checklist de migration par fichier

Pour chaque fichier :
1. [ ] Ajouter imports HugeIcons en haut du `<script>`
2. [ ] Identifier toutes les icônes Material utilisées
3. [ ] Remplacer chaque `<span class="material-symbols-rounded">` par `<HugeiconsIcon>`
4. [ ] Ajuster les tailles (text-xl → :size="20")
5. [ ] Vérifier les classes CSS (opacité, couleurs, etc.)
6. [ ] Tester le build : `npm run build`
7. [ ] Vérifier visuellement dans le navigateur
