# 🔐 Refonte du système de signature et validation des rapports

**Date**: 29 octobre 2025  
**Version**: 2.0  
**Status**: ✅ Implémenté

## 📋 Résumé des changements

Le système de signature des rapports a été complètement refondu pour séparer clairement deux rôles :

1. **Signature par le rédacteur** : Le rédacteur du rapport signe son travail avec ses informations de profil
2. **Validation par un officier** : Un officier peut valider et verrouiller le rapport après relecture

## 🎯 Objectifs

- ✅ Le rédacteur signe automatiquement avec ses informations de profil
- ✅ La signature manuscrite est récupérée automatiquement depuis le profil
- ✅ Un officier peut valider et verrouiller un rapport
- ✅ Protection anti-screenshot pour les signatures
- ✅ Verrouillage automatique après validation officier
- ✅ Seuls le rédacteur et le validateur peuvent modifier un rapport verrouillé

---

## 🗄️ Modifications de la base de données

### Nouveau schéma `Report`

Ajout des champs suivants dans le modèle `Report` :

```prisma
model Report {
  // ... champs existants ...

  // Validation officier
  validatedAt          DateTime? // Date de validation par l'officier
  validatedById        String?   // ID de l'officier qui a validé
  validatorSignatureUrl String?  // URL de la signature de l'officier validateur
  validatorNotes       String?   // Notes de l'officier validateur
  isLocked             Boolean   @default(false) // Rapport verrouillé après validation

  // Relations
  validator   User? @relation("ReportValidator", fields: [validatedById], references: [id])
}

model User {
  // ... champs existants ...
  validatedReports Report[] @relation("ReportValidator")
}
```

### Migration Prisma

```bash
npx prisma migrate dev --name add_officer_validation_fields
```

---

## 🔧 Backend - Modifications

### 1. Routes ajoutées (`report.router.ts`)

```typescript
// Validation par l'officier
reportRouter.post(
  "/:reportId/validate",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.validateReport(req, res, next)
);

reportRouter.delete(
  "/:reportId/validate",
  requirePermissions(PermissionCode.ADMIN),
  (req, res, next) => ReportController.removeValidation(req, res, next)
);
```

### 2. Validation schema (`report.validation.ts`)

```typescript
export const validateReportSchema = z.object({
  validatorNotes: z.string().optional(),
});
```

### 3. Service methods (`report.service.ts`)

#### `validateReport(reportId, validatorId, notes?)`

- Vérifie que le rapport n'est pas déjà verrouillé
- Récupère automatiquement la signature de l'officier validateur
- Met à jour le rapport avec les informations de validation
- Verrouille le rapport (`isLocked = true`)

```typescript
static async validateReport(reportId: string, validatorId: string, notes?: string) {
  // Vérification si déjà verrouillé
  if (report.isLocked) {
    throw createError(403, "Le rapport est déjà verrouillé");
  }

  // Récupération des infos de l'officier
  const validator = await prisma.user.findUnique({
    where: { id: validatorId },
    select: { id: true, firstName: true, lastName: true, signatureUrl: true },
  });

  // Validation et verrouillage
  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: {
      validatedAt: new Date(),
      validatedById: validatorId,
      validatorSignatureUrl: validator.signatureUrl,
      validatorNotes: notes || null,
      isLocked: true,
    },
  });

  return updatedReport;
}
```

#### `removeValidation(reportId)` (Admin uniquement)

Supprime la validation et déverrouille le rapport.

#### Protection lors des modifications

La méthode `updateReport` a été mise à jour pour vérifier le verrouillage :

```typescript
static async updateReport(reportId: string, input: UpdateReportInput, userId?: string) {
  // Vérifier si le rapport est verrouillé
  if (report.isLocked && userId) {
    // Seul le rédacteur original ou le validateur peuvent modifier un rapport verrouillé
    if (report.ownerId !== userId && report.validatedById !== userId) {
      throw createError(403, "Ce rapport est verrouillé");
    }
  }
  // ...
}
```

---

## 🎨 Frontend - Modifications

### 1. Module de signature du rédacteur (`SignOffModule.vue`)

**Avant** : L'officier remplissait manuellement les informations  
**Après** : Le rédacteur signe avec ses informations de profil

#### Fonctionnalités

- ✅ Pré-remplissage automatique avec les données du profil utilisateur
- ✅ Affichage de la signature manuscrite (protection anti-screenshot)
- ✅ Nom, grade, matricule récupérés automatiquement
- ✅ Composant `ProtectedSignature` intégré

```vue
<template>
  <!-- Mode lecture -->
  <div v-if="!isEditing">
    <h3>✍️ Signature du rédacteur</h3>
    <div>Date: {{ modelValue.date }}</div>
    <div>Nom: {{ modelValue.officer.name }}</div>
    <div>Grade: {{ modelValue.officer.rank }}</div>
    <div>Matricule: {{ modelValue.officer.badgeNumber }}</div>

    <!-- Signature protégée -->
    <ProtectedSignature
      v-if="currentUserSignatureUrl"
      :src="currentUserSignatureUrl"
      alt="Signature du rédacteur"
    />
  </div>

  <!-- Mode édition : informations automatiques -->
  <div v-else>
    <p>Vos informations de profil seront utilisées</p>
    <!-- Aperçu read-only des infos -->
  </div>
</template>
```

### 2. Modal de validation officier (`OfficerValidationModal.vue`)

Nouveau composant accessible depuis l'en-tête du rapport.

#### Fonctionnalités

- ✅ Bouton "Valider le rapport" / "Rapport validé" dans l'en-tête
- ✅ Affichage des informations du rapport à valider
- ✅ Récupération automatique des informations de l'officier validateur
- ✅ Affichage de la signature manuscrite de l'officier
- ✅ Champ de notes optionnel
- ✅ Verrouillage automatique après validation
- ✅ Affichage de l'état de validation si déjà validé
- ✅ Déverrouillage pour les admins uniquement

```vue
<template>
  <ModalDialog>
    <!-- Si déjà validé -->
    <div v-if="report.isLocked">
      <div class="alert alert-success">✅ Rapport validé</div>
      <div>
        Validateur: {{ report.validator.firstName }}
        {{ report.validator.lastName }}
      </div>
      <div>Date: {{ formatDate(report.validatedAt) }}</div>
      <ProtectedSignature :src="report.validatorSignatureUrl" />

      <!-- Admin only -->
      <button v-if="isAdmin" @click="handleRemoveValidation">
        🔓 Déverrouiller
      </button>
    </div>

    <!-- Formulaire de validation -->
    <div v-else>
      <div class="alert alert-warning">
        ⚠️ En validant, le rapport sera verrouillé
      </div>

      <h3>Vos informations (automatiques)</h3>
      <div>{{ authStore.user.firstName }} {{ authStore.user.lastName }}</div>
      <div>Grade: {{ authStore.user.grade }}</div>
      <ProtectedSignature :src="authStore.user.signatureUrl" />

      <textarea v-model="validatorNotes" placeholder="Notes..."></textarea>

      <button @click="handleValidate">🔒 Valider et verrouiller</button>
    </div>
  </ModalDialog>
</template>
```

### 3. Types TypeScript

Mise à jour de l'interface `Report` :

```typescript
export interface Report {
  // ... champs existants ...

  // Validation officier
  validatedAt?: string | null;
  validatedById?: string | null;
  validatorSignatureUrl?: string | null;
  validatorNotes?: string | null;
  isLocked?: boolean;
  validator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    grade?: string;
    matricule?: string;
  };
}
```

### 4. API Service

```typescript
export const reportsApi = {
  // ... méthodes existantes ...

  async validateReport(reportId: string, validatorNotes?: string) {
    const response = await api.post<{ report: Report }>(
      `/reports/${reportId}/validate`,
      { validatorNotes }
    );
    return response.data.report;
  },

  async removeValidation(reportId: string) {
    const response = await api.delete<{ report: Report }>(
      `/reports/${reportId}/validate`
    );
    return response.data.report;
  },
};
```

---

## 🔒 Système de verrouillage

### Règles de verrouillage

1. **Déclenchement** : Un rapport est verrouillé (`isLocked = true`) quand un officier le valide
2. **Permissions de modification** :
   - ✅ Rédacteur original (`ownerId`)
   - ✅ Officier validateur (`validatedById`)
   - ❌ Tous les autres utilisateurs (sauf admin)
3. **Admin** : Peut déverrouiller n'importe quel rapport

### Backend enforcement

```typescript
// Dans updateReport
if (report.isLocked && userId) {
  if (report.ownerId !== userId && report.validatedById !== userId) {
    throw createError(403, "Ce rapport est verrouillé");
  }
}
```

### Frontend indication

```vue
<!-- Badge dans l'en-tête -->
<button
  :class="report.isLocked ? 'btn-success' : 'btn-warning'"
  @click="showOfficerValidationModal = true"
>
  <span v-if="report.isLocked">🔒 Rapport validé</span>
  <span v-else>🔓 Valider le rapport</span>
</button>
```

---

## 🛡️ Protection des signatures

Le composant `ProtectedSignature` est utilisé pour afficher les signatures manuscrites :

### Fonctionnalités de protection

- ✅ Détection des raccourcis clavier de screenshot (Impr écran, Cmd+Shift+3/4, Win+Shift+S, etc.)
- ✅ Floutage automatique lors de la perte de focus
- ✅ Watermark avec matricule et timestamp
- ✅ Désactivation du clic droit
- ✅ Désactivation de la sélection
- ✅ Désactivation du drag & drop

### Utilisation

```vue
<ProtectedSignature
  :src="signatureUrl"
  alt="Signature manuscrite"
  class="max-h-32"
/>
```

---

## 📊 Workflow complet

### 1. Rédaction du rapport

```
Rédacteur → Crée le rapport
          → Ajoute les modules
          → Signe avec le module "Signature" (informations automatiques)
```

### 2. Validation officier

```
Officier → Ouvre le rapport
         → Clique sur "Valider le rapport"
         → Modal s'ouvre avec ses informations
         → (Optionnel) Ajoute des notes
         → Clique sur "Valider et verrouiller"
         → Rapport verrouillé ✅
```

### 3. Rapport verrouillé

```
État : isLocked = true
Modifications autorisées pour :
  - Rédacteur original
  - Officier validateur
  - Admin (peut aussi déverrouiller)
```

### 4. Déverrouillage (Admin uniquement)

```
Admin → Ouvre le modal de validation
      → Clique sur "🔓 Déverrouiller"
      → Rapport déverrouillé, validation supprimée
```

---

## 🚀 Déploiement

### 1. Backend

```bash
cd backend
npx prisma migrate deploy
npm run build
pm2 restart osint-backend
```

### 2. Frontend

```bash
cd frontend
npm run build
# Déployer le dist/
```

---

## ✅ Tests à effectuer

### Tests fonctionnels

- [ ] Un rédacteur peut signer un rapport avec ses informations de profil
- [ ] La signature manuscrite s'affiche correctement
- [ ] Un officier peut valider un rapport
- [ ] Le rapport est verrouillé après validation
- [ ] Seuls le rédacteur et le validateur peuvent modifier un rapport verrouillé
- [ ] Un admin peut déverrouiller un rapport
- [ ] Les protections anti-screenshot fonctionnent
- [ ] Export PDF inclut la signature du rédacteur ET la validation officier

### Tests de sécurité

- [ ] Impossible de modifier un rapport verrouillé sans permissions
- [ ] La signature est protégée contre les screenshots
- [ ] La validation nécessite une signature manuscrite dans le profil
- [ ] L'API refuse les modifications non autorisées

---

## 📝 Notes importantes

1. **Signature obligatoire** : L'utilisateur doit avoir une signature manuscrite dans son profil pour :

   - Signer un rapport (rédacteur)
   - Valider un rapport (officier)

2. **Mise à jour du profil** : Les utilisateurs doivent s'assurer que leur profil (nom, grade, matricule, signature) est à jour avant de signer ou valider.

3. **Historique** : Les validations sont tracées avec :

   - Date et heure (`validatedAt`)
   - Identité de l'officier (`validatedById`)
   - Signature de l'officier (`validatorSignatureUrl`)
   - Notes optionnelles (`validatorNotes`)

4. **Rétrocompatibilité** : L'ancien module `SignOffModule` a été renommé en `SignOffModule.old.vue` au cas où.

---

## 🐛 Problèmes connus et solutions

### Problème : Utilisateur sans signature

**Symptôme** : Message d'erreur lors de la tentative de signature/validation  
**Solution** : Aller dans Profil → Ajouter une signature manuscrite

### Problème : Rapport bloqué

**Symptôme** : Impossible de modifier un rapport  
**Solution** :

- Vérifier si le rapport est verrouillé (`isLocked = true`)
- Contacter un admin pour déverrouillage si nécessaire

---

## 🎉 Conclusion

Le nouveau système de signature et validation offre :

- ✅ **Clarté** : Séparation nette entre signature du rédacteur et validation officier
- ✅ **Automatisation** : Informations de profil utilisées automatiquement
- ✅ **Sécurité** : Protection des signatures et verrouillage des rapports validés
- ✅ **Traçabilité** : Historique complet de la validation
- ✅ **Conformité** : Workflow professionnel pour les rapports officiels

**Prochaines étapes possibles** :

- Ajouter une timeline de validation dans l'historique du rapport
- Notification email lors de la validation
- Export PDF avec QR code de vérification
