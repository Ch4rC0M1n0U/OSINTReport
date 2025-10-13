# 🎨 REFONTE UI - Style SimpleSidebar

**Date** : 11 octobre 2025  
**Objectif** : Refonte complète de l'interface pour adopter un style moderne "SimpleSidebar"  
**Inspiration** : Interface épurée avec sidebar fixe, navigation claire et hiérarchie visuelle améliorée

---

## 🎯 OBJECTIFS

### Problèmes de l'ancienne UI
- ❌ Header en haut avec drawer qui prenait trop de place
- ❌ Navigation peu claire (menu déroulant Administration)
- ❌ Logo et titre dans le header plutôt que la sidebar
- ❌ Hiérarchie visuelle pas optimale
- ❌ Trop de couleurs et d'éléments visuels

### Objectifs de la nouvelle UI
- ✅ Sidebar fixe à gauche avec logo en haut
- ✅ Navigation claire et épurée
- ✅ Avatar utilisateur en bas de la sidebar
- ✅ Contenu principal occupe tout l'espace
- ✅ Design moderne et minimaliste
- ✅ Responsive (mobile + desktop)

---

## 📐 ARCHITECTURE

### Layout général (Desktop)

```
┌────────────┬──────────────────────────────────────┐
│  Logo      │                                      │
├────────────┤         Main Content Area            │
│ Dashboard  │                                      │
│ Rapports   │         (RouterView)                 │
│ Recherche  │                                      │
│            │                                      │
│ ADMIN      │                                      │
│ Réglages   │                                      │
│ Users      │                                      │
│ SMTP       │                                      │
│ ...        │                                      │
│            │                                      │
├────────────┤                                      │
│  Avatar    │                                      │
│  Tom Cook  │                                      │
└────────────┴──────────────────────────────────────┘
  256px (w-64)        Largeur flexible
```

### Layout mobile

```
┌──────────────────────────────────────┐
│ ☰  OSINT Report           [Avatar]   │ ← Top bar
├──────────────────────────────────────┤
│                                      │
│         Main Content Area            │
│                                      │
│                                      │
└──────────────────────────────────────┘

[Sidebar en drawer sur clic du burger menu]
```

---

## 🎨 COMPOSANTS MODIFIÉS

### 1. AppShell.vue

**Avant** : Drawer DaisyUI avec header en haut
**Après** : Sidebar fixe Tailwind avec logo et user en bas

#### Nouvelle structure

```vue
<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar fixe (desktop) -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
      <!-- Logo en haut -->
      <div class="flex items-center justify-center h-16 px-4 border-b">
        <img :src="logoUrl" class="h-10 w-10" />
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        <slot name="sidebar" />
      </nav>
      
      <!-- User en bas -->
      <div class="flex-shrink-0 border-t border-gray-200 p-4">
        <slot name="user" />
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64 flex flex-col flex-1 min-h-screen">
      <main class="flex-1 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
```

#### Classes Tailwind clés

```css
lg:w-64          /* Largeur sidebar: 256px */
lg:fixed         /* Position fixe */
lg:inset-y-0     /* Hauteur complète */
lg:pl-64         /* Padding left pour éviter overlap avec sidebar */
bg-gray-50       /* Fond gris clair pour le contenu */
border-r         /* Bordure droite de la sidebar */
```

---

### 2. DashboardPage.vue

**Avant** : Menu avec dropdown pour Administration
**Après** : Menu plat avec section "Administration" séparée

#### Template #sidebar

```vue
<!-- Navigation principale -->
<div class="space-y-1">
  <RouterLink
    v-for="item in mainNavigation"
    :key="item.label"
    :to="item.to"
    class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg"
    active-class="bg-indigo-50 text-indigo-600"
    inactive-class="text-gray-700 hover:bg-gray-50"
  >
    <span class="material-symbols-rounded mr-3">{{ item.icon }}</span>
    {{ item.label }}
  </RouterLink>
</div>

<!-- Section Administration -->
<div v-if="adminNavigation" class="mt-8">
  <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase">
    Administration
  </h3>
  <div class="space-y-1">
    <RouterLink v-for="child in adminNavigation.children" ... />
  </div>
</div>
```

#### Template #user

```vue
<div class="flex items-center gap-3">
  <!-- Avatar -->
  <div class="w-10 h-10 rounded-full bg-indigo-600 text-white">
    {{ userInitials }}
  </div>
  
  <!-- Info utilisateur -->
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium text-gray-900 truncate">
      Tom Cook
    </p>
    <p class="text-xs text-gray-500 truncate">Admin</p>
  </div>
  
  <!-- Menu dropdown -->
  <button class="btn btn-ghost btn-sm btn-circle">
    <span class="material-symbols-rounded">more_vert</span>
  </button>
</div>
```

---

## 🎨 PALETTE DE COULEURS

### Nouvelle palette (Tailwind)

```css
/* Fond principal */
bg-gray-50         /* #F9FAFB - Fond du contenu */
bg-white           /* #FFFFFF - Fond sidebar */

/* Textes */
text-gray-900      /* #111827 - Texte principal */
text-gray-700      /* #374151 - Texte secondaire */
text-gray-500      /* #6B7280 - Texte tertiaire */

/* Accents */
bg-indigo-50       /* #EEF2FF - Background lien actif */
text-indigo-600    /* #4F46E5 - Texte lien actif */
bg-indigo-600      /* #4F46E5 - Bouton primaire, avatar */

/* Bordures */
border-gray-200    /* #E5E7EB - Bordures légères */

/* Hover states */
hover:bg-gray-50   /* Survol menu */
hover:bg-red-50    /* Survol déconnexion */
```

---

## ✨ FONCTIONNALITÉS

### Navigation active

```vue
<RouterLink
  :to="item.to"
  active-class="bg-indigo-50 text-indigo-600"
  inactive-class="text-gray-700 hover:bg-gray-50"
>
```

- Lien actif : Fond indigo clair + texte indigo
- Lien inactif : Texte gris + survol gris clair
- Transition fluide avec `transition-colors`

### Section Administration

- Titre en majuscules : `uppercase tracking-wider`
- Taille réduite : `text-xs`
- Couleur discrète : `text-gray-500`
- Séparation visuelle : `mt-8` (margin-top)

### User section

- **Position** : En bas de la sidebar (`mt-auto`)
- **Bordure supérieure** : `border-t`
- **Avatar** : Rond avec initiales ou photo
- **Dropdown** : Menu pour Profil / Déconnexion
- **Truncate** : Texte coupé si trop long

### Responsive

**Desktop (lg+)**
- Sidebar fixe visible : `hidden lg:flex`
- Contenu décalé : `lg:pl-64`

**Mobile**
- Top bar avec burger menu
- Sidebar en drawer (overlay)
- Avatar dans le top bar

---

## 📱 BREAKPOINTS

```css
/* Mobile first */
Default           : 0-1023px  (mobile/tablet)
lg (large)        : 1024px+   (desktop)

hidden lg:flex    : Caché sur mobile, flex sur desktop
lg:pl-64          : Padding-left 256px sur desktop seulement
lg:fixed          : Position fixe sur desktop seulement
```

---

## 🔧 CLASSES UTILITAIRES

### Flexbox

```css
flex              /* Display flex */
flex-col          /* Direction column */
flex-1            /* Flex grow 1 */
items-center      /* Align items center */
justify-center    /* Justify content center */
gap-3             /* Gap 12px */
space-y-1         /* Margin vertical 4px entre enfants */
```

### Sizing

```css
w-64              /* Width 256px (sidebar) */
w-10 h-10         /* Taille avatar 40x40px */
min-w-0           /* Min width 0 (pour truncate) */
max-w-7xl         /* Max width 1280px (contenu) */
```

### Spacing

```css
px-3 py-2         /* Padding horizontal 12px, vertical 8px */
px-4              /* Padding horizontal 16px */
mx-auto           /* Margin auto horizontal (centrage) */
mt-8              /* Margin top 32px */
```

### Borders

```css
border-r          /* Bordure droite */
border-t          /* Bordure haut */
border-gray-200   /* Couleur bordure */
rounded-lg        /* Border radius 8px */
rounded-full      /* Border radius 9999px (cercle) */
```

### Typography

```css
text-sm           /* Font size 14px */
text-xs           /* Font size 12px */
font-medium       /* Font weight 500 */
font-semibold     /* Font weight 600 */
uppercase         /* Text transform uppercase */
tracking-wider    /* Letter spacing 0.05em */
truncate          /* Ellipsis si overflow */
```

---

## 🧪 TESTS

### Desktop
1. ✅ Sidebar visible en permanence
2. ✅ Logo affiché en haut
3. ✅ Menu principal épuré
4. ✅ Section "Administration" séparée
5. ✅ Avatar utilisateur en bas
6. ✅ Liens actifs mis en évidence
7. ✅ Dropdown user fonctionnel

### Mobile
1. ✅ Top bar avec burger menu
2. ✅ Sidebar en drawer (overlay)
3. ✅ Fermeture du drawer au clic sur overlay
4. ✅ Navigation identique au desktop
5. ✅ Avatar dans le top bar

### Transitions
1. ✅ Hover sur liens : changement de couleur fluide
2. ✅ Active state : fond indigo clair
3. ✅ Dropdown menu : animation smooth

---

## 📚 RESSOURCES

### Tailwind CSS
- **Documentation** : https://tailwindcss.com/docs
- **Flexbox** : https://tailwindcss.com/docs/flex
- **Responsive** : https://tailwindcss.com/docs/responsive-design

### Inspiration
- **SimpleSidebar** : Layout sidebar fixe avec logo en haut
- **Tailwind UI** : https://tailwindui.com/components/application-ui/application-shells/sidebar

---

## 📁 FICHIERS MODIFIÉS

```
frontend/src/components/layout/AppShell.vue      (Layout principal)
frontend/src/pages/DashboardPage.vue             (Menu et navigation)
```

---

## 🚀 PROCHAINES ÉTAPES

### Améliorations possibles

1. **Animation sidebar mobile**
   - Transition slide-in/out plus fluide
   
2. **Badge de notifications**
   - Ajouter des compteurs sur les liens de menu
   
3. **Recherche rapide**
   - Ajouter une barre de recherche dans la sidebar
   
4. **Favoris**
   - Permettre d'épingler des rapports en haut
   
5. **Dark mode**
   - Variante sombre de la sidebar

---

**Statut** : ✅ Déployé  
**Version** : 2.0 (SimpleSidebar)  
**Action utilisateur** : Rechargez la page pour voir la nouvelle interface
