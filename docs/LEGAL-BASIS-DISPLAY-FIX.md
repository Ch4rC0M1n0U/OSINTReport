# 🔧 Correction de l'affichage de la Base Légale - v1.1.1

## 📋 Problème résolu

**Symptôme** : Les badges de base légale débordaient du conteneur lorsque plusieurs articles étaient sélectionnés, rendant l'affichage peu professionnel.

**Impact** :
- ❌ Page de création (Étape 3 - Validation)
- ❌ Modal de modification des informations
- ❌ Page de détail du rapport (section Informations)

---

## ✅ Solution implémentée

### 1. Composant réutilisable `LegalBasisDisplay`

**Fichier** : `/frontend/src/components/shared/LegalBasisDisplay.vue`

**Fonctionnalités** :
- ✅ Affichage uniforme des badges de base légale
- ✅ Scrollbar verticale automatique si > 4-5 articles
- ✅ Mode cliquable (ouverture de la modal de détail)
- ✅ Mode non-cliquable (prévisualisation)
- ✅ Hauteur maximale configurable
- ✅ Texte personnalisable si vide

**Props** :

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `legalBasis` | `string \| null \| undefined` | - | Chaîne des articles (format: "Art. X • Art. Y") |
| `label` | `string` | `"Base légale"` | Label affiché au-dessus |
| `clickable` | `boolean` | `false` | Badges cliquables ou non |
| `scrollable` | `boolean` | `true` | Active la scrollbar si débordement |
| `emptyText` | `string` | `"—"` | Texte affiché si aucun article |

**Events** :

| Event | Payload | Description |
|-------|---------|-------------|
| `click-article` | `string` | Émis au clic sur un badge (si `clickable=true`) |

---

### 2. Utilisation dans ReportDetailPage.vue

**Avant** :
```vue
<div class="md:col-span-2">
  <div class="text-sm opacity-70 mb-2">Base légale</div>
  <div v-if="report.legalBasis" class="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded border border-base-300">
    <button
      v-for="article in parseLegalBasis(report.legalBasis)"
      :key="article"
      type="button"
      class="badge badge-primary badge-sm font-mono cursor-pointer hover:badge-secondary transition-colors"
      @click="openArticleDetail(article)"
      :title="`Cliquer pour voir les détails de ${article}`"
    >
      {{ article }}
    </button>
  </div>
  <div v-else class="font-medium">—</div>
</div>
```

**Après** :
```vue
<div class="md:col-span-2">
  <LegalBasisDisplay
    :legal-basis="report.legalBasis"
    :clickable="true"
    @click-article="openArticleDetail"
  />
</div>
```

**Réduction** : 15 lignes → 5 lignes ✨

---

### 3. Utilisation dans ReportCreatePage.vue

**Avant** :
```vue
<div v-if="form.legalBasis">
  <div class="text-sm opacity-70 mb-2">Base légale:</div>
  <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded border border-base-300">
    <span
      v-for="article in parseLegalBasis(form.legalBasis)"
      :key="article"
      class="badge badge-primary badge-sm font-mono"
    >
      {{ article }}
    </span>
  </div>
</div>
```

**Après** :
```vue
<LegalBasisDisplay
  :legal-basis="form.legalBasis"
  label="Base légale:"
  :clickable="false"
/>
```

**Réduction** : 12 lignes → 4 lignes ✨

---

### 4. Correction LegalBasisSelector.vue (Zone de sélection)

**Problème** : La zone d'affichage des badges sélectionnés débordait aussi

**Avant** :
```vue
<div
  class="input input-bordered flex flex-wrap gap-2 min-h-[3rem] cursor-pointer..."
>
```

**Après** :
```vue
<div
  class="input input-bordered flex flex-wrap gap-2 min-h-[3rem] max-h-32 overflow-y-auto cursor-pointer..."
>
```

**Ajouts** :
- `max-h-32` : Limite la hauteur à 128px
- `overflow-y-auto` : Ajoute scrollbar verticale automatique

---

## 🎨 Aperçu visuel

### Avec scrollbar (10+ articles)

```
┌─────────────────────────────────────────────────┐
│ Base légale                                     │
├─────────────────────────────────────────────────┤
│ [ Art. 28bis CIC ]  [ Art. 39bis CIC ]         │ ↑
│ [ Art. 39ter CIC ]  [ Art. 39quater CIC ]      │ │
│ [ Art. 46bis CIC ]  [ Art. 46bis §2 CIC ]      │ │ Scroll
│ [ Art. 47ter CIC ]  [ Art. 47sexies CIC ]      │ │ (128px)
│ [ Art. 88bis CIC ]  [ Art. 88ter CIC ]         │ │
│ [ Art. 88quater CIC ] [ Art. 88sexies CIC ]    │ ↓
└─────────────────────────────────────────────────┘
```

### Sans scrollbar (< 5 articles)

```
┌─────────────────────────────────────────────────┐
│ Base légale                                     │
├─────────────────────────────────────────────────┤
│ [ Art. 46bis §2 CIC ]  [ Art. 88bis CIC ]      │
│ [ Art. 39bis CIC ]                              │
└─────────────────────────────────────────────────┘
```

---

## 📊 Comparaison

| Aspect | Avant (v1.1.0) | Après (v1.1.1) |
|--------|----------------|----------------|
| **Code dupliqué** | 3 fois | Composant réutilisable ✨ |
| **Lignes de code** | ~40 lignes | ~15 lignes ✨ |
| **Maintenance** | 3 endroits à modifier | 1 seul composant ✨ |
| **Scrollbar** | ✅ Présente | ✅ Améliorée (6px, arrondie) |
| **Affichage > 5 articles** | ✅ Corrigé | ✅ Optimisé |
| **Clickable badges** | ✅ Oui | ✅ Configurable |
| **Consistance UI** | ⚠️ Variable | ✅ 100% uniforme |

---

## 🧪 Tests de validation

### Test 1 : Affichage avec beaucoup d'articles

**Étapes** :
1. Créer un rapport
2. Sélectionner 15+ articles
3. Aller à l'Étape 3 (Validation)

**Résultat attendu** :
```
✅ Zone de badges limitée à 128px
✅ Scrollbar verticale visible
✅ Tous les badges affichés (pas de débordement)
✅ Scrollbar personnalisée (6px, arrondie)
```

---

### Test 2 : Mode cliquable (Page de détail)

**Étapes** :
1. Ouvrir un rapport avec 3+ articles
2. Vérifier l'affichage dans "Informations du rapport"
3. Survoler un badge
4. Cliquer sur un badge

**Résultat attendu** :
```
✅ Badges affichés avec scrollbar si nécessaire
✅ Hover : couleur change (bleu → violet)
✅ Curseur : pointer (main)
✅ Click : modal de détail s'ouvre
```

---

### Test 3 : Mode non-cliquable (Prévisualisation)

**Étapes** :
1. Créer un rapport
2. Sélectionner 5 articles
3. Aller à l'Étape 3 (Validation)
4. Survoler un badge

**Résultat attendu** :
```
✅ Badges affichés correctement
✅ Pas de changement de couleur au hover
✅ Curseur : default (flèche)
✅ Click : aucune action
```

---

### Test 4 : Aucun article sélectionné

**Étapes** :
1. Créer un rapport sans sélectionner de base légale
2. Aller à l'Étape 3

**Résultat attendu** :
```
✅ Affiche : "—"
✅ Pas de bordure vide
✅ Pas d'erreur console
```

---

## 🔧 Détails techniques

### Scrollbar personnalisée

```css
.overflow-y-auto::-webkit-scrollbar {
  width: 6px; /* Réduit de 8px à 6px pour être plus discret */
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: hsl(var(--b2));
  border-radius: 3px; /* Coins arrondis */
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 3px; /* Coins arrondis */
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3); /* Plus foncé au hover */
}
```

---

### Rendu dynamique (button vs span)

```vue
<component
  :is="clickable ? 'button' : 'span'"
  v-for="article in articles"
  :key="article"
  :type="clickable ? 'button' : undefined"
  class="badge badge-primary badge-sm font-mono transition-colors"
  :class="clickable ? 'cursor-pointer hover:badge-secondary' : ''"
  @click="clickable ? $emit('click-article', article) : undefined"
>
  {{ article }}
</component>
```

**Explication** :
- Si `clickable=true` → Rendu en `<button>` avec événement click
- Si `clickable=false` → Rendu en `<span>` statique
- Évite les warnings HTML pour `<span>` avec `@click`

---

## 📁 Fichiers modifiés

### 1. Nouveau composant
- ✅ `/frontend/src/components/shared/LegalBasisDisplay.vue` (~80 lignes)

### 2. Modifications
- ✅ `/frontend/src/components/shared/LegalBasisSelector.vue` (ajout max-h-32 + overflow-y-auto)
- ✅ `/frontend/src/pages/reports/ReportDetailPage.vue` (import + utilisation)
- ✅ `/frontend/src/pages/reports/ReportCreatePage.vue` (import + utilisation)

### 3. Documentation
- ✅ `/docs/LEGAL-BASIS-DISPLAY-FIX.md` (ce fichier)

---

## 🚀 Avantages

### Pour les développeurs
- ✅ **Réutilisabilité** : 1 composant, 3 usages
- ✅ **Maintenabilité** : Modification centralisée
- ✅ **Consistance** : Affichage identique partout
- ✅ **Props flexibles** : Mode cliquable/non-cliquable

### Pour les utilisateurs
- ✅ **UI propre** : Pas de débordement
- ✅ **Scrollbar discrète** : 6px, arrondie
- ✅ **Performance** : Pas de re-render inutile
- ✅ **Accessibilité** : Sémantique HTML correcte

---

## 📝 Notes de version

### v1.1.1 (3 octobre 2025)

**Corrections** :
- ✅ Débordement des badges dans `LegalBasisDisplay` corrigé
- ✅ Débordement des badges dans `LegalBasisSelector` corrigé
- ✅ Scrollbar personnalisée (6px, arrondie)
- ✅ Affichage uniforme sur toutes les pages

**Améliorations** :
- ✅ Composant `LegalBasisDisplay` réutilisable
- ✅ Réduction de ~40 lignes de code dupliqué
- ✅ Mode cliquable/non-cliquable configurable
- ✅ Meilleure sémantique HTML (button vs span)
- ✅ Zone de sélection avec scrollbar (max-h-32)

**Documentation** :
- ✅ Guide de correction créé
- ✅ Tests de validation ajoutés

---

### v1.1.0 (3 octobre 2025)

**Ajouts** :
- 4 nouveaux articles (39ter, 39quater, 88ter, 88quater)
- Modal de détail avec texte légal complet
- Badges cliquables avec hover effect
- Scrollbar initiale (8px)

---

### v1.0.0 (3 octobre 2025)

**Version initiale** :
- 15 articles du CIC belge
- Sélecteur multi-articles
- Recherche + filtres

---

## ✅ Checklist de validation

### Développement
- [x] Composant `LegalBasisDisplay` créé
- [x] Import dans ReportDetailPage.vue
- [x] Import dans ReportCreatePage.vue
- [x] Props correctement typées
- [x] Events émis correctement
- [x] 0 erreur TypeScript

### Tests fonctionnels
- [ ] Test avec 1 article
- [ ] Test avec 5 articles
- [ ] Test avec 15+ articles
- [ ] Test mode cliquable (page détail)
- [ ] Test mode non-cliquable (prévisualisation)
- [ ] Test aucun article sélectionné

### UI/UX
- [ ] Scrollbar visible si > 5 articles
- [ ] Pas de débordement horizontal
- [ ] Hover effect (si cliquable)
- [ ] Transition fluide (300ms)
- [ ] Tooltip au hover (si cliquable)

---

**Développé par** : GitHub Copilot  
**Version** : 1.1.1  
**Date** : 3 octobre 2025  
**Type** : Correction + Optimisation
