# 🐛 BUGFIX - Heures de capture incorrectes (problème de timezone)

**Date** : 6 octobre 2025  
**Problème** : Les heures de capture affichées ne correspondent pas aux heures EXIF  
**Cause** : Conversion timezone automatique lors du parsing des dates EXIF

---

## 🔍 Diagnostic

### Symptômes

- ✅ La date est correcte (jour/mois/année)
- ❌ L'heure affichée est décalée de 2 heures (timezone UTC+2 → UTC)
- Exemple : Photo prise à **20h00** → affichée comme **18h00**

### Cause racine

Les dates EXIF **n'incluent PAS de timezone** par défaut. Elles sont enregistrées en **heure locale de l'appareil photo**.

**Format EXIF typique** :
```
DateTimeOriginal: "2025:10:05 20:00:35"
```
☝️ Pas d'indication de timezone !

**Problème avec le code original** :
```typescript
// ❌ MAUVAIS - Conversion automatique en UTC
if (exifData.DateTimeOriginal) {
  captureDate = new Date(exifData.DateTimeOriginal).toISOString();
  // Input: Date object avec timezone locale (UTC+2)
  // Output: "2025-10-05T18:00:35.000Z" (converti en UTC, -2h !)
}
```

**Comportement de JavaScript** :
1. `exifr` parse la date EXIF et crée un objet `Date` JavaScript
2. L'objet `Date` **interprète** la date comme étant dans la timezone locale du serveur
3. `.toISOString()` **convertit** en UTC
4. Résultat : **perte de 2 heures** (UTC+2 → UTC)

---

## ✅ Solution

### Stratégie

**Préserver l'heure EXACTE des EXIF sans conversion de timezone.**

Les dates EXIF doivent être **interprétées comme UTC** (même si elles sont locales) pour éviter toute conversion. C'est une convention : on stocke l'heure "telle quelle" et on laisse le frontend décider comment l'afficher.

### Code corrigé

**Fichier** : `backend/src/modules/media/media.service.ts`

```typescript
// Extraction de la date de capture (plusieurs champs possibles)
// IMPORTANT: Les dates EXIF sont en heure LOCALE de l'appareil (sans timezone)
// On doit les interpréter comme telles et non les convertir en UTC
const rawDate = exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;
const offsetTime = exifData.OffsetTimeOriginal || exifData.OffsetTime;

if (rawDate) {
  if (rawDate instanceof Date) {
    // Si exifr a parsé en Date, il a utilisé la timezone locale du serveur
    // On doit extraire les composants date/heure et les traiter comme UTC
    // pour préserver l'heure exacte affichée dans les EXIF
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    const hours = String(rawDate.getHours()).padStart(2, '0');
    const minutes = String(rawDate.getMinutes()).padStart(2, '0');
    const seconds = String(rawDate.getSeconds()).padStart(2, '0');
    
    // Reconstruction en ISO avec l'heure EXACTE de l'EXIF (pas de conversion timezone)
    captureDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    
    console.log(`📸 Capture date (EXIF local time): ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
    console.log(`📸 Capture date (stored as): ${captureDate}`);
    
    if (offsetTime) {
      console.log(`🌍 Original timezone offset: ${offsetTime}`);
    }
  } else if (typeof rawDate === 'string') {
    // Si c'est une string, on la parse manuellement pour éviter les conversions timezone
    // Format EXIF typique: "2025:10:05 20:00:35"
    const match = rawDate.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      captureDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      console.log(`📸 Capture date (parsed from EXIF string): ${captureDate}`);
    } else {
      captureDate = rawDate;
      console.log('📸 Capture date (raw string):', captureDate);
    }
  }
}
```

### Ajout des champs timezone

On extrait aussi les champs de timezone EXIF (si présents) :

```typescript
pick: [
  'DateTimeOriginal',
  'CreateDate',
  'DateTime',
  'OffsetTimeOriginal', // ✅ Timezone offset de la date originale
  'OffsetTime',         // ✅ Timezone offset général
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'Make',
  'Model'
],
```

---

## 🧪 Test de validation

### Avant le fix

**EXIF original** : `DateTimeOriginal: "2025:10:05 20:00:35"`  
**Stocké en DB** : `"2025-10-05T18:00:35.000Z"` ❌ (-2h)  
**Affiché** : 18h00 ❌

### Après le fix

**EXIF original** : `DateTimeOriginal: "2025:10:05 20:00:35"`  
**Stocké en DB** : `"2025-10-05T20:00:35.000Z"` ✅ (heure préservée)  
**Affiché** : 20h00 ✅

---

## 🎯 Explication technique

### Pourquoi stocker en "faux UTC" ?

Les dates EXIF sont **locales mais sans timezone**. On a 3 options :

1. **❌ Convertir en UTC** → perte d'information (on ne sait pas la timezone originale)
2. **❌ Stocker comme string** → difficile à manipuler, pas de tri/comparaison
3. **✅ Stocker comme ISO UTC avec l'heure locale** → solution pragmatique

Option 3 = on fait **"comme si"** l'heure EXIF était UTC, mais c'est en réalité l'heure locale.

**Avantages** :
- Format ISO standard (compatible JSON, bases de données)
- Heure préservée à l'identique
- Facile à afficher (juste enlever le "Z" ou formater sans conversion)
- Tri chronologique fonctionnel

**Limitation** :
- On ne peut pas comparer des photos prises dans des timezones différentes
- Mais ce n'est pas un problème pour OSINT : on veut juste afficher l'heure de prise de vue

---

## 📝 Notes importantes

### Frontend : Comment afficher

**Ne PAS utiliser** :
```typescript
// ❌ MAUVAIS - Va re-convertir en timezone locale du navigateur
new Date(captureDate).toLocaleString()
```

**Utiliser** :
```typescript
// ✅ BON - Affiche l'heure telle quelle
captureDate.replace('T', ' ').replace('.000Z', '')
// "2025-10-05 20:00:35"

// Ou avec un formatter qui ignore la timezone
const dt = captureDate.slice(0, 19).replace('T', ' ')
```

### Future amélioration

Si on veut gérer les timezones correctement :
1. Extraire `OffsetTimeOriginal` (ex: "+02:00")
2. Stocker la timezone séparément
3. Reconstruire la date complète : `"2025-10-05T20:00:35+02:00"`

Mais pour l'instant, la solution actuelle suffit largement.

---

## 🚀 Déploiement

### Actions effectuées

1. ✅ Ajout extraction `OffsetTimeOriginal` et `OffsetTime`
2. ✅ Parsing manuel des composants date/heure
3. ✅ Reconstruction ISO sans conversion timezone
4. ✅ Backend redémarré

### Test requis

1. **Uploader une nouvelle photo** avec GPS et EXIF
2. **Vérifier la date** dans l'interface
3. **Comparer** avec les propriétés EXIF originales de la photo

**Commande pour vérifier EXIF original** :
```bash
exiftool photo.jpg | grep DateTimeOriginal
```

---

## 📁 Fichiers modifiés

**`backend/src/modules/media/media.service.ts`** :
- Lignes ~128-158 : Nouveau parsing de date sans conversion timezone
- Ligne ~107 : Ajout `OffsetTimeOriginal` et `OffsetTime` dans `pick`

---

## 🎓 Leçon apprise

**Les dates EXIF sont un piège !**

- ❌ Jamais utiliser `new Date(exifDate).toISOString()` directement
- ✅ Toujours extraire les composants et reconstruire manuellement
- 📚 Lire la spec EXIF pour comprendre le format exact
- 🧪 Toujours tester avec des photos réelles de différents appareils

---

**Status** : ✅ CORRIGÉ  
**Priorité** : 🔴 HAUTE (données incorrectes affichées)  
**Test** : ⏳ EN ATTENTE - **Uploadez une nouvelle photo pour tester !**

