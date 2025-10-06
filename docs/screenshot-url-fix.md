# 🔧 Correction - URL des Screenshots

## Problème Identifié

Les URLs générées pour les screenshots pointaient vers `http://localhost:3000` au lieu du port correct `http://localhost:4000`.

**Exemple d'URL incorrecte** :
```
http://localhost:3000/api/media/screenshot/0fa813355b1e7636d3ab85c69198fd52.webp?signature=a988f1058152799e598f8057e34936c8025e06470daab378b9d246097861e280&expires=1759753090506
```

**URL correcte attendue** :
```
http://localhost:4000/api/media/screenshot/0fa813355b1e7636d3ab85c69198fd52.webp?signature=...&expires=...
```

---

## Cause

La variable d'environnement `API_URL` n'était pas définie dans le fichier `.env` du backend. Le service `media.service.ts` utilisait une valeur par défaut hardcodée :

```typescript
const baseUrl = process.env.API_URL || 'http://localhost:3000';
```

Or, le backend tourne sur le **port 4000** (défini par `PORT=4000` dans `.env`).

---

## Solution Appliquée

### 1. Ajout de la variable d'environnement

**Fichier** : `/workspaces/OSINTReport/backend/.env`

```properties
# Media/Screenshot Configuration
MEDIA_SECRET_KEY=your-super-secret-key-change-in-production-please-min-32-chars-long
API_URL=http://localhost:4000
```

### 2. Redémarrage du backend

```bash
pkill -f "ts-node-dev"
cd /workspaces/OSINTReport/backend
npm run dev
```

### 3. Mise à jour de la documentation

Fichiers corrigés :
- ✅ `docs/screenshot-testing-guide.md` - Tous les ports 3000 → 4000
- ✅ `docs/screenshot-quickstart.md` - Configuration et exemples curl

---

## Vérification

### Test manuel

1. **Uploader un nouveau screenshot** via l'interface
2. **Inspecter la réponse** dans la console réseau du navigateur
3. **Vérifier l'URL** dans le champ `data.url`

**Devrait maintenant afficher** :
```json
{
  "success": true,
  "data": {
    "filename": "abc123...webp",
    "url": "http://localhost:4000/api/media/screenshot/abc123...webp?signature=...&expires=...",
    "expiresAt": 1759753090506,
    "metadata": { ... }
  }
}
```

### Test automatique

```bash
# Tester l'upload
curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.png" \
  | jq '.data.url'

# Devrait afficher une URL commençant par http://localhost:4000
```

---

## Configuration pour Production

⚠️ **Important** : En production, remplacer par l'URL publique :

```properties
# .env (production)
API_URL=https://api.votre-domaine.com
```

---

## Checklist de Vérification

- [x] Variable `API_URL` ajoutée dans `.env`
- [x] Backend redémarré
- [x] Documentation mise à jour
- [ ] Test d'upload effectué
- [ ] URL vérifiée dans la réponse
- [ ] Screenshot accessible via l'URL

---

**Date de correction** : 4 octobre 2025  
**Status** : ✅ CORRIGÉ  
**Impact** : Les nouveaux uploads généreront des URLs correctes
