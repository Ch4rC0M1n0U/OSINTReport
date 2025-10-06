# 🎨 Session 9 - Système de Paramètres Système

## 🎯 Objectif

Créer un système de configuration pour personnaliser l'application selon l'unité utilisatrice :
- Informations du service (nom, adresse complète)
- Logo personnalisable
- Contacts (téléphone, fax, email, site web)
- Personnalisation visuelle (couleurs)
- Header pleine largeur avec logo + titre dynamique

---

## ✅ Implémentation complète

### 1. Backend - Base de données

**Fichier** : `backend/prisma/schema.prisma`

**Modèle ajouté** :
```prisma
model SystemSettings {
  id        String   @id @default(uuid())
  
  // Informations sur le service
  serviceName     String   @default("OSINT")
  serviceFullName String?  // Ex: "DR5 - OSINT - BRUXELLES"
  serviceAddress  String?
  serviceCity     String?
  servicePostalCode String?
  serviceCountry  String?  @default("Belgique")
  
  // Contacts
  phoneNumber     String?
  faxNumber       String?
  emailContact    String?
  websiteUrl      String?
  
  // Branding
  logoUrl         String?  // Chemin vers le logo uploadé
  primaryColor    String?  @default("#003f87") // Bleu police belge
  secondaryColor  String?  @default("#0066cc")
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Migration** : `20251006084657_add_system_settings`

**Résultat** : ✅ Table créée avec valeurs par défaut

---

### 2. Backend - API

#### A. Service (`settings.service.ts`)

```typescript
export class SettingsService {
  // Récupérer settings (crée si n'existe pas)
  static async getSettings(): Promise<SystemSettings>
  
  // Mettre à jour settings
  static async updateSettings(data: UpdateSettingsData): Promise<SystemSettings>
  
  // Mettre à jour logo
  static async updateLogo(logoUrl: string): Promise<SystemSettings>
  
  // Supprimer logo
  static async removeLogo(): Promise<SystemSettings>
}
```

**Logique** :
- `getSettings()` crée automatiquement un enregistrement avec valeurs par défaut si n'existe pas
- Un seul enregistrement SystemSettings dans la base (singleton)

#### B. Controller (`settings.controller.ts`)

```typescript
export class SettingsController {
  // GET /api/settings - Récupérer settings (public)
  static async getSettings(req, res, next)
  
  // PUT /api/settings - Mettre à jour (auth + permission)
  static async updateSettings(req, res, next)
  
  // POST /api/settings/logo - Upload logo (auth + permission)
  static async uploadLogo(req, res, next)
  
  // DELETE /api/settings/logo - Supprimer logo (auth + permission)
  static async removeLogo(req, res, next)
}
```

**Validation Zod** :
```typescript
const updateSettingsSchema = z.object({
  serviceName: z.string().min(1).max(100).optional(),
  serviceFullName: z.string().min(1).max(200).nullable().optional(),
  serviceAddress: z.string().min(1).max(500).nullable().optional(),
  serviceCity: z.string().min(1).max(100).nullable().optional(),
  servicePostalCode: z.string().min(1).max(20).nullable().optional(),
  serviceCountry: z.string().min(1).max(100).nullable().optional(),
  phoneNumber: z.string().min(1).max(50).nullable().optional(),
  faxNumber: z.string().min(1).max(50).nullable().optional(),
  emailContact: z.string().email().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});
```

#### C. Router (`settings.router.ts`)

**Routes** :
```typescript
GET    /api/settings           // Public - Récupérer settings
PUT    /api/settings           // Protégé - Mettre à jour
POST   /api/settings/logo      // Protégé - Upload logo
DELETE /api/settings/logo      // Protégé - Supprimer logo
```

**Upload multer** :
```typescript
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/logos/",
    filename: `logo-${timestamp}-${random}.${ext}`
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: ["image/jpeg", "image/png", "image/svg+xml", "image/webp"]
});
```

**Permissions** :
- Route publique : `GET /api/settings` (accessible sans auth)
- Routes protégées : Nécessitent permission `system:settings` ou `system:admin`

#### D. Permission ajoutée

**Fichier** : `backend/src/modules/auth/auth.constants.ts`

```typescript
export enum PermissionCode {
  REPORTS_READ = "reports:read",
  REPORTS_WRITE = "reports:write",
  USERS_READ = "users:read",
  USERS_WRITE = "users:write",
  ADMIN = "system:admin",
  SYSTEM_SETTINGS = "system:settings", // ← NOUVEAU
}
```

**Rôle admin** : Permission `SYSTEM_SETTINGS` ajoutée automatiquement

#### E. Fichiers statiques

**Fichier** : `backend/src/app.ts`

```typescript
// Servir les fichiers statiques (logos, avatars, etc.)
app.use("/uploads", express.static(join(__dirname, "../uploads")));
```

**Résultat** : Logos accessibles via `http://localhost:4000/uploads/logos/logo-xxx.png`

---

### 3. Frontend - Service API

**Fichier** : `frontend/src/services/api/settings.ts`

```typescript
export interface SystemSettings {
  id: string;
  serviceName: string;
  serviceFullName?: string | null;
  serviceAddress?: string | null;
  serviceCity?: string | null;
  servicePostalCode?: string | null;
  serviceCountry?: string | null;
  phoneNumber?: string | null;
  faxNumber?: string | null;
  emailContact?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: string;
  updatedAt: string;
}

class SettingsApi {
  async getSettings(): Promise<SystemSettings>
  async updateSettings(data: UpdateSettingsData): Promise<SystemSettings>
  async uploadLogo(file: File): Promise<SystemSettings>
  async removeLogo(): Promise<SystemSettings>
  getLogoUrl(logoPath: string | null): string | null
}

export const settingsApi = new SettingsApi();
```

---

### 4. Frontend - Composable

**Fichier** : `frontend/src/composables/useSystemSettings.ts`

```typescript
export function useSystemSettings() {
  const settings = ref<SystemSettings | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadSettings()
  async function refreshSettings()

  // Computed
  const appTitle = computed(() => `${serviceName} REPORT`)
  const serviceFullName = computed(...)
  const logoUrl = computed(...)
  const primaryColor = computed(...)
  const secondaryColor = computed(...)

  return {
    settings, loading, error,
    loadSettings, refreshSettings,
    appTitle, serviceFullName, logoUrl,
    primaryColor, secondaryColor
  };
}
```

**Utilisation** : Singleton partagé entre tous les composants (state global via closure)

---

### 5. Frontend - Page Settings

**Fichier** : `frontend/src/pages/admin/SystemSettingsPage.vue`

**Sections** :

1. **Logo du service**
   - Preview du logo actuel
   - Upload nouveau logo (drag & drop)
   - Bouton "Supprimer logo"

2. **Informations du service**
   - Nom du service (obligatoire)
   - Nom complet (ex: "DR5 - OSINT - BRUXELLES")
   - Adresse, Ville, Code postal, Pays

3. **Coordonnées de contact**
   - Téléphone, Fax
   - Email, Site web

4. **Personnalisation visuelle**
   - Couleur principale (color picker + input hex)
   - Couleur secondaire (color picker + input hex)

**Validation** :
- Nom du service obligatoire
- Email valide si renseigné
- URL valide si renseignée
- Format couleur hex (#RRGGBB)

**Actions** :
- Annuler (recharge settings)
- Enregistrer (PUT /api/settings)

---

### 6. Frontend - Layout modifié

**Fichier** : `frontend/src/components/layout/AppShell.vue`

**Avant** :
```vue
<header class="navbar bg-base-100">
  <div class="flex-1">
    <h1>OSINTReport</h1>
  </div>
  <div class="flex-none">
    <slot name="header" />
  </div>
</header>
```

**Après** :
```vue
<header class="bg-base-100 border-b">
  <div class="navbar">
    <!-- Mobile toggle -->
    <div class="flex-none lg:hidden">
      <label for="app-drawer">☰</label>
    </div>

    <!-- Logo à gauche -->
    <div class="flex-none">
      <img v-if="logoUrl" :src="logoUrl" class="h-12" />
    </div>

    <!-- Titre dynamique -->
    <div class="flex-1">
      <h1 class="text-xl font-bold">{{ appTitle }}</h1>
      <p v-if="serviceFullName" class="text-xs">{{ serviceFullName }}</p>
    </div>

    <!-- User menu à droite -->
    <div class="flex-none">
      <slot name="header" />
    </div>
  </div>
</header>
```

**Chargement settings** :
```vue
<script setup>
import { onMounted } from "vue";
import { useSystemSettings } from "@/composables/useSystemSettings";

const systemSettings = useSystemSettings();

onMounted(() => {
  systemSettings.loadSettings();
});
</script>
```

**Résultat** :
- ✅ Header pleine largeur
- ✅ Logo en haut à gauche (si configuré)
- ✅ Titre dynamique : `${serviceName} REPORT`
- ✅ Sous-titre avec nom complet du service
- ✅ Menu utilisateur à droite

---

### 7. Frontend - Navigation admin

**Fichier** : `frontend/src/pages/DashboardPage.vue`

**Ajouté** :
```typescript
const canManageSystemSettings = computed(() => {
  const permissions = auth.user?.permissions;
  return permissions ? permissions.includes("system:settings") : false;
});

const adminNavigation = computed(() => {
  const adminChildren = [
    // ... existing items
    {
      label: "Paramètres système",
      to: { name: "admin.system" },
      icon: "settings",
      visible: canManageSystemSettings.value || canAccessAdmin.value,
    },
  ];
  // ...
});
```

**Résultat** : Menu "Administration" → "Paramètres système"

---

### 8. Frontend - Router

**Fichier** : `frontend/src/router/index.ts`

**Route ajoutée** :
```typescript
{
  path: "admin/system",
  name: "admin.system",
  component: SystemSettingsPage,
  meta: {
    requiresAuth: true,
    permissions: ["system:settings"],
  },
}
```

---

## 📊 Flux de données

### Chargement initial

```
1. User accède à l'application
   ↓
2. AppShell.onMounted() → loadSettings()
   ↓
3. GET /api/settings (public, pas d'auth nécessaire)
   ↓
4. Backend vérifie si settings existe
   - Si OUI → retourne settings
   - Si NON → crée avec valeurs par défaut → retourne
   ↓
5. Frontend stocke dans useSystemSettings (singleton)
   ↓
6. Header affiche logo + titre dynamique
```

### Modification des settings

```
1. Admin ouvre /admin/system
   ↓
2. Page charge settings (déjà en cache)
   ↓
3. Admin modifie champs + upload logo
   ↓
4. Click "Enregistrer"
   ↓
5. PUT /api/settings avec données
   ↓
6. Backend valide (Zod) + vérifie permission
   ↓
7. Backend met à jour settings en DB
   ↓
8. Backend retourne settings mis à jour
   ↓
9. Frontend met à jour cache
   ↓
10. Header se met à jour automatiquement (reactive)
```

---

## 🎨 Exemples d'utilisation

### Exemple 1 : Configuration DR5 Bruxelles

```json
{
  "serviceName": "OSINT",
  "serviceFullName": "DR5 - OSINT - BRUXELLES",
  "serviceAddress": "Rue de la Loi 16",
  "serviceCity": "Bruxelles",
  "servicePostalCode": "1000",
  "serviceCountry": "Belgique",
  "phoneNumber": "+32 2 123 45 67",
  "faxNumber": "+32 2 123 45 68",
  "emailContact": "osint.dr5@police.belgium.eu",
  "websiteUrl": "https://www.police.be",
  "logoUrl": "/uploads/logos/logo-1696598765-123456789.png",
  "primaryColor": "#003f87",
  "secondaryColor": "#0066cc"
}
```

**Affichage Header** :
```
┌─────────────────────────────────────────────────────────┐
│ [LOGO]  OSINT REPORT                      [User Menu]   │
│         DR5 - OSINT - BRUXELLES                         │
└─────────────────────────────────────────────────────────┘
```

### Exemple 2 : Configuration PJF Liège

```json
{
  "serviceName": "PJF LIÈGE",
  "serviceFullName": "Police Judiciaire Fédérale - Unité OSINT Liège",
  "serviceAddress": "Rue du Palais 12",
  "serviceCity": "Liège",
  "servicePostalCode": "4000",
  "serviceCountry": "Belgique",
  "phoneNumber": "+32 4 987 65 43",
  "emailContact": "osint.liege@police.belgium.eu",
  "logoUrl": null,
  "primaryColor": "#1a5490",
  "secondaryColor": "#2e7abf"
}
```

**Affichage Header** :
```
┌─────────────────────────────────────────────────────────┐
│ PJF LIÈGE REPORT                          [User Menu]   │
│ Police Judiciaire Fédérale - Unité OSINT Liège         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

### Permissions

- **Lecture settings** : Public (GET /api/settings)
- **Modification settings** : `system:settings` ou `system:admin`
- **Upload logo** : `system:settings` ou `system:admin`

### Validation

- **Backend** : Validation Zod stricte
- **Frontend** : Validation HTML5 + vérifications supplémentaires
- **Upload** : 
  - Taille max : 5 MB
  - Types MIME : PNG, JPG, SVG, WebP
  - Noms de fichiers sécurisés (timestamp + random)

### Stockage

- **Logos** : `backend/uploads/logos/` (créé automatiquement)
- **Base de données** : Path relatif stocké (`/uploads/logos/logo-xxx.png`)
- **Accès** : Fichiers servis via Express static middleware

---

## 🧪 Tests

### Test manuel backend

```bash
# 1. Récupérer settings (doit créer si n'existe pas)
curl http://localhost:4000/api/settings

# 2. Mettre à jour settings (nécessite auth)
curl -X PUT http://localhost:4000/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"serviceName":"PJF LIÈGE","primaryColor":"#1a5490"}'

# 3. Upload logo (nécessite auth)
curl -X POST http://localhost:4000/api/settings/logo \
  -H "Cookie: session=..." \
  -F "logo=@/path/to/logo.png"

# 4. Supprimer logo (nécessite auth)
curl -X DELETE http://localhost:4000/api/settings/logo \
  -H "Cookie: session=..."
```

### Test manuel frontend

1. **Accéder à la page** : `/admin/system`
2. **Modifier nom du service** : "DR5 - OSINT"
3. **Upload logo** : Choisir un fichier PNG
4. **Modifier couleurs** : Utiliser color picker
5. **Enregistrer** → Vérifier que header se met à jour
6. **Recharger page** → Vérifier que settings persistent

---

## 📁 Fichiers créés/modifiés

### Backend

**Créés** :
- ✅ `backend/prisma/schema.prisma` - Modèle SystemSettings
- ✅ `backend/prisma/migrations/20251006084657_add_system_settings/` - Migration
- ✅ `backend/src/modules/settings/settings.service.ts` - Service
- ✅ `backend/src/modules/settings/settings.controller.ts` - Controller
- ✅ `backend/src/modules/settings/settings.router.ts` - Router

**Modifiés** :
- ✅ `backend/src/modules/auth/auth.constants.ts` - Permission SYSTEM_SETTINGS
- ✅ `backend/src/routes/index.ts` - Import settingsRouter
- ✅ `backend/src/app.ts` - Static middleware pour /uploads

### Frontend

**Créés** :
- ✅ `frontend/src/services/api/settings.ts` - API client
- ✅ `frontend/src/composables/useSystemSettings.ts` - Composable global
- ✅ `frontend/src/pages/admin/SystemSettingsPage.vue` - Page settings

**Modifiés** :
- ✅ `frontend/src/router/index.ts` - Route /admin/system
- ✅ `frontend/src/components/layout/AppShell.vue` - Header dynamique
- ✅ `frontend/src/pages/DashboardPage.vue` - Menu admin

---

## 🚀 Améliorations futures

### Phase 1 (prioritaire)

- [ ] **Preview couleurs** : Afficher aperçu du thème avant enregistrement
- [ ] **Reset logo** : Bouton "Restaurer logo par défaut"
- [ ] **Validation temps réel** : Validation des champs pendant la saisie

### Phase 2 (nice to have)

- [ ] **Thèmes prédéfinis** : Templates de couleurs (Police Belge, Douanes, Gendarmerie)
- [ ] **Multi-langues** : Support i18n pour les labels
- [ ] **Historique** : Versionning des settings avec rollback
- [ ] **Export/Import** : Exporter settings en JSON pour réutilisation

### Phase 3 (avancé)

- [ ] **CSS variables dynamiques** : Injecter primaryColor/secondaryColor dans :root
- [ ] **Logo watermark PDF** : Utiliser logo dans exports PDF
- [ ] **Email branding** : Utiliser logo et couleurs dans emails
- [ ] **Multi-tenancy** : Settings par unité/département

---

## 📚 Documentation technique

### Architecture

```
Backend:
  settings.service.ts  → Business logic (CRUD)
  settings.controller.ts → HTTP handlers
  settings.router.ts   → Routes + middleware
  schema.prisma       → Database model

Frontend:
  settingsApi.ts      → API client (axios)
  useSystemSettings.ts → Global state (singleton)
  SystemSettingsPage.vue → Admin UI
  AppShell.vue        → Dynamic header
```

### Base de données

**Table** : `SystemSettings`
- **PK** : `id` (UUID)
- **Unique** : Un seul enregistrement (singleton pattern)
- **Defaults** : serviceName="OSINT", serviceCountry="Belgique", colors=#003f87/#0066cc

### API Endpoints

| Méthode | Endpoint | Auth | Permission | Description |
|---------|----------|------|------------|-------------|
| GET | `/api/settings` | Non | - | Récupérer settings |
| PUT | `/api/settings` | Oui | `system:settings` | Mettre à jour settings |
| POST | `/api/settings/logo` | Oui | `system:settings` | Upload logo |
| DELETE | `/api/settings/logo` | Oui | `system:settings` | Supprimer logo |

---

## ✅ Checklist de validation

### Backend
- [x] Migration Prisma appliquée
- [x] Settings service créé
- [x] Settings controller créé
- [x] Settings router créé
- [x] Permission SYSTEM_SETTINGS ajoutée
- [x] Router intégré dans app
- [x] Static middleware configuré
- [x] Dossier uploads/logos créé automatiquement

### Frontend
- [x] Service API créé
- [x] Composable useSystemSettings créé
- [x] Page SystemSettingsPage créée
- [x] Route /admin/system ajoutée
- [x] Menu admin mis à jour
- [x] AppShell modifié (header dynamique)
- [x] Logo affiché si présent
- [x] Titre dynamique affiché

### Fonctionnalités
- [x] Chargement settings au démarrage
- [x] Affichage logo dans header
- [x] Affichage titre dynamique
- [x] Upload logo fonctionnel
- [x] Suppression logo fonctionnelle
- [x] Modification settings fonctionnelle
- [x] Validation formulaire
- [x] Messages d'erreur/succès
- [x] Permissions vérifiées

---

**Session** : 9  
**Date** : 6 octobre 2025  
**Status** : ✅ COMPLET  
**Prochaine étape** : Tester en production + éventuellement améliorer le PDF avec les settings

## 🐛 Bugs résolus

### 1. Permission manquante (BUGFIX-SETTINGS-PAGE-ACCESS.md)

**Problème** : Page `/admin/system` ne s'affichait pas  
**Cause** : Permission `system:settings` manquante dans JWT  
**Solution** :
- Ajout permission dans `bootstrap.ts`
- Route accepte `system:admin` aussi (temporaire)
- Utilisateur s'est reconnecté → Nouveau JWT avec permission

### 2. Connection refused (BUGFIX-SETTINGS-API-CONNECTION.md)

**Problème** : `GET http://localhost:4000/api/settings net::ERR_CONNECTION_REFUSED`  
**Cause** : `settingsApi` utilisait `axios` directement au lieu de l'instance `api` configurée  
**Solution** :
- Import `{ api }` depuis `@/services/http`
- Remplacement de tous les appels `axios.*` → `api.*`
- Correction `getLogoUrl()` pour utiliser `window.location.origin`

**Résultat** : ✅ Page fonctionne en local et Codespaces

