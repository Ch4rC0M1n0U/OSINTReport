# Amélioration UX - Signature toujours visible (v1.2)

## Date : 26 octobre 2025

## 🎯 Objectif

Améliorer l'expérience utilisateur sur la page de profil en rendant la section signature toujours visible avec un placeholder quand aucune signature n'est enregistrée.

## ✨ Changements apportés

### Avant

```
┌─────────────────────────────────────┐
│  Signature manuscrite               │
├─────────────────────────────────────┤
│                                     │
│  [Aucun affichage si pas de signature]
│                                     │
│  [Bouton: Ajouter une signature]   │
│                                     │
│  OU                                 │
│                                     │
│  [Image de signature si existe]    │
│  [Modifier] [Supprimer]             │
└─────────────────────────────────────┘
```

### Après

```
┌─────────────────────────────────────┐
│  Signature manuscrite               │
├─────────────────────────────────────┤
│  Ma signature                       │
│  ┌───────────────────────────────┐ │
│  │ 🖊️ Aucune signature           │ │
│  │    enregistrée                │ │
│  │ Ajoutez votre signature       │ │
│  │ manuscrite pour personnaliser │ │
│  │ vos rapports                  │ │
│  └───────────────────────────────┘ │
│  [Ajouter une signature]            │
│                                     │
│  OU (si signature existe)           │
│                                     │
│  [Image de signature protégée]     │
│  [Modifier] [Supprimer]             │
└─────────────────────────────────────┘
```

## 📝 Modifications détaillées

### 1. Zone d'affichage toujours visible

**Avant** : La zone d'affichage n'apparaissait que si une signature existait.

**Après** : La zone est **toujours présente** avec :

- ✅ **Signature existante** → Affichage avec `ProtectedSignature`
- ✅ **Pas de signature** → Placeholder élégant avec icône et message

### 2. Placeholder quand pas de signature

```vue
<div
  class="border-2 border-dashed border-base-300 rounded-lg p-8 bg-base-50 text-center"
>
  <HugeiconsIcon :icon="PencilEdit01Icon" class="w-16 h-16 mx-auto text-base-300 mb-3" />
  <p class="text-base-content/60 font-medium mb-2">Aucune signature enregistrée</p>
  <p class="text-sm text-base-content/40">
    Ajoutez votre signature manuscrite pour personnaliser vos rapports
  </p>
</div>
```

**Caractéristiques du placeholder** :

- Bordure en pointillés (dashed) pour indiquer une zone à remplir
- Fond gris clair pour différencier de la zone active
- Icône de crayon (64x64px) centrée
- Message informatif en deux niveaux (titre + description)
- Design cohérent avec le reste de l'interface

### 3. Logique des boutons améliorée

#### État 1 : Pas de signature

```vue
<button class="btn btn-primary btn-sm">
  <Icon /> Ajouter une signature
</button>
```

→ Un seul bouton "Ajouter"

#### État 2 : Signature existe

```vue
<button class="btn btn-primary btn-sm">
  <Icon /> Modifier la signature
</button>
<button class="btn btn-outline btn-error btn-sm">
  <Icon /> Supprimer la signature
</button>
```

→ Deux boutons "Modifier" et "Supprimer"

#### État 3 : Mode dessin actif

```vue
<!-- Les boutons sont gérés par le composant SignaturePad -->
<!-- [Effacer] [Annuler] [Enregistrer] -->
```

→ Boutons intégrés au canvas

### 4. Label dynamique

```vue
<span class="label-text font-medium">
  {{ showSignaturePad ? 'Dessinez votre signature' : 'Ma signature' }}
</span>
```

- Mode normal : "Ma signature"
- Mode dessin : "Dessinez votre signature"

## 🎨 Améliorations UX

### 1. Clarté visuelle

- ✅ L'emplacement signature est toujours visible
- ✅ L'utilisateur sait immédiatement s'il a une signature ou non
- ✅ Le placeholder guide l'action à effectuer

### 2. Cohérence

- ✅ Design uniforme que la signature existe ou non
- ✅ Même zone d'affichage dans tous les cas
- ✅ Transitions fluides entre les états

### 3. Guidage utilisateur

- ✅ Message explicite "Aucune signature enregistrée"
- ✅ Indication de l'utilité : "pour personnaliser vos rapports"
- ✅ Bouton d'action clairement visible

### 4. Actions adaptées

- ✅ Bouton "Ajouter" quand pas de signature
- ✅ Boutons "Modifier" ET "Supprimer" quand signature existe
- ✅ Plus besoin de deviner quelle action est possible

## 🔄 États de l'interface

### État A : Aucune signature (Initial)

```
┌─────────────────────────────────┐
│ Ma signature                    │
│ ╔═══════════════════════════╗   │
│ ║  🖊️                        ║   │
│ ║  Aucune signature         ║   │
│ ║  enregistrée              ║   │
│ ║  Ajoutez votre signature  ║   │
│ ╚═══════════════════════════╝   │
│ [➕ Ajouter une signature]      │
└─────────────────────────────────┘
```

### État B : Signature existe

```
┌─────────────────────────────────┐
│ Ma signature                    │
│ ╔═══════════════════════════╗   │
│ ║  [Signature protégée]     ║   │
│ ║  🔒 PROTÉGÉ              ║   │
│ ╚═══════════════════════════╝   │
│ [✏️ Modifier] [🗑️ Supprimer]    │
└─────────────────────────────────┘
```

### État C : Mode dessin

```
┌─────────────────────────────────┐
│ Dessinez votre signature        │
│ ╔═══════════════════════════╗   │
│ ║  [Canvas de dessin]       ║   │
│ ║                           ║   │
│ ║  ✍️ Zone de signature     ║   │
│ ╚═══════════════════════════╝   │
│ [🧹 Effacer] [❌ Annuler] [✅ Enregistrer]
└─────────────────────────────────┘
```

## 📊 Avantages

### Pour l'utilisateur

1. **Visibilité** : Sait immédiatement s'il a une signature
2. **Guidage** : Comprend ce qu'il doit faire
3. **Simplicité** : Actions claires et évidentes
4. **Cohérence** : Interface uniforme et prévisible

### Pour le design

1. **Espace structuré** : Section toujours présente
2. **Hiérarchie visuelle** : Importance de la signature mise en avant
3. **Feedback immédiat** : État visible en un coup d'œil
4. **Accessibilité** : Messages textuels clairs

## 🔧 Code modifié

**Fichier** : `/workspaces/OSINTReport/frontend/src/pages/ProfilePage.vue`

**Lignes modifiées** : ~545-595

**Changements principaux** :

1. Structure conditionnelle refactorisée
2. Ajout du placeholder pour état vide
3. Logique des boutons séparée (avec/sans signature)
4. Label dynamique ajouté
5. Classes CSS optimisées

## ✅ Tests suggérés

1. **État initial** (pas de signature)

   - [ ] Le placeholder s'affiche
   - [ ] L'icône de crayon est visible
   - [ ] Le message "Aucune signature enregistrée" apparaît
   - [ ] Le bouton "Ajouter une signature" est affiché

2. **Ajout de signature**

   - [ ] Clic sur "Ajouter" → Canvas s'affiche
   - [ ] Label change pour "Dessinez votre signature"
   - [ ] Dessin possible sans décalage
   - [ ] Boutons Effacer/Annuler/Enregistrer fonctionnent

3. **Signature enregistrée**

   - [ ] La signature s'affiche avec protection
   - [ ] Deux boutons "Modifier" et "Supprimer" visibles
   - [ ] Filigrane "PROTÉGÉ" visible
   - [ ] Badge au survol fonctionne

4. **Modification de signature**

   - [ ] Clic sur "Modifier" → Canvas s'affiche
   - [ ] Possibilité de dessiner nouvelle signature
   - [ ] Annulation ramène à l'ancienne signature

5. **Suppression de signature**
   - [ ] Clic sur "Supprimer" → Signature supprimée
   - [ ] Retour au placeholder
   - [ ] Bouton redevient "Ajouter une signature"

## 🎯 Résultat final

L'interface est maintenant plus **intuitive**, **cohérente** et **professionnelle** :

- ✅ Emplacement signature toujours visible
- ✅ État clair (vide ou rempli)
- ✅ Actions adaptées au contexte
- ✅ Guidage utilisateur amélioré
- ✅ Design uniforme et élégant

---

**Version** : 1.2  
**Type** : Amélioration UX  
**Impact** : Frontend uniquement (ProfilePage.vue)  
**Compatibilité** : Compatible avec v1.0 et v1.1
