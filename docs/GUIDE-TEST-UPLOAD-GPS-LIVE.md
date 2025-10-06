# 🧪 GUIDE DE TEST - Upload Image GPS (EN DIRECT)

**Date** : 6 octobre 2025  
**Objectif** : Tester l'upload d'une image Xiaomi avec coordonnées GPS

---

## ✅ PRÉREQUIS (Complétés)

- ✅ Backend démarré sur http://localhost:4000
- ✅ Frontend démarré sur http://localhost:5174
- ✅ Services Docker actifs (PostgreSQL, Meilisearch)
- ✅ exifr installé dans le backend
- ✅ Code modifié avec exifr

---

## 📋 ÉTAPES DU TEST

### 1️⃣ Connexion à l'application

1. Ouvrir le navigateur : **http://localhost:5174**
2. Se connecter avec :
   - **Email** : `admin@police.belgium.eu`
   - **Mot de passe** : Votre mot de passe configuré

### 2️⃣ Créer ou ouvrir un rapport

**Option A : Créer un nouveau rapport**
1. Cliquer sur "Rapports" dans le menu
2. Cliquer "Nouveau rapport"
3. Remplir les informations de base :
   - Titre : "Test Upload GPS Xiaomi"
   - Numéro de dossier : "TEST-GPS-001"
   - Service demandeur : "OSINT Lab"
   - Objectif : "Tester l'extraction GPS avec exifr"
4. Cliquer "Créer"

**Option B : Ouvrir un rapport existant**
1. Cliquer sur "Rapports" dans le menu
2. Sélectionner un rapport existant
3. Cliquer pour l'ouvrir

### 3️⃣ Ajouter le module MediaGallery

1. Dans le rapport ouvert, descendre jusqu'à la section "Modules"
2. Cliquer sur "➕ Ajouter un module"
3. Dans la liste des modules disponibles, sélectionner :
   - **"🖼️ Galerie média"** (media_gallery)
4. Cliquer "Ajouter"

Le module devrait apparaître avec :
- Titre : "🖼️ Galerie média"
- Compteur : "0" screenshots
- Bouton : "📤 Ajouter une capture"

### 4️⃣ Uploader votre image Xiaomi

1. Cliquer sur le bouton **"📤 Ajouter une capture"**
2. Une modal s'ouvre avec un sélecteur de fichier
3. **IMPORTANT** : Sélectionner votre photo Xiaomi 14 avec GPS :
   - Fichier JPG/JPEG
   - Taille : ~3-4 MB
   - EXIF avec GPS : `50,1,10.60536` N, `4,3,5.9364` E

4. Cliquer **"Téléverser"**

### 5️⃣ Observer les logs backend

**Pendant l'upload**, ouvrir un terminal et observer :

```bash
# Afficher les logs backend en temps réel
cd /workspaces/OSINTReport/backend
# Chercher dans les logs du backend qui tourne déjà
```

**Logs attendus** :
```
📊 Processing image: IMG_20251005_180035.jpg (3245678 bytes)
📏 Image dimensions: 4080x1836
📦 Image format: jpeg
💾 Image size: 3.09 MB
📋 Starting EXIF extraction with exifr...
✅ EXIF data extracted successfully
📸 Capture date (DateTimeOriginal): 2025-10-05T18:00:35.000Z
📍 GPS coordinates: 50.019613°, 4.051649°
📍 GPS altitude: 234.9m
📱 Device: Xiaomi Xiaomi 14
🔧 Resizing to max 3840x1836
✅ Screenshot processed: abc123...xyz.webp
```

### 6️⃣ Vérifier l'affichage dans la galerie

**Immédiatement après l'upload** :

1. ✅ L'image apparaît dans la grille de la galerie
2. ✅ **Badge vert 📍** visible en haut à droite de la vignette
3. ✅ Métadonnées affichées :
   - Dimensions : `3840x1728` (ou similaire)
   - Taille : `~450 KB` (WebP compressé)
   - Date de capture : `05/10/2025 18:00`

### 7️⃣ Ouvrir la modal fullscreen

1. **Cliquer sur l'image** dans la galerie
2. Une grande modal s'ouvre

**Vérifications dans la modal** :

✅ **Image affichée en grand**

✅ **Section métadonnées** avec :
- Dimensions : 3840x1728
- Taille : ~450 KB
- Capture : 05/10/2025 18:00:35
- Téléversé : Date du jour

✅ **Section "📍 Localisation GPS"** affichée avec :
- **Latitude** : `50.019613°` (ou proche)
- **Longitude** : `4.051649°` (ou proche)
- **Altitude** : `234.9m`

✅ **Boutons d'action** :
- 🌍 Google Maps
- 🗺️ OpenStreetMap
- 📋 Copier

✅ **Carte OpenStreetMap embarquée** :
- iframe chargé
- Marqueur visible
- Position : **Belgique, région de Liège**

### 8️⃣ Tester les liens externes

**Google Maps** :
1. Cliquer sur "🌍 Google Maps"
2. Nouvelle fenêtre s'ouvre
3. ✅ Vérifier : Marqueur en **Belgique**
4. ✅ Vérifier : Proche de Liège/Namur

**OpenStreetMap** :
1. Cliquer sur "🗺️ OpenStreetMap"
2. Nouvelle fenêtre s'ouvre
3. ✅ Vérifier : Même position qu'avec Google Maps
4. ✅ Vérifier : Zoom niveau 15

**Copier coordonnées** :
1. Cliquer sur "📋 Copier"
2. ✅ Notification : "Coordonnées copiées"
3. Coller dans un éditeur (Ctrl+V)
4. ✅ Vérifier : `50.019613, 4.051649`

### 9️⃣ Vérifier les fichiers backend

Dans un terminal :

```bash
cd /workspaces/OSINTReport/backend/uploads/screenshots

# Lister les fichiers
ls -lh *.webp

# Afficher le dernier metadata JSON
ls -t *.meta.json | head -1 | xargs cat | jq '.'
```

**Vérifications** :

```json
{
  "filename": "abc123...xyz.webp",
  "originalName": "IMG_20251005_180035.jpg",
  "gpsLatitude": 50.019613,      ← DOIT ÊTRE PRÉSENT
  "gpsLongitude": 4.051649,      ← DOIT ÊTRE PRÉSENT
  "gpsAltitude": 234.9,          ← DOIT ÊTRE PRÉSENT
  "captureDate": "2025-10-05T18:00:35.000Z"
}
```

---

## ✅ CRITÈRES DE SUCCÈS

Le test est **RÉUSSI** si TOUS les points suivants sont validés :

### Backend
- [x] Aucune erreur 500
- [x] Logs montrent : "✅ EXIF data extracted successfully"
- [x] Logs montrent : "📍 GPS coordinates: 50.019613°, 4.051649°"
- [x] Fichier .webp créé
- [x] Fichier .meta.json contient gpsLatitude/gpsLongitude

### Frontend - Galerie
- [x] Image visible dans la grille
- [x] Badge 📍 vert affiché
- [x] Métadonnées affichées (dimensions, taille, date)

### Frontend - Modal
- [x] Section "📍 Localisation GPS" visible
- [x] Coordonnées correctes (±0.0001°)
- [x] Carte OpenStreetMap chargée
- [x] Marqueur visible et bien positionné

### Liens
- [x] Google Maps ouvre la bonne position
- [x] OpenStreetMap ouvre la bonne position
- [x] Copier met les coordonnées dans le presse-papier

---

## ❌ PROBLÈMES POSSIBLES

### Erreur 500 lors de l'upload

**Symptômes** :
- Upload échoue
- Message d'erreur dans l'UI

**Debug** :
1. Ouvrir la console navigateur (F12)
2. Vérifier le message d'erreur
3. Vérifier les logs backend

**Causes possibles** :
- exifr pas installé → `npm install exifr`
- Backend pas redémarré → Relancer `npm run dev`
- Image corrompue → Tester avec une autre image

### GPS non extrait

**Symptômes** :
- Pas de badge 📍
- Pas de section GPS

**Debug** :
```bash
# Vérifier si l'image a vraiment du GPS
exiftool -GPS:All votre-image.jpg
```

**Causes possibles** :
- Image sans GPS (screenshot, photo éditée)
- EXIF strippé par une app
- Format EXIF très exotique

### Coordonnées incorrectes

**Symptômes** :
- Marqueur au mauvais endroit
- Coordonnées bizarres

**Debug** :
1. Vérifier les logs backend
2. Comparer avec exiftool
3. Vérifier le JSON metadata

### Carte ne charge pas

**Symptômes** :
- Iframe vide
- Pas de carte visible

**Solutions** :
- Vérifier connexion internet
- Utiliser les boutons Google Maps/OSM
- Attendre quelques secondes (chargement)

---

## 📊 RÉSULTATS ATTENDUS

### Avant (exif-parser)
```
❌ Upload → Erreur 500
❌ Message : "undefined: +02:00"
❌ GPS non extrait
```

### Après (exifr)
```
✅ Upload → Succès
✅ GPS : 50.019613°, 4.051649°
✅ Altitude : 234.9m
✅ Badge 📍 visible
✅ Carte affichée correctement
✅ Marqueur en Belgique (Liège)
```

---

## 📝 RAPPORT DE TEST

**Date du test** : __________  
**Testeur** : __________

### Upload
- [ ] Upload réussi sans erreur 500
- [ ] Durée upload : _______ secondes
- [ ] Fichier WebP créé : _______ KB

### Extraction GPS
- [ ] GPS extrait depuis EXIF
- [ ] Latitude : __________ (attendu: ~50.019613)
- [ ] Longitude : __________ (attendu: ~4.051649)
- [ ] Altitude : __________ (attendu: ~234.9)

### Interface
- [ ] Badge 📍 visible
- [ ] Section GPS affichée
- [ ] Carte chargée
- [ ] Marqueur visible
- [ ] Position correcte (Belgique)

### Liens
- [ ] Google Maps fonctionne
- [ ] OpenStreetMap fonctionne
- [ ] Copier fonctionne

### Problèmes rencontrés
```
________________________________
________________________________
________________________________
```

### Commentaires
```
________________________________
________________________________
________________________________
```

**Résultat global** : ✅ SUCCÈS / ⚠️ PARTIEL / ❌ ÉCHEC

---

## 🎯 PROCHAINES ÉTAPES

### Si le test RÉUSSIT ✅
1. Marquer le fix comme validé
2. Tester avec d'autres devices (iPhone, Google Pixel)
3. Mettre à jour la documentation
4. Fermer le ticket/issue

### Si le test ÉCHOUE ❌
1. Noter les erreurs exactes
2. Collecter les logs backend
3. Vérifier la photo avec exiftool
4. Reporter les problèmes pour investigation

---

**Bonne chance pour le test ! 🚀**

*Ce document sera mis à jour avec vos résultats.*

