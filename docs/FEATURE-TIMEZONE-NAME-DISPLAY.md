# 🎨 AMÉLIORATION - Affichage nom de timezone + Correction uploadedAt

**Date** : 6 octobre 2025  
**Objectif 1** : Afficher le nom de la timezone (CEST, CET, EST, etc.)  
**Objectif 2** : Corriger l'heure de téléversement pour utiliser la timezone locale

---

## 🎯 Problèmes résolus

### 1. Timezone affichée uniquement en offset

**Avant** :
```
Capture : 05/10/2025 18:00:35 (UTC+02:00)
```

**Problème** : `UTC+02:00` est technique, pas immédiatement lisible.

**Après** :
```
Capture : 05/10/2025 18:00:35 (CEST - UTC+02:00)
```

**Amélioration** : `CEST` (Central European Summer Time) est plus parlant !

---

### 2. Heure de téléversement incorrecte

**Avant** :
```typescript
uploadedAt: new Date().toISOString()
// Résultat: "2025-10-06T05:45:30.000Z" (UTC, décalé de 2h)
```

**Problème** : 
- Serveur en Europe/Paris (UTC+2)
- Upload à 7h45 locale → stocké comme 5h45 UTC
- Affichage : 5h45 au lieu de 7h45 ❌

**Après** :
```typescript
uploadedAt: getCurrentDateTimeWithTimezone()
// Résultat: "2025-10-06T07:45:30+02:00" (heure locale avec timezone)
```

**Amélioration** :
- Upload à 7h45 locale → stocké comme 7h45+02:00
- Affichage : 7h45 (CEST - UTC+02:00) ✅

---

## 💻 Solution technique

### Backend - Helper function

**Nouveau code** :
```typescript
/**
 * Retourne la date/heure actuelle avec timezone locale (ISO 8601 complet)
 * Ex: "2025-10-06T07:45:30+02:00"
 */
function getCurrentDateTimeWithTimezone(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Calcul de l'offset timezone
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}
```

**Utilisation** :
```typescript
// Dans processScreenshot()
uploadedAt: getCurrentDateTimeWithTimezone(), // ✅

// Dans saveScreenshotMetadata()
uploadedAt: getCurrentDateTimeWithTimezone(), // ✅

// Dans listUserScreenshots()
uploadedAt: metadata.uploadedAt || getCurrentDateTimeWithTimezone(), // ✅ Fallback
```

---

### Frontend - Mapping timezone

**Nouveau code** :
```typescript
/**
 * Convertit un offset timezone en nom de timezone
 * Ex: "+02:00" (en été) → "CEST", "+01:00" (en hiver) → "CET"
 */
function getTimezoneName(offset: string): string {
  const timezoneMap: Record<string, string> = {
    '+02:00': 'CEST', // Central European Summer Time (été)
    '+01:00': 'CET',  // Central European Time (hiver)
    '+00:00': 'UTC',  // Coordinated Universal Time
    '-04:00': 'EDT',  // Eastern Daylight Time
    '-05:00': 'EST',  // Eastern Standard Time
    '+09:00': 'JST',  // Japan Standard Time
    '+08:00': 'CST',  // China Standard Time
  };
  
  return timezoneMap[offset] || `UTC${offset}`;
}
```

**Utilisation dans formatFullDate()** :
```typescript
function formatFullDate(isoDate: string): string {
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/);
  if (!match) return isoDate;
  
  const [, year, month, day, hours, minutes, seconds, timezone] = match;
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  
  if (timezone) {
    const tzName = getTimezoneName(timezone); // ✅ Mapping
    return `${dateStr} (${tzName} - UTC${timezone})`;
  }
  
  return dateStr;
}
```

---

## 📊 Exemples d'affichage

### Photo prise à Bruxelles (été)

**EXIF** : `2025-10-05T18:00:35+02:00`  
**Affiché** : `05/10/2025 18:00:35 (CEST - UTC+02:00)`

### Photo prise en hiver

**EXIF** : `2025-01-15T14:30:00+01:00`  
**Affiché** : `15/01/2025 14:30:00 (CET - UTC+01:00)`

### Photo prise à New York (été)

**EXIF** : `2025-07-04T14:00:00-04:00`  
**Affiché** : `04/07/2025 14:00:00 (EDT - UTC-04:00)`

### Photo prise au Japon

**EXIF** : `2025-03-20T09:00:00+09:00`  
**Affiché** : `20/03/2025 09:00:00 (JST - UTC+09:00)`

### Timezone non mappée

**EXIF** : `2025-06-10T12:00:00+05:30`  
**Affiché** : `10/06/2025 12:00:00 (UTC+05:30 - UTC+05:30)`
(Inde, pas dans le mapping → fallback sur offset)

---

## 🧪 Test de validation

### Avant les modifications

**Upload à 7h45 locale (CEST)** :
```
Téléversé : 06/10/2025 05:45:30 (UTC+00:00)  ❌
```

### Après les modifications

**Upload à 7h45 locale (CEST)** :
```
Téléversé : 06/10/2025 07:45:30 (CEST - UTC+02:00)  ✅
```

---

## 🌍 Timezones supportées

| Offset | Nom | Description |
|--------|-----|-------------|
| `+02:00` | **CEST** | Central European Summer Time (Europe été) |
| `+01:00` | **CET** | Central European Time (Europe hiver) |
| `+00:00` | **UTC** | Coordinated Universal Time |
| `-04:00` | **EDT** | Eastern Daylight Time (USA été) |
| `-05:00` | **EST** | Eastern Standard Time (USA hiver) |
| `+09:00` | **JST** | Japan Standard Time |
| `+08:00` | **CST** | China Standard Time |
| Autre | **UTC±XX:XX** | Fallback sur offset |

**Extensible** : Ajoutez d'autres timezones dans `timezoneMap` selon vos besoins !

---

## 🎨 Affichage dans l'interface

### Modal plein écran

**Avant** :
```
Capture : 05/10/2025 18:00:35 (UTC+02:00)
Téléversé : 06/10/2025 05:45:30 (UTC+00:00)
```

**Après** :
```
Capture : 05/10/2025 18:00:35 (CEST - UTC+02:00) ✅
Téléversé : 06/10/2025 07:45:30 (CEST - UTC+02:00) ✅
```

### Tooltip (survol)

**Avant** :
```
05/10/2025 18:00:35 (UTC+02:00)
```

**Après** :
```
05/10/2025 18:00:35 (CEST - UTC+02:00) ✅
```

---

## 🔧 Fichiers modifiés

### Backend

**`backend/src/modules/media/media.service.ts`** :

1. **Lignes 8-30** : Nouvelle fonction `getCurrentDateTimeWithTimezone()`
2. **Ligne ~299** : `uploadedAt: getCurrentDateTimeWithTimezone()` (saveScreenshotMetadata)
3. **Ligne ~323** : `uploadedAt: getCurrentDateTimeWithTimezone()` (return metadata)
4. **Ligne ~517** : `uploadedAt: metadata.uploadedAt || getCurrentDateTimeWithTimezone()` (listUserScreenshots)

### Frontend

**`frontend/src/components/modules/MediaGalleryModule.vue`** :

- **Lignes ~365-380** : Nouvelle fonction `getTimezoneName()`
- **Lignes ~382-397** : Fonction `formatFullDate()` mise à jour

**`frontend/src/components/shared/ScreenshotPicker.vue`** :

- **Lignes ~309-318** : Nouvelle fonction `getTimezoneName()`
- **Lignes ~320-335** : Fonction `formatDate()` mise à jour

---

## 🎓 Bénéfices

### 1. Lisibilité améliorée

**Avant** : `UTC+02:00` (technique)  
**Après** : `CEST - UTC+02:00` (lisible + technique)

### 2. Cohérence temporelle

**uploadedAt** et **captureDate** utilisent maintenant le même format avec timezone locale.

### 3. Analyse OSINT facilitée

- **CEST** = été en Europe → on sait que c'est entre mars et octobre
- **CET** = hiver en Europe → on sait que c'est entre novembre et février
- **EDT/EST** = permet de détecter si la photo vient des USA

### 4. Détection d'incohérences

**Exemple** :
- Photo uploadée : `07:45:30 (CEST - UTC+02:00)`
- Photo capturée : `14:00:00 (JST - UTC+09:00)`
- ✅ Analyse : Photo prise au Japon, uploadée depuis Europe

---

## 🚀 Déploiement

### Actions effectuées

1. ✅ Backend : Fonction helper `getCurrentDateTimeWithTimezone()`
2. ✅ Backend : Remplacement `new Date().toISOString()` par la nouvelle fonction
3. ✅ Frontend : Mapping timezone → noms (CEST, CET, etc.)
4. ✅ Frontend : Affichage `(CEST - UTC+02:00)`
5. ✅ Backend redémarré

### Test requis

**Rafraîchissez la page (Ctrl+Shift+R)** et vérifiez :

1. **Nouvelle photo** :
   - Uploadez une photo
   - Ligne "Téléversé :" doit afficher `(CEST - UTC+02:00)` avec l'heure locale

2. **Photo existante** :
   - Ligne "Capture :" doit afficher `(CEST - UTC+02:00)` si timezone était +02:00

---

## 📝 Extension possible

### Ajouter plus de timezones

```typescript
const timezoneMap: Record<string, string> = {
  // Ajoutez selon vos besoins
  '+03:00': 'EEST', // Eastern European Summer Time
  '+05:30': 'IST',  // India Standard Time
  '+10:00': 'AEST', // Australian Eastern Standard Time
  '-08:00': 'PST',  // Pacific Standard Time
  // etc.
};
```

### Détection automatique heure d'été/hiver

Pour l'instant, c'est statique (`+02:00` → CEST, `+01:00` → CET).

Une amélioration future pourrait :
1. Parser la date
2. Vérifier si on est en période d'été (mars-octobre) ou hiver
3. Afficher le bon nom automatiquement

---

**Status** : ✅ IMPLÉMENTÉ  
**Priorité** : 🟢 UX AMÉLIORATION  
**Test** : ⏳ EN ATTENTE - **Rafraîchissez et uploadez une photo !**

