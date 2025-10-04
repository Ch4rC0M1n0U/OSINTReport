# 📸 Galerie de Captures d'Écran

Ce dossier contient les captures d'écran utilisées dans les modules d'analyse OSINT.

## 📁 Structure

```
screenshots/
├── index.json          # Index des captures disponibles
├── example-*.png       # Captures d'exemple
└── [vos captures]      # Vos captures personnalisées
```

## 🎯 Utilisation

### Ajouter une capture à la galerie

1. **Placer l'image** dans ce dossier (`frontend/public/images/screenshots/`)
2. **Mettre à jour** le fichier `index.json` :

```json
{
  "screenshots": [
    {
      "name": "Profil Facebook - Suspect A",
      "url": "/images/screenshots/suspect-a-facebook.png"
    },
    {
      "name": "Discussion Telegram - Groupe X",
      "url": "/images/screenshots/telegram-group-x.png"
    }
  ]
}
```

### Upload direct depuis l'interface

Le composant **ScreenshotPicker** permet aussi d'uploader directement depuis l'interface :
- Cliquez sur **"📤 Upload"**
- Sélectionnez une image (PNG, JPG, WebP...)
- L'image est ajoutée temporairement à la galerie

> ⚠️ **Note** : L'upload temporaire n'est pas persistant. Pour une solution permanente, implémentez un endpoint backend d'upload.

## 🔧 Format des captures

- **Formats supportés** : PNG, JPG, JPEG, WebP, GIF
- **Taille recommandée** : Max 2 MB par image
- **Dimensions** : Largeur max 1920px (auto-resize dans l'interface)

## 🎨 Bonnes pratiques

1. **Nommage** : Utilisez des noms descriptifs
   - ✅ `facebook-john-doe-profile.png`
   - ❌ `screenshot1.png`

2. **Organisation** : Groupez par type/plateforme
   ```
   screenshots/
   ├── facebook/
   ├── instagram/
   ├── telegram/
   └── twitter/
   ```

3. **Confidentialité** : Anonymisez les données sensibles avant upload

## 🚀 Intégration dans les modules

Le **ScreenshotPicker** est intégré dans :
- ✅ **PlatformAnalysisModule** - Capture de profils
- ⏳ **IdentifierLookupModule** - Preuves de recherche
- ⏳ **MediaGalleryModule** - Collection de médias

## 📝 TODO Backend

Pour une solution production :

```typescript
// backend/src/modules/media/media.controller.ts
@Post('upload/screenshot')
async uploadScreenshot(@UploadedFile() file: Express.Multer.File) {
  // Valider le fichier
  // Sauvegarder dans /uploads/screenshots/
  // Mettre à jour index.json
  // Retourner l'URL
}
```

## 🔒 Sécurité

- [ ] Validation du type MIME
- [ ] Limitation de taille (2 MB max)
- [ ] Scan antivirus
- [ ] Stockage sécurisé (hors webroot)
- [ ] URLs signées pour accès temporaire
