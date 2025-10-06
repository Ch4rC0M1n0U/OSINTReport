# 🚀 Quick Start - Système de Screenshots

## Installation (5 minutes)

### 1. Dépendances

```bash
# Backend
cd backend
npm install sharp exifreader multer
npm install --save-dev @types/multer
```

### 2. Configuration

**Créer `.env` si absent** :
```bash
cd backend
cat >> .env << 'EOF'
# Screenshot Security
MEDIA_SECRET_KEY=your-super-secret-key-change-in-production-please-min-32-chars
API_URL=http://localhost:4000
EOF
```

### 3. Dossiers

```bash
mkdir -p backend/uploads/screenshots/temp
chmod 700 backend/uploads/screenshots
```

### 4. Démarrage

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

---

## Utilisation Rapide (2 minutes)

### Dans un module Vue

```vue
<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text">Capture d'écran</span>
    </label>
    <ScreenshotPicker v-model="screenshot" label="Screenshot du profil" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ScreenshotPicker from '@/components/shared/ScreenshotPicker.vue';

const screenshot = ref('');
</script>
```

### Avec metadata (Finding)

```typescript
const screenshot = computed({
  get: () => profileToEdit.value.metadata?.screenshot || '',
  set: (value: string) => {
    if (!profileToEdit.value.metadata) {
      profileToEdit.value.metadata = {};
    }
    profileToEdit.value.metadata.screenshot = value;
  },
});
```

### Affichage dans une Card

```vue
<div v-if="screenshot" class="mt-3">
  <p class="text-xs font-semibold text-base-content/70 mb-1">
    📸 Capture
  </p>
  <img
    :src="screenshot"
    alt="Screenshot"
    class="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
    @click="openScreenshot"
  />
</div>

<script setup lang="ts">
const screenshot = computed(() => props.item.metadata?.screenshot);

function openScreenshot() {
  if (screenshot.value) {
    window.open(screenshot.value, '_blank');
  }
}
</script>
```

---

## API Usage

### Upload

```bash
curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@screenshot.png" \
  -F "caseId=CASE-123" \
  -F "investigatorName=John Doe"
```

### List

```bash
curl -X GET http://localhost:4000/api/media/screenshots/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete

```bash
curl -X DELETE http://localhost:4000/api/media/screenshot/abc123.webp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Vérification

```bash
# Vérifier que les routes sont enregistrées
curl http://localhost:4000/api/health
# Devrait retourner : {"status":"ok"}

# Vérifier que le dossier existe
ls -la backend/uploads/screenshots/
# Devrait afficher : drwx------ temp/

# Vérifier Sharp installé
cd backend
npm list sharp
# Devrait afficher : sharp@x.x.x
```

---

## Documentation Complète

- **Architecture** : `docs/screenshot-security-system.md`
- **Tests** : `docs/screenshot-testing-guide.md`
- **Session** : `docs/SESSION-8-SCREENSHOTS-COMPLETE.md`

---

## Support

**Problème** | **Solution**
--- | ---
Module not found 'sharp' | `npm install sharp`
Permission denied | `chmod 700 backend/uploads/screenshots`
401 Unauthorized | Vérifier que JWT est envoyé dans headers
Upload bloqué | Vérifier taille < 10MB et format PNG/JPG/WebP

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-XX
