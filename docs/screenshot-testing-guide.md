# 🧪 Guide de Test - Système de Screenshots Sécurisés

## Prérequis

✅ Backend lancé sur `http://localhost:4000`  
✅ Frontend lancé sur `http://localhost:5174`  
✅ Utilisateur connecté avec un compte valide

---

## Tests Rapides (5 minutes)

### 1️⃣ Test Upload Screenshot

**Étapes** :
1. Ouvrir le frontend : `http://localhost:5174`
2. Se connecter avec un compte utilisateur
3. Créer ou éditer un rapport
4. Accéder au module **Analyse de Plateformes** (Platform Analysis)
5. Cliquer sur **"Ajouter un profil"**
6. Remplir le formulaire :
   - Plateforme : Facebook
   - Nom d'utilisateur : john.doe
   - Statut : Active
7. Descendre jusqu'au champ **"Capture du profil"**
8. Cliquer sur **"Upload"**
9. Sélectionner une image (PNG/JPG/WebP < 10MB)

**Résultat attendu** :
- ✅ Loader pendant l'upload
- ✅ Aperçu de l'image apparaît
- ✅ **Watermark visible** en bas à droite avec :
  - Date + Heure
  - Nom de l'investigateur
  - ID du dossier
- ✅ Pas d'erreur dans la console

**Commande de vérification backend** :
```bash
# Vérifier que le fichier est créé
ls -lh /workspaces/OSINTReport/backend/uploads/screenshots/

# Devrait afficher :
# -rw------- 1 user user 145K Jan 03 14:30 a1b2c3d4e5f6...webp
# -rw------- 1 user user  512 Jan 03 14:30 a1b2c3d4e5f6...webp.meta.json
```

**Vérifier le watermark** :
```bash
# Télécharger et ouvrir l'image
xdg-open /workspaces/OSINTReport/backend/uploads/screenshots/*.webp
```

---

### 2️⃣ Test Galerie de Screenshots

**Étapes** :
1. Dans le même formulaire (ou un autre)
2. Cliquer sur **"Choisir une capture"**
3. Observer le modal qui s'ouvre

**Résultat attendu** :
- ✅ Modal s'ouvre avec titre "📸 Galerie de captures d'écran"
- ✅ Grille responsive (2/3/4 colonnes selon écran)
- ✅ Toutes les images uploadées apparaissent
- ✅ Hover sur une image affiche :
  - Nom du fichier original
  - Taille (KB/MB)
  - Dimensions (largeur x hauteur)
  - Bouton "🗑️ Supprimer"
- ✅ Click sur une image la sélectionne
- ✅ Modal se ferme automatiquement

**Test de sélection** :
1. Cliquer sur une image de la galerie
2. Vérifier que l'aperçu change dans le formulaire
3. Vérifier que le modal se ferme

---

### 3️⃣ Test Sécurité - URL Signée

**Test 1 : URL valide**
```bash
# Copier l'URL d'un screenshot depuis la console réseau du navigateur
# Format : http://localhost:4000/api/media/screenshot/abc123.webp?signature=...&expires=...

# Tester l'accès
curl -i "COLLER_URL_COMPLETE_ICI"

# Devrait retourner :
# HTTP/1.1 200 OK
# Content-Type: image/webp
# + données binaires de l'image
```

**Test 2 : Signature invalide**
```bash
# Modifier la signature dans l'URL
curl -i "http://localhost:4000/api/media/screenshot/abc123.webp?signature=FAUSSE_SIGNATURE&expires=9999999999999"

# Devrait retourner :
# HTTP/1.1 400 Bad Request
# {"success":false,"error":"Signature invalide"}
```

**Test 3 : URL expirée**
```bash
# Utiliser un timestamp dans le passé
curl -i "http://localhost:4000/api/media/screenshot/abc123.webp?signature=xyz&expires=1000000000"

# Devrait retourner :
# HTTP/1.1 400 Bad Request
# {"success":false,"error":"URL expirée"}
```

**Test 4 : Sans authentification (direct file access)**
```bash
# Essayer d'accéder au fichier directement
curl -i "http://localhost:4000/uploads/screenshots/abc123.webp"

# Devrait retourner :
# HTTP/1.1 404 Not Found
# (car le dossier est hors du webroot)
```

---

### 4️⃣ Test Upload - Validation de Fichiers

**Test 1 : Fichier trop volumineux**
1. Créer une grande image > 10MB :
```bash
# Générer une image de 3MB
convert -size 3000x3000 xc:blue /tmp/big_image.jpg
```
2. Essayer de l'uploader via l'interface
3. **Résultat attendu** : Erreur "Fichier trop volumineux (10MB maximum)"

**Test 2 : Format non supporté**
1. Essayer d'uploader un PDF, DOCX, ou EXE
2. **Résultat attendu** : Erreur "Format non supporté. Utilisez PNG, JPG ou WebP."

**Test 3 : Upload via API (curl)**
```bash
# Sans token JWT
curl -X POST http://localhost:4000/api/media/upload \
  -F "file=@/tmp/test.png"

# Devrait retourner :
# HTTP/1.1 401 Unauthorized
# {"success":false,"error":"Authentification requise"}
```

```bash
# Avec token JWT valide
# D'abord obtenir un token en se connectant
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

# Puis uploader
curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.png" \
  -F "caseId=CASE-123" \
  -F "investigatorName=John Doe"

# Devrait retourner :
# {"success":true,"data":{...}}
```

---

### 5️⃣ Test Suppression de Screenshot

**Étapes** :
1. Ouvrir la galerie de screenshots
2. Hover sur une image
3. Cliquer sur **"🗑️ Supprimer"**
4. Confirmer la suppression dans la popup

**Résultat attendu** :
- ✅ Popup de confirmation apparaît
- ✅ Après confirmation, loader s'affiche
- ✅ Image disparaît de la galerie
- ✅ Si l'image était sélectionnée, l'aperçu disparaît
- ✅ Fichier supprimé du serveur

**Vérification backend** :
```bash
# Avant suppression
ls /workspaces/OSINTReport/backend/uploads/screenshots/ | wc -l
# Exemple : 6 fichiers (3 images + 3 .meta.json)

# Après suppression
ls /workspaces/OSINTReport/backend/uploads/screenshots/ | wc -l
# Exemple : 4 fichiers (2 images + 2 .meta.json)
```

**Test de sécurité - Suppression par un autre utilisateur** :
```bash
# Utilisateur A uploade une image
# Utilisateur B essaie de la supprimer

curl -X DELETE http://localhost:4000/api/media/screenshot/abc123.webp \
  -H "Authorization: Bearer $TOKEN_USER_B"

# Devrait retourner :
# HTTP/1.1 403 Forbidden
# {"success":false,"error":"Vous ne pouvez pas supprimer ce fichier"}
```

---

### 6️⃣ Test Affichage dans la Card

**Étapes** :
1. Sauvegarder un profil avec screenshot
2. Retourner à la liste des modules
3. Observer la card du profil créé

**Résultat attendu** :
- ✅ Section **"📸 Capture du profil"** visible
- ✅ Image affichée (w-full h-32 object-cover)
- ✅ Hover change l'opacité (80%)
- ✅ Click ouvre l'image en plein écran dans un nouvel onglet

---

### 7️⃣ Test Compression & Qualité

**Avant/Après Compression** :
```bash
# Taille du fichier original
ls -lh /tmp/test.png
# Exemple : -rw-r--r-- 1 user user 1.8M Jan 03 14:00 test.png

# Taille après upload (WebP)
ls -lh /workspaces/OSINTReport/backend/uploads/screenshots/*.webp
# Exemple : -rw------- 1 user user 145K Jan 03 14:30 abc123.webp

# Ratio de compression : 1.8MB → 145KB = 92% de réduction
```

**Qualité visuelle** :
1. Ouvrir l'image originale
2. Ouvrir l'image compressée (depuis la galerie ou card)
3. Comparer visuellement
4. **Résultat attendu** : Différence minime, qualité encore excellente (85%)

---

### 8️⃣ Test Préservation EXIF

**Vérifier les métadonnées** :
```bash
# Installer exiftool si nécessaire
sudo apt-get install libimage-exiftool-perl

# Image originale avec EXIF
exiftool /tmp/photo_avec_gps.jpg
# Devrait afficher : Camera, GPS, Date, etc.

# Image uploadée
exiftool /workspaces/OSINTReport/backend/uploads/screenshots/abc123.webp
# Devrait ENCORE afficher les mêmes données EXIF
```

**Cas d'usage important** :
- Photo prise avec smartphone → GPS préservé
- Photo prise avec appareil pro → Modèle appareil préservé
- Date de prise de vue → Horodatage forensique préservé

---

## Tests Avancés (10 minutes)

### 9️⃣ Test Intégration Multi-Modules

**Modules à tester** :
1. **PlatformAnalysis** ✅ (déjà intégré)
2. **IdentifierLookup** (à intégrer)
3. **MediaGallery** (à créer)

**Pour chaque module** :
1. Ajouter le champ screenshot dans le formulaire
2. Tester upload + sélection
3. Vérifier affichage dans la card

---

### 🔟 Test Performance

**Upload simultanés** :
```bash
# Lancer 10 uploads en parallèle
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/media/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/test_$i.png" &
done
wait

# Vérifier que tous ont réussi
ls /workspaces/OSINTReport/backend/uploads/screenshots/*.webp | wc -l
# Devrait afficher : 10 (ou plus si déjà des fichiers existants)
```

**Temps de réponse** :
```bash
# Mesurer le temps d'upload
time curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.png"

# Objectif : < 500ms pour une image de 1MB
```

---

### 1️⃣1️⃣ Test Expiration d'URL (48h)

**Simulation d'expiration** :
```bash
# Modifier le service pour tester (à des fins de test uniquement)
# Dans media.service.ts, changer :
# const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
# Par :
# const expiresAt = Date.now() + 5000; // 5 secondes

# Uploader une image
# Attendre 6 secondes
# Essayer d'accéder à l'URL

# Devrait retourner "URL expirée"
```

---

## Checklist Complète

### Backend
- [ ] Upload fonctionne avec JWT
- [ ] Upload refuse sans JWT (401)
- [ ] Upload refuse fichiers > 10MB
- [ ] Upload refuse formats non-image
- [ ] Compression WebP fonctionnelle
- [ ] Watermark visible et lisible
- [ ] EXIF préservé
- [ ] URLs signées générées
- [ ] Vérification signature OK
- [ ] Expiration URLs respectée
- [ ] Suppression autorisée seulement pour uploader
- [ ] Liste screenshots filtrée par utilisateur

### Frontend
- [ ] ScreenshotPicker s'affiche correctement
- [ ] Upload via bouton "Upload"
- [ ] Sélection via galerie
- [ ] Preview de l'image sélectionnée
- [ ] Hover actions (Changer, Supprimer)
- [ ] Click pour agrandir
- [ ] Loader pendant upload
- [ ] Erreurs affichées (type, taille)
- [ ] Modal galerie responsive
- [ ] Suppression fonctionne
- [ ] Intégration dans PlatformAnalysis OK

### Sécurité
- [ ] Accès direct fichier impossible
- [ ] URL sans signature refusée
- [ ] URL avec signature modifiée refusée
- [ ] URL expirée refusée
- [ ] Upload sans auth refusé
- [ ] Suppression cross-user refusée
- [ ] Fichiers hors webroot
- [ ] Noms fichiers aléatoires
- [ ] Rate limiting actif

---

## Résolution de Problèmes

### Problème 1 : "Cannot POST /api/media/upload"
**Cause** : Router media non enregistré  
**Solution** :
```bash
# Vérifier routes/index.ts
grep "mediaRouter" /workspaces/OSINTReport/backend/src/routes/index.ts

# Devrait afficher :
# import { mediaRouter } from "@modules/media/media.router";
# router.use("/media", mediaRouter);
```

### Problème 2 : "Module 'sharp' not found"
**Cause** : Dépendance manquante  
**Solution** :
```bash
cd /workspaces/OSINTReport/backend
npm install sharp exifreader multer
npm install --save-dev @types/multer
```

### Problème 3 : "EACCES: permission denied"
**Cause** : Permissions dossier uploads  
**Solution** :
```bash
chmod 700 /workspaces/OSINTReport/backend/uploads/screenshots
chown -R $USER /workspaces/OSINTReport/backend/uploads
```

### Problème 4 : Upload bloqué à 100%
**Cause** : Timeout réseau  
**Solution** :
```bash
# Augmenter la limite dans app.ts
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

### Problème 5 : Watermark non visible
**Cause** : SVG mal formaté ou taille trop petite  
**Solution** :
```bash
# Vérifier le SVG généré dans les logs
# Ou télécharger l'image et zoomer pour vérifier
```

---

## Métriques de Succès

✅ **Tous les tests passent** : 0 erreur critique  
✅ **Performance acceptable** : Upload < 500ms  
✅ **Compression efficace** : Ratio > 80%  
✅ **Sécurité respectée** : 0 accès non autorisé  
✅ **UX fluide** : 0 bug d'affichage  

---

**Durée totale des tests** : ~15 minutes  
**Tests automatisés** : À venir (TODO)  
**Prochaine étape** : Intégration dans les autres modules
