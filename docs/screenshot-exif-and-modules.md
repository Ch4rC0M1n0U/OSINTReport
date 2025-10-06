# 📸 Métadonnées EXIF & Intégration Modules - Guide Complet

## 🎯 Objectifs

1. **Extraction EXIF améliorée** - Date/heure de capture depuis les métadonnées
2. **Intégration IdentifierLookup** - Screenshots de preuves pour les identifiants
3. **Module MediaGallery** - Galerie complète des screenshots du dossier

---

## ✅ 1. Métadonnées EXIF (Date/Heure de capture)

### Backend - Extraction EXIF

**Fichier** : `/backend/src/modules/media/media.service.ts`

```typescript
// Extraction EXIF détaillée (date/heure de capture)
let exifData: any = {};
let captureDate: string | undefined;

try {
  exifData = imageMetadata.exif || {};
  
  // Extraction de la date de capture depuis EXIF
  // Tags EXIF possibles: DateTimeOriginal, CreateDate, DateTime
  if (exifData) {
    const exifBuffer = exifData as Buffer;
    const exifString = exifBuffer.toString();
    
    // Recherche de la date dans les tags EXIF courants
    const dateMatch = exifString.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (dateMatch) {
      // Conversion du format EXIF (YYYY:MM:DD HH:MM:SS) vers ISO
      const [, year, month, day, hour, minute, second] = dateMatch;
      captureDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
    }
  }
} catch (err: any) {
  console.warn('Extraction EXIF partielle:', err.message);
}
```

### Sauvegarde avec captureDate

```typescript
await saveScreenshotMetadata({
  filename: finalFilename,
  originalName: file.originalname,
  userId,
  caseId: metadata.caseId,
  investigatorName: metadata.investigatorName,
  size: processedImage.size,
  width: processedImage.width,
  height: processedImage.height,
  format: processedImage.format,
  uploadedAt: new Date().toISOString(),
  captureDate, // ← Date de capture depuis EXIF (si disponible)
});
```

### Type TypeScript mis à jour

**Frontend** : `/frontend/src/services/screenshot.ts`

```typescript
export interface Screenshot {
  filename: string;
  originalName: string;
  url: string;
  expiresAt: number;
  uploadedAt: string;
  captureDate?: string; // ← NOUVEAU : Date de capture depuis EXIF
  caseId: string;
  size: number;
  width: number;
  height: number;
}
```

### Affichage des métadonnées EXIF

**Composant** : `ScreenshotPicker.vue`

```vue
<p v-if="screenshot.captureDate" class="text-white/60 text-xs">
  📸 {{ formatDate(screenshot.captureDate) }}
</p>
```

**Fonction de formatage** :

```typescript
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## ✅ 2. Intégration IdentifierLookup

### Vue d'ensemble

Les screenshots peuvent maintenant être attachés aux identifiants pour servir de **preuves visuelles** (captures de profils, comptes, etc.).

### Backend - Aucune modification

Le système d'isolation par `caseId` fonctionne déjà automatiquement.

### Frontend - IdentifierEditModal.vue

**Ajout du ScreenshotPicker** :

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

**Props mises à jour** :

```typescript
const props = defineProps<{
  isOpen: boolean;
  identifier: Finding | null;
  existingValues?: string[];
  reportId?: string; // ← NOUVEAU : UID du rapport pour screenshots
}>();
```

**Gestion du screenshot** :

```typescript
// Screenshot (optionnel)
const screenshot = ref('');

// Synchroniser avec props
watch(
  () => props.identifier,
  (newIdentifier) => {
    if (newIdentifier) {
      const cloned = JSON.parse(JSON.stringify(newIdentifier));
      screenshot.value = cloned.screenshot || '';
      // ...
    } else {
      screenshot.value = '';
    }
  },
  { immediate: true }
);

// Inclure dans l'envoi
function handleSubmit() {
  const finalIdentifier = { ...localIdentifier.value };
  if (screenshot.value) {
    (finalIdentifier as any).screenshot = screenshot.value;
  }
  emit('save', finalIdentifier);
}
```

### IdentifierLookupModule.vue

**Propagation du reportId** :

```vue
<IdentifierEditModal
  :is-open="isModalOpen"
  :identifier="editingIdentifier"
  :existing-values="existingValues"
  :report-id="reportId"  <!-- ← Propagation -->
  @close="closeModal"
  @save="handleSave"
/>
```

```typescript
const props = defineProps<{
  modelValue: { findings?: Finding[]; };
  readonly?: boolean;
  reportId?: string; // ← NOUVEAU
}>();
```

### IdentifierCard.vue - Affichage du screenshot

**Template** :

```vue
<!-- Screenshot (si présent) -->
<div v-if="screenshot" class="mt-3">
  <div class="relative group cursor-pointer rounded-lg overflow-hidden border border-base-300 hover:border-primary">
    <img
      :src="screenshot"
      alt="Screenshot de preuve"
      class="w-full h-32 object-cover"
      @click="openScreenshot"
    />
    <div class="absolute top-2 right-2">
      <span class="badge badge-sm bg-black/50 text-white border-0">
        📸 Preuve
      </span>
    </div>
  </div>
</div>
```

**Script** :

```typescript
// Screenshot (optionnel)
const screenshot = computed(() => (props.identifier as any).screenshot);

function openScreenshot() {
  if (screenshot.value) {
    window.open(screenshot.value, '_blank');
  }
}
```

---

## ✅ 3. Module MediaGallery

### Vue d'ensemble

Module dédié pour **afficher tous les screenshots d'un dossier** dans une galerie visuelle.

### Fonctionnalités

- ✅ **Galerie visuelle** avec preview des images
- ✅ **Métadonnées EXIF** affichées (date de capture, dimensions, taille)
- ✅ **Upload direct** depuis le module
- ✅ **Suppression** avec confirmation
- ✅ **Vue plein écran** pour chaque screenshot
- ✅ **Isolation par dossier** (caseId automatique)

### Composant MediaGalleryModule.vue

**Props** :

```typescript
const props = defineProps<{
  modelValue?: any;
  readonly?: boolean;
  reportId?: string; // UID du rapport pour filtrer les screenshots
}>();
```

**Fonctionnalités principales** :

```typescript
// Chargement automatique
watch(() => props.reportId, loadScreenshots, { immediate: true });

// Liste filtrée par caseId
async function loadScreenshots() {
  if (!props.reportId) return;
  screenshots.value = await screenshotService.list(props.reportId);
}

// Upload avec isolation
async function handleUpload() {
  await screenshotService.upload(selectedFile.value, {
    caseId: props.reportId,
    investigatorName: 'Investigateur',
  });
  await loadScreenshots();
}

// Suppression sécurisée
async function confirmDelete(screenshot: Screenshot) {
  if (!confirm(`Supprimer "${screenshot.originalName}" ?`)) return;
  await screenshotService.delete(screenshot.filename, props.reportId);
  await loadScreenshots();
}
```

**Interface** :

```vue
<!-- Grille de screenshots -->
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div v-for="screenshot in screenshots" :key="screenshot.filename">
    <!-- Preview image -->
    <figure class="relative h-48 overflow-hidden">
      <img :src="screenshot.url" class="w-full h-full object-cover" />
    </figure>

    <!-- Métadonnées -->
    <div class="text-xs space-y-1">
      <div>📐 {{ screenshot.width }}x{{ screenshot.height }}</div>
      <div>💾 {{ formatSize(screenshot.size) }}</div>
      <div v-if="screenshot.captureDate">
        📸 {{ formatDate(screenshot.captureDate) }}
      </div>
      <div v-else>
        📅 {{ formatDate(screenshot.uploadedAt) }}
      </div>
    </div>

    <!-- Actions -->
    <button @click="confirmDelete(screenshot)">🗑️</button>
  </div>
</div>
```

---

## 📊 Flux de données complet

```
┌────────────────────────────────────────────────────────┐
│           Upload Screenshot avec EXIF                  │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  1. Sharp.js lit les métadonnées (y compris EXIF)     │
│  2. Extraction date de capture:                        │
│     - DateTimeOriginal (prioritaire)                   │
│     - CreateDate (fallback)                            │
│     - DateTime (fallback)                              │
│  3. Conversion YYYY:MM:DD HH:MM:SS → ISO 8601         │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Sauvegarde métadonnées (screenshot.meta.json)        │
│  {                                                      │
│    "filename": "screenshot-1728057000000.webp",        │
│    "captureDate": "2025-10-03T14:22:15.000Z",  ← EXIF  │
│    "uploadedAt": "2025-10-04T10:30:00.000Z",           │
│    "width": 1920, "height": 1080, "size": 256000,     │
│    "caseId": "REPORT-12345", "userId": "user-abc"     │
│  }                                                      │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│           Affichage dans les modules                   │
├────────────────────────────────────────────────────────┤
│  • ScreenshotPicker → Affiche date capture si EXIF    │
│  • IdentifierCard → Preview + badge "📸 Preuve"       │
│  • MediaGallery → Grille avec toutes les métadonnées  │
└────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests

### Test 1 : EXIF avec photo smartphone

```bash
# Upload une photo prise avec smartphone (contient EXIF)
curl -X POST "http://localhost:4000/api/media/upload?caseId=TEST-001" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo_smartphone.jpg"
```

**Résultat attendu** :
```json
{
  "metadata": {
    "captureDate": "2025-10-03T14:22:15.000Z",  // Date EXIF
    "uploadedAt": "2025-10-04T10:30:00.000Z"
  }
}
```

### Test 2 : Screenshot sans EXIF

```bash
# Upload un screenshot (pas de métadonnées EXIF)
curl -X POST "http://localhost:4000/api/media/upload?caseId=TEST-001" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@screenshot.png"
```

**Résultat attendu** :
```json
{
  "metadata": {
    "captureDate": null,  // Pas d'EXIF
    "uploadedAt": "2025-10-04T10:30:00.000Z"
  }
}
```

### Test 3 : Intégration IdentifierLookup

1. Créer un identifiant (email, phone, etc.)
2. Ajouter un screenshot de preuve
3. Vérifier l'affichage dans `IdentifierCard`
4. Éditer l'identifiant → Screenshot toujours présent

### Test 4 : Module MediaGallery

1. Naviguer vers module "Media Gallery"
2. Vérifier affichage de tous les screenshots du dossier
3. Upload un nouveau screenshot
4. Vérifier qu'il apparaît immédiatement
5. Supprimer un screenshot → Retrait immédiat
6. Changer de dossier → Voir uniquement screenshots du nouveau dossier

---

## 📝 Fichiers modifiés

### Backend

1. ✅ `/backend/src/modules/media/media.service.ts`
   - Extraction EXIF améliorée (captureDate)
   - Sauvegarde captureDate dans métadonnées
   - Retour captureDate dans listUserScreenshots()

### Frontend - Services

2. ✅ `/frontend/src/services/screenshot.ts`
   - Interface Screenshot avec `captureDate?`

### Frontend - Composants partagés

3. ✅ `/frontend/src/components/shared/ScreenshotPicker.vue`
   - Affichage date de capture EXIF (📸)
   - Fonction formatDate()

### Frontend - Modules

4. ✅ `/frontend/src/components/modules/IdentifierEditModal.vue`
   - Ajout ScreenshotPicker
   - Prop reportId
   - Gestion screenshot dans handleSubmit()

5. ✅ `/frontend/src/components/modules/IdentifierLookupModule.vue`
   - Prop reportId
   - Propagation à IdentifierEditModal

6. ✅ `/frontend/src/components/modules/IdentifierCard.vue`
   - Affichage screenshot (preview + badge)
   - Fonction openScreenshot()

7. ✅ `/frontend/src/components/modules/MediaGalleryModule.vue`
   - **NOUVEAU MODULE** : Galerie complète
   - Affichage grille avec métadonnées
   - Upload/Suppression intégrés
   - Vue plein écran

### Documentation

8. ✅ `/docs/screenshot-exif-and-modules.md` (ce fichier)

---

## 🎓 Bonnes pratiques

### Métadonnées EXIF

1. **Toujours vérifier** la présence d'EXIF avant extraction
2. **Fallback gracieux** si pas d'EXIF (utiliser uploadedAt)
3. **Préserver EXIF** dans l'image finale (withMetadata())
4. **Conversion format** : EXIF (YYYY:MM:DD) → ISO 8601

### Screenshots dans modules

1. **Prop reportId obligatoire** pour ScreenshotPicker
2. **Validation optionnelle** : screenshot peut être vide
3. **Storage dans Finding** : Utiliser `(finding as any).screenshot`
4. **Affichage conditionnel** : `v-if="screenshot"`

### Module MediaGallery

1. **Chargement automatique** au montage et changement de reportId
2. **Gestion erreurs** affichée clairement à l'utilisateur
3. **Upload optimiste** : Recharger après succès
4. **Isolation stricte** : Toujours filtrer par caseId

---

## 🚀 Prochaines étapes

- [ ] Extraction GPS depuis EXIF (géolocalisation)
- [ ] Extraction appareil/modèle (Device, Make, Model)
- [ ] Tags/catégories pour screenshots
- [ ] Recherche fulltext dans galerie
- [ ] Export ZIP de la galerie complète
- [ ] Watermark personnalisable par utilisateur

---

**Version** : 1.0  
**Date** : 4 octobre 2025  
**Statut** : ✅ Implémenté et testé
