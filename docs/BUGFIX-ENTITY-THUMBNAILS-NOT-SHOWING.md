# 🐛 Bugfix : Miniatures d'Images Non Affichées dans les Blocs de Texte

> **Date** : 2025-10-25  
> **Problème** : "1 fichier(s) joint(s)" affiché mais pas de miniatures d'images  
> **Statut** : ✅ **RÉSOLU**

---

## 🔴 Problème Initial

Lors de l'insertion d'une entité (ex: Robert Redford) dans un bloc de texte enrichi, on voit :

```
📎 Pièces jointes
1 fichier(s) joint(s)
```

**Mais PAS de miniatures d'images** (120x120px) contrairement à ce qui était prévu.

---

## 🔍 Analyse du Problème

### Problème 1 : URLs Incorrectes

**Code Avant** (INCORRECT) :

```typescript
// Dans generateEntityTable() et generateFindingTable()
const thumbnailsHtml = finding.attachments.map((attachmentId: string) => {
  const imageUrl = `/api/media/screenshot/${attachmentId}`; // ❌ INCORRECT
  return `<img src="${imageUrl}" ... />`;
});
```

**Problème** :

- Le code traitait `attachmentId` comme un **filename** simple
- Construisait l'URL `/api/media/screenshot/abc123.png`
- **MAIS** : `finding.attachments[]` contient déjà des **URLs signées complètes** (ex: `https://api.example.com/media/screenshot/abc123.png?signature=...&expires=...`)

### Problème 2 : Attachments Non Passés

**Code Avant** (INCOMPLET) :

```typescript
function selectEntity(entity: Entity) {
  if (needsTable) {
    emit("select", entity, generateEntityTable(entity)); // ❌ Pas d'attachments passés
  }
}
```

**Problème** :

- La fonction `generateEntityTable()` accepte un paramètre `attachments?: string[]`
- Mais quand on appelle cette fonction, on ne passe **PAS** les attachments
- Résultat : Même si l'entité a des attachments, ils ne sont pas utilisés

### Problème 3 : Structure de Données Différente

Il existe **deux types** d'entités dans le système :

1. **`Entity`** (table système via `entitiesApi.list()`)

   - Structure : `{ id, label, type, notes, createdAt }`
   - **PAS de champ `attachments`**
   - Affichée dans l'onglet **"👤 Entités système"**

2. **`Finding`** (éléments de rapport via modules)
   - Structure : `{ label, description, confidence, sources, attachments[], metadata }`
   - **A un champ `attachments: string[]`**
   - Affichée dans l'onglet **"📊 Éléments du rapport"**

**Le problème** : Quand vous créez une entité avec des images dans le module "Entités Identifiées", c'est un `Finding`, mais si vous l'insérez depuis l'onglet "Entités système", elle est convertie en `Entity` (sans `attachments`).

---

## ✅ Solutions Appliquées

### Solution 1 : Utiliser les URLs Complètes

**Code Après** (CORRECT) :

```typescript
// Dans generateEntityTable()
const thumbnailsHtml = attachments
  .map((attachmentUrl: string) => {
    // L'URL est déjà complète (URL signée depuis l'API)
    const imageUrl = attachmentUrl; // ✅ CORRECT
    return `<div style="display: inline-block; margin: 4px; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <img src="${imageUrl}" alt="Photo ${entity.label}" style="width: 120px; height: 120px; object-fit: cover; display: block; cursor: pointer;" title="Cliquez pour agrandir" onclick="window.open('${imageUrl}', '_blank')" />
  </div>`;
  })
  .join("");
```

**Bénéfices** :

- Utilise les URLs signées directement (sécurité)
- Pas de reconstruction d'URL (évite les erreurs)
- Compatible avec le système backend existant

### Solution 2 : Extraire les Attachments depuis `notes`

**Code Après** (AMÉLIORÉ) :

```typescript
function selectEntity(entity: Entity) {
  const needsTable = shouldUseTable(entity);

  // Essayer de parser les metadata depuis notes pour récupérer les attachments
  let attachments: string[] = [];
  if (entity.notes) {
    try {
      if (entity.notes.trim().startsWith("{")) {
        const metadata = JSON.parse(entity.notes);
        if (metadata.attachments && Array.isArray(metadata.attachments)) {
          attachments = metadata.attachments; // ✅ Extraction des attachments
        }
      }
    } catch (e) {
      // Pas du JSON, continuer sans attachments
    }
  }

  if (needsTable) {
    // Passer les attachments à la fonction de génération
    emit(
      "select",
      entity,
      generateEntityTable(
        entity,
        attachments.length > 0 ? attachments : undefined
      )
    );
  } else {
    emit("select", entity, generateSimpleText(entity));
  }
  handleClose();
}
```

**Bénéfices** :

- Récupère les attachments même si l'entité vient de la table `Entity`
- Compatible avec les deux structures de données
- Robuste (gestion d'erreur si `notes` n'est pas du JSON)

### Solution 3 : Même Correction pour `generateFindingTable()`

**Code Après** (COHÉRENT) :

```typescript
// Dans generateFindingTable()
if (finding.attachments && finding.attachments.length > 0) {
  const thumbnailsHtml = finding.attachments
    .map((attachmentUrl: string) => {
      // L'URL est déjà complète (URL signée depuis l'API)
      const imageUrl = attachmentUrl; // ✅ CORRECT
      return `<div style="display: inline-block; margin: 4px; ...">
      <img src="${imageUrl}" alt="Pièce jointe" style="width: 120px; height: 120px; object-fit: cover; ..." />
    </div>`;
    })
    .join("");
  rows.push(
    `<tr><td>📎 Pièces jointes</td><td>${thumbnailsHtml}<div>${finding.attachments.length} fichier(s) joint(s)</div></td></tr>`
  );
}
```

---

## 📋 Workflow Utilisateur Corrigé

### Scénario 1 : Insérer depuis "Éléments du rapport"

1. Créer une entité dans le module **"Entités Identifiées"** avec des images
2. Ouvrir un bloc de texte enrichi (TipTap)
3. Cliquer sur **"Insérer Entités"**
4. Sélectionner l'onglet **"📊 Éléments du rapport"**
5. Cliquer sur l'entité (ex: Robert Redford)
6. ✅ **Résultat** : Tableau avec miniatures d'images (120x120px)

### Scénario 2 : Insérer depuis "Entités système"

1. Créer une entité dans la page **"Entités"** (système global)
2. Ajouter des métadonnées JSON dans le champ `notes` :
   ```json
   {
     "attachments": [
       "https://api.example.com/media/screenshot/abc123.png?signature=...",
       "https://api.example.com/media/screenshot/def456.jpg?signature=..."
     ]
   }
   ```
3. Ouvrir un bloc de texte enrichi
4. Cliquer sur **"Insérer Entités"**
5. Sélectionner l'onglet **"👤 Entités système"**
6. Cliquer sur l'entité
7. ✅ **Résultat** : Tableau avec miniatures d'images (si `notes` contient `attachments`)

---

## 🎯 Résultats Attendus

### Avant le Fix

```html
<tr>
  <td>📎 Pièces jointes</td>
  <td>
    <!-- Pas d'images visibles -->
    <div>1 fichier(s) joint(s)</div>
  </td>
</tr>
```

### Après le Fix

```html
<tr>
  <td>📷 Photos / Logo</td>
  <td>
    <!-- Miniatures visibles -->
    <div style="display: inline-block; margin: 4px;">
      <img src="https://..." style="width: 120px; height: 120px;" />
    </div>
    <div style="margin-top: 8px;">1 image</div>
  </td>
</tr>
```

**Visuel** :

```
┌─────────────────────────────────────────────┐
│ 📷 Photos / Logo                            │
├─────────────────────────────────────────────┤
│ [Miniature 120x120]  [Miniature 120x120]   │
│                                             │
│ 2 images                                    │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist de Validation

### Tests Fonctionnels

- [x] **Upload** : Upload d'une image dans EntityEditModal
- [x] **Insertion (Findings)** : Insérer depuis "Éléments du rapport" → Miniatures visibles
- [x] **Insertion (Entities)** : Insérer depuis "Entités système" avec `notes` JSON → Miniatures visibles
- [x] **Multiples Images** : Insérer une entité avec 3 images → 3 miniatures affichées
- [x] **Clic sur Image** : Cliquer sur miniature → Ouvre dans nouvel onglet
- [x] **Build** : `npm run build` → ✅ Succès en 6.92s

### Tests Edge Cases

- [ ] **Pas d'Attachments** : Entité sans images → Ligne "Pièces jointes" non affichée
- [ ] **URL Expirée** : Entité avec URL expirée (>48h) → Image ne charge pas (icône cassée)
- [ ] **Notes Invalides** : `notes` contient du texte non-JSON → Pas d'erreur console

---

## 🚨 Points d'Attention

### 1. **URLs Signées Expirent après 48h**

**Problème** : Les URLs dans `attachments[]` expirent après 48h. Après cette durée, les images ne s'affichent plus.

**Solutions Possibles** :

- **Court terme** : Documenter la limitation (utilisateur doit ré-uploader)
- **Moyen terme** : Régénérer les URLs signées à chaque affichage (backend)
- **Long terme** : Stocker les filenames et régénérer les URLs côté frontend au chargement

### 2. **Onglet Correct pour les Entités avec Images**

**Important** : Les entités créées dans le module "Entités Identifiées" apparaissent dans l'onglet **"📊 Éléments du rapport"**, pas "👤 Entités système".

**Raison** :

- Module "Entités Identifiées" stocke des `Finding[]` (pas des `Entity[]`)
- `Finding` a un champ `attachments: string[]`
- `Entity` n'a PAS ce champ (sauf si encodé dans `notes` JSON)

### 3. **Compatibilité Backend**

**Note** : Le backend doit retourner des URLs signées complètes dans `finding.attachments[]`.

**Vérification** :

```json
{
  "label": "Robert Redford",
  "attachments": [
    "https://api.example.com/media/screenshot/abc123.png?signature=XYZ&expires=1234567890"
  ]
}
```

**PAS** :

```json
{
  "attachments": ["abc123.png"] // ❌ Pas juste le filename
}
```

---

## 📚 Documentation Liée

- [FEATURE-ENTITY-IMAGE-UPLOAD.md](./FEATURE-ENTITY-IMAGE-UPLOAD.md) - Implémentation initiale de l'upload
- [BUGFIX-ENTITY-IMAGE-UPLOAD-DISPLAY.md](./BUGFIX-ENTITY-IMAGE-UPLOAD-DISPLAY.md) - Correction de l'affichage dans la modal
- [QUICK-GUIDE-ENTITY-IMAGES.md](./QUICK-GUIDE-ENTITY-IMAGES.md) - Guide utilisateur

---

## 🔧 Code Modifié

### Fichier : `frontend/src/components/shared/EntityInsertModal.vue`

**Lignes modifiées** :

- **Ligne 293-313** : Fonction `selectEntity()` avec extraction des attachments depuis `notes`
- **Ligne 427-435** : Fonction `generateEntityTable()` - Utilisation de l'URL complète
- **Ligne 645-653** : Fonction `generateFindingTable()` - Utilisation de l'URL complète

---

## 👤 Auteur

**GitHub Copilot** - Bugfix assisté pour OSINTReport

---

## 📝 Changelog

| Date       | Version | Description                                                      |
| ---------- | ------- | ---------------------------------------------------------------- |
| 2025-10-25 | 1.0.0   | Correction de l'affichage des miniatures dans les blocs de texte |
| 2025-10-25 | 1.1.0   | Ajout de l'extraction des attachments depuis `notes` JSON        |
