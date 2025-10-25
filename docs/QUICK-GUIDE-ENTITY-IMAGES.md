# 📸 Guide Rapide : Ajouter des Images aux Entités

> **Temps de lecture** : 2 minutes  
> **Niveau** : Débutant  
> **Module concerné** : Entités Identifiées

---

## 🎯 Pourquoi ajouter des images ?

Les images permettent d'**enrichir visuellement** vos entités (personnes, entreprises, groupes) et de faciliter leur identification dans les rapports.

**Exemples d'utilisation** :

- 📷 **Photo d'identité** d'un suspect (Robert Redford)
- 🏢 **Logo d'entreprise** (ACME Corporation)
- 🖼️ **Capture d'écran** d'un profil social (LinkedIn, Facebook)
- 📄 **Document scanné** (carte d'identité, permis de conduire)

---

## ⚡ Workflow en 4 Étapes

### Étape 1 : Ouvrir le Module Entités

1. Accéder à **Rapports** > **Modules** > **Entités Identifiées**
2. Cliquer sur **"+ Nouvelle Entité"** ou modifier une entité existante

### Étape 2 : Remplir les Informations

- **Nom** : Exemple "Robert Redford"
- **Type** : Personne / Société / Groupe / Autre
- **Description** : Brève description de l'entité
- **Sources** : Ajouter au moins une source

### Étape 3 : Ajouter des Images

Descendre jusqu'à la section **📷 Photos / Captures d'écran** :

```
┌────────────────────────────────────────────────┐
│ 📷 Photos / Captures d'écran (0)              │
│                                                │
│ ┌──────────────────────────┬──────────────┐  │
│ │ 🖼️ Choisir depuis galerie│ 📤 Upload   │  │
│ └──────────────────────────┴──────────────┘  │
│                                                │
│ 💡 Ces images apparaîtront dans les blocs     │
│    de texte enrichi                            │
└────────────────────────────────────────────────┘
```

**Option A : Upload depuis votre ordinateur**

1. Cliquer sur **"📤 Upload"**
2. Sélectionner un ou plusieurs fichiers (PNG, JPG, WebP)
3. Limite : **2 MB par fichier**

**Option B : Choisir depuis la galerie**

1. Cliquer sur **"🖼️ Choisir depuis galerie"**
2. Sélectionner une image déjà uploadée (TODO)

### Étape 4 : Gérer et Sauvegarder

Une fois les images uploadées :

```
┌─────────────┬─────────────┬─────────────┐
│   Image 1   │   Image 2   │   Image 3   │
│  [96x96px]  │  [96x96px]  │  [96x96px]  │
│     ✕       │     ✕       │     ✕       │  ← Supprimer au hover
└─────────────┴─────────────┴─────────────┘
```

- **Supprimer** : Survoler une image et cliquer sur ✕
- **Sauvegarder** : Cliquer sur **"Enregistrer"** en bas de la modal

---

## 📝 Insertion dans un Rapport

### Comment les images apparaissent ?

Lorsque vous insérez l'entité dans un **bloc de texte enrichi** :

1. Ouvrir un bloc de texte (TipTap)
2. Cliquer sur **"Insérer Entités"**
3. Sélectionner "Robert Redford"
4. Cliquer sur **"Insérer Tableau"**

**Résultat** :

```html
┌──────────────────────────────────────────────────┐ │ 👤 Robert Redford │
├──────────────────────────────────────────────────┤ │ Description : Acteur
américain né en 1936... │ ├──────────────────────────────────────────────────┤ │
📸 Pièces jointes (2) : │ │ [Image 1 - 120x120px] [Image 2 - 120x120px] │ ←
Miniatures cliquables │ │ │ 📌 Sources : 2 │
└──────────────────────────────────────────────────┘
```

- Les images sont affichées en **miniatures (120x120px)**
- Elles sont **cliquables** et s'ouvrent dans un nouvel onglet
- Elles apparaissent **automatiquement** (pas besoin de les insérer manuellement)

---

## ⚠️ Limitations et Contraintes

### Formats Acceptés

- ✅ PNG
- ✅ JPEG / JPG
- ✅ WebP
- ❌ GIF, SVG, BMP (non supportés)

### Taille Maximale

- **2 MB par fichier**
- Si vous dépassez : message d'erreur affiché

### Sécurité

- Les images sont stockées avec des **URLs signées** (expiration 48h)
- Si une URL expire, re-uploader l'image

---

## 🐛 Résolution de Problèmes

### ❓ "Le bouton Upload ne répond pas"

**Solution** : Vérifier que vous avez bien cliqué sur **"📤 Upload"** (pas sur le label parent)

### ❓ "L'image ne s'affiche pas après upload"

**Causes** :

1. Upload en cours (patienter quelques secondes)
2. Erreur backend (vérifier les logs)
3. Format de fichier non supporté

**Solution** : Re-tenter l'upload avec un fichier PNG/JPG < 2 MB

### ❓ "Les miniatures n'apparaissent pas dans le rapport"

**Causes** :

1. Entité non sauvegardée après upload
2. Module 'entities' non présent dans les modules disponibles

**Solution** : Sauvegarder l'entité, puis ré-ouvrir la modal d'insertion

---

## 💡 Astuces Pro

### Optimiser vos Images

Avant upload, compresser vos images avec :

- **TinyPNG** (https://tinypng.com/) - Compression PNG/JPG
- **ImageOptim** (Mac) - Optimisation locale
- **Squoosh** (https://squoosh.app/) - Compression en ligne

### Nommer vos Fichiers

Utiliser des noms descriptifs :

- ✅ `robert-redford-linkedin-profile.png`
- ✅ `acme-corp-logo-2025.jpg`
- ❌ `IMG_1234.jpg`

### Upload Multiple

Sélectionner plusieurs fichiers en une fois :

1. Cliquer sur **"📤 Upload"**
2. Maintenir **Ctrl** (Windows) ou **Cmd** (Mac)
3. Sélectionner plusieurs fichiers
4. Valider

---

## 📚 Documentation Complémentaire

- **Guide complet** : [FEATURE-ENTITY-IMAGE-UPLOAD.md](./FEATURE-ENTITY-IMAGE-UPLOAD.md)
- **Affichage des miniatures** : [FEATURE-IMAGE-THUMBNAILS.md](./FEATURE-IMAGE-THUMBNAILS.md)
- **Support des entités** : [FEATURE-THUMBNAILS-ALL-ENTITIES.md](./FEATURE-THUMBNAILS-ALL-ENTITIES.md)

---

## ✅ Checklist Finale

Avant de sauvegarder votre entité avec images :

- [ ] Au moins 1 image uploadée
- [ ] Images < 2 MB chacune
- [ ] Format PNG/JPG/WebP
- [ ] Nom et type d'entité remplis
- [ ] Au moins 1 source ajoutée
- [ ] Entité sauvegardée avec succès

---

**Bon travail ! 🎉**
