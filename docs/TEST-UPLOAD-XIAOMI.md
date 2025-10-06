# 🧪 Test Upload Image Xiaomi avec GPS

**Date** : 6 octobre 2025  
**Objectif** : Valider l'extraction GPS avec exifr pour images Xiaomi/Google Photos

---

## 📋 Données de test

### Photo Xiaomi 14 (utilisateur)

```
Make: Xiaomi
Model: Xiaomi 14
ImageWidth: 4080px
ImageHeight: 1836px
DateTime: 2025:10:05 18:00:35
GPSLatitude: 50,1,10.60536    → Attendu: 50.019613°
GPSLongitude: 4,3,5.9364      → Attendu: 4.051649°
GPSAltitude: 234.9m
```

**Localisation** : Belgique, près de Liège  
**Coordonnées attendues** : `50.019613°N, 4.051649°E`

---

## 🚀 Procédure de test

### 1. Démarrer les services

```bash
# Services Docker
cd /workspaces/OSINTReport
docker-compose up -d

# Backend (avec exifr)
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

### 2. Se connecter à l'application

1. Ouvrir : http://localhost:5173
2. Login : `admin@police.belgium.eu` / mot de passe configuré
3. Créer ou ouvrir un rapport

### 3. Ajouter module MediaGallery

1. Dans le rapport, cliquer "Ajouter un module"
2. Sélectionner "Galerie média"
3. Cliquer "📤 Ajouter une capture"

### 4. Uploader l'image Xiaomi

1. Sélectionner votre photo Xiaomi 14
2. Cliquer "Téléverser"
3. **Observer les logs backend** :

```bash
# Dans le terminal backend, vous devriez voir :
📊 Processing image: IMG_20251005_180035.jpg (3.2 MB)
📏 Image dimensions: 4080x1836
📦 Image format: jpeg
💾 Image size: 3.20 MB
📋 Starting EXIF extraction with exifr...
✅ EXIF data extracted successfully
📸 Capture date (DateTimeOriginal): 2025-10-05T18:00:35.000Z
📍 GPS coordinates: 50.019613°, 4.051649°
📍 GPS altitude: 234.9m
📱 Device: Xiaomi Xiaomi 14
🔧 Resizing to max 3840x1836
✅ Screenshot processed
```

### 5. Vérifier l'affichage

**Dans la galerie** :
- ✅ Image visible avec vignette
- ✅ Badge vert 📍 en haut à droite
- ✅ Métadonnées : dimensions, taille, date

**Cliquer sur l'image** :
- ✅ Modal fullscreen s'ouvre
- ✅ Section "📍 Localisation GPS" affichée
- ✅ Coordonnées : `50.019613°, 4.051649°`
- ✅ Altitude : `234.9m`
- ✅ Carte OpenStreetMap chargée
- ✅ Marqueur à la bonne position (Belgique)

### 6. Tester les liens

1. **Google Maps** :
   - Cliquer "🌍 Google Maps"
   - Nouvelle fenêtre s'ouvre
   - Vérifier : Marqueur en Belgique, près de Liège

2. **OpenStreetMap** :
   - Cliquer "🗺️ OpenStreetMap"
   - Nouvelle fenêtre s'ouvre
   - Vérifier : Marqueur au bon endroit, zoom 15

3. **Copier** :
   - Cliquer "📋 Copier"
   - Notification : "Coordonnées copiées"
   - Coller dans un éditeur : `50.019613, 4.051649`

### 7. Vérifier les fichiers backend

```bash
# Métadonnées sauvegardées
cd backend/uploads/screenshots
ls -lh *.webp

# Afficher le JSON metadata
cat *.meta.json | jq '.'
```

**Attendu** :
```json
{
  "filename": "abc123...xyz.webp",
  "originalName": "IMG_20251005_180035.jpg",
  "userId": "user-uuid",
  "caseId": "case-uuid",
  "investigatorName": "Admin User",
  "size": 450000,
  "width": 3840,
  "height": 1728,
  "format": "webp",
  "uploadedAt": "2025-10-06T04:50:00.000Z",
  "captureDate": "2025-10-05T18:00:35.000Z",
  "gpsLatitude": 50.019613,
  "gpsLongitude": 4.051649,
  "gpsAltitude": 234.9
}
```

---

## ✅ Checklist de validation

### Backend
- [ ] Aucune erreur 500
- [ ] Logs EXIF extraction réussis
- [ ] Coordonnées GPS correctes dans les logs
- [ ] Fichier .webp créé
- [ ] Fichier .meta.json créé avec GPS

### Frontend
- [ ] Upload réussi
- [ ] Badge 📍 visible
- [ ] Modal fullscreen fonctionne
- [ ] Section GPS affichée
- [ ] Coordonnées correctes
- [ ] Carte chargée
- [ ] Marqueur bien positionné
- [ ] Boutons Google Maps/OSM fonctionnent
- [ ] Bouton Copier fonctionne

### Données GPS
- [ ] Latitude : `50.019613` (±0.000001)
- [ ] Longitude : `4.051649` (±0.000001)
- [ ] Altitude : `234.9` (±0.1)
- [ ] Date : `2025-10-05T18:00:35.000Z`

---

## 🐛 Dépannage

### Erreur 500 lors de l'upload

**Symptôme** : HTTP 500, backend crash

**Solution** :
1. Vérifier que exifr est installé : `npm list exifr`
2. Vérifier les logs backend pour le message d'erreur exact
3. Vérifier que l'image n'est pas corrompue

### GPS non extrait

**Symptôme** : Pas de badge 📍, pas de section GPS

**Causes possibles** :
1. Image sans GPS (screenshot, photo éditée)
2. EXIF strippé avant upload
3. Format EXIF non supporté (rare avec exifr)

**Debug** :
```bash
# Installer exiftool
sudo apt-get install libimage-exiftool-perl

# Vérifier EXIF de l'image originale
exiftool -GPS:All votre-image.jpg

# Attendu :
# GPS Latitude : 50 deg 1' 10.61" N
# GPS Longitude : 4 deg 3' 5.94" E
# GPS Altitude : 234.9 m
```

### Coordonnées incorrectes

**Symptôme** : Marqueur au mauvais endroit

**Debug** :
1. Vérifier les logs backend : coordonnées affichées
2. Comparer avec exiftool
3. Vérifier le JSON metadata

### Carte ne charge pas

**Symptôme** : Iframe OpenStreetMap vide

**Causes** :
1. Connexion internet
2. OpenStreetMap indisponible
3. Bloqué par CSP (rare)

**Solution** :
- Utiliser les boutons Google Maps/OSM pour ouvrir en externe
- Vérifier la console navigateur (F12)

---

## 📊 Résultats attendus

### Avant (exif-parser)

```
❌ Upload Xiaomi → Erreur 500
❌ GPS non extrait
❌ "undefined: +02:00"
```

### Après (exifr)

```
✅ Upload Xiaomi → Succès
✅ GPS extrait : 50.019613°, 4.051649°
✅ Altitude : 234.9m
✅ Date : 2025-10-05T18:00:35.000Z
✅ Carte affichée correctement
```

---

## 🎯 Critères de succès

Le test est **RÉUSSI** si :

1. ✅ Upload sans erreur 500
2. ✅ GPS extrait avec précision <10m
3. ✅ Badge 📍 visible
4. ✅ Carte affichée avec marqueur correct
5. ✅ Liens externes fonctionnels
6. ✅ Metadata JSON contient GPS

Le test est **ÉCHOUÉ** si :

1. ❌ Erreur 500
2. ❌ GPS non extrait (alors qu'il existe)
3. ❌ Coordonnées incorrectes (>100m d'erreur)
4. ❌ Carte ne charge pas

---

## 📝 Rapport de test

```
Date : __________
Testeur : __________
Device photo : Xiaomi 14

Upload : ✅ / ❌
GPS extrait : ✅ / ❌
  - Latitude : __________
  - Longitude : __________
  - Altitude : __________
Badge 📍 : ✅ / ❌
Carte affichée : ✅ / ❌
Liens Google/OSM : ✅ / ❌
Bouton Copier : ✅ / ❌

Problèmes rencontrés :
________________________________
________________________________

Commentaires :
________________________________
________________________________
```

---

## 🔄 Tests additionnels recommandés

### Autres devices

1. **Google Pixel** : Photo Google Photos haute résolution
2. **iPhone** : Photo avec HEIC format
3. **Canon DSLR** : Photo professionnelle
4. **Screenshot** : Image sans GPS (comportement normal)

### Formats GPS variés

1. **DMS standard** : `50°1'10.60536"N`
2. **DMS virgules** : `50,1,10.60536` ✅ (testé)
3. **Décimal** : `50.019613`
4. **Hémisphère Sud/Ouest** : Coordonnées négatives

### Grandes résolutions

1. **4K** : 3840x2160
2. **6K** : 6000x4000 (DSLR)
3. **8K** : 7680x4320 (smartphones haut de gamme)
4. **Panorama** : 12000x3000

---

**Status** : 📝 PRÊT POUR TEST  
**Priorité** : 🔴 HAUTE (bugfix critique)  
**Impact** : ✅ Débloque upload Google Photos/Xiaomi

