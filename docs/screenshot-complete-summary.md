# 📸 Système de Screenshots - Récapitulatif Complet (Session 4 Oct 2025)

## 🎯 Objectifs de la session

1. ✅ Watermark simplifié (date/heure + UID dossier uniquement)
2. ✅ Isolation stricte par dossier (caseId)
3. ✅ Détection dynamique URL serveur (Codespaces)
4. ✅ Extraction métadonnées EXIF (date/heure de capture)
5. ✅ Intégration IdentifierLookup (preuves screenshots)
6. ✅ Module MediaGallery (galerie complète dossier)

---

## ✅ Implémentations terminées

### 1. Watermark simplifié

**Avant** :
```
04/10/2025, 15:30 | Jean Dupont | Case: REPORT-12345
```

**Après** :
```
04/10/2025, 15:30 | Case: REPORT-12345
```

**Fichier** : `backend/src/modules/media/media.service.ts` - `createWatermarkText()`

---

### 2. Isolation par dossier

#### Backend

**Service** :
```typescript
// Liste filtrée par caseId
export async function listUserScreenshots(
  userId: string,
  baseUrl?: string,
  caseId?: string  // ← Filtre obligatoire
): Promise<any[]>

// Suppression avec vérification caseId
export async function deleteScreenshot(
  filename: string,
  userId: string,
  caseId?: string  // ← Vérification dossier
)
```

**Controller** :
```typescript
// Extraction caseId depuis query
const caseId = req.query.caseId as string | undefined;
const screenshots = await mediaService.listUserScreenshots(userId, baseUrl, caseId);
```

#### Frontend

**Service API** :
```typescript
// caseId OBLIGATOIRE pour list()
async list(caseId: string): Promise<Screenshot[]>

// caseId optionnel pour delete()
async delete(filename: string, caseId?: string): Promise<void>
```

**Composants** :
```vue
<!-- ScreenshotPicker avec caseId obligatoire -->
<ScreenshotPicker
  v-model="screenshot"
  :case-id="reportId"
/>
```

**Propagation** :
```
ReportDetailPage (reportId)
  → PlatformAnalysisModule (reportId)
    → PlatformEditModal (reportId)
      → ScreenshotPicker (caseId)
```

---

### 3. Détection dynamique URL serveur

#### Problème

- Codespaces : `https://fuzzy-halibut-97wgwqvrqgg379r7-4000.app.github.dev/`
- Localhost : `http://localhost:4000/`
- Production : URLs variables selon environnement

#### Solution

**Backend** :
```typescript
// Extraction URL depuis headers HTTP
function getServerBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:4000';
  return `${protocol}://${host}`;
}

// Utilisation
const baseUrl = getServerBaseUrl(req);
const result = await mediaService.processScreenshot(file, userId, metadata, baseUrl);
```

**Service** :
```typescript
// generateSignedUrl avec baseUrl optionnelle
export function generateSignedUrl(
  filename: string,
  expiresAt: number,
  baseUrl?: string  // ← Détecté dynamiquement
): string {
  const apiUrl = baseUrl || process.env.API_URL || 'http://localhost:4000';
  return `${apiUrl}/api/media/screenshot/${filename}?signature=${signature}&expires=${expiresAt}`;
}
```

---

### 4. Métadonnées EXIF (Date/Heure de capture)

#### Extraction backend

```typescript
// Extraction date de capture depuis EXIF
let captureDate: string | undefined;

if (exifData) {
  const exifString = exifData.toString();
  const dateMatch = exifString.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  
  if (dateMatch) {
    // Conversion YYYY:MM:DD HH:MM:SS → ISO 8601
    const [, year, month, day, hour, minute, second] = dateMatch;
    captureDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
  }
}

// Sauvegarde
await saveScreenshotMetadata({
  // ...
  captureDate, // ← Date de capture EXIF (optionnelle)
});
```

#### Affichage frontend

```vue
<!-- Dans ScreenshotPicker, IdentifierCard, MediaGallery -->
<div v-if="screenshot.captureDate">
  <span>📸</span>
  <span>{{ formatDate(screenshot.captureDate) }}</span>
</div>
```

**Interface TypeScript** :
```typescript
export interface Screenshot {
  // ...
  uploadedAt: string;
  captureDate?: string; // ← NOUVEAU : Date de capture depuis EXIF
  // ...
}
```

---

### 5. Intégration IdentifierLookup

#### Module IdentifierEditModal.vue

**Screenshot picker intégré** :
```vue
<!-- Capture d'écran -->
<div v-if="reportId" class="form-control">
  <label class="label">
    <span class="label-text">Capture d'écran</span>
  </label>
  <ScreenshotPicker
    v-model="screenshot"
    label="Preuve de l'identifiant"
    :case-id="reportId"
  />
</div>
```

**Gestion état** :
```typescript
const screenshot = ref('');

// Chargement depuis identifier
watch(() => props.identifier, (newIdentifier) => {
  if (newIdentifier) {
    screenshot.value = cloned.screenshot || '';
  } else {
    screenshot.value = '';
  }
});

// Sauvegarde
function handleSubmit() {
  const finalIdentifier = { ...localIdentifier.value };
  if (screenshot.value) {
    (finalIdentifier as any).screenshot = screenshot.value;
  }
  emit('save', finalIdentifier);
}
```

#### Affichage dans IdentifierCard.vue

```vue
<!-- Screenshot (si présent) -->
<div v-if="screenshot" class="mt-3">
  <div class="relative group cursor-pointer" @click="openScreenshot">
    <img :src="screenshot" class="w-full h-32 object-cover" />
    <div class="absolute top-2 right-2">
      <span class="badge badge-sm bg-black/50 text-white">
        📸 Preuve
      </span>
    </div>
  </div>
</div>
```

---

### 6. Module MediaGallery

#### Fonctionnalités

- ✅ **Galerie visuelle** (grille responsive 2/3/4 colonnes)
- ✅ **Upload direct** avec validation
- ✅ **Suppression** avec confirmation
- ✅ **Vue plein écran** (modal)
- ✅ **Métadonnées affichées** :
  - Dimensions (width x height)
  - Taille fichier (KB/MB)
  - Date de capture EXIF (si disponible)
  - Date de téléversement (sinon)
- ✅ **Isolation automatique** par reportId

#### Interface

```vue
<!-- Grille de screenshots -->
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div v-for="screenshot in screenshots">
    <!-- Preview image avec effet hover -->
    <figure class="h-48">
      <img :src="screenshot.url" />
      <div class="hover:bg-black/50">
        <span class="text-4xl">🔍</span>
      </div>
    </figure>

    <!-- Métadonnées -->
    <div class="text-xs">
      <div>📐 {{ screenshot.width }}x{{ screenshot.height }}</div>
      <div>💾 {{ formatSize(screenshot.size) }}</div>
      <div v-if="screenshot.captureDate">
        📸 {{ formatDate(screenshot.captureDate) }}
      </div>
    </div>

    <!-- Actions -->
    <button @click="confirmDelete(screenshot)">🗑️</button>
  </div>
</div>
```

#### Chargement automatique

```typescript
// Auto-load au montage et changement de reportId
watch(() => props.reportId, loadScreenshots, { immediate: true });

async function loadScreenshots() {
  if (!props.reportId) return;
  screenshots.value = await screenshotService.list(props.reportId);
}
```

---

## 📊 Architecture complète

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (Vue 3)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ReportDetailPage                                   │
│    ↓ :report-id="reportId"                         │
│  ┌─────────────────────────────────────────────┐  │
│  │ PlatformAnalysisModule                       │  │
│  │   ↓ :report-id                               │  │
│  │ PlatformEditModal → ScreenshotPicker         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ IdentifierLookupModule                       │  │
│  │   ↓ :report-id                               │  │
│  │ IdentifierEditModal → ScreenshotPicker       │  │
│  │ IdentifierCard → Screenshot preview          │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ MediaGalleryModule                           │  │
│  │  - Galerie complète (grille)                 │  │
│  │  - Upload direct                             │  │
│  │  - Vue plein écran                           │  │
│  │  - Métadonnées EXIF                          │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ScreenshotPicker (Shared)                    │  │
│  │  - Upload file                               │  │
│  │  - Galerie screenshots                       │  │
│  │  - Sélection/Suppression                     │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ screenshot.ts (Service API)                  │  │
│  │  - list(caseId) ← OBLIGATOIRE                │  │
│  │  - upload(file, { caseId })                  │  │
│  │  - delete(filename, caseId)                  │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────┐
│              Backend (Express + TypeScript)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  media.controller.ts                                │
│   - uploadScreenshot() → getServerBaseUrl(req)      │
│   - listScreenshots() → caseId from query           │
│   - deleteScreenshot() → caseId verification        │
│                                                     │
│  media.service.ts                                   │
│   - processScreenshot(file, userId, metadata, baseUrl) │
│     ├─ Sharp.js: resize, compress, watermark       │
│     ├─ EXIF extraction (captureDate)               │
│     └─ Save metadata.json                          │
│   - listUserScreenshots(userId, baseUrl, caseId)   │
│     ├─ Filter by userId + caseId                   │
│     └─ Generate signed URLs                        │
│   - deleteScreenshot(filename, userId, caseId)     │
│     ├─ Verify userId ownership                     │
│     └─ Verify caseId membership                    │
│   - generateSignedUrl(filename, expiresAt, baseUrl) │
│     └─ HMAC SHA-256 signature + 48h expiration     │
│                                                     │
│  Storage                                            │
│   /uploads/                                         │
│     ├─ screenshot-1728057000000.webp                │
│     └─ screenshot-1728057000000.webp.meta.json      │
│        {                                            │
│          "filename": "...",                         │
│          "caseId": "REPORT-12345",                  │
│          "userId": "user-abc",                      │
│          "captureDate": "2025-10-03T14:22:15Z", ←EXIF│
│          "uploadedAt": "2025-10-04T10:30:00Z",      │
│          "width": 1920, "height": 1080,             │
│          "size": 256000                             │
│        }                                            │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

| Niveau | Protection | Implémentation |
|--------|-----------|----------------|
| **Upload** | Watermark + metadata | Date/Heure + CaseID |
| **Storage** | Fichier + metadata.json | userId + caseId |
| **Liste** | Filtrage double | userId + caseId |
| **Suppression** | Vérification double | userId + caseId |
| **Accès** | URLs signées | HMAC SHA-256 + expiration 48h |
| **URL** | Détection dynamique | req.headers (x-forwarded-*) |

---

## 📝 Fichiers modifiés (Session complète)

### Backend

1. ✅ `backend/src/modules/media/media.service.ts`
   - Watermark simplifié
   - Extraction EXIF (captureDate)
   - listUserScreenshots(userId, baseUrl, caseId)
   - deleteScreenshot(filename, userId, caseId)
   - generateSignedUrl(filename, expiresAt, baseUrl)
   - processScreenshot(..., baseUrl)

2. ✅ `backend/src/modules/media/media.controller.ts`
   - getServerBaseUrl(req)
   - uploadScreenshot() avec baseUrl
   - listScreenshots() avec caseId query
   - deleteScreenshot() avec caseId query

3. ✅ `backend/.env`
   - API_URL=http://localhost:4000 (fallback)
   - MEDIA_SECRET_KEY (généré)

### Frontend - Services

4. ✅ `frontend/src/services/screenshot.ts`
   - Interface Screenshot avec captureDate?
   - list(caseId) - caseId OBLIGATOIRE
   - delete(filename, caseId?)

### Frontend - Composants partagés

5. ✅ `frontend/src/components/shared/ScreenshotPicker.vue`
   - Prop caseId OBLIGATOIRE
   - Affichage captureDate EXIF
   - formatDate() pour EXIF

### Frontend - Modules

6. ✅ `frontend/src/components/modules/PlatformAnalysisModule.vue`
   - Prop reportId
   - Propagation à PlatformEditModal

7. ✅ `frontend/src/components/modules/PlatformEditModal.vue`
   - Prop reportId
   - ScreenshotPicker avec :case-id

8. ✅ `frontend/src/components/modules/IdentifierLookupModule.vue`
   - Prop reportId
   - Propagation à IdentifierEditModal

9. ✅ `frontend/src/components/modules/IdentifierEditModal.vue`
   - Prop reportId
   - ScreenshotPicker intégré
   - Gestion screenshot dans handleSubmit()

10. ✅ `frontend/src/components/modules/IdentifierCard.vue`
    - Affichage screenshot (preview)
    - Badge "📸 Preuve"
    - openScreenshot()

11. ✅ `frontend/src/components/modules/MediaGalleryModule.vue`
    - **NOUVEAU MODULE** complet
    - Galerie responsive
    - Upload/Suppression
    - Vue plein écran
    - Métadonnées EXIF

12. ✅ `frontend/src/pages/reports/ReportDetailPage.vue`
    - Propagation :report-id à tous les modules

### Documentation

13. ✅ `docs/screenshot-isolation-guide.md`
14. ✅ `docs/screenshot-watermark-and-isolation.md`
15. ✅ `docs/screenshot-exif-and-modules.md`
16. ✅ `docs/screenshot-complete-summary.md` (ce fichier)

---

## 🧪 Tests de validation

### ✅ Test 1 : Watermark simplifié

```bash
curl -X POST "http://localhost:4000/api/media/upload?caseId=TEST-001" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@screenshot.png"
```

**Vérifier** : Watermark = `04/10/2025, 15:30 | Case: TEST-001`

### ✅ Test 2 : Isolation par dossier

```bash
# Upload dans CASE-A
curl -X POST ".../upload?caseId=CASE-A" -F "file=@a.png"

# Upload dans CASE-B
curl -X POST ".../upload?caseId=CASE-B" -F "file=@b.png"

# Liste CASE-A
curl ".../list?caseId=CASE-A"  # → Seulement screenshots de A

# Liste CASE-B
curl ".../list?caseId=CASE-B"  # → Seulement screenshots de B
```

### ✅ Test 3 : URL dynamique Codespaces

**Vérifier** : URLs retournées contiennent l'URL Codespaces réelle :
```
https://fuzzy-halibut-97wgwqvrqgg379r7-4000.app.github.dev/api/media/screenshot/...
```

### ✅ Test 4 : EXIF

```bash
# Upload photo smartphone (avec EXIF)
curl -X POST ".../upload?caseId=TEST" -F "file=@photo.jpg"
```

**Vérifier** : Métadonnées contiennent `captureDate` (date prise photo)

### ✅ Test 5 : IdentifierLookup

1. Créer identifiant (email/phone)
2. Ajouter screenshot de preuve
3. Vérifier affichage dans IdentifierCard
4. Ouvrir screenshot en plein écran

### ✅ Test 6 : MediaGallery

1. Ouvrir module "Media Gallery"
2. Voir tous les screenshots du dossier
3. Upload nouveau screenshot
4. Vérifier métadonnées affichées (dimensions, taille, date EXIF)
5. Supprimer screenshot → Confirmation + retrait
6. Vue plein écran → Modal avec détails complets

---

## 🎓 Bonnes pratiques résumées

### Upload
- ✅ Toujours passer `caseId` dans query
- ✅ Valider format (PNG/JPG/WebP) et taille (<10MB)
- ✅ Extraire EXIF si disponible
- ✅ Appliquer watermark avec date + caseId

### Liste
- ✅ **Obligatoire** : Filtrer par `caseId`
- ✅ Générer URLs signées dynamiques (baseUrl)
- ✅ Inclure `captureDate` si EXIF disponible

### Suppression
- ✅ Vérifier userId (propriétaire)
- ✅ Vérifier caseId (appartenance dossier)
- ✅ Supprimer fichier + métadonnées

### Frontend
- ✅ Prop `caseId`/`reportId` obligatoire
- ✅ Afficher date capture (EXIF) prioritaire sur uploadedAt
- ✅ Gestion erreurs claire (messages utilisateur)
- ✅ Rechargement après upload/suppression

---

## 🚀 Prochaines étapes possibles

### Fonctionnalités avancées
- [ ] **Tags/Catégories** pour screenshots
- [ ] **Recherche fulltext** dans métadonnées
- [ ] **Export ZIP** galerie complète
- [ ] **Annotations** sur screenshots (flèches, zones, texte)
- [ ] **Comparaison côte-à-côte** de 2 screenshots

### Métadonnées EXIF avancées
- [ ] **GPS** : Extraction latitude/longitude
- [ ] **Device** : Modèle appareil (iPhone 12, Samsung S21, etc.)
- [ ] **Software** : App utilisée (Instagram, Camera, etc.)
- [ ] **ISO/Shutter/Aperture** : Paramètres photo

### Sécurité
- [ ] **Rotation automatique** des URLs signées
- [ ] **Audit log** : Qui a accédé à quel screenshot
- [ ] **Chiffrement** des fichiers au repos
- [ ] **DRM** : Watermark invisible

### Performance
- [ ] **Thumbnails** : Générer miniatures (150x150px)
- [ ] **Lazy loading** : Charger images progressivement
- [ ] **CDN** : Héberger sur CDN (CloudFlare, AWS CloudFront)
- [ ] **Cache** : Mettre en cache URLs signées côté client

---

## 📚 Documentation complète

1. **Guide isolation** : `docs/screenshot-isolation-guide.md`
2. **Watermark & Isolation** : `docs/screenshot-watermark-and-isolation.md`
3. **EXIF & Modules** : `docs/screenshot-exif-and-modules.md`
4. **Quickstart** : `docs/screenshot-quickstart.md`
5. **Testing** : `docs/screenshot-testing-guide.md`
6. **API Complete** : `docs/api-complete.md`

---

**Session complète : 4 octobre 2025**  
**Statut** : ✅ Tous les objectifs atteints  
**Version** : 2.0 (EXIF + Modules)  
**Modules intégrés** : PlatformAnalysis, IdentifierLookup, MediaGallery  
**Prêt pour production** : ✅
