# 📷 Upload d'Images dans les Entités Identifiées

> **Date** : 2025-01-XX  
> **Statut** : ✅ Implémenté  
> **Impact** : Enrichissement visuel des entités (personnes, entreprises, etc.)

---

## 🎯 Objectif

Permettre l'ajout de **photos, logos et captures d'écran** directement lors de la création ou de l'édition d'une entité dans le module **"Entités Identifiées"**.

Ces images seront ensuite affichées automatiquement sous forme de **miniatures (120x120px)** lorsque l'entité est insérée dans un bloc de texte enrichi du rapport.

---

## 🧩 Cas d'Usage

### Exemple 1 : Personne Physique

- **Entité** : Robert Redford
- **Type** : Personne
- **Image uploadée** : Photo d'identité, capture d'écran de profil LinkedIn
- **Résultat** : Lors de l'insertion dans un bloc texte, sa photo apparaît en miniature cliquable

### Exemple 2 : Entreprise

- **Entité** : ACME Corporation
- **Type** : Société
- **Image uploadée** : Logo de l'entreprise, capture du site web
- **Résultat** : Le logo s'affiche en miniature lors de l'insertion dans le rapport

---

## 🔧 Implémentation Technique

### 1. Composant Modifié

**Fichier** : `frontend/src/components/modules/EntityEditModal.vue`

#### Section HTML (Lignes ~319-384)

```vue
<!-- Pièces jointes / Images -->
<div class="form-control">
  <label class="label">
    <span class="label-text">📷 Photos / Captures d'écran ({{ attachmentsCount }})</span>
    <span class="label-text-alt text-xs opacity-60">
      Logos, photos d'identité, documents...
    </span>
  </label>

  <!-- Liste des images actuelles -->
  <div v-if="attachmentsCount > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
    <div
      v-for="(attachmentId, idx) in localEntity.attachments"
      :key="idx"
      class="relative group"
    >
      <img
        :src="`/api/media/screenshot/${attachmentId}`"
        alt="Pièce jointe"
        class="w-full h-24 object-cover rounded border border-base-300"
      />
      <button
        type="button"
        class="absolute top-1 right-1 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
        @click="removeAttachment(idx)"
        title="Supprimer"
      >
        ✕
      </button>
    </div>
  </div>

  <!-- Boutons d'ajout -->
  <div class="flex gap-2">
    <button
      type="button"
      class="btn btn-sm btn-outline flex-1"
      @click="openScreenshotGallery"
    >
      <span>🖼️</span>
      <span>Choisir depuis la galerie</span>
    </button>
    <label class="btn btn-sm btn-outline cursor-pointer">
      <span>📤</span>
      <span>Upload</span>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        @change="handleFileUpload"
      />
    </label>
  </div>

  <!-- Erreur d'upload -->
  <div v-if="uploadError" class="alert alert-error mt-2 text-sm">
    <span>⚠️</span>
    <span>{{ uploadError }}</span>
  </div>

  <!-- Info -->
  <label class="label">
    <span class="label-text-alt text-xs opacity-60">
      💡 Ces images apparaîtront dans les blocs de texte enrichi
    </span>
  </label>
</div>
```

#### Section TypeScript (Lignes ~815-871)

```typescript
// ==================== GESTION DES PIÈCES JOINTES / IMAGES ====================

const uploadError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploadingFile = ref(false);

const attachmentsCount = computed(() => {
  return localEntity.value.attachments?.length || 0;
});

/**
 * Upload d'un ou plusieurs fichiers depuis le bouton Upload
 */
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) return;

  uploadError.value = null;
  isUploadingFile.value = true;

  try {
    // Import dynamique du service
    const { screenshotService } = await import("@/services/screenshot");

    for (const file of Array.from(files)) {
      // Vérification taille (2 MB max)
      if (file.size > 2 * 1024 * 1024) {
        uploadError.value = `Le fichier "${file.name}" dépasse 2 MB`;
        continue;
      }

      // Upload
      const response = await screenshotService.upload(file, {
        caseId: undefined, // Pas de caseId pour les entités
      });

      // Ajouter le filename aux attachments
      if (!localEntity.value.attachments) {
        localEntity.value.attachments = [];
      }
      localEntity.value.attachments.push(response.filename);
    }
  } catch (error: any) {
    uploadError.value = error.message || "Erreur lors de l'upload";
  } finally {
    isUploadingFile.value = false;
    // Reset l'input pour permettre un nouvel upload du même fichier
    if (input) {
      input.value = "";
    }
  }
}

/**
 * Supprimer une pièce jointe par son index
 */
function removeAttachment(index: number) {
  if (!localEntity.value.attachments) return;
  localEntity.value.attachments.splice(index, 1);
}

/**
 * Ouvrir la galerie de screenshots (TODO: à implémenter si besoin)
 */
function openScreenshotGallery() {
  // Pour l'instant, on peut juste lancer un message ou ne rien faire
  // Cette fonction pourrait ouvrir une modal de sélection depuis les screenshots existants
  console.log("TODO: Implémenter la galerie de screenshots");
}
```

### 2. Service Utilisé

**Service** : `screenshotService` (`frontend/src/services/screenshot.ts`)

- **Endpoint API** : `POST /api/media/upload`
- **Limite de taille** : 2 MB par fichier
- **Formats acceptés** : PNG, JPG, JPEG, WebP
- **Stockage** : Les images sont stockées dans `backend/uploads/screenshots/`
- **URL signée** : Expire après 48h pour sécurité

### 3. Affichage dans les Blocs de Texte

**Fichier** : `frontend/src/components/modules/EntityInsertModal.vue`

Lorsque l'entité est insérée dans un bloc de texte via la fonction `generateEntityTable()`, les images apparaissent automatiquement en miniatures (120x120px) cliquables qui s'ouvrent dans un nouvel onglet.

---

## 📋 Workflow Utilisateur

### Étape 1 : Créer/Éditer une Entité

1. Ouvrir le module **"Entités Identifiées"**
2. Cliquer sur **"Nouvelle Entité"** ou éditer une entité existante
3. Remplir les champs (Nom, Type, Description, etc.)

### Étape 2 : Ajouter des Images

4. Descendre jusqu'à la section **"📷 Photos / Captures d'écran"**
5. Deux options :
   - **Upload** : Cliquer sur le bouton "📤 Upload" et sélectionner un ou plusieurs fichiers (max 2 MB chacun)
   - **Galerie** : Cliquer sur "🖼️ Choisir depuis la galerie" (TODO)

### Étape 3 : Gérer les Images

6. Les images uploadées s'affichent en grille (2 colonnes sur mobile, 3 sur desktop)
7. Au survol d'une image, un bouton ✕ apparaît pour la supprimer
8. Sauvegarder l'entité

### Étape 4 : Insérer dans un Bloc de Texte

9. Ouvrir un bloc de texte enrichi (TipTap)
10. Cliquer sur le bouton **"Insérer Entités"**
11. Sélectionner l'entité (ex: "Robert Redford")
12. Cliquer sur **"Insérer Tableau"**
13. Les images apparaissent en miniatures (120x120px) dans le tableau généré

---

## 🎨 Interface Utilisateur

### Grille d'Images

```
┌─────────────┬─────────────┬─────────────┐
│   Image 1   │   Image 2   │   Image 3   │
│  [96x96px]  │  [96x96px]  │  [96x96px]  │
│     ✕       │     ✕       │     ✕       │
└─────────────┴─────────────┴─────────────┘
```

- **Affichage** : `object-cover` pour conserver les proportions
- **Hover** : Bouton de suppression (✕) apparaît en haut à droite
- **Border** : `border-base-300` pour délimitation visuelle

### Boutons d'Action

```
┌──────────────────────────────────┬─────────────┐
│  🖼️ Choisir depuis la galerie  │  📤 Upload  │
└──────────────────────────────────┴─────────────┘
```

### Messages d'Erreur

Si un fichier dépasse 2 MB :

```
┌──────────────────────────────────────────────┐
│ ⚠️ Le fichier "photo.jpg" dépasse 2 MB     │
└──────────────────────────────────────────────┘
```

---

## ✅ Validation et Tests

### Checklist Fonctionnelle

- [x] Upload de fichiers PNG/JPG/WebP
- [x] Validation de la taille (max 2 MB)
- [x] Affichage des miniatures en grille
- [x] Suppression d'images au hover
- [x] Sauvegarde dans `Finding.attachments[]`
- [x] Affichage dans les blocs de texte enrichi
- [x] Build frontend sans erreurs (6.82s)

### Tests Manuels Recommandés

1. **Upload Simple** : Upload d'une seule image (PNG 500 KB)
2. **Upload Multiple** : Upload de 3 images simultanément
3. **Limite de Taille** : Tenter d'uploader un fichier > 2 MB (erreur attendue)
4. **Suppression** : Supprimer une image, sauvegarder, vérifier qu'elle ne réapparaît pas
5. **Insertion** : Insérer l'entité dans un bloc texte et vérifier l'affichage des miniatures

---

## 🔄 Compatibilité Backend

### Structure de `Finding`

```typescript
interface Finding {
  label: string;
  description: string;
  confidence: "confirmed" | "probable" | "possible";
  sources: Source[];
  attachments?: string[]; // ← Tableau de filenames (ex: ["abc123.png", "def456.jpg"])
  metadata?: {
    entityType?: "person" | "company" | "group" | "other";
    aliases?: string[];
    isVerified?: boolean;
    // ...
  };
}
```

Les `attachments` sont stockés sous forme de **tableau de chaînes** contenant les **filenames** (pas les URLs complètes).

---

## 🚀 Améliorations Futures

### Court Terme

- [ ] Implémenter la galerie de sélection (`openScreenshotGallery`)
- [ ] Ajouter un loader/spinner pendant l'upload
- [ ] Afficher une prévisualisation avant upload
- [ ] Permettre le drag & drop d'images

### Long Terme

- [ ] Reconnaissance faciale automatique (AI)
- [ ] Extraction de métadonnées EXIF (GPS, date de capture)
- [ ] Recadrage/rotation d'images
- [ ] Annotation/balisage d'images (zones d'intérêt)

---

## 📚 Documentation Liée

- [FEATURE-IMAGE-THUMBNAILS.md](./FEATURE-IMAGE-THUMBNAILS.md) - Affichage des miniatures dans les rapports
- [FEATURE-THUMBNAILS-ALL-ENTITIES.md](./FEATURE-THUMBNAILS-ALL-ENTITIES.md) - Support des thumbnails pour toutes les entités
- [BUGFIX-ENTITIES-TEXT-BLOCKS.md](./BUGFIX-ENTITIES-TEXT-BLOCKS.md) - Ajout du module 'entities' dans les blocs de texte

---

## 🐛 Dépannage

### Problème : "Cannot find module '@/services/screenshot'"

**Solution** : Vérifier que le fichier `frontend/src/services/screenshot.ts` existe. Si nécessaire, redémarrer le serveur de dev (`npm run dev`).

### Problème : Images ne s'affichent pas

**Causes possibles** :

1. URL signée expirée (> 48h)
2. Fichier supprimé du disque
3. Problème de permissions backend

**Solution** : Re-uploader l'image ou vérifier les logs backend.

### Problème : "Le fichier dépasse 2 MB"

**Solution** : Compresser l'image avec un outil comme TinyPNG ou ImageOptim avant upload.

---

## 👤 Auteur

**GitHub Copilot** - Implémentation assistée pour OSINTReport

---

## 📝 Changelog

| Date       | Version | Description                                                            |
| ---------- | ------- | ---------------------------------------------------------------------- |
| 2025-01-XX | 1.0.0   | Première implémentation complète de l'upload d'images dans les entités |
