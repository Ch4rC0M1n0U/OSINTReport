# 🎨 AMÉLIORATION UI - Affichage de la timezone originale

**Date** : 6 octobre 2025  
**Objectif** : Afficher la timezone entre parenthèses dans l'interface  
**Format** : `05/10/2025 18:00:35 (UTC+02:00)`

---

## 🎯 Contexte

Pour l'analyse OSINT, il est **crucial** que l'utilisateur voie immédiatement :
- ✅ L'heure **locale** de la prise de vue
- ✅ La **timezone** dans laquelle la photo a été prise
- ✅ Ces infos **sans ambiguïté** et **sans conversion**

---

## ❌ Problème initial

### Code problématique

```typescript
// ❌ MAUVAIS - Conversion en timezone du navigateur
function formatFullDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
```

### Résultat affiché

**Input** : `2025-10-05T18:00:35+02:00` (photo prise à 18h à Bruxelles, UTC+2)  
**Output** : `05/10/2025 18:00:35` ❌ (on ne voit pas la timezone!)

**Si navigateur en UTC+1** :
- Input : `2025-10-05T18:00:35+02:00`
- Output : `05/10/2025 17:00:35` ❌❌ (ERREUR! Convertit en UTC+1)

**Problèmes** :
1. ❌ Pas de timezone affichée → ambiguïté
2. ❌ Conversion automatique → heure incorrecte
3. ❌ Impossible de savoir le fuseau horaire original

---

## ✅ Solution implémentée

### Nouveau code

```typescript
function formatFullDate(isoDate: string): string {
  // Format complet avec timezone originale entre parenthèses
  // Ex: "2025-10-05T18:00:35+02:00" → "05/10/2025 18:00:35 (UTC+02:00)"
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/);
  if (!match) return isoDate;
  
  const [, year, month, day, hours, minutes, seconds, timezone] = match;
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  
  if (timezone) {
    // Convertir "+02:00" en "UTC+02:00" pour plus de clarté
    const sign = timezone.startsWith('+') ? '+' : '-';
    const offset = timezone.slice(1); // "02:00"
    return `${dateStr} (UTC${sign}${offset})`;
  }
  
  return dateStr;
}
```

### Résultat affiché

**Input** : `2025-10-05T18:00:35+02:00`  
**Output** : `05/10/2025 18:00:35 (UTC+02:00)` ✅

**Avantages** :
- ✅ **Heure exacte préservée** (18:00:35)
- ✅ **Timezone visible** (UTC+02:00)
- ✅ **Pas de conversion** (affichage direct du string)
- ✅ **Format clair** pour l'analyste OSINT

---

## 📊 Exemples d'affichage

### Photo prise à Bruxelles (été)

**EXIF** : `2025-10-05T18:00:35+02:00`  
**Affiché** : `05/10/2025 18:00:35 (UTC+02:00)`  
**Interprétation** : Photo prise à 18h heure belge (CEST)

### Photo prise à New York (été)

**EXIF** : `2025-07-04T14:00:00-04:00`  
**Affiché** : `04/07/2025 14:00:00 (UTC-04:00)`  
**Interprétation** : Photo prise à 14h heure de New York (EDT)

### Photo prise à Tokyo

**EXIF** : `2025-03-15T09:30:00+09:00`  
**Affiché** : `15/03/2025 09:30:00 (UTC+09:00)`  
**Interprétation** : Photo prise à 9h30 heure de Tokyo (JST)

### Photo ancienne sans timezone

**EXIF** : `2015-06-20T12:00:00+02:00` (timezone ajoutée par fallback)  
**Affiché** : `20/06/2015 12:00:00 (UTC+02:00)`  
**Interprétation** : Timezone estimée (serveur Europe/Paris)

---

## 🎨 Où est affichée la timezone ?

### 1. MediaGalleryModule - Modal plein écran

**Fichier** : `frontend/src/components/modules/MediaGalleryModule.vue`

**Code** :
```vue
<div v-if="fullscreenImage.captureDate">
  <strong>Capture :</strong> {{ formatFullDate(fullscreenImage.captureDate) }}
</div>
```

**Affichage** :
```
Capture : 05/10/2025 18:00:35 (UTC+02:00)
```

### 2. MediaGalleryModule - Tooltip thumbnail

**Code** :
```vue
<span :title="formatFullDate(screenshot.captureDate)">
  {{ formatDate(screenshot.captureDate) }}
</span>
```

**Affichage** :
- Thumbnail : `05/10/2025` (format court)
- Tooltip (survol) : `05/10/2025 18:00:35 (UTC+02:00)` (format complet)

### 3. ScreenshotPicker - Liste des screenshots

**Fichier** : `frontend/src/components/shared/ScreenshotPicker.vue`

**Code** :
```vue
<p v-if="screenshot.captureDate" class="text-white/60 text-xs">
  📸 {{ formatDate(screenshot.captureDate) }}
</p>
```

**Affichage** :
```
📸 05/10/2025 18:00 (UTC+02:00)
```

---

## 🧪 Parsing robuste

### Regex utilisée

```regex
/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/
```

**Capture groups** :
1. `year` : `2025`
2. `month` : `10`
3. `day` : `05`
4. `hours` : `18`
5. `minutes` : `00`
6. `seconds` : `35`
7. `timezone` : `+02:00` (optionnel)

### Gestion des cas limites

**Cas 1 : Avec timezone**
```typescript
Input:  "2025-10-05T18:00:35+02:00"
Output: "05/10/2025 18:00:35 (UTC+02:00)" ✅
```

**Cas 2 : Sans timezone (ancien format)**
```typescript
Input:  "2025-10-05T18:00:35.000Z"
Output: "05/10/2025 18:00:35" ✅ (pas de parenthèses si pas de TZ)
```

**Cas 3 : Timezone négative**
```typescript
Input:  "2025-07-04T14:00:00-05:00"
Output: "04/07/2025 14:00:00 (UTC-05:00)" ✅
```

**Cas 4 : Format invalide**
```typescript
Input:  "invalid-date"
Output: "invalid-date" ✅ (fallback, retourne tel quel)
```

---

## 🎓 Bénéfices OSINT

### 1. Clarté temporelle

**Avant** :
```
Capture : 05/10/2025 18:00:35
```
❓ 18h dans quel fuseau horaire ?

**Après** :
```
Capture : 05/10/2025 18:00:35 (UTC+02:00)
```
✅ 18h heure belge (UTC+2)

### 2. Corrélation géographique

**Exemple** :
- GPS : `50.8503°N, 4.3517°E` (Bruxelles)
- Date : `05/10/2025 18:00:35 (UTC+02:00)`
- ✅ **Cohérence** : Bruxelles est bien en UTC+2 en été

**Détection d'incohérence** :
- GPS : `40.7128°N, 74.0060°W` (New York)
- Date : `05/10/2025 18:00:35 (UTC+02:00)` 
- ⚠️ **ALERTE** : New York devrait être UTC-4 ou UTC-5, pas UTC+2!
- → Photo manipulée ou mauvaise metadata

### 3. Analyse multi-sources

**Timeline avec photos de différents endroits** :
```
Photo A : 04/07/2025 14:00:00 (UTC-04:00) - New York
Photo B : 04/07/2025 20:00:00 (UTC+02:00) - Paris
```

**Conversion en UTC pour timeline** :
```
Photo A : 04/07/2025 18:00:00 UTC
Photo B : 04/07/2025 18:00:00 UTC
```

✅ Les deux photos prises **au même instant** (18h UTC), mais à des heures locales différentes.

---

## 🔧 Code modifié

### MediaGalleryModule.vue

**Lignes ~362-390** :

```typescript
function formatDate(isoDate: string): string {
  // Format court: DD/MM/YYYY
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function formatFullDate(isoDate: string): string {
  // Format complet avec timezone originale entre parenthèses
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/);
  if (!match) return isoDate;
  
  const [, year, month, day, hours, minutes, seconds, timezone] = match;
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  
  if (timezone) {
    const sign = timezone.startsWith('+') ? '+' : '-';
    const offset = timezone.slice(1);
    return `${dateStr} (UTC${sign}${offset})`;
  }
  
  return dateStr;
}
```

### ScreenshotPicker.vue

**Lignes ~309-327** :

```typescript
function formatDate(isoDate: string): string {
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/);
  if (!match) return isoDate;
  
  const [, year, month, day, hours, minutes, , timezone] = match;
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
  
  if (timezone) {
    const sign = timezone.startsWith('+') ? '+' : '-';
    const offset = timezone.slice(1);
    return `${dateStr} (UTC${sign}${offset})`;
  }
  
  return dateStr;
}
```

---

## 📸 Captures d'écran (rendu attendu)

### Modal plein écran

```
┌─────────────────────────────────────────────────┐
│  📸 IMG_20251005_180035.jpg                     │
│                                                  │
│  Original : IMG_20251005_180035.jpg             │
│  Taille : 568.7 KB                              │
│  Dimensions : 3840 x 1728                       │
│  Capture : 05/10/2025 18:00:35 (UTC+02:00) ✅   │
│                                                  │
│  📍 Localisation GPS                            │
│  Coordonnées : 50.019613°, 4.051649°            │
│  Altitude : 234.9m                              │
│  [Voir sur Google Maps] [Voir sur OpenStreetMap│
└─────────────────────────────────────────────────┘
```

### Thumbnail avec tooltip

```
┌──────────────┐
│  [Miniature] │  ← Survol = Tooltip
│  05/10/2025  │     "05/10/2025 18:00:35 (UTC+02:00)"
└──────────────┘
```

### Liste ScreenshotPicker

```
┌────────────────────────────────────────────┐
│ ☑ IMG_20251005_180035.jpg                  │
│   📸 05/10/2025 18:00 (UTC+02:00) ✅        │
│   📍 GPS disponible                        │
└────────────────────────────────────────────┘
```

---

## 🚀 Déploiement

### Actions effectuées

1. ✅ Modification `MediaGalleryModule.vue` - fonctions `formatDate()` et `formatFullDate()`
2. ✅ Modification `ScreenshotPicker.vue` - fonction `formatDate()`
3. ✅ Parsing manuel de la date ISO (pas de `new Date()`)
4. ✅ Extraction et affichage de la timezone entre parenthèses

### Test requis

**Rafraîchissez la page (Ctrl+Shift+R)** et vérifiez :

1. **Modal plein écran** :
   - Ligne "Capture :" doit afficher `(UTC+02:00)` à la fin
   
2. **Thumbnail** (survol) :
   - Tooltip doit afficher l'heure complète avec `(UTC+02:00)`
   
3. **Liste screenshots** :
   - Date doit afficher `(UTC+02:00)` après l'heure

---

## 📁 Fichiers modifiés

- `frontend/src/components/modules/MediaGalleryModule.vue` (lignes ~362-390)
- `frontend/src/components/shared/ScreenshotPicker.vue` (lignes ~309-327)

---

## 🎓 Références

**Standards** :
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) - Format date avec timezone
- [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339) - Internet date/time format

**OSINT Best Practices** :
- Toujours afficher la timezone originale
- Ne jamais convertir automatiquement en timezone locale du navigateur
- Permettre la corrélation timezone/GPS pour validation

---

**Status** : ✅ IMPLÉMENTÉ  
**Priorité** : 🟢 UX CRITIQUE POUR OSINT  
**Test** : ⏳ EN ATTENTE - **Rafraîchissez et vérifiez l'affichage !**

