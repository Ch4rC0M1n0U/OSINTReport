# 🎯 INSTRUCTIONS RAPIDES - Test Upload GPS

## 🚀 TOUT EST PRÊT !

- ✅ **Backend** : http://localhost:4000 (actif)
- ✅ **Frontend** : http://localhost:5174 (actif)
- ✅ **exifr** : Installé et configuré
- ✅ **Logs** : Filtrés pour montrer l'extraction GPS

---

## 📋 PROCÉDURE EN 5 ÉTAPES

### 1. Se connecter
- Ouvrir : http://localhost:5174
- Login : `admin@police.belgium.eu`

### 2. Créer/Ouvrir un rapport
- Cliquer "Rapports" → "Nouveau rapport"
- Ou sélectionner un rapport existant

### 3. Ajouter module MediaGallery
- Dans le rapport, cliquer "➕ Ajouter un module"
- Sélectionner "🖼️ Galerie média"

### 4. Uploader votre photo Xiaomi
- Cliquer "📤 Ajouter une capture"
- Sélectionner votre photo avec GPS
- Cliquer "Téléverser"

### 5. Vérifier
- ✅ Badge 📍 vert sur la vignette
- ✅ Cliquer l'image → Modal avec carte
- ✅ Coordonnées : ~50.019613°, 4.051649°
- ✅ Carte OpenStreetMap → Marqueur en Belgique

---

## 🔍 LOGS À SURVEILLER

Pendant l'upload, dans un terminal :

```bash
# Les logs backend sont déjà filtrés et affichent :
📊 Processing image: ...
📋 Starting EXIF extraction with exifr...
✅ EXIF data extracted successfully
📍 GPS coordinates: 50.019613°, 4.051649°
📍 GPS altitude: 234.9m
✅ Screenshot processed: ...
```

---

## ✅ SUCCÈS SI :

1. Pas d'erreur 500
2. Badge 📍 visible
3. GPS extrait : ~50.019°N, 4.051°E
4. Carte affiche la Belgique

---

## ❌ ÉCHEC SI :

1. Erreur 500 lors de l'upload
2. Pas de badge 📍 (alors que photo a GPS)
3. Coordonnées incorrectes (>100km d'erreur)
4. Carte ne charge pas

---

## 📞 AIDE

- **Guide détaillé** : `docs/GUIDE-TEST-UPLOAD-GPS-LIVE.md`
- **Fix technique** : `docs/FIX-EXIF-EXTRACTION-EXIFR.md`
- **Backend logs** : Terminal backend actif

---

**Prêt pour le test ! 🚀**

Uploadez votre photo maintenant et observez les résultats.

