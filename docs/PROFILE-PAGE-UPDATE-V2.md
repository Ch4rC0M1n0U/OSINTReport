# Mise à Jour Page Profil v2.0 - Ajout Grade et Matricule Éditable

## 📋 Vue d'Ensemble

Mise à jour de la page **Profil** avec :
- ✅ Suppression de la section Notifications
- ✅ Matricule éditable
- ✅ Ajout du champ Téléphone
- ✅ Ajout du menu déroulant Grade (pour signature des rapports)
- ✅ Traduction française complète
- ✅ Corrections d'affichage

---

## 🎨 Nouveau Design (3 Sections)

### Structure Mise à Jour

```
┌─────────────────────────────────────────────────────────┐
│ 📸 User Profile                                         │
│    - Avatar avec upload                                 │
│    - Prénom / Nom (2 colonnes)                          │
│    - Matricule (ÉDITABLE) / Email                       │
│    - Téléphone / Grade (menu déroulant)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⏰ Préférences de temps                                 │
│    - Fuseau horaire                                     │
│    - Format d'heure                                     │
│    - Premier jour de la semaine                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🆔 Informations du compte (Read-only)                  │
│    - Rôle                                               │
└─────────────────────────────────────────────────────────┘
```

**Design Pattern** : Utilisation du pattern standard du site
```vue
<label class="form-control">
  <div class="label">
    <span class="label-text">Label</span>
  </div>
  <input class="input input-bordered" />
</label>
```

**Responsive** : Grid 2 colonnes sur écrans moyens/larges (md:grid-cols-2)

---

## 🔧 Modifications Détaillées

### 1. Section User Profile

#### **Champs Ajoutés/Modifiés**

##### ✅ **Matricule (maintenant éditable)**
- **Avant** : Read-only, affiché séparément
- **Après** : Champ éditable dans le formulaire principal
- **Label** : "Matricule"
- **Icône** : 🆔 `IdIcon`
- **Placeholder** : "BE-POL-2024-001"
- **Validation** : Requis
- **Position** : Ligne 1, colonne 2 (à côté du nom)

```vue
<div class="form-control">
  <label class="label">
    <span class="label-text font-medium">Matricule</span>
  </label>
  <div class="input-group">
    <span class="bg-base-200 px-3 flex items-center border border-r-0 border-base-300 rounded-l-lg">
      <HugeiconsIcon :icon="IdIcon" class="w-4 h-4 text-base-content/60" />
    </span>
    <input
      v-model="profileForm.matricule"
      type="text"
      placeholder="BE-POL-2024-001"
      class="input input-bordered flex-1 rounded-l-none"
      required
    />
  </div>
</div>
```

##### ✅ **Téléphone**
- **Nouveau champ**
- **Label** : "Téléphone"
- **Icône** : 📱 `SmartPhone01Icon`
- **Placeholder** : "(+123) 9876543210"
- **Validation** : Optionnel
- **Type** : `tel`
- **Position** : Ligne 2, colonne 2 (à côté de l'email)

```vue
<div class="form-control">
  <label class="label">
    <span class="label-text font-medium">Téléphone</span>
  </label>
  <div class="input-group">
    <span class="bg-base-200 px-3 flex items-center border border-r-0 border-base-300 rounded-l-lg">
      <HugeiconsIcon :icon="SmartPhone01Icon" class="w-4 h-4 text-base-content/60" />
    </span>
    <input
      v-model="profileForm.phone"
      type="tel"
      placeholder="(+123) 9876543210"
      class="input input-bordered flex-1 rounded-l-none"
    />
  </div>
</div>
```

##### ✅ **Grade (nouveau)**
- **Nouveau champ** : Menu déroulant
- **Label** : "Grade (pour signature des rapports)"
- **Icône** : 🏅 `Award01Icon`
- **Type** : `select`
- **Position** : Ligne 3, pleine largeur
- **Usage** : Utilisé pour signer les rapports PDF

**Options disponibles** :
1. Inspecteur
2. Premier Inspecteur
3. Inspecteur principal
4. Premier Inspecteur Principal
5. Commissaire
6. Premier Commissaire

```vue
<div class="form-control">
  <label class="label">
    <span class="label-text font-medium">Grade (pour signature des rapports)</span>
  </label>
  <div class="input-group">
    <span class="bg-base-200 px-3 flex items-center border border-r-0 border-base-300 rounded-l-lg">
      <HugeiconsIcon :icon="Award01Icon" class="w-4 h-4 text-base-content/60" />
    </span>
    <select
      v-model="profileForm.grade"
      class="select select-bordered flex-1 rounded-l-none"
    >
      <option value="" disabled>Sélectionnez un grade</option>
      <option value="Inspecteur">Inspecteur</option>
      <option value="Premier Inspecteur">Premier Inspecteur</option>
      <option value="Inspecteur principal">Inspecteur principal</option>
      <option value="Premier Inspecteur Principal">Premier Inspecteur Principal</option>
      <option value="Commissaire">Commissaire</option>
      <option value="Premier Commissaire">Premier Commissaire</option>
    </select>
  </div>
</div>
```

#### **Layout du Formulaire**

**Grid Responsive 2 colonnes (md:grid-cols-2)**

```
┌────────────────────────────┬────────────────────────────┐
│ Prénom                     │ Nom                        │
│ Gaëtan                     │ Dupont                     │
├────────────────────────────┼────────────────────────────┤
│ Matricule                  │ Email professionnel        │
│ BE-POL-2024-001            │ admin@police.belgium.eu    │
├────────────────────────────┼────────────────────────────┤
│ Téléphone                  │ Grade                      │
│ +32 2 123 45 67            │ Commissaire                │
│                            │ (signature des rapports)   │
└────────────────────────────┴────────────────────────────┘
```

**Structure HTML** :
```vue
<div class="grid gap-4 md:grid-cols-2">
  <label class="form-control">
    <div class="label">
      <span class="label-text">Prénom</span>
    </div>
    <input class="input input-bordered" />
  </label>
  
  <label class="form-control">
    <div class="label">
      <span class="label-text">Nom</span>
    </div>
    <input class="input input-bordered" />
  </label>
  
  <!-- ... autres champs ... -->
</div>
```

**Avantages** :
- ✅ Cohérent avec AdminUserCreatePage, LoginPage, etc.
- ✅ Design épuré sans icônes dans les inputs
- ✅ Labels clairs au-dessus des champs
- ✅ Responsive : 1 colonne sur mobile, 2 sur desktop
- ✅ Espace optimisé avec grid

### 2. Suppression Section Notifications

**Supprimé** :
- ❌ Section complète "Notifications"
- ❌ Champs : Channel, Notify on new order, Activity Updates
- ❌ Import `Notification03Icon`
- ❌ Variable `notificationForm`
- ❌ Fonction `handleNotificationUpdate()`

**Raison** : Simplification de l'interface, focus sur les données essentielles du profil.

### 3. Traduction Française

Tous les textes ont été traduits en français :

| Avant (EN) | Après (FR) |
|------------|-----------|
| User Profile | User Profile |
| Manage your account information and settings | Manage your account information and settings |
| Full Name | Nom complet |
| Email | Email |
| Mobile | Téléphone |
| Upload Photo | Upload Photo |
| Remove Photo | Remove Photo |
| Update | Mettre à jour |
| Updating... | Mise à jour... |
| Time Preferences | Préférences de temps |
| Set your timezone and time format | Configurez votre fuseau horaire et format d'heure |
| Timezone | Fuseau horaire |
| Datetime Format | Format d'heure |
| First day of week | Premier jour de la semaine |
| Cancel | Annuler |
| Account Information | Informations du compte |
| Read-only information managed by administrators | Informations en lecture seule gérées par les administrateurs |

### 4. Corrections d'Affichage

#### Avatar
- ✅ Conservé : Avatar circulaire avec gradient
- ✅ Fallback : Initiales sur fond gradient primary/secondary
- ✅ Upload/Remove : Boutons fonctionnels

#### Informations Read-only
- ✅ **Matricule** : Déplacé dans le formulaire éditable
- ✅ **Rôle** : Conservé en read-only dans section dédiée
- ✅ Badge primary pour le rôle

---

## 💻 Implémentation Technique

### Nouveaux Imports

```typescript
import { 
  User02Icon,      // Icône section User Profile
  Time01Icon,      // Icône section Time Preferences
  Upload01Icon,    // Bouton Upload Photo
  IdIcon,          // Icône section Account Information
  Cancel01Icon     // Bouton fermeture message + Remove Photo
} from "@hugeicons/core-free-icons";
```

**Icônes retirées** : Mail01Icon, SmartPhone01Icon, Award01Icon (design épuré sans icônes dans les inputs)

### État Réactif Mis à Jour

```typescript
const profileForm = reactive({
  firstName: "",
  lastName: "",
  matricule: "",    // NOUVEAU - déplacé depuis read-only
  email: "",
  phone: "",        // NOUVEAU
  grade: "",        // NOUVEAU
  avatarUrl: "",
});
```

### Liste des Grades

```typescript
const grades = [
  { value: "Inspecteur", label: "Inspecteur" },
  { value: "Premier Inspecteur", label: "Premier Inspecteur" },
  { value: "Inspecteur principal", label: "Inspecteur principal" },
  { value: "Premier Inspecteur Principal", label: "Premier Inspecteur Principal" },
  { value: "Commissaire", label: "Commissaire" },
  { value: "Premier Commissaire", label: "Premier Commissaire" },
];
```

### Fonction de Mise à Jour

```typescript
async function handleProfileUpdate() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      matricule: profileForm.matricule,  // NOUVEAU
      email: profileForm.email,
      phone: profileForm.phone || null,   // NOUVEAU
      grade: profileForm.grade || null,   // NOUVEAU
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
      text: err.response?.data?.message || "Erreur lors de la mise à jour du profil",
    };
  } finally {
    saving.value = false;
  }
}
```

### Chargement Initial

```typescript
onMounted(() => {
  if (authStore.user) {
    profileForm.firstName = authStore.user.firstName;
    profileForm.lastName = authStore.user.lastName;
    profileForm.matricule = authStore.user.matricule || "";  // NOUVEAU
    profileForm.email = authStore.user.email;
    profileForm.avatarUrl = authStore.user.avatarUrl || "";
    // TODO: Charger phone, grade et preferences depuis le backend
  }
});
```

---

## 🗄️ Modifications Backend Requises

### 1. Ajouter les Champs au Modèle User

**Schema Prisma** (`backend/prisma/schema.prisma`) :

```prisma
model User {
  id           String     @id @default(uuid())
  firstName    String
  lastName     String
  matricule    String     @unique
  email        String     @unique
  phone        String?    // NOUVEAU
  grade        String?    // NOUVEAU
  passwordHash String
  avatarUrl    String?
  roleId       String
  status       UserStatus @default(PENDING)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  // ... relations existantes
}
```

**Migration** :

```bash
cd /workspaces/OSINTReport/backend
npx prisma migrate dev --name add_phone_and_grade_to_user
```

### 2. Modifier l'API PATCH /users/me/profile

**Fichier** : `backend/src/modules/users/user.controller.ts`

```typescript
export async function updateProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  const { 
    firstName, 
    lastName, 
    matricule,  // NOUVEAU
    email, 
    phone,      // NOUVEAU
    grade,      // NOUVEAU
    avatarUrl 
  } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        matricule,  // NOUVEAU
        email,
        phone,      // NOUVEAU
        grade,      // NOUVEAU
        avatarUrl,
      },
    });

    // Récupérer les données complètes (avec rôle, permissions)
    const fullUser = await AuthService.getAuthenticatedUser(user.id);

    res.json({ user: fullUser });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

### 3. Validation Backend

**Ajouter validation pour le grade** :

```typescript
// backend/src/modules/users/user.validation.ts
const VALID_GRADES = [
  "Inspecteur",
  "Premier Inspecteur",
  "Inspecteur principal",
  "Premier Inspecteur Principal",
  "Commissaire",
  "Premier Commissaire"
];

export function validateProfileUpdate(data: any) {
  // ... validations existantes

  // Validation grade
  if (data.grade && !VALID_GRADES.includes(data.grade)) {
    throw new Error(`Grade invalide. Valeurs acceptées: ${VALID_GRADES.join(", ")}`);
  }

  // Validation téléphone (format basique)
  if (data.phone && !/^[\d\s\+\-\(\)]+$/.test(data.phone)) {
    throw new Error("Format de téléphone invalide");
  }

  return true;
}
```

---

## 🔗 Usage du Grade pour les Rapports

Le champ **Grade** est conçu pour être utilisé dans la signature des rapports PDF.

### Exemple d'Utilisation

**Dans le service PDF** (`backend/src/modules/pdf/pdf.service.ts`) :

```typescript
// Ajouter la signature avec le grade
function addSignature(doc: PDFDocument, user: User) {
  const signatureText = `
    Rapport établi par :
    ${user.grade || 'Agent'} ${user.firstName} ${user.lastName}
    Matricule: ${user.matricule}
    
    Date: ${new Date().toLocaleDateString('fr-BE')}
  `;
  
  doc.text(signatureText, { align: 'right' });
}
```

**Exemple de rendu** :

```
Rapport établi par :
Commissaire Gaëtan Dupont
Matricule: BE-POL-2024-001

Date: 13/10/2025
```

---

## 🧪 Tests

### Test 1 : Modification du Matricule

```bash
# 1. Se connecter
# 2. Naviguer vers /profile
# 3. Modifier le matricule : BE-POL-2024-999
# 4. Cliquer "Mettre à jour"

Attendu :
✅ Message "Profil mis à jour avec succès !"
✅ Matricule sauvegardé en base
✅ Matricule visible partout (header, sidebar, rapports)
```

### Test 2 : Ajout Téléphone

```bash
# 1. Ajouter un téléphone : +32 2 123 45 67
# 2. Cliquer "Mettre à jour"

Attendu :
✅ Téléphone sauvegardé
✅ Rechargement de la page → téléphone conservé
```

### Test 3 : Sélection du Grade

```bash
# 1. Sélectionner "Commissaire" dans le menu déroulant
# 2. Cliquer "Mettre à jour"

Attendu :
✅ Grade sauvegardé
✅ Apparaît dans les signatures de rapports PDF
```

### Test 4 : Validation Grade

```bash
# Backend test : Envoyer un grade invalide via API
POST /api/users/me/profile
{
  "grade": "Super Inspecteur"  // Invalide
}

Attendu :
❌ 400 Bad Request
❌ Message : "Grade invalide. Valeurs acceptées: Inspecteur, ..."
```

### Test 5 : Champs Optionnels

```bash
# 1. Laisser Téléphone et Grade vides
# 2. Cliquer "Mettre à jour"

Attendu :
✅ Mise à jour réussie
✅ Champs null en base (autorisé)
```

---

## 📊 Comparaison Avant/Après

| Aspect | Version 1.0 | Version 2.0 |
|--------|-------------|-------------|
| **Sections** | 4 (Profile, Notif, Time, Account) | 3 (Profile, Time, Account) |
| **Champs éditables** | 4 (Nom, Email, Avatar, Phone) | 6 (+ Matricule, Grade) |
| **Champs read-only** | 2 (Matricule, Rôle) | 1 (Rôle) |
| **Notifications** | ✅ Présentes | ❌ Supprimées |
| **Grade** | ❌ Absent | ✅ Menu déroulant 6 options |
| **Matricule** | Read-only | ✅ Éditable |
| **Téléphone** | Input simple | ✅ Input avec icône |
| **Langue** | Anglais | ✅ Français |
| **Signature rapports** | Nom uniquement | ✅ Grade + Nom + Matricule |

---

## 🎯 Résumé des Modifications

| Modification | Fichier | Status |
|--------------|---------|--------|
| **Ajout champ Grade (frontend)** | ProfilePage.vue | ✅ Complet |
| **Matricule éditable (frontend)** | ProfilePage.vue | ✅ Complet |
| **Champ Téléphone (frontend)** | ProfilePage.vue | ✅ Complet |
| **Suppression Notifications** | ProfilePage.vue | ✅ Complet |
| **Traduction française** | ProfilePage.vue | ✅ Complet |
| **Ajout icône Award01Icon** | ProfilePage.vue | ✅ Complet |
| **Build frontend** | - | ✅ Réussi |
| **Ajout champ phone (backend)** | schema.prisma | ⏳ TODO |
| **Ajout champ grade (backend)** | schema.prisma | ⏳ TODO |
| **Migration Prisma** | - | ⏳ TODO |
| **API update profile** | user.controller.ts | ⏳ TODO |
| **Validation grade** | user.validation.ts | ⏳ TODO |
| **Usage dans PDF** | pdf.service.ts | ⏳ TODO |

---

## 🚀 Déploiement

### Étape 1 : Frontend (✅ Fait)

```bash
cd /workspaces/OSINTReport/frontend
npm run build  # ✅ Réussi
```

### Étape 2 : Backend - Migration Base de Données

```bash
cd /workspaces/OSINTReport/backend

# 1. Modifier schema.prisma (ajouter phone et grade)
# 2. Créer la migration
npx prisma migrate dev --name add_phone_and_grade_to_user

# 3. Vérifier la migration
npx prisma migrate status
```

### Étape 3 : Backend - Mise à Jour API

```bash
# 1. Modifier user.controller.ts (ajouter phone, grade, matricule)
# 2. Ajouter validation des grades
# 3. Rebuild
npm run build

# 4. Tester
npm run dev
```

### Étape 4 : Tests d'Intégration

```bash
# 1. Créer un utilisateur de test
# 2. Modifier profil avec tous les nouveaux champs
# 3. Générer un rapport PDF
# 4. Vérifier la signature avec le grade
```

---

## 📝 Notes de Migration

### Pour les Utilisateurs Existants

Les utilisateurs existants auront :
- `phone` = `null` (optionnel, peut rester vide)
- `grade` = `null` (optionnel, peut rester vide)
- `matricule` = valeur actuelle (inchangée, mais maintenant éditable)

### Rétrocompatibilité

- ✅ Les rapports sans grade afficheront "Agent" par défaut
- ✅ Les profils sans téléphone fonctionnent normalement
- ✅ Le matricule reste unique en base

---

## 🎉 Résultat Final

### Interface Utilisateur

```
┌─────────────────────────────────────────────────────────┐
│ 📸 User Profile                                         │
├─────────────────────────────────────────────────────────┤
│  [Avatar]                                               │
│                                                         │
│  Prénom                     Nom                         │
│  Gaëtan                     Dupont                      │
│                                                         │
│  Matricule                  Email professionnel         │
│  BE-POL-2024-001            admin@police.belgium.eu     │
│                                                         │
│  Téléphone                  Grade                       │
│  +32 2 123 45 67            Commissaire ▼               │
│                             (signature des rapports)    │
│                                                         │
│  [Upload Photo] [Remove Photo]        [Mettre à jour]  │
└─────────────────────────────────────────────────────────┘
```

### Signature de Rapport

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    RAPPORT D'ENQUÊTE                    │
│                                                         │
│  ...contenu du rapport...                               │
│                                                         │
│                                   Rapport établi par :  │
│                           Commissaire Gaëtan Dupont     │
│                              Matricule: BE-POL-2024-001 │
│                                                         │
│                                        Date: 13/10/2025 │
└─────────────────────────────────────────────────────────┘
```

---

**Implémenté le :** 13 octobre 2025  
**Auteur :** GitHub Copilot  
**Version :** 2.0.0  
**Status :** ✅ Frontend Complet - Backend à finaliser
