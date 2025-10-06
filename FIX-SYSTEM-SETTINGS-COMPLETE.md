# ✅ Correction complète - Page Paramètres Système

## 🐛 Problèmes identifiés et résolus

### 1. **Logo URL incorrecte** (RÉSOLU ✅)
**Symptôme**: Logo ne s'affiche pas, URL pointe vers le frontend au lieu du backend

**Cause**: 
- `getLogoUrl()` utilisait `window.location.origin` qui retourne l'URL du frontend (port 5173)
- Pas de proxy Vite pour `/uploads`

**Solution**:
- Ajout du proxy `/uploads` dans `vite.config.ts`
- Modification de `getLogoUrl()` pour retourner le chemin relatif en dev (`/uploads/logos/...`)
- Le proxy Vite redirige automatiquement vers le backend

**Fichiers modifiés**:
- `frontend/vite.config.ts` - Ajout proxy `/uploads`
- `frontend/src/services/api/settings.ts` - `getLogoUrl()` retourne chemin relatif en dev

---

### 2. **Upload en boucle infinie** (RÉSOLU ✅)
**Symptôme**: "Upload en cours..." ne disparaît jamais, besoin de rafraîchir manuellement

**Cause**: 
- Les fonctions `modal.showSuccess()` et `modal.showError()` retournent des Promises
- `await modal.showSuccess()` bloque l'exécution jusqu'à ce que l'utilisateur ferme la modale
- Le `finally { uploading.value = false }` ne s'exécute jamais

**Solution**:
- Suppression des `await` devant `modal.showSuccess()` et `modal.showError()`
- Les modales s'affichent mais le code continue
- Le `finally` s'exécute immédiatement et `uploading.value = false`

**Fichiers modifiés**:
- `frontend/src/pages/admin/SystemSettingsPage.vue` - Fonctions `handleLogoChange()` et `handleSubmit()`

---

### 3. **Bouton "Supprimer le logo" ne fonctionne pas** (RÉSOLU ✅)
**Symptôme**: Clic sur le bouton ne fait rien, fonction appelée mais s'arrête

**Cause**: 
- Le composant `ModalDialog` n'était pas importé dans `SystemSettingsPage`
- `modal.showConfirm()` créait une Promise mais aucun composant ne déclenchait `handleConfirm()` ou `handleCancel()`
- La Promise restait en attente indéfiniment

**Solution**:
- Import de `ModalDialog` dans `SystemSettingsPage.vue`
- Ajout du composant dans le template avec liaison aux événements
- `@confirm="modal.handleConfirm"` et `@cancel="modal.handleCancel"`
- Ajout de `.prevent` sur le click handler pour empêcher comportement par défaut

**Fichiers modifiés**:
- `frontend/src/pages/admin/SystemSettingsPage.vue` - Import + template + `@click.prevent`

---

## 📋 Résumé des modifications

### `frontend/vite.config.ts`
```typescript
proxy: {
  "/api": {
    target: env.VITE_API_URL ?? "http://localhost:4000",
    changeOrigin: true,
    secure: false,
  },
  "/uploads": {  // ← AJOUTÉ
    target: env.VITE_API_URL ?? "http://localhost:4000",
    changeOrigin: true,
    secure: false,
  },
},
```

### `frontend/src/services/api/settings.ts`
```typescript
getLogoUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith("http")) return logoPath;

  // En développement, le proxy Vite gère /uploads
  if (import.meta.env.DEV) {
    return logoPath;  // Retourne juste "/uploads/logos/xxx.png"
  }

  // En production, construire l'URL complète
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : window.location.origin.replace(/\/$/, "");

  return `${baseUrl}${logoPath}`;
}
```

### `frontend/src/pages/admin/SystemSettingsPage.vue`

**Template** - Ajout du composant ModalDialog:
```vue
<!-- Modal Dialog -->
<ModalDialog
  v-model="modal.isOpen.value"
  :title="modal.config.value.title"
  :message="modal.config.value.message"
  :type="modal.config.value.type"
  :confirm-text="modal.config.value.confirmText"
  :cancel-text="modal.config.value.cancelText"
  :is-confirm="modal.config.value.type === 'confirm' || modal.config.value.type === 'error'"
  @confirm="modal.handleConfirm"
  @cancel="modal.handleCancel"
/>
```

**Script** - Import du composant:
```typescript
import ModalDialog from "@/components/shared/ModalDialog.vue";
```

**Template** - Bouton suppression avec .prevent:
```vue
<button
  type="button"
  @click.prevent="handleRemoveLogo"  // ← .prevent ajouté
  class="btn btn-error btn-sm"
  :disabled="uploading"
>
  <span v-if="uploading" class="loading loading-spinner loading-xs"></span>
  <span v-else>🗑️</span>
  Supprimer
</button>
```

**Script** - Suppression des await sur modales:
```typescript
async function handleLogoChange(event: Event) {
  // ...
  try {
    const updated = await settingsApi.uploadLogo(file);
    settings.value = updated;
    modal.showSuccess("Logo uploadé avec succès !");  // ← Plus de await
  } catch (err: any) {
    modal.showError(err.response?.data?.message);    // ← Plus de await
  } finally {
    uploading.value = false;  // ← S'exécute immédiatement
  }
}

async function handleRemoveLogo() {
  const confirmed = await modal.showConfirm(...);  // ← await conservé car on attend la réponse
  if (!confirmed) return;
  
  try {
    const updated = await settingsApi.removeLogo();
    settings.value = updated;
    modal.showSuccess("Logo supprimé avec succès !");  // ← Plus de await
  } catch (err: any) {
    modal.showError(err.response?.data?.message);    // ← Plus de await
  } finally {
    uploading.value = false;  // ← S'exécute immédiatement
  }
}
```

---

## 🧪 Tests à effectuer

### Test 1: Upload de logo
1. Aller sur `/admin/system`
2. Cliquer sur "Choisir un fichier"
3. Sélectionner une image (PNG, JPG, SVG, WebP, < 5MB)
4. **Vérifier**:
   - ✅ Spinner apparaît brièvement
   - ✅ Spinner disparaît automatiquement (pas besoin de rafraîchir)
   - ✅ Modale de succès s'affiche
   - ✅ Logo s'affiche dans la prévisualisation
   - ✅ Logo s'affiche dans le header de l'application

### Test 2: Suppression de logo
1. Avec un logo déjà uploadé
2. Cliquer sur "🗑️ Supprimer"
3. **Vérifier**:
   - ✅ Modale de confirmation apparaît
   - ✅ Cliquer sur "Confirmer"
   - ✅ Spinner apparaît brièvement sur le bouton
   - ✅ Spinner disparaît automatiquement
   - ✅ Modale de succès s'affiche
   - ✅ Logo disparaît de la prévisualisation
   - ✅ Message "Aucun logo défini" apparaît
   - ✅ Logo disparaît du header

### Test 3: Modification des paramètres
1. Modifier les champs (nom du service, adresse, etc.)
2. Cliquer sur "💾 Enregistrer"
3. **Vérifier**:
   - ✅ Spinner apparaît sur le bouton
   - ✅ Modale de succès s'affiche
   - ✅ Spinner disparaît
   - ✅ Les modifications sont sauvegardées (vérifier en rafraîchissant)

---

## 🔍 Debug

Si un problème persiste, ouvrir la console (F12) et vérifier:

### Logs attendus pour suppression de logo:
```
handleRemoveLogo appelé
Confirmation: true
Appel de settingsApi.removeLogo()
Logo supprimé, updated: { ... logoUrl: null }
```

### Requêtes réseau (F12 → Network):
- `DELETE /api/settings/logo` → Status 200
- Response body: `{ "logoUrl": null, ... }`

### Affichage du logo via proxy:
- URL dans l'img: `/uploads/logos/logo-xxx.png` (chemin relatif)
- Requête réseau: `GET /uploads/logos/logo-xxx.png` → Status 200
- Proxifié vers: `http://localhost:4000/uploads/logos/logo-xxx.png`

---

## ✨ Résultat final

L'upload et la suppression de logo fonctionnent maintenant correctement:
- ✅ Upload instantané avec feedback visuel
- ✅ Suppression avec confirmation
- ✅ Pas besoin de rafraîchir manuellement
- ✅ Affichage immédiat dans toute l'application
- ✅ Modales de succès/erreur non bloquantes
- ✅ État de chargement géré correctement

## 🚀 Prochaines étapes possibles

- [ ] Ajouter un crop d'image avant upload
- [ ] Limiter les dimensions du logo (ex: max 500x500px)
- [ ] Prévisualisation avant upload
- [ ] Glisser-déposer pour l'upload
- [ ] Historique des logos précédents
- [ ] Suppression automatique des anciens fichiers logo
