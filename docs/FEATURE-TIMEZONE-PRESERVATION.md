# 🎯 AMÉLIORATION - Préservation de l'heure locale EXACTE de prise de vue (OSINT)

**Date** : 6 octobre 2025  
**Objectif** : Stocker la date de capture avec la timezone originale de la photo  
**Format** : ISO 8601 complet avec offset (`2025-10-05T18:00:35+02:00`)

---

## 🎓 Contexte OSINT

En investigation OSINT, **l'heure exacte locale** de prise de vue est une **métadonnée cruciale** :

- 📸 **Timeline d'événements** : Savoir quand une photo a été prise dans le fuseau horaire local
- 🌍 **Géolocalisation temporelle** : Corréler l'heure avec la position GPS
- ⏰ **Analyse comportementale** : Identifier les habitudes (photos prises à 3h du matin = nuit locale)
- 🔍 **Vérification de cohérence** : Vérifier si l'heure correspond à la luminosité/météo du lieu

### Exemple critique

**Photo prise à Bruxelles (UTC+2) à 18h00** :
- ❌ **Stockage UTC** : `2025-10-05T16:00:00Z` → On perd l'info que c'était 18h LOCALE (fin de journée)
- ✅ **Stockage avec timezone** : `2025-10-05T18:00:35+02:00` → On sait que c'était 18h à Bruxelles

**Impact OSINT** :
- Photo à 18h locale = fin de journée, soleil bas
- Photo à 16h UTC (18h+2) ne veut rien dire sans contexte géographique
- Avec GPS (Bruxelles) + heure locale (18h) = timeline cohérente

---

## 🔧 Solution technique

### 1. Configuration timezone du serveur

**Avant** : Serveur en UTC (timezone neutre)  
**Après** : Serveur en Europe/Paris (UTC+1/+2)

```bash
# Configuration permanente de la timezone
sudo ln -sf /usr/share/zoneinfo/Europe/Paris /etc/localtime
echo "Europe/Paris" | sudo tee /etc/timezone
```

**Vérification** :
```bash
$ date
Mon Oct  6 07:45:32 CEST 2025  # ✅ CEST = UTC+2 (heure d'été)
```

### 2. Extraction de la timezone EXIF

**Champs EXIF utilisés** :
- `OffsetTimeOriginal` : Timezone de DateTimeOriginal (prioritaire)
- `OffsetTime` : Timezone générale (fallback)

**Format** : `+02:00`, `-05:00`, `+00:00`, etc.

### 3. Nouveau format de stockage

**Format ISO 8601 complet** :
```
2025-10-05T18:00:35+02:00
    ↑         ↑       ↑
  Date     Heure   Timezone
```

**Composants** :
- `2025-10-05` : Date de prise de vue
- `T` : Séparateur ISO 8601
- `18:00:35` : **Heure LOCALE** de prise de vue
- `+02:00` : **Offset timezone** (CEST = UTC+2)

---

## 💻 Code implémenté

**Fichier** : `backend/src/modules/media/media.service.ts`

```typescript
// Extraction de la date de capture (plusieurs champs possibles)
// IMPORTANT: Pour l'OSINT, on doit préserver l'heure LOCALE EXACTE de la prise de vue
// avec sa timezone originale (ISO 8601 complet: 2025-10-05T18:00:35+02:00)
const rawDate = exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;
const offsetTime = exifData.OffsetTimeOriginal || exifData.OffsetTime;

if (rawDate) {
  let dateStr = '';
  
  if (rawDate instanceof Date) {
    // Extraire les composants sans conversion timezone
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    const hours = String(rawDate.getHours()).padStart(2, '0');
    const minutes = String(rawDate.getMinutes()).padStart(2, '0');
    const seconds = String(rawDate.getSeconds()).padStart(2, '0');
    
    dateStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    console.log(`📸 Capture date (EXIF): ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
  } else if (typeof rawDate === 'string') {
    // Parse manuel du format EXIF: "2025:10:05 18:00:35"
    const match = rawDate.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      dateStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      console.log(`📸 Capture date (parsed): ${dateStr}`);
    }
  }
  
  // Ajouter la timezone originale si disponible dans les EXIF
  if (dateStr) {
    if (offsetTime && typeof offsetTime === 'string') {
      // offsetTime format: "+02:00", "-05:00", etc.
      captureDate = `${dateStr}${offsetTime}`;
      console.log(`🌍 Timezone offset found: ${offsetTime}`);
      console.log(`📸 Full capture date with timezone: ${captureDate}`);
    } else {
      // Pas de timezone EXIF: on utilise celle du serveur comme fallback
      // pour estimer la timezone locale de la prise de vue
      const serverOffset = -new Date().getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(serverOffset) / 60);
      const offsetMinutes = Math.abs(serverOffset) % 60;
      const offsetSign = serverOffset >= 0 ? '+' : '-';
      const fallbackOffset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      
      captureDate = `${dateStr}${fallbackOffset}`;
      console.log(`⚠️ No timezone in EXIF, using server timezone as fallback: ${fallbackOffset}`);
      console.log(`📸 Capture date (estimated): ${captureDate}`);
    }
  }
}
```

---

## 🧪 Scénarios de test

### Scénario 1 : Photo moderne avec timezone EXIF

**Input EXIF** :
```
DateTimeOriginal: "2025:10:05 18:00:35"
OffsetTimeOriginal: "+02:00"
```

**Output stocké** :
```json
{
  "captureDate": "2025-10-05T18:00:35+02:00"
}
```

**Logs backend** :
```
📸 Capture date (EXIF): 2025-10-05 18:00:35
🌍 Timezone offset found: +02:00
📸 Full capture date with timezone: 2025-10-05T18:00:35+02:00
```

✅ **Parfait** : Heure locale exacte préservée avec timezone

---

### Scénario 2 : Photo ancienne sans timezone EXIF

**Input EXIF** :
```
DateTimeOriginal: "2025:10:05 18:00:35"
OffsetTimeOriginal: (absent)
```

**Serveur** : Europe/Paris (UTC+2 en été)

**Output stocké** :
```json
{
  "captureDate": "2025-10-05T18:00:35+02:00"
}
```

**Logs backend** :
```
📸 Capture date (EXIF): 2025-10-05 18:00:35
⚠️ No timezone in EXIF, using server timezone as fallback: +02:00
📸 Capture date (estimated): 2025-10-05T18:00:35+02:00
```

⚠️ **Estimation** : Timezone déduite du serveur (Europe/Paris)

---

### Scénario 3 : Photo d'un autre fuseau horaire

**Input EXIF** :
```
DateTimeOriginal: "2025:10:05 12:00:00"
OffsetTimeOriginal: "-05:00"  # New York (EST)
```

**Output stocké** :
```json
{
  "captureDate": "2025-10-05T12:00:00-05:00"
}
```

✅ **Correct** : Photo prise à 12h heure de New York (17h UTC)

---

## 📊 Comparaison avant/après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Format** | `2025-10-05T18:00:35.000Z` | `2025-10-05T18:00:35+02:00` |
| **Timezone** | ❌ UTC (perte info) | ✅ Originale préservée |
| **Heure affichée** | UTC (16h) | Locale (18h) |
| **Précision OSINT** | ⚠️ Moyenne | ✅ Maximale |
| **Géolocalisation** | ❌ Décorrélée | ✅ Cohérente |
| **Timeline** | ⚠️ Ambiguë | ✅ Claire |

---

## 🌍 Impact sur l'affichage frontend

### Affichage recommandé

```typescript
// ✅ BON - Affiche l'heure locale telle quelle
const displayDate = (isoDate: string) => {
  // Parse "2025-10-05T18:00:35+02:00"
  const date = new Date(isoDate);
  
  // Option 1: Format personnalisé préservant la timezone
  return isoDate.replace('T', ' ').slice(0, 19); // "2025-10-05 18:00:35"
  
  // Option 2: Affichage avec timezone
  return date.toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',  // Ou extraire du offset
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
```

### Affichage à éviter

```typescript
// ❌ MAUVAIS - Convertit en timezone du navigateur
new Date(captureDate).toLocaleString()
// Si navigateur en UTC: affiche 16h au lieu de 18h !
```

---

## 🎯 Bénéfices OSINT

### 1. Analyse temporelle précise

**Exemple** : Photo de manifestation
- GPS : Bruxelles (50.8503°N, 4.3517°E)
- Date : `2025-10-05T18:00:35+02:00`
- ✅ **Analyse** : Photo prise à 18h locale à Bruxelles = fin de journée, cohérent avec ombre longues visibles

### 2. Corrélation multi-sources

**Exemple** : Vérifier un alibi
- Personne affirme être à Paris à 18h
- Photo uploadée avec GPS New York + `2025-10-05T18:00:00-05:00`
- ✅ **Analyse** : 18h à New York = 00h (minuit) à Paris → alibi faux

### 3. Pattern analysis

**Exemple** : Identifier des habitudes
- Série de photos à `03:00:00+02:00` (3h du matin locale)
- ✅ **Analyse** : Activité nocturne inhabituelle, potentiellement suspecte

---

## 📝 Notes techniques

### Format ISO 8601 avec timezone

**Composants** :
- `YYYY-MM-DD` : Date
- `T` : Séparateur
- `HH:MM:SS` : Heure locale
- `±HH:MM` : Offset UTC

**Exemples valides** :
- `2025-10-05T18:00:35+02:00` (Bruxelles, été)
- `2025-12-15T12:30:00+01:00` (Paris, hiver)
- `2025-07-04T14:00:00-05:00` (New York, été)
- `2025-01-01T00:00:00+00:00` (London, UTC)

### Conversion UTC

Pour obtenir l'heure UTC :
```typescript
const utcDate = new Date('2025-10-05T18:00:35+02:00');
console.log(utcDate.toISOString()); // "2025-10-05T16:00:35.000Z"
```

**Mais on NE stocke PAS en UTC** pour préserver l'heure locale !

---

## 🚀 Déploiement

### Actions effectuées

1. ✅ Serveur configuré en Europe/Paris (UTC+1/+2)
2. ✅ Extraction `OffsetTimeOriginal` et `OffsetTime`
3. ✅ Stockage format ISO 8601 avec timezone
4. ✅ Fallback sur timezone serveur si absent dans EXIF
5. ✅ Backend redémarré

### Test requis

**Action** : Uploader une nouvelle photo avec GPS

**Vérifications** :
1. Ouvrir les logs backend → Chercher `📸 Full capture date with timezone:`
2. Vérifier le fichier `.meta.json` :
   ```bash
   cat uploads/screenshots/*.meta.json | jq -r '.captureDate'
   ```
   Devrait afficher : `2025-10-05T18:00:35+02:00` (avec timezone!)
3. Dans l'interface : Vérifier que l'heure affichée est **18:00** (heure locale)

---

## 📁 Fichiers modifiés

**`backend/src/modules/media/media.service.ts`** :
- Lignes ~128-178 : Nouvelle logique de parsing avec timezone
- Ajout extraction `OffsetTimeOriginal` et `OffsetTime`
- Calcul fallback timezone serveur si EXIF incomplet

**Système** :
- `/etc/timezone` : `Europe/Paris`
- `/etc/localtime` → `/usr/share/zoneinfo/Europe/Paris`

---

## 🎓 Références

**Standards** :
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) - Format date/heure international
- [EXIF 2.32](http://www.cipa.jp/std/documents/e/DC-008-Translation-2019-E.pdf) - Spec EXIF timezone

**OSINT** :
- Timezone = métadonnée critique pour la géolocalisation temporelle
- Permet de corréler heure locale avec luminosité, météo, activité humaine
- Essential pour timeline reconstruction et vérification de cohérence

---

**Status** : ✅ IMPLÉMENTÉ  
**Priorité** : 🟢 AMÉLIORATION OSINT CRITIQUE  
**Test** : ⏳ EN ATTENTE - **Uploadez une photo pour tester !**

