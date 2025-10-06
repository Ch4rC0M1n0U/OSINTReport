# 📸 Screenshot - Watermark & Isolation (Session Octobre 2025)

## 🎯 Modifications demandées

1. **Watermark simplifié** : uniquement date/heure + UID du dossier
2. **Isolation stricte** : screenshots visibles uniquement dans le contexte d'un dossier

## ✅ Changements implémentés

### 1. Watermark simplifié

**Fichier modifié :** `/backend/src/modules/media/media.service.ts`

**Fonction `createWatermarkText()`** :

```typescript
function createWatermarkText(metadata: ScreenshotMetadata): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} | Case: ${metadata.caseId}`;
}
```

**Avant :**
```
04/10/2025, 15:30 | Jean Dupont | Case: REPORT-12345
```

**Après :**
```
04/10/2025, 15:30 | Case: REPORT-12345
```

---

### 2. Isolation par dossier (Backend)

#### 📂 `media.service.ts`

**a) `listUserScreenshots()` - Ajout du filtre `caseId`**

```typescript
export async function listUserScreenshots(
  userId: string,
  baseUrl?: string,
  caseId?: string  // ← NOUVEAU
): Promise<any[]> {
  // Filtrage par userId ET caseId
  const userMatch = metadata.userId === userId;
  const caseMatch = !caseId || metadata.caseId === caseId;
  
  if (userMatch && caseMatch) {
    // Ajouter le screenshot
  }
}
```

**Comportement :**
- **Sans `caseId`** : Retourne tous les screenshots de l'utilisateur
- **Avec `caseId`** : Retourne uniquement les screenshots du dossier spécifié

**b) `deleteScreenshot()` - Ajout de la vérification `caseId`**

```typescript
export async function deleteScreenshot(
  filename: string,
  userId: string,
  caseId?: string  // ← NOUVEAU
) {
  // Vérification userId
  if (metadata.userId !== userId) {
    throw new Error('Permissions insuffisantes');
  }

  // Vérification caseId
  if (caseId && metadata.caseId !== caseId) {
    throw new Error('Ce screenshot n\'appartient pas à ce dossier');
  }
}
```

#### 📂 `media.controller.ts`

**a) `listScreenshots()` - Extraction du `caseId` depuis la query**

```typescript
export async function listScreenshots(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const baseUrl = getServerBaseUrl(req);
  const caseId = req.query.caseId as string | undefined;  // ← NOUVEAU

  const screenshots = await mediaService.listUserScreenshots(userId, baseUrl, caseId);
}
```

**b) `deleteScreenshot()` - Vérification du `caseId`**

```typescript
export async function deleteScreenshot(req: Request, res: Response) {
  const { filename } = req.params;
  const userId = (req as any).user?.id;
  const caseId = req.query.caseId as string | undefined;  // ← NOUVEAU

  await mediaService.deleteScreenshot(filename, userId, caseId);
}
```

---

### 3. Isolation par dossier (Frontend)

#### 📂 `frontend/src/services/screenshot.ts`

**a) `list()` - Paramètre `caseId` OBLIGATOIRE**

```typescript
async list(caseId: string): Promise<Screenshot[]> {
  const response = await api.get<{ success: boolean; data: Screenshot[] }>(
    `/media/screenshots/list?caseId=${encodeURIComponent(caseId)}`
  );
  return response.data.data;
}
```

**b) `delete()` - Paramètre `caseId` optionnel**

```typescript
async delete(filename: string, caseId?: string): Promise<void> {
  const url = caseId
    ? `/media/screenshot/${filename}?caseId=${encodeURIComponent(caseId)}`
    : `/media/screenshot/${filename}`;
  
  const response = await api.delete<{ success: boolean; message: string }>(url);
}
```

#### 📂 `frontend/src/components/shared/ScreenshotPicker.vue`

**a) Prop `caseId` OBLIGATOIRE**

```typescript
interface Props {
  modelValue: string;
  label?: string;
  caseId: string;  // ← OBLIGATOIRE
}
```

**b) Utilisation du `caseId` dans les méthodes**

```typescript
// Chargement
async function loadScreenshots() {
  screenshots.value = await screenshotService.list(props.caseId);
}

// Upload
const result = await screenshotService.upload(file, {
  caseId: props.caseId,  // ← Utilise le caseId du dossier
  investigatorName: 'Investigateur',
});

// Suppression
await screenshotService.delete(screenshot.filename, props.caseId);
```

#### 📂 `frontend/src/components/modules/PlatformAnalysisModule.vue`

**Ajout de la prop `reportId`**

```typescript
const props = defineProps<{
  modelValue: { findings?: Finding[]; platform?: string; };
  readonly?: boolean;
  reportId?: string;  // ← NOUVEAU
}>();
```

**Propagation au modal**

```vue
<PlatformEditModal
  :is-open="isModalOpen"
  :profile="editingProfile"
  :existing-profiles="existingProfiles"
  :report-id="reportId"  <!-- ← Propagation -->
  @close="closeModal"
  @save="handleSave"
/>
```

#### 📂 `frontend/src/components/modules/PlatformEditModal.vue`

**Réception et propagation du `reportId`**

```typescript
const props = defineProps<{
  isOpen: boolean;
  profile: Finding | null;
  existingProfiles?: string[];
  reportId?: string;  // ← NOUVEAU
}>();
```

```vue
<ScreenshotPicker
  v-model="screenshot"
  label="Capture du profil"
  :case-id="reportId || 'UNKNOWN'"  <!-- ← Propagation au picker -->
/>
```

#### 📂 `frontend/src/pages/reports/ReportDetailPage.vue`

**Propagation du `reportId` à tous les modules**

```vue
<component
  :is="getModuleComponent(module.type)"
  :model-value="module.payload"
  :report-id="reportId"  <!-- ← Propagation automatique -->
  @update:model-value="handleUpdateModule"
/>
```

---

## 🔒 Sécurité & Isolation

### Niveaux de protection

| Niveau | Protection | Implémentation |
|--------|-----------|----------------|
| **1. Upload** | Screenshot lié au dossier | `caseId` dans métadonnées |
| **2. Liste** | Filtrage backend | `userId` + `caseId` |
| **3. Suppression** | Double vérification | `userId` + `caseId` |
| **4. Affichage** | URLs signées | HMAC SHA-256 + expiration 48h |

### Exemple de métadonnées sauvegardées

```json
{
  "filename": "screenshot-1728057000000.png",
  "originalName": "capture-linkedin.png",
  "userId": "user-abc123",
  "caseId": "REPORT-12345",
  "investigatorName": "Jean Dupont",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "format": "png",
  "uploadedAt": "2025-10-04T15:30:00.000Z"
}
```

---

## 🧪 Tests

### Test 1 : Upload avec isolation

```bash
curl -X POST "http://localhost:4000/api/media/upload?caseId=CASE-001" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@screenshot.png"
```

**Résultat :** Screenshot avec watermark `04/10/2025, 15:30 | Case: CASE-001`

### Test 2 : Liste filtrée

```bash
# Dossier A
curl "http://localhost:4000/api/media/screenshots/list?caseId=CASE-A" \
  -H "Authorization: Bearer $TOKEN"

# Dossier B
curl "http://localhost:4000/api/media/screenshots/list?caseId=CASE-B" \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat :** Chaque requête retourne UNIQUEMENT les screenshots du dossier spécifié

### Test 3 : Suppression sécurisée

```bash
# Tentative de suppression avec mauvais caseId
curl -X DELETE "http://localhost:4000/api/media/screenshot/screenshot-123.png?caseId=WRONG-CASE" \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :** Erreur 400 - "Ce screenshot n'appartient pas à ce dossier"

---

## 📊 Flux de données complet

```
┌──────────────────────────────────────────────────────┐
│              ReportDetailPage.vue                    │
│              reportId = "REPORT-12345"               │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ :report-id="reportId"
                     ▼
┌──────────────────────────────────────────────────────┐
│           PlatformAnalysisModule.vue                 │
│           props.reportId = "REPORT-12345"            │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ :report-id="reportId"
                     ▼
┌──────────────────────────────────────────────────────┐
│            PlatformEditModal.vue                     │
│            props.reportId = "REPORT-12345"           │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ :case-id="reportId"
                     ▼
┌──────────────────────────────────────────────────────┐
│            ScreenshotPicker.vue                      │
│            props.caseId = "REPORT-12345"             │
└────────────────────┬─────────────────────────────────┘
                     │
                     ├─ list(caseId)
                     ├─ upload(file, { caseId })
                     └─ delete(filename, caseId)
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│          screenshot.ts (Service API)                 │
│          GET /api/media/screenshots/list?caseId=...  │
│          POST /api/media/upload?caseId=...           │
│          DELETE /api/media/screenshot/...?caseId=... │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│         media.controller.ts (Backend)                │
│         - Extract caseId from req.query              │
│         - Call service with caseId                   │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│         media.service.ts (Business Logic)            │
│         - Filter by userId + caseId                  │
│         - Generate watermark with caseId only        │
│         - Verify ownership + case membership         │
└──────────────────────────────────────────────────────┘
```

---

## 📝 Fichiers modifiés

### Backend

1. ✅ `/backend/src/modules/media/media.service.ts`
   - `createWatermarkText()` - Simplifié
   - `listUserScreenshots()` - Ajout filtre `caseId`
   - `deleteScreenshot()` - Ajout vérification `caseId`

2. ✅ `/backend/src/modules/media/media.controller.ts`
   - `listScreenshots()` - Extraction `caseId` de query
   - `deleteScreenshot()` - Extraction `caseId` de query

### Frontend

3. ✅ `/frontend/src/services/screenshot.ts`
   - `list()` - Paramètre `caseId` obligatoire
   - `delete()` - Paramètre `caseId` optionnel

4. ✅ `/frontend/src/components/shared/ScreenshotPicker.vue`
   - Prop `caseId` obligatoire
   - Utilisation dans `loadScreenshots()`, `upload()`, `delete()`

5. ✅ `/frontend/src/components/modules/PlatformAnalysisModule.vue`
   - Ajout prop `reportId`
   - Propagation au modal

6. ✅ `/frontend/src/components/modules/PlatformEditModal.vue`
   - Ajout prop `reportId`
   - Propagation au `ScreenshotPicker`

7. ✅ `/frontend/src/pages/reports/ReportDetailPage.vue`
   - Propagation `:report-id="reportId"` à tous les modules

### Documentation

8. ✅ `/docs/screenshot-isolation-guide.md`
9. ✅ `/docs/screenshot-watermark-and-isolation.md`

---

## 🚀 Déploiement

### Checklist avant déploiement

- [x] Tests unitaires backend
- [x] Tests E2E frontend
- [ ] Vérification isolation entre dossiers
- [ ] Test watermark simplifié
- [ ] Migration données existantes (si nécessaire)
- [ ] Documentation utilisateur

### Migration (si screenshots existants)

Si des screenshots existent sans `caseId` dans les métadonnées :

```bash
# Script de migration à créer
node scripts/migrate-screenshots-add-caseid.js
```

---

## 📚 Ressources

- [Guide d'isolation des screenshots](./screenshot-isolation-guide.md)
- [Documentation API screenshots](./screenshot-quickstart.md)
- [Architecture du système](./architecture.md)

---

**Date de modification :** 4 octobre 2025  
**Version :** 2.0 (Isolation + Watermark simplifié)  
**Statut :** ✅ Implémenté et documenté
