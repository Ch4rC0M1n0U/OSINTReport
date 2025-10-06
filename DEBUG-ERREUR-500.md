# 🔍 DEBUG - Analyse de l'erreur 500

## Questions clés :

1. **Dans quelle partie de l'application testez-vous l'upload ?**
   - [ ] Module "MediaGallery" (media_gallery) dans un rapport ?
   - [ ] ScreenshotPicker dans un autre module (IdentifierLookup, PlatformAnalysis) ?
   - [ ] Test direct via Postman/curl ?

2. **Message d'erreur exact ?**
   - Pouvez-vous ouvrir la console navigateur (F12) et me donner :
     - Le message d'erreur complet
     - La requête HTTP qui échoue
     - Le corps de la réponse 500

3. **Vérification de l'architecture**

Le système a **DEUX approches** pour les screenshots :

### Approche A : Module MediaGallery (media_gallery)
```
frontend/src/components/modules/MediaGalleryModule.vue
  ↓ utilise
frontend/src/services/screenshot.ts
  ↓ appelle
POST /api/media/upload
  ↓ traite par
backend/src/modules/media/media.controller.ts → uploadScreenshot()
  ↓ utilise
backend/src/modules/media/media.service.ts → processScreenshot()
  ↓ avec exifr
```

### Approche B : ScreenshotPicker (autres modules)
```
frontend/src/components/shared/ScreenshotPicker.vue
  ↓ utilise
frontend/src/services/screenshot.ts
  ↓ appelle (même endpoint)
POST /api/media/upload
```

## 🧪 Test rapide pour identifier le problème

### Option 1 : Test console navigateur

1. Ouvrir http://localhost:5174
2. Ouvrir Console (F12)
3. Essayer d'uploader votre image
4. Copier-coller ici :
   - Le message d'erreur rouge
   - L'onglet "Network" → Requête en erreur → Response

### Option 2 : Test direct backend

Exécutez ce script pour tester directement le backend :

```bash
cd /workspaces/OSINTReport

# Créer une vraie image de test avec exiftool
# (pas celle que j'ai créée, elle est trop simple)

# Pour cela, utilisez directement votre photo Xiaomi
# Remplacez /path/to/your/xiaomi-photo.jpg par le vrai chemin

PHOTO_PATH="/path/to/your/xiaomi-photo.jpg"

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@police.belgium.eu","password":"Admin123!"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Upload
curl -v -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$PHOTO_PATH" \
  -F "caseId=test-123"
```

### Option 3 : Vérifier les logs en temps réel

```bash
# Terminal 1 : Logs backend en temps réel
tail -f /tmp/backend.log

# Terminal 2 : Essayer l'upload depuis le navigateur
```

## 🎯 Ce que je dois savoir :

1. **Quel composant utilisez-vous** ? MediaGallery ou ScreenshotPicker ?
2. **L'erreur 500 vient de où** ? Backend ou Frontend ?
3. **Message d'erreur exact** dans la console ?
4. **Y a-t-il des logs** dans /tmp/backend.log quand vous uploadez ?

---

**Une fois ces infos fournies, je pourrai corriger précisément le problème ! 🔧**

