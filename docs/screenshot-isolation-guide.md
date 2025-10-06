# 📸 Guide d'Isolation des Screenshots par Dossier

## 🎯 Objectif

Les screenshots sont maintenant strictement isolés par dossier (`caseId`/`reportId`) pour garantir la confidentialité et éviter les fuites entre différentes enquêtes.

## 🔒 Modifications implémentées

### 1. **Watermark simplifié**

Le watermark n'affiche plus que :
- **Date et heure** de capture
- **UID du dossier** (Case ID)

**Ancien format :**
```
04/10/2025, 15:30 | Jean Dupont | Case: REPORT-12345
```

**Nouveau format :**
```
04/10/2025, 15:30 | Case: REPORT-12345
```

### 2. **Isolation stricte par dossier**

#### Backend (`media.service.ts`)

**Fonction `listUserScreenshots()`** :
```typescript
export async function listUserScreenshots(
  userId: string,
  baseUrl?: string,
  caseId?: string  // ← NOUVEAU : Filtre obligatoire
): Promise<any[]>
```

- **Sans `caseId`** : Retourne TOUS les screenshots de l'utilisateur (pour migration/admin)
- **Avec `caseId`** : Retourne UNIQUEMENT les screenshots du dossier spécifié

**Fonction `deleteScreenshot()`** :
```typescript
export async function deleteScreenshot(
  filename: string,
  userId: string,
  caseId?: string  // ← NOUVEAU : Vérification supplémentaire
)
```

Vérifie :
1. Que l'utilisateur est propriétaire du screenshot
2. Que le screenshot appartient bien au dossier (si `caseId` fourni)

#### Frontend (`screenshot.ts`)

**API `list()` - Paramètre OBLIGATOIRE** :
```typescript
async list(caseId: string): Promise<Screenshot[]>
```

**API `delete()` - Paramètre optionnel** :
```typescript
async delete(filename: string, caseId?: string): Promise<void>
```

#### Composant `ScreenshotPicker.vue`

**Prop `caseId` OBLIGATOIRE** :
```vue
<ScreenshotPicker
  v-model="screenshot"
  label="Capture du profil"
  :case-id="reportId"  <!-- UID du dossier -->
/>
```

## 🚀 Utilisation

### Dans un module de rapport

```vue
<script setup lang="ts">
const props = defineProps<{
  reportId?: string; // UID du rapport
}>();
</script>

<template>
  <ScreenshotPicker
    v-model="screenshot"
    :case-id="reportId || 'UNKNOWN'"
  />
</template>
```

### Depuis `ReportDetailPage.vue`

Le `reportId` est automatiquement propagé à tous les modules :

```vue
<component
  :is="getModuleComponent(module.type)"
  :model-value="module.payload"
  :report-id="reportId"  <!-- Propagation automatique -->
  @update:model-value="handleUpdateModule"
/>
```

## 🛡️ Sécurité

### Niveaux de protection

1. **Upload** : Screenshot lié au `caseId` fourni dans les métadonnées
2. **Liste** : Filtrage backend par `userId` ET `caseId`
3. **Suppression** : Vérification double (userId + caseId)
4. **Affichage** : URLs signées valides 48h uniquement

### Exemples de requêtes

**Upload avec isolation :**
```http
POST /api/media/upload?caseId=REPORT-12345&investigatorName=Jean
Content-Type: multipart/form-data
```

**Liste filtrée par dossier :**
```http
GET /api/media/screenshots/list?caseId=REPORT-12345
```

**Suppression sécurisée :**
```http
DELETE /api/media/screenshot/screenshot-1234567890.png?caseId=REPORT-12345
```

## 📊 Flux de données

```
┌─────────────────────┐
│  Upload Screenshot  │
└──────────┬──────────┘
           │
           ├─> Watermark: Date + CaseID
           ├─> Métadonnées: userId + caseId
           ├─> Stockage: /uploads/screenshot-{timestamp}.png
           └─> DB: {filename}.meta.json
                   │
                   ├─ userId: "user-123"
                   ├─ caseId: "REPORT-12345"
                   └─ uploadedAt: "2025-10-04T15:30:00Z"

┌─────────────────────┐
│  List Screenshots   │
└──────────┬──────────┘
           │
           ├─> Filtre 1: userId === current user
           ├─> Filtre 2: caseId === report ID
           └─> Retour: Screenshots du dossier uniquement

┌─────────────────────┐
│ Delete Screenshot   │
└──────────┬──────────┘
           │
           ├─> Vérif 1: userId === owner
           ├─> Vérif 2: caseId === screenshot.caseId
           └─> Suppression: fichier + métadonnées
```

## 🧪 Tests

### Test 1 : Upload avec caseId

```bash
curl -X POST "http://localhost:4000/api/media/upload?caseId=TEST-001" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@screenshot.png"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "filename": "screenshot-1728057000000.png",
    "url": "https://..../api/media/screenshot/screenshot-1728057000000.png?signature=...&expires=...",
    "metadata": {
      "caseId": "TEST-001"
    }
  }
}
```

### Test 2 : Liste filtrée

```bash
curl "http://localhost:4000/api/media/screenshots/list?caseId=TEST-001" \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :** Uniquement les screenshots de `TEST-001`

### Test 3 : Isolation entre dossiers

1. Upload screenshot dans `CASE-A`
2. Upload screenshot dans `CASE-B`
3. Liste avec `?caseId=CASE-A` → Seulement screenshots de A
4. Liste avec `?caseId=CASE-B` → Seulement screenshots de B

## 🔧 Migration

Si vous avez des screenshots existants **sans `caseId`**, ils resteront accessibles via :

```typescript
// Sans filtre (admin/migration)
const allScreenshots = await screenshotService.list(undefined);
```

Pour les réattribuer à un dossier :

1. Charger le screenshot
2. Lire les métadonnées
3. Ajouter le `caseId` dans les métadonnées
4. Sauvegarder

## 📝 Checklist

- [x] Watermark simplifié (Date + CaseID uniquement)
- [x] `listUserScreenshots()` avec filtre `caseId`
- [x] `deleteScreenshot()` avec vérification `caseId`
- [x] Frontend `screenshot.ts` avec `caseId` obligatoire
- [x] `ScreenshotPicker.vue` avec prop `caseId`
- [x] Propagation `reportId` depuis `ReportDetailPage`
- [x] Modules mis à jour (`PlatformAnalysisModule`, `PlatformEditModal`)
- [ ] Tests E2E d'isolation
- [ ] Documentation utilisateur

## 🎓 Bonnes pratiques

1. **Toujours passer le `caseId`** lors de l'upload
2. **Toujours filtrer par `caseId`** lors de la liste
3. **Vérifier le `caseId`** lors de la suppression
4. **Ne jamais afficher** de screenshots d'autres dossiers
5. **Logs** : Enregistrer les accès aux screenshots pour audit

---

**Version :** 1.0  
**Date :** 4 octobre 2025  
**Statut :** ✅ Implémenté
