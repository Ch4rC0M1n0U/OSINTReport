# 📍 Extraction GPS EXIF et Cartographie OpenStreetMap

## Vue d'ensemble

Cette fonctionnalité extrait automatiquement les coordonnées GPS des métadonnées EXIF des captures d'écran uploadées et les affiche sur une carte OpenStreetMap interactive pour analyse OSINT.

## Fonctionnalités

### 🔍 Extraction automatique

Le système extrait automatiquement les données GPS suivantes depuis les EXIF :

- **Latitude** : Coordonnée GPS Nord/Sud (format décimal)
- **Longitude** : Coordonnée GPS Est/Ouest (format décimal)
- **Altitude** : Altitude en mètres (optionnelle)

### 🗺️ Affichage cartographique

Quand une image contient des coordonnées GPS :

1. **Badge GPS** : Badge vert 📍 sur la vignette dans la galerie
2. **Coordonnées** : Affichage des coordonnées dans la modal fullscreen
3. **Carte interactive** : Carte OpenStreetMap embarquée avec marqueur
4. **Liens externes** :
   - Google Maps
   - OpenStreetMap
   - Bouton copier les coordonnées

## Architecture technique

### Backend (`media.service.ts`)

#### Extraction GPS

```typescript
// Recherche des tags EXIF GPS
const gpsLatMatch = exifString.match(/GPSLatitude.*?(\d+),\s*(\d+),\s*([\d.]+)/);
const gpsLatRefMatch = exifString.match(/GPSLatitudeRef.*?([NS])/);
const gpsLonMatch = exifString.match(/GPSLongitude.*?(\d+),\s*(\d+),\s*([\d.]+)/);
const gpsLonRefMatch = exifString.match(/GPSLongitudeRef.*?([EW])/);
const gpsAltMatch = exifString.match(/GPSAltitude.*?([\d.]+)/);

// Conversion Degrés/Minutes/Secondes → Décimal
if (gpsLatMatch && gpsLatRefMatch) {
  const [, degrees, minutes, seconds] = gpsLatMatch;
  let lat = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;
  if (gpsLatRefMatch[1] === 'S') lat = -lat;
  gpsLatitude = lat;
}
```

#### Sauvegarde métadonnées

```typescript
await saveScreenshotMetadata({
  // ... autres champs
  captureDate,
  gpsLatitude,
  gpsLongitude,
  gpsAltitude,
});
```

### Frontend

#### Interface TypeScript (`screenshot.ts`)

```typescript
export interface Screenshot {
  // ... autres champs
  captureDate?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
}
```

#### Composant LocationMap (`LocationMap.vue`)

Composant réutilisable qui affiche :

1. **Coordonnées GPS** : Latitude, Longitude, Altitude (si disponible)
2. **Boutons d'action** :
   - 🌍 Ouvrir dans Google Maps
   - 🗺️ Ouvrir dans OpenStreetMap
   - 📋 Copier les coordonnées
3. **Carte embarquée** : iframe OpenStreetMap avec marqueur
4. **Avertissement confidentialité** : Note sur les données sensibles

#### Intégration MediaGalleryModule

```vue
<!-- Badge GPS dans la grille -->
<span
  v-if="screenshot.gpsLatitude !== undefined && screenshot.gpsLongitude !== undefined"
  class="badge badge-success badge-xs gap-1"
  title="Image géolocalisée"
>
  <span>📍</span>
</span>

<!-- Carte dans la modal fullscreen -->
<LocationMap
  v-if="fullscreenImage.gpsLatitude !== undefined"
  :latitude="fullscreenImage.gpsLatitude"
  :longitude="fullscreenImage.gpsLongitude"
  :altitude="fullscreenImage.gpsAltitude"
/>
```

## Format EXIF GPS

### Structure des données GPS dans EXIF

Les coordonnées GPS sont stockées en **Degrés, Minutes, Secondes (DMS)** :

```
GPSLatitude: 48, 51, 24.5
GPSLatitudeRef: N
GPSLongitude: 2, 17, 40.2
GPSLongitudeRef: E
GPSAltitude: 35.5
```

### Conversion DMS → Décimal

```
Latitude = Degrés + (Minutes / 60) + (Secondes / 3600)
Si Ref = 'S' ou 'W' : valeur négative
```

**Exemple** :
```
48°51'24.5"N → 48 + 51/60 + 24.5/3600 = 48.856806°
```

## Utilisation

### Upload d'image avec GPS

1. Prendre une photo avec un smartphone (GPS activé)
2. Uploader l'image dans MediaGallery
3. Le système extrait automatiquement les coordonnées
4. Badge 📍 vert apparaît sur la vignette

### Visualisation de la carte

1. Cliquer sur une image géolocalisée
2. Modal fullscreen s'ouvre
3. Carte OpenStreetMap affichée avec :
   - Marqueur à la position exacte
   - Coordonnées précises
   - Liens vers Google Maps/OSM
4. Possibilité de copier les coordonnées

### Export pour analyse

**Coordonnées copiables** :
```
48.856806, 2.294506
```

**URL Google Maps** :
```
https://www.google.com/maps?q=48.856806,2.294506
```

**URL OpenStreetMap** :
```
https://www.openstreetmap.org/?mlat=48.856806&mlon=2.294506&zoom=15
```

## Cas d'usage OSINT

### 1. Géolocalisation de profils

- Extraction de la localisation depuis les photos de profil
- Vérification de cohérence entre localisation déclarée et photos
- Triangulation via plusieurs images

### 2. Analyse de déplacements

- Timeline des déplacements via métadonnées GPS
- Identification de lieux fréquentés
- Corrélation avec autres sources (réseaux sociaux)

### 3. Vérification d'alibi

- Comparaison position GPS vs déclarations
- Horodatage précis (captureDate + GPS)
- Preuves géolocalisées

### 4. Investigation terrain

- Mapping des lieux d'intérêt
- Planification d'interventions
- Documentation de scènes

## Sécurité et confidentialité

### ⚠️ Avertissement

Les métadonnées GPS révèlent des informations **extrêmement sensibles** :

- Domicile des personnes
- Lieux de travail
- Habitudes de déplacement
- Localisations précises à quelques mètres

### Bonnes pratiques

1. **Isolation par dossier** : GPS visible uniquement dans le rapport concerné
2. **Contrôle d'accès** : Permissions utilisateur strictes
3. **Nettoyage EXIF** : Option de strip EXIF avant export (TODO)
4. **Note de confidentialité** : Avertissement affiché sur chaque carte
5. **Logs d'accès** : Traçabilité des consultations GPS (TODO)

### Note légale

> Les métadonnées GPS sont incluses dans le rapport pour analyse OSINT uniquement.
> Leur utilisation doit respecter les réglementations sur la protection des données personnelles (RGPD).

## Limitations connues

### 1. Formats EXIF variables

- Différents fabricants = formats différents
- Regex peut manquer certains formats
- Solution : Utiliser une bibliothèque EXIF dédiée (exif-parser, exifr)

### 2. Précision GPS

- GPS smartphone : ±5-15 mètres
- GPS photo : dépend du moment de la capture
- Altitude souvent imprécise

### 3. Images sans GPS

- Screenshots d'écran : pas de GPS
- Photos téléchargées : EXIF souvent strippé
- Images éditées : métadonnées perdues

### 4. OpenStreetMap embed

- iframe peut être bloqué par certains navigateurs
- Pas de personnalisation avancée de la carte
- Alternative : Leaflet.js pour carte native (TODO)

## Améliorations futures

### 📊 Court terme

- [ ] Bibliothèque EXIF dédiée (exifr) pour meilleure extraction
- [ ] Affichage du niveau de précision GPS
- [ ] Export KML/GPX pour analyse SIG
- [ ] Filtre "Images géolocalisées uniquement"

### 🚀 Moyen terme

- [ ] Carte Leaflet.js native (plus flexible qu'iframe)
- [ ] Clustering de plusieurs marqueurs
- [ ] Heatmap des localisations
- [ ] Timeline géographique

### 🔮 Long terme

- [ ] Reverse geocoding (adresse depuis coordonnées)
- [ ] Intégration avec APIs externes (Google Places, etc.)
- [ ] Analyse de trajectoire (déplacements)
- [ ] Corrélation automatique avec autres sources

## Tests

### Test 1 : Upload image avec GPS

```bash
# 1. Prendre photo avec smartphone (GPS ON)
# 2. Uploader via MediaGallery
# 3. Vérifier badge 📍 vert
# 4. Vérifier coordonnées extraites
```

### Test 2 : Affichage carte

```bash
# 1. Cliquer sur image GPS
# 2. Vérifier coordonnées affichées
# 3. Vérifier carte chargée
# 4. Tester liens Google Maps/OSM
# 5. Tester copie coordonnées
```

### Test 3 : Image sans GPS

```bash
# 1. Uploader screenshot (pas de GPS)
# 2. Vérifier absence badge 📍
# 3. Vérifier pas de carte dans modal
```

## Dépannage

### Carte ne s'affiche pas

**Causes possibles** :
- iframe bloqué par CSP
- Connexion internet
- OpenStreetMap indisponible

**Solution** :
- Vérifier console navigateur
- Utiliser liens externes (Google Maps)

### GPS non extrait

**Causes possibles** :
- Image sans GPS
- Format EXIF non supporté
- EXIF strippé avant upload

**Solution** :
- Vérifier avec outil EXIF (exiftool)
- Utiliser image originale non éditée

### Coordonnées incorrectes

**Causes possibles** :
- Erreur conversion DMS → Décimal
- Référence N/S/E/W inversée

**Solution** :
- Vérifier logs backend
- Comparer avec exiftool

## Ressources

### Standards EXIF

- [EXIF 2.3 Specification](https://www.cipa.jp/std/documents/e/DC-008-2012_E.pdf)
- [GPS Tag Structure](https://exiftool.org/TagNames/GPS.html)

### APIs cartographiques

- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet.js](https://leafletjs.com/)
- [uMap](https://umap.openstreetmap.fr/)

### Outils EXIF

- [ExifTool](https://exiftool.org/)
- [Exifr (JS)](https://github.com/MikeKovarik/exifr)
- [exif-parser (JS)](https://github.com/bwindels/exif-parser)

## Changelog

### v1.0.0 (2025-10-04)

- ✅ Extraction GPS depuis EXIF (Lat/Lon/Alt)
- ✅ Composant LocationMap avec OpenStreetMap
- ✅ Badge GPS dans MediaGallery
- ✅ Carte interactive dans modal fullscreen
- ✅ Liens Google Maps / OpenStreetMap
- ✅ Copie coordonnées
- ✅ Avertissement confidentialité

---

**Auteur** : Système OSINT Report  
**Date** : 4 octobre 2025  
**Version** : 1.0.0
