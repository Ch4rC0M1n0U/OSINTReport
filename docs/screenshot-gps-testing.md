# 🧪 Guide de test - GPS EXIF et Cartographie

## Préparation

### Images de test

Vous aurez besoin de deux types d'images :

1. **Image AVEC GPS** : Photo prise avec un smartphone (GPS activé)
2. **Image SANS GPS** : Screenshot d'écran ou photo sans géolocalisation

### Création d'image de test avec GPS

Si vous n'avez pas de photo GPS, utilisez ExifTool pour en créer une :

```bash
# Installer ExifTool
sudo apt-get install libimage-exiftool-perl

# Ajouter des coordonnées GPS à une image
exiftool -GPSLatitude="48.8566" -GPSLatitudeRef="N" \
         -GPSLongitude="2.3522" -GPSLongitudeRef="E" \
         -GPSAltitude="35" \
         test-image.jpg

# Vérifier les métadonnées
exiftool -GPS:All test-image.jpg
```

**Coordonnées de test** :
- **Paris** : 48.8566°N, 2.3522°E
- **New York** : 40.7128°N, 74.0060°W
- **Tokyo** : 35.6762°N, 139.6503°E

## Scénarios de test

### ✅ Test 1 : Upload image avec GPS

**Objectif** : Vérifier l'extraction des coordonnées GPS

**Étapes** :
1. Ouvrir un rapport
2. Ajouter le module "Galerie média"
3. Cliquer sur "📤 Ajouter une capture"
4. Sélectionner une image avec GPS
5. Uploader l'image

**Résultats attendus** :
- ✅ Upload réussi
- ✅ Image apparaît dans la galerie
- ✅ Badge vert 📍 visible sur la vignette
- ✅ Logs backend montrent : `gpsLatitude: 48.8566, gpsLongitude: 2.3522`

**Vérification backend** :
```bash
# Vérifier les logs
cd backend && npm run dev
# Chercher dans les logs : "GPS extracted"

# Vérifier le fichier metadata
cat backend/uploads/screenshots/<filename>.meta.json | jq '.gpsLatitude, .gpsLongitude'
```

---

### ✅ Test 2 : Affichage de la carte

**Objectif** : Vérifier l'affichage de la carte OpenStreetMap

**Étapes** :
1. Dans MediaGallery, cliquer sur une image avec GPS
2. Observer la modal fullscreen

**Résultats attendus** :
- ✅ Coordonnées GPS affichées (format : `48.856600°, 2.352200°`)
- ✅ Section "📍 Localisation GPS" visible
- ✅ Carte OpenStreetMap chargée avec marqueur
- ✅ Marqueur positionné correctement
- ✅ Boutons "Google Maps", "OpenStreetMap", "Copier" présents

**Vérification visuelle** :
- Le marqueur doit être à Paris (Tour Eiffel visible sur la carte)
- Zoom par défaut : ~15

---

### ✅ Test 3 : Boutons d'action

**Objectif** : Tester les liens et bouton copier

**Étapes** :
1. Ouvrir modal fullscreen d'image GPS
2. Cliquer sur "🌍 Google Maps"
3. Vérifier que Google Maps s'ouvre avec le bon marqueur
4. Revenir, cliquer sur "🗺️ OpenStreetMap"
5. Vérifier que OSM s'ouvre avec le bon marqueur
6. Revenir, cliquer sur "📋 Copier"
7. Coller dans un éditeur de texte

**Résultats attendus** :
- ✅ Google Maps : Marqueur à Paris
- ✅ OpenStreetMap : Marqueur à Paris, zoom 15
- ✅ Copier : `48.856600, 2.352200` dans le presse-papier
- ✅ Notification "Coordonnées copiées"

---

### ✅ Test 4 : Image sans GPS

**Objectif** : Vérifier le comportement sans métadonnées GPS

**Étapes** :
1. Uploader un screenshot (sans GPS)
2. Observer la vignette
3. Ouvrir la modal fullscreen

**Résultats attendus** :
- ✅ Pas de badge 📍 sur la vignette
- ✅ Modal affiche métadonnées normales
- ✅ Pas de section "Localisation GPS"
- ✅ Pas de carte OpenStreetMap

---

### ✅ Test 5 : Altitude GPS

**Objectif** : Vérifier l'affichage de l'altitude

**Étapes** :
1. Uploader une image avec GPS + Altitude
2. Ouvrir modal fullscreen
3. Observer les métadonnées GPS

**Résultats attendus** :
- ✅ "Altitude: 35.0m" affiché
- ✅ Coordonnées complètes visibles

**Image de test** :
```bash
exiftool -GPSAltitude="125.5" test-image.jpg
```

---

### ✅ Test 6 : Hémisphère Sud/Ouest

**Objectif** : Vérifier la conversion des coordonnées négatives

**Étapes** :
1. Créer image avec coordonnées Sud/Ouest

```bash
exiftool -GPSLatitude="33.8688" -GPSLatitudeRef="S" \
         -GPSLongitude="151.2093" -GPSLongitudeRef="E" \
         sydney.jpg
```

2. Uploader l'image
3. Vérifier les coordonnées

**Résultats attendus** :
- ✅ Latitude : `-33.868800°` (négatif car Sud)
- ✅ Longitude : `151.209300°` (positif car Est)
- ✅ Marqueur à Sydney, Australie

---

### ✅ Test 7 : Multiple images GPS

**Objectif** : Vérifier plusieurs images géolocalisées

**Étapes** :
1. Uploader 3-5 images avec GPS différents
2. Observer la galerie
3. Vérifier chaque carte

**Résultats attendus** :
- ✅ Tous les badges 📍 visibles
- ✅ Chaque image ouvre la bonne carte
- ✅ Pas de confusion entre les coordonnées

---

### ✅ Test 8 : Isolation par dossier

**Objectif** : Vérifier que le GPS reste isolé par dossier

**Étapes** :
1. Créer Dossier A
2. Uploader image GPS Paris dans Dossier A
3. Créer Dossier B
4. Vérifier que l'image GPS n'apparaît PAS dans Dossier B

**Résultats attendus** :
- ✅ Image GPS visible uniquement dans Dossier A
- ✅ Coordonnées GPS non divulguées à d'autres dossiers

---

## Tests de robustesse

### 🔧 Test R1 : Format EXIF atypique

**Image avec format non standard** :

```bash
# Certains appareils utilisent des formats différents
exiftool -GPS:All weird-format.jpg
```

**Attendu** :
- Extraction peut échouer
- Pas de badge GPS
- Logs backend : "Extraction EXIF partielle"

---

### 🔧 Test R2 : Image corrompue

**Étapes** :
1. Corrompre légèrement une image GPS
2. Uploader

**Attendu** :
- Upload réussit (Sharp.js traite l'image)
- GPS peut ne pas être extrait
- Pas d'erreur côté serveur

---

### 🔧 Test R3 : Très grandes coordonnées

**Coordonnées extrêmes** :

```bash
# Pôle Nord
exiftool -GPSLatitude="90.0000" -GPSLatitudeRef="N" pole-nord.jpg

# Ligne de changement de date
exiftool -GPSLongitude="180.0000" -GPSLongitudeRef="W" dateline.jpg
```

**Attendu** :
- Coordonnées extraites correctement
- Carte affiche le bon emplacement
- Pas d'erreur de dépassement

---

## Tests d'intégration

### 🔗 Test I1 : ScreenshotPicker

**Objectif** : Vérifier que GPS fonctionne aussi dans ScreenshotPicker (IdentifierLookup)

**Étapes** :
1. Ouvrir IdentifierLookup
2. Ajouter identifier
3. Cliquer "Ajouter preuve"
4. Sélectionner image GPS
5. Sauvegarder

**Attendu** :
- ✅ Badge 📍 visible dans le picker
- ✅ Carte accessible depuis le picker (TODO: à implémenter)

---

### 🔗 Test I2 : Export rapport

**Objectif** : Vérifier que les coordonnées GPS sont exportées

**Étapes** :
1. Créer rapport avec images GPS
2. Exporter en PDF (TODO)
3. Vérifier le contenu

**Attendu** :
- ✅ Coordonnées GPS dans le PDF
- ✅ Carte statique ou lien vers carte

---

## Checklist validation

### Backend

- [ ] GPS extrait depuis EXIF
- [ ] Conversion DMS → Décimal correcte
- [ ] Hémisphère Sud/Ouest (négatif)
- [ ] Altitude extraite
- [ ] Métadonnées sauvegardées (*.meta.json)
- [ ] Logs clairs en cas d'erreur

### Frontend

- [ ] Badge 📍 sur vignettes GPS
- [ ] Coordonnées affichées dans modal
- [ ] Carte OpenStreetMap chargée
- [ ] Marqueur positionné correctement
- [ ] Bouton Google Maps fonctionnel
- [ ] Bouton OpenStreetMap fonctionnel
- [ ] Bouton Copier fonctionnel
- [ ] Pas de carte si pas de GPS
- [ ] Avertissement confidentialité affiché

### Sécurité

- [ ] GPS isolé par dossier (caseId)
- [ ] Permissions respectées
- [ ] Pas de fuite de coordonnées

---

## Résultats attendus

### ✅ Tous les tests passent

**Fonctionnalité validée** :
- Extraction GPS EXIF opérationnelle
- Cartographie OpenStreetMap fonctionnelle
- Isolation et sécurité respectées

### ⚠️ Certains tests échouent

**Actions** :
1. Vérifier les logs backend
2. Inspecter les fichiers *.meta.json
3. Tester avec différentes images
4. Vérifier la connectivité (OpenStreetMap)

### ❌ Tests critiques échouent

**Blockers** :
- GPS non extrait → Problème regex EXIF
- Carte ne charge pas → Problème iframe/CSP
- Mauvaises coordonnées → Erreur conversion DMS

---

## Outils de débogage

### Backend

```bash
# Logs détaillés
DEBUG=* npm run dev

# Vérifier métadonnées
cat backend/uploads/screenshots/*.meta.json | jq '.gpsLatitude'

# Tester extraction EXIF
exiftool -GPS:All backend/uploads/screenshots/<file>.webp
```

### Frontend

```javascript
// Console navigateur
console.log(screenshot.gpsLatitude, screenshot.gpsLongitude);

// Vérifier chargement iframe
document.querySelector('iframe').src;
```

---

## Rapport de test

```
Date: __________
Testeur: __________

Résultats:
- Test 1 (Upload GPS): ✅ / ❌
- Test 2 (Carte): ✅ / ❌
- Test 3 (Boutons): ✅ / ❌
- Test 4 (Sans GPS): ✅ / ❌
- Test 5 (Altitude): ✅ / ❌
- Test 6 (Hémisphère): ✅ / ❌
- Test 7 (Multiple): ✅ / ❌
- Test 8 (Isolation): ✅ / ❌

Bugs trouvés:
1. ___________________________
2. ___________________________

Commentaires:
________________________________
________________________________
```

---

**Note** : Cette fonctionnalité GPS est critique pour l'analyse OSINT. Tous les tests doivent passer avant mise en production.
