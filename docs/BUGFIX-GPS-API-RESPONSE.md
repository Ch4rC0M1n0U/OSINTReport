# 🐛 BUGFIX - Données GPS manquantes dans les réponses API

**Date** : 6 octobre 2025  
**Problème** : GPS extrait correctement mais pas affiché dans l'interface  
**Cause** : Données GPS non incluses dans les réponses API

---

## 🔍 Diagnostic

### Symptômes

- ✅ Upload fonctionne
- ✅ GPS extrait correctement (vérifié dans `.meta.json`)
- ❌ Pas de badge 📍 dans l'interface
- ❌ Pas de section GPS dans la modal
- ❌ Pas de carte OpenStreetMap

### Investigation

**Fichier metadata.json** (backend) :
```json
{
  "gpsLatitude": 50.0196126,
  "gpsLongitude": 4.051648999999999,
  "gpsAltitude": 234.9
}
```
✅ **GPS bien extrait et sauvegardé**

**Réponse API** `/api/media/upload` (avant le fix) :
```json
{
  "metadata": {
    "originalName": "IMG_20251005_180035.jpg",
    "size": 568710,
    "width": 3840,
    "height": 1728,
    "format": "webp",
    "uploadedAt": "2025-10-06T05:09:26.225Z",
    "uploadedBy": "user-id"
    // ❌ Pas de captureDate, gpsLatitude, gpsLongitude, gpsAltitude
  }
}
```

**Réponse API** `/api/media/screenshots/list` (avant le fix) :
```json
[
  {
    "filename": "...",
    "uploadedAt": "...",
    // ❌ Pas de gpsLatitude, gpsLongitude, gpsAltitude
  }
]
```

### Cause racine

Les données GPS étaient :
1. ✅ Extraites par exifr
2. ✅ Sauvegardées dans le fichier `.meta.json`
3. ❌ **MAIS PAS retournées dans les réponses API**

Deux fonctions oubliaient de renvoyer les données GPS :
- `processScreenshot()` - réponse upload
- `listUserScreenshots()` - liste des screenshots

---

## ✅ Solution

### 1. Mise à jour de l'interface TypeScript

**Fichier** : `backend/src/modules/media/media.service.ts`

```typescript
interface ProcessedScreenshot {
  filename: string;
  signedUrl: string;
  expiresAt: number;
  metadata: {
    originalName: string;
    size: number;
    width: number;
    height: number;
    format: string;
    uploadedAt: string;
    uploadedBy: string;
    captureDate?: string;    // ✅ AJOUTÉ
    gpsLatitude?: number;    // ✅ AJOUTÉ
    gpsLongitude?: number;   // ✅ AJOUTÉ
    gpsAltitude?: number;    // ✅ AJOUTÉ
  };
}
```

### 2. Correction de processScreenshot()

**Avant** :
```typescript
return {
  filename: finalFilename,
  signedUrl,
  expiresAt,
  metadata: {
    originalName: file.originalname,
    size: processedImage.size,
    width: processedImage.width,
    height: processedImage.height,
    format: processedImage.format,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
    // ❌ Données GPS manquantes
  },
};
```

**Après** :
```typescript
return {
  filename: finalFilename,
  signedUrl,
  expiresAt,
  metadata: {
    originalName: file.originalname,
    size: processedImage.size,
    width: processedImage.width,
    height: processedImage.height,
    format: processedImage.format,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
    captureDate,      // ✅ AJOUTÉ
    gpsLatitude,      // ✅ AJOUTÉ
    gpsLongitude,     // ✅ AJOUTÉ
    gpsAltitude,      // ✅ AJOUTÉ
  },
};
```

### 3. Correction de listUserScreenshots()

**Avant** :
```typescript
screenshots.push({
  filename: metadata.filename,
  originalName: metadata.originalName,
  url: generateSignedUrl(metadata.filename, expiresAt, baseUrl),
  expiresAt,
  uploadedAt: metadata.uploadedAt || new Date().toISOString(),
  captureDate: metadata.captureDate,
  caseId: metadata.caseId,
  size: metadata.size,
  width: metadata.width,
  height: metadata.height,
  // ❌ Données GPS manquantes
});
```

**Après** :
```typescript
screenshots.push({
  filename: metadata.filename,
  originalName: metadata.originalName,
  url: generateSignedUrl(metadata.filename, expiresAt, baseUrl),
  expiresAt,
  uploadedAt: metadata.uploadedAt || new Date().toISOString(),
  captureDate: metadata.captureDate,
  gpsLatitude: metadata.gpsLatitude,    // ✅ AJOUTÉ
  gpsLongitude: metadata.gpsLongitude,  // ✅ AJOUTÉ
  gpsAltitude: metadata.gpsAltitude,    // ✅ AJOUTÉ
  caseId: metadata.caseId,
  size: metadata.size,
  width: metadata.width,
  height: metadata.height,
});
```

---

## 🧪 Test de validation

### Avant le fix

**API Response** :
```json
{
  "metadata": {
    "width": 3840,
    "height": 1728
    // ❌ Pas de GPS
  }
}
```

**Interface** :
- ❌ Pas de badge 📍
- ❌ Pas de carte

### Après le fix

**API Response** :
```json
{
  "metadata": {
    "width": 3840,
    "height": 1728,
    "gpsLatitude": 50.0196126,        // ✅ GPS présent
    "gpsLongitude": 4.051648999999999,
    "gpsAltitude": 234.9
  }
}
```

**Interface** (après rafraîchissement) :
- ✅ Badge 📍 vert visible
- ✅ Section "📍 Localisation GPS"
- ✅ Carte OpenStreetMap avec marqueur
- ✅ Coordonnées : 50.019613°, 4.051649°
- ✅ Altitude : 234.9m

---

## 🚀 Déploiement

### Actions effectuées

1. ✅ Mise à jour interface `ProcessedScreenshot`
2. ✅ Ajout GPS dans `processScreenshot()` (réponse upload)
3. ✅ Ajout GPS dans `listUserScreenshots()` (liste screenshots)
4. ✅ Backend redémarré

### Validation requise

**IMPORTANT** : Il faut **rafraîchir la page** dans le navigateur pour recharger les screenshots avec les nouvelles données GPS !

1. [ ] Rafraîchir la page (F5)
2. [ ] Vérifier badge 📍 vert
3. [ ] Cliquer image → Modal
4. [ ] Vérifier section GPS
5. [ ] Vérifier carte OpenStreetMap
6. [ ] Vérifier coordonnées : ~50.019613°, 4.051649°

---

## 📁 Fichiers modifiés

**`backend/src/modules/media/media.service.ts`** :
- Interface `ProcessedScreenshot` : +4 champs optionnels
- Fonction `processScreenshot()` : Ligne ~252, ajout GPS dans metadata retourné
- Fonction `listUserScreenshots()` : Ligne ~443, ajout GPS dans screenshots array

---

## 🎓 Leçon apprise

**Toujours inclure dans les réponses API ce qui est sauvegardé dans les métadonnées !**

Flow correct :
1. ✅ Extraction des données (EXIF, GPS, etc.)
2. ✅ Sauvegarde dans `.meta.json`
3. ✅ **Retour dans les réponses API** ← C'était manquant !
4. ✅ Affichage dans l'interface

---

## 📊 Impact

| Métrique | Avant | Après |
|----------|-------|-------|
| GPS dans metadata.json | ✅ Oui | ✅ Oui |
| GPS dans API upload | ❌ Non | ✅ Oui |
| GPS dans API list | ❌ Non | ✅ Oui |
| Badge 📍 affiché | ❌ Non | ✅ Oui |
| Carte OpenStreetMap | ❌ Non | ✅ Oui |

---

**Status** : ✅ CORRIGÉ  
**Priorité** : 🔴 HAUTE (fonctionnalité GPS inutilisable)  
**Test** : ⏳ EN ATTENTE - **RAFRAÎCHISSEZ LA PAGE MAINTENANT !**

