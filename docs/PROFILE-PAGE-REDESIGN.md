# Refonte de la Page Profil Utilisateur

## 📋 Vue d'Ensemble

Refonte complète de la page **Profil** avec un design moderne inspiré de interfaces professionnelles, incluant la gestion des préférences utilisateur (timezone, notifications, etc.).

### Accès

**Route :** `/profile`  
**Permission requise :** Utilisateur authentifié

---

## 🎨 Nouveau Design

### Structure de la Page

La page est divisée en **4 sections distinctes** :

```
┌─────────────────────────────────────────────────────────┐
│ 📸 User Profile                                         │
│    - Avatar avec upload                                 │
│    - Full Name, Email, Mobile                          │
│    - Matricule (read-only)                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔔 Notifications                                        │
│    - Channel (In App, Email, SMS, Push)                │
│    - Notify on new order                                │
│    - Activity Updates                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⏰ Time Preferences                                     │
│    - Timezone (GMT+1:00 - Brussels)                    │
│    - Datetime Format (12h/24h)                         │
│    - First day of week (Monday/Sunday)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🆔 Account Information (Read-only)                     │
│    - Matricule                                          │
│    - Rôle (Admin, Editor, Reader)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Section 1 : User Profile

### Champs Éditables

#### 1. **Avatar**
- Affichage : Photo de profil circulaire avec ring primary
- Fallback : Initiales sur fond gradient primary/secondary
- Upload : Bouton "Upload Photo" (PNG/JPEG, max 5MB)
- Remove : Bouton "Remove Photo" (si avatar présent)

#### 2. **Full Name**
- Label : "Full Name"
- Icône : User02Icon
- Placeholder : "Denish Navadiya"
- Validation : Requis
- Note : Stocke firstName (pour l'instant, lastName séparé à implémenter)

#### 3. **User (Matricule)**
- Format : `nexus.com/` + `matricule`
- État : Read-only (géré par administrateurs)
- Exemple : `nexus.com/withden`

#### 4. **Email**
- Label : "Email"
- Icône : Mail01Icon
- Placeholder : "test@gmail.com"
- Validation : Format email requis
- Type : email professionnel

#### 5. **Mobile**
- Label : "Mobile"
- Icône : SmartPhone01Icon
- Placeholder : "(+123) 9876543210"
- Validation : Optionnel
- Note : **Nouveau champ** (à ajouter en BDD)

### Actions

**Bouton Update** :
- Position : Coin inférieur droit
- États :
  - Normal : "Update" avec icône Upload
  - En cours : "Updating..." avec spinner
  - Succès : Alert verte pendant 3 secondes
  - Erreur : Alert rouge

**API Backend :**
```http
PATCH /api/users/me/profile
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "firstName": "Denish",
  "lastName": "Navadiya",
  "email": "test@gmail.com",
  "phone": "(+123) 9876543210",
  "avatarUrl": null
}
```

---

## 🔔 Section 2 : Notifications

### Préférences de Notification

#### 1. **Channel**
- Options :
  - In App (défaut)
  - Email
  - SMS
  - Push Notification

#### 2. **Notify on new order**
- Options :
  - All
  - Important (défaut)
  - Urgent Only
  - None

#### 3. **Activity Updates**
- Options :
  - All Updates
  - Only @mention (défaut)
  - When Assigned
  - None

### État Actuel

⚠️ **Non connecté au backend** - Les préférences sont stockées localement dans le composant.

**TODO Backend :**
```typescript
// Ajouter table UserPreferences
model UserPreferences {
  id                 String   @id @default(uuid())
  userId             String   @unique
  notifChannel       String   @default("in_app")
  notifNewOrder      String   @default("important")
  notifActivityUpdates String @default("mention")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

**API Future :**
```http
PATCH /api/users/me/preferences/notifications
{
  "channel": "in_app",
  "newOrderNotif": "important",
  "activityUpdates": "mention"
}
```

---

## ⏰ Section 3 : Time Preferences

### Paramètres Temporels

#### 1. **Timezone**
- Liste complète de timezones
- Format : `GMT+X:XX - City (Acronym)`
- Défaut : `Europe/Brussels` (GMT+1:00 - CET)

**Timezones disponibles :**
- Europe/Brussels (GMT+1:00 - CET)
- Europe/Paris (GMT+1:00 - CET)
- Europe/London (GMT+0:00 - GMT)
- America/New_York (GMT-5:00 - EST)
- America/Los_Angeles (GMT-8:00 - PST)
- Asia/Tokyo (GMT+9:00 - JST)
- Australia/Sydney (GMT+11:00 - AEDT)

#### 2. **Datetime Format**
- 12-hour (AM/PM) - défaut
- 24-hour

#### 3. **First day of week**
- Sunday
- Monday (défaut)
- Saturday

### Actions

**Bouton Cancel** :
- Réinitialise les valeurs par défaut

**Bouton Update** :
- Sauvegarde les préférences temporelles
- Alert de confirmation

**Footer Link** :
- "You might looking for: Manage users" → `/admin/settings`

### État Actuel

⚠️ **Non connecté au backend** - Les préférences sont stockées localement.

**TODO Backend :**
```typescript
// Ajouter à UserPreferences
model UserPreferences {
  // ... autres champs
  timezone          String   @default("Europe/Brussels")
  dateFormat        String   @default("12h")
  firstDayOfWeek    String   @default("monday")
}
```

**API Future :**
```http
PATCH /api/users/me/preferences/time
{
  "timezone": "Europe/Brussels",
  "dateFormat": "12h",
  "firstDayOfWeek": "monday"
}
```

---

## 🆔 Section 4 : Account Information

### Informations en Lecture Seule

#### 1. **Matricule**
- Affichage : Police monospace sur fond gris
- Icône : IdIcon
- Exemple : `BE-POL-2024-001`
- Gestion : Administrateurs uniquement

#### 2. **Rôle**
- Affichage : Badge primary
- Valeurs possibles :
  - admin
  - editor
  - reader
- Gestion : Administrateurs uniquement

---

## 💻 Implémentation Technique

### Fichier Modifié

**`frontend/src/pages/ProfilePage.vue`** (refonte complète)

### Imports

```typescript
import { HugeiconsIcon } from "@hugeicons/vue";
import { 
  User02Icon,
  Notification03Icon,
  Time01Icon,
  Upload01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  IdIcon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";
```

### État Réactif

```typescript
// Formulaire profil utilisateur
const profileForm = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",          // NOUVEAU
  avatarUrl: "",
});

// Formulaire notifications
const notificationForm = reactive({
  channel: "in_app",
  newOrderNotif: "important",
  activityUpdates: "mention",
});

// Formulaire préférences temporelles
const timeForm = reactive({
  timezone: "Europe/Brussels",
  dateFormat: "12h",
  firstDayOfWeek: "monday",
});
```

### Fonctions Principales

#### `handleProfileUpdate()`

Met à jour le profil utilisateur (nom, email, téléphone, avatar).

```typescript
async function handleProfileUpdate() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      email: profileForm.email,
      phone: profileForm.phone || null,
      avatarUrl: profileForm.avatarUrl || null,
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);
      profileForm.avatarUrl = response.data.user.avatarUrl || "";
    }

    message.value = {
      type: "success",
      text: "Profil mis à jour avec succès !",
    };

    setTimeout(() => {
      message.value = null;
    }, 3000);
  } catch (err: any) {
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de la mise à jour",
    };
  } finally {
    saving.value = false;
  }
}
```

#### `handleImageUpload()`

Upload d'avatar via FormData.

```typescript
async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // Validation
  if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
    message.value = { type: "error", text: "Seuls PNG/JPEG acceptés" };
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = { type: "error", text: "Max 5MB" };
    return;
  }

  saving.value = true;
  message.value = null;

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);
      profileForm.avatarUrl = response.data.user.avatarUrl || "";
    }

    message.value = { type: "success", text: "Photo mise à jour !" };
    setTimeout(() => { message.value = null; }, 3000);
  } catch (err: any) {
    message.value = { type: "error", text: "Erreur upload" };
  } finally {
    saving.value = false;
    target.value = "";
  }
}
```

#### `handleNotificationUpdate()`

⚠️ **TODO** - À implémenter quand backend prêt.

#### `handleTimePreferencesUpdate()`

⚠️ **TODO** - À implémenter quand backend prêt.

---

## 🎨 Styles et Design

### Cards Sections

```vue
<div class="bg-base-100 rounded-lg shadow-md border border-base-200">
  <!-- Header -->
  <div class="p-6 border-b border-base-200">
    <div class="flex items-center gap-3">
      <HugeiconsIcon :icon="Icon" class="w-6 h-6 text-primary" />
      <div>
        <h2 class="text-xl font-semibold">Section Title</h2>
        <p class="text-sm text-base-content/60">Description</p>
      </div>
    </div>
  </div>
  
  <!-- Body -->
  <div class="p-6">
    <!-- Contenu -->
  </div>
</div>
```

### Input Groups avec Icônes

```vue
<div class="input-group">
  <span class="bg-base-200 px-3 flex items-center border border-r-0 border-base-300 rounded-l-lg">
    <HugeiconsIcon :icon="Icon" class="w-4 h-4 text-base-content/60" />
  </span>
  <input
    v-model="model"
    type="text"
    class="input input-bordered flex-1 rounded-l-none"
  />
</div>
```

### Avatar avec Gradient

```vue
<div
  class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center text-2xl font-bold ring ring-primary ring-offset-base-100 ring-offset-2"
>
  {{ userInitials }}
</div>
```

### Alerts Messages

```vue
<div v-if="message" :class="`alert alert-${message.type} shadow-lg`" class="mb-6">
  <div class="flex items-center gap-2">
    <HugeiconsIcon 
      :icon="message.type === 'success' ? User02Icon : Cancel01Icon" 
      class="w-5 h-5"
    />
    <span>{{ message.text }}</span>
  </div>
  <button @click="message = null" class="btn btn-ghost btn-sm btn-circle">
    <HugeiconsIcon :icon="Cancel01Icon" class="w-4 h-4" />
  </button>
</div>
```

---

## 🔐 Sécurité

### Validation Frontend

**Email :**
- Type `email` HTML5
- Attribut `required`

**Téléphone :**
- Type `tel` HTML5
- Optionnel

**Upload Image :**
- Types autorisés : PNG, JPEG, JPG
- Taille max : 5MB
- Validation avant upload

### Permissions

**User Profile** :
- Utilisateur peut modifier ses propres données
- Matricule et rôle : read-only (admin uniquement)

**Notifications & Time** :
- Accessible à tous les utilisateurs authentifiés
- Préférences personnelles

---

## 🚧 TODO Backend

### 1. Ajouter le champ `phone` au modèle User

**Schema Prisma :**
```prisma
model User {
  id           String     @id @default(uuid())
  firstName    String
  lastName     String
  matricule    String     @unique
  email        String     @unique
  phone        String?    // NOUVEAU
  passwordHash String
  avatarUrl    String?
  roleId       String
  status       UserStatus @default(PENDING)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  // ... relations
}
```

**Migration :**
```bash
npx prisma migrate dev --name add_user_phone
```

### 2. Créer le modèle UserPreferences

**Schema Prisma :**
```prisma
model UserPreferences {
  id                    String   @id @default(uuid())
  userId                String   @unique
  
  // Notifications
  notifChannel          String   @default("in_app")
  notifNewOrder         String   @default("important")
  notifActivityUpdates  String   @default("mention")
  
  // Time Preferences
  timezone              String   @default("Europe/Brussels")
  dateFormat            String   @default("12h")
  firstDayOfWeek        String   @default("monday")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Ajouter dans User model :
model User {
  // ... champs existants
  preferences UserPreferences?
}
```

**Migration :**
```bash
npx prisma migrate dev --name add_user_preferences
```

### 3. Créer les endpoints API

#### Endpoint Notifications

**Fichier :** `backend/src/modules/users/user.controller.ts`

```typescript
export async function updateNotificationPreferences(req: Request, res: Response) {
  const userId = req.user!.id;
  const { channel, newOrderNotif, activityUpdates } = req.body;

  try {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        notifChannel: channel,
        notifNewOrder: newOrderNotif,
        notifActivityUpdates: activityUpdates,
      },
      create: {
        userId,
        notifChannel: channel,
        notifNewOrder: newOrderNotif,
        notifActivityUpdates: activityUpdates,
      },
    });

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

**Route :**
```typescript
router.patch(
  '/me/preferences/notifications',
  requireAuth,
  updateNotificationPreferences
);
```

#### Endpoint Time Preferences

```typescript
export async function updateTimePreferences(req: Request, res: Response) {
  const userId = req.user!.id;
  const { timezone, dateFormat, firstDayOfWeek } = req.body;

  try {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        timezone,
        dateFormat,
        firstDayOfWeek,
      },
      create: {
        userId,
        timezone,
        dateFormat,
        firstDayOfWeek,
      },
    });

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

**Route :**
```typescript
router.patch(
  '/me/preferences/time',
  requireAuth,
  updateTimePreferences
);
```

#### Endpoint Get Preferences

```typescript
export async function getUserPreferences(req: Request, res: Response) {
  const userId = req.user!.id;

  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

**Route :**
```typescript
router.get(
  '/me/preferences',
  requireAuth,
  getUserPreferences
);
```

### 4. Modifier endpoint PATCH /users/me/profile

Ajouter support du champ `phone` :

```typescript
export async function updateProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  const { firstName, lastName, email, phone, avatarUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone,  // NOUVEAU
        avatarUrl,
      },
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

---

## 🧪 Tests

### Test 1 : Mise à Jour Profil

```bash
# 1. Se connecter
# 2. Naviguer vers /profile
# 3. Modifier Full Name, Email, Mobile
# 4. Cliquer Update

Attendu :
✅ Message "Profil mis à jour avec succès !"
✅ Données sauvegardées en base
✅ Message disparaît après 3 secondes
```

### Test 2 : Upload Avatar

```bash
# 1. Cliquer "Upload Photo"
# 2. Sélectionner une image PNG (< 5MB)

Attendu :
✅ Image uploadée et affichée
✅ Message "Photo mise à jour !"
✅ Avatar visible dans header/sidebar
```

### Test 3 : Validation Upload

```bash
# Test 3a : Fichier > 5MB
Attendu : ❌ "Le fichier est trop volumineux"

# Test 3b : Fichier PDF
Attendu : ❌ "Seuls PNG/JPEG acceptés"
```

### Test 4 : Preferences (quand backend implémenté)

```bash
# 1. Modifier Timezone → Europe/Paris
# 2. Modifier Date Format → 24h
# 3. Cliquer Update

Attendu :
✅ Préférences sauvegardées
✅ Application des préférences dans l'UI
```

---

## 📚 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Sections** | 1 (Profil uniquement) | 4 (Profil, Notif, Time, Account) |
| **Champs** | 4 (Nom, Email, Avatar, Matricule) | 9 (+ Mobile, Timezone, etc.) |
| **Design** | Card simple | Cards séparées avec headers |
| **Icônes** | 1 (Upload) | 8 (User, Mail, Phone, etc.) |
| **Preferences** | ❌ Aucune | ✅ Notif + Time |
| **Layout** | 1 colonne | Responsive (3 cols → 1 col mobile) |
| **Avatar** | Ring primary | Gradient + Ring |
| **Read-only** | Inline | Section dédiée |

---

## 🎯 Résumé

| Fonctionnalité | Status |
|----------------|--------|
| **UI Profile Section** | ✅ Complet |
| **UI Notifications Section** | ✅ Complet |
| **UI Time Preferences Section** | ✅ Complet |
| **UI Account Info Section** | ✅ Complet |
| **Upload Avatar** | ✅ Fonctionnel |
| **Update Profile (nom, email)** | ✅ Fonctionnel |
| **Champ Mobile (frontend)** | ✅ Complet |
| **Champ Mobile (backend)** | ⏳ TODO |
| **Preferences API** | ⏳ TODO |
| **Timezone Support** | ⏳ TODO |
| **Build Frontend** | ✅ Réussi |
| **Documentation** | ✅ Complète |

---

**Implémenté le :** 13 octobre 2025  
**Auteur :** GitHub Copilot  
**Version :** 2.0.0  
**Status :** ✅ UI Complète - Backend partiellement à implémenter
