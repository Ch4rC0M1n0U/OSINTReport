# 🎨 Personnalisation de la page de connexion

## 📋 Vue d'ensemble

La page de connexion utilise désormais les **paramètres système** définis dans `/admin/system` pour afficher :
- ✅ Logo du service (si défini)
- ✅ Nom du service
- ✅ Nom complet du service (description)
- ✅ Adresse complète du service (en pied de page)

## 🔄 Modifications apportées

### 1. Import du composable `useSystemSettings`

```typescript
import { useSystemSettings } from "@/composables/useSystemSettings";

const { settings, logoUrl } = useSystemSettings();
```

### 2. Computed properties pour les textes dynamiques

```typescript
const serviceName = computed(() => 
  settings.value?.serviceName || "OSINT"
);

const serviceFullName = computed(() => 
  settings.value?.serviceFullName || "Plateforme de gestion et d'analyse OSINT"
);

const serviceAddress = computed(() => {
  const parts = [];
  if (settings.value?.serviceAddress) parts.push(settings.value.serviceAddress);
  if (settings.value?.servicePostalCode || settings.value?.serviceCity) {
    const cityPart = [settings.value?.servicePostalCode, settings.value?.serviceCity]
      .filter(Boolean)
      .join(' ');
    parts.push(cityPart);
  }
  if (settings.value?.serviceCountry) parts.push(settings.value.serviceCountry);
  return parts.length > 0 ? parts.join(', ') : null;
});
```

### 3. Affichage du logo côté gauche (desktop)

**Avant** :
```vue
<span class="material-symbols-rounded text-5xl">search_insights</span>
<h1 class="text-4xl font-bold">OSINT Report</h1>
```

**Après** :
```vue
<!-- Logo du service si disponible -->
<div v-if="logoUrl" class="flex-shrink-0">
  <img 
    :src="logoUrl" 
    :alt="`Logo ${serviceName}`" 
    class="h-16 w-auto object-contain drop-shadow-lg"
  />
</div>
<!-- Icône par défaut si pas de logo -->
<span v-else class="material-symbols-rounded text-5xl drop-shadow-lg">
  search_insights
</span>

<!-- Nom du service -->
<div>
  <h1 class="text-4xl font-bold drop-shadow-md">{{ serviceName }}</h1>
  <p v-if="serviceFullName && serviceFullName !== serviceName" 
     class="text-sm text-primary-content/80 mt-1">
    {{ serviceFullName }}
  </p>
</div>
```

### 4. Affichage du logo version mobile

**Avant** :
```vue
<div class="lg:hidden flex items-center justify-center gap-2 mb-8">
  <span class="material-symbols-rounded text-4xl text-primary">search_insights</span>
  <h1 class="text-2xl font-bold text-primary">OSINT Report</h1>
</div>
```

**Après** :
```vue
<div class="lg:hidden mb-8">
  <div class="flex items-center justify-center gap-3 mb-2">
    <img 
      v-if="logoUrl" 
      :src="logoUrl" 
      :alt="`Logo ${serviceName}`" 
      class="h-12 w-auto object-contain"
    />
    <span v-else class="material-symbols-rounded text-4xl text-primary">
      search_insights
    </span>
    
    <div class="text-center">
      <h1 class="text-2xl font-bold text-primary">{{ serviceName }}</h1>
    </div>
  </div>
  <p v-if="serviceFullName && serviceFullName !== serviceName" 
     class="text-center text-sm text-base-content/70">
    {{ serviceFullName }}
  </p>
</div>
```

### 5. Adresse du service en pied de page

**Avant** :
```vue
<div class="text-center text-xs text-base-content/50 mt-8">
  <p>En vous connectant, vous acceptez nos</p>
  <p>
    <a href="#" class="link link-hover">Conditions d'utilisation</a> 
    et 
    <a href="#" class="link link-hover">Politique de confidentialité</a>
  </p>
</div>
```

**Après** :
```vue
<div class="mt-8 pt-6 border-t border-base-content/10">
  <!-- Adresse du service -->
  <div v-if="serviceAddress" class="text-center text-sm text-base-content/60 mb-4">
    <div class="flex items-start justify-center gap-2">
      <span class="material-symbols-rounded text-base mt-0.5">location_on</span>
      <div>
        <p class="font-medium text-base-content/80">{{ serviceName }}</p>
        <p>{{ serviceAddress }}</p>
      </div>
    </div>
  </div>
  
  <!-- Mentions légales -->
  <div class="text-center text-xs text-base-content/50">
    <p>En vous connectant, vous acceptez nos</p>
    <p>
      <a href="#" class="link link-hover">Conditions d'utilisation</a> 
      et 
      <a href="#" class="link link-hover">Politique de confidentialité</a>
    </p>
  </div>
</div>
```

## 📸 Exemples d'affichage

### Cas 1 : Avec logo et informations complètes

**Paramètres définis** :
- Logo : `logo-police-federale.png`
- Nom du service : `Police Fédérale`
- Nom complet : `Service Central de Lutte contre la Cybercriminalité`
- Adresse : `Rue de la Loi 16`
- Code postal : `1000`
- Ville : `Bruxelles`
- Pays : `Belgique`

**Affichage** :
```
┌─────────────────────────────────────┐
│  [Logo Police]  Police Fédérale     │
│                 Service Central...   │
│  ─────                               │
│                                      │
│  Plateforme de gestion               │
│  et d'analyse OSINT                  │
│                                      │
│  ...                                 │
│                                      │
│  ────────────────────────────────── │
│  📍 Police Fédérale                  │
│     Rue de la Loi 16,                │
│     1000 Bruxelles, Belgique         │
└─────────────────────────────────────┘
```

### Cas 2 : Sans logo (valeurs par défaut)

**Paramètres définis** :
- Logo : Aucun
- Nom du service : `OSINT`
- Autres champs : Vides

**Affichage** :
```
┌─────────────────────────────────────┐
│  🔍  OSINT                           │
│  ─────                               │
│                                      │
│  Plateforme de gestion               │
│  et d'analyse OSINT                  │
│                                      │
│  ...                                 │
│                                      │
│  (pas d'adresse affichée)            │
└─────────────────────────────────────┘
```

### Cas 3 : Logo avec nom personnalisé

**Paramètres définis** :
- Logo : `logo-service.png`
- Nom du service : `DGSI`
- Nom complet : `Direction Générale de la Sécurité Intérieure`
- Adresse : Partielle (uniquement ville et pays)

**Affichage** :
```
┌─────────────────────────────────────┐
│  [Logo DGSI]  DGSI                   │
│                Direction Générale... │
│  ─────                               │
│                                      │
│  Plateforme de gestion               │
│  et d'analyse OSINT                  │
│                                      │
│  ...                                 │
│                                      │
│  ────────────────────────────────── │
│  📍 DGSI                             │
│     Paris, France                    │
└─────────────────────────────────────┘
```

## 🎨 Classes CSS utilisées

### Logo
- Desktop : `h-16 w-auto object-contain drop-shadow-lg` (64px de hauteur)
- Mobile : `h-12 w-auto object-contain` (48px de hauteur)

### Nom du service
- Desktop : `text-4xl font-bold drop-shadow-md`
- Mobile : `text-2xl font-bold text-primary`

### Nom complet du service
- Desktop : `text-sm text-primary-content/80 mt-1`
- Mobile : `text-center text-sm text-base-content/70`

### Adresse
- Container : `text-center text-sm text-base-content/60 mb-4`
- Nom : `font-medium text-base-content/80`
- Adresse : couleur par défaut (inherit)

## 🔄 Flux de données

1. **Chargement de la page** → `useSystemSettings()` récupère les paramètres
2. **Paramètres chargés** → Computed properties calculées
3. **Rendu** → Affichage dynamique selon les valeurs
4. **Pas de paramètres** → Valeurs par défaut ("OSINT", icône search_insights)

## ✨ Avantages

- ✅ **Branding personnalisé** : Chaque service peut avoir son identité visuelle
- ✅ **Mise à jour centralisée** : Modifier dans `/admin/system` met à jour partout
- ✅ **Fallback intelligent** : Affichage correct même sans paramètres définis
- ✅ **Responsive** : Adaptation automatique desktop/mobile
- ✅ **Accessible** : Alt text sur les images, structure sémantique

## 🧪 Tests recommandés

1. **Avec logo + toutes infos** :
   - Aller dans `/admin/system`
   - Uploader un logo
   - Remplir tous les champs (nom, adresse complète)
   - Se déconnecter
   - Vérifier l'affichage sur la page de login

2. **Sans logo** :
   - Supprimer le logo dans `/admin/system`
   - Se déconnecter
   - Vérifier que l'icône par défaut s'affiche

3. **Avec adresse partielle** :
   - Remplir uniquement ville et pays
   - Vérifier que l'adresse s'affiche correctement formatée

4. **Version mobile** :
   - Tester sur écran < 1024px
   - Vérifier l'affichage du logo et du texte centré

## 📱 Breakpoints

- **Desktop** : `lg:` (≥ 1024px) → Colonne gauche avec logo grand format
- **Mobile** : `< 1024px` → Logo en haut, centré, plus petit

## 🎯 Prochaines améliorations possibles

- [ ] Animation de transition lors du chargement du logo
- [ ] Dark mode avec logo alternatif (logo clair/foncé)
- [ ] Couleurs personnalisées pour le dégradé de fond (utiliser primaryColor/secondaryColor)
- [ ] Affichage des contacts (téléphone, email) depuis les paramètres système
- [ ] Changement dynamique du titre de la page (`<title>`)
- [ ] Favicon dynamique basé sur le logo
