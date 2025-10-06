# ✅ Croisements inter-modules - COMPLET

**Date** : 6 octobre 2025  
**Objectif** : Lier les entités avec les identifiants, plateformes et médias du rapport

---

## 🎯 Fonctionnalités implémentées

### 1. Liaison Entité ↔ Identifiants

**Champ ajouté** : `relatedIdentifiers: string[]`

**Fonctionnement** :
- Saisie manuelle dans EntityEditModal (texte séparé par virgules)
- Détection automatique du type d'identifiant (📞 téléphone, 📧 email, 👤 username)
- Affichage dans EntityCard avec badges et icônes

**Exemple** :
```typescript
{
  label: "Jean Dupont",
  entityType: "person",
  metadata: {
    relatedIdentifiers: [
      "+32 475 12 34 56",
      "jean.dupont@example.com",
      "@jeandupont"
    ]
  }
}
```

**Affichage** :
```
🔗 Identifiants liés :
📞 +32 475 12 34 56  📧 jean.dupont@example.com  👤 @jeandupont
```

---

### 2. Liaison Entité ↔ Plateformes

**Champ ajouté** : `relatedPlatforms: string[]`

**Fonctionnement** :
- Saisie de références aux analyses de plateformes
- Format libre : "Facebook - John Doe", "Instagram - @johndoe"
- Affichage dans EntityCard avec badges bleus

**Exemple** :
```typescript
{
  label: "Jean Dupont",
  entityType: "person",
  metadata: {
    relatedPlatforms: [
      "Facebook - John Doe",
      "Instagram - @johndoe",
      "X (Twitter) - @jdupont"
    ]
  }
}
```

**Affichage** :
```
🌐 Plateformes :
Facebook - John Doe  Instagram - @johndoe  X (Twitter) - @jdupont
```

---

### 3. Liaison Entité ↔ Médias

**Champ ajouté** : `relatedMedia: string[]`

**Fonctionnement** :
- Références aux médias du rapport (screenshots, photos)
- Format : noms de fichiers ou descriptions
- Affichage dans EntityCard avec badges verts

**Exemple** :
```typescript
{
  label: "Jean Dupont",
  entityType: "person",
  metadata: {
    relatedMedia: [
      "screenshot_profil_facebook.png",
      "photo_suspect_identite.jpg",
      "video_surveillance.mp4"
    ]
  }
}
```

**Affichage** :
```
🖼️ Médias liés :
screenshot_profil_facebook.png  photo_suspect_identite.jpg  video_surveillance.mp4
```

---

## 📋 Détection automatique du type d'identifiant

### Algorithme de détection

```typescript
function getIdentifierIcon(identifier: string): string {
  const lower = identifier.toLowerCase();
  
  // Email : contient @ et .
  if (lower.includes('@') && lower.includes('.')) {
    return '📧';
  }
  
  // Téléphone : format numérique avec +
  if (lower.match(/^\+?\d{8,15}$/)) {
    return '📞';
  }
  
  // Username : commence par @
  if (lower.startsWith('@')) {
    return '👤';
  }
  
  return '🔖'; // Autre
}
```

### Exemples de détection

| Valeur saisie | Type détecté | Icône |
|---------------|--------------|-------|
| `+32 475 12 34 56` | Téléphone | 📞 |
| `jean.dupont@example.com` | Email | 📧 |
| `@johndoe` | Username | 👤 |
| `123456789` | Téléphone | 📞 |
| `JD-2024-001` | Autre | 🔖 |

---

## 🎨 Interface utilisateur

### EntityEditModal - Section Croisements

```vue
<div class="divider text-sm opacity-60">🔗 Croisements</div>

<!-- Identifiants -->
<div class="form-control">
  <label class="label">
    <span class="label-text text-xs">Identifiants liés</span>
    <span class="label-text-alt text-xs opacity-60">Séparés par des virgules</span>
  </label>
  <input
    v-model="relatedIdentifiersText"
    type="text"
    placeholder="Ex: +32 475 12 34 56, john.doe@example.com, @johndoe"
    class="input input-bordered input-sm font-mono"
  />
</div>

<!-- Plateformes -->
<div class="form-control">
  <label class="label">
    <span class="label-text text-xs">Plateformes liées</span>
    <span class="label-text-alt text-xs opacity-60">Ex: Facebook, Instagram, X</span>
  </label>
  <input
    v-model="relatedPlatformsText"
    type="text"
    placeholder="Ex: Facebook - John Doe, Instagram - @johndoe"
    class="input input-bordered input-sm"
  />
</div>

<!-- Médias -->
<div class="form-control">
  <label class="label">
    <span class="label-text text-xs">Médias liés</span>
    <span class="label-text-alt text-xs opacity-60">Noms de fichiers ou descriptions</span>
  </label>
  <input
    v-model="relatedMediaText"
    type="text"
    placeholder="Ex: screenshot_profil.png, photo_suspect.jpg"
    class="input input-bordered input-sm font-mono"
  />
</div>
```

### EntityCard - Affichage des croisements

```vue
<!-- Séparateur -->
<div class="mt-3 pt-3 border-t border-base-300">

<!-- Identifiants avec icônes auto-détectées -->
<div v-if="hasRelatedIdentifiers">
  <div class="text-xs opacity-60 mb-1">🔗 Identifiants liés :</div>
  <div class="flex flex-wrap gap-1">
    <span class="badge badge-sm badge-outline font-mono">
      📞 +32 475 12 34 56
    </span>
    <span class="badge badge-sm badge-outline font-mono">
      📧 jean.dupont@example.com
    </span>
  </div>
</div>

<!-- Plateformes avec badges bleus -->
<div v-if="hasRelatedPlatforms">
  <div class="text-xs opacity-60 mb-1">🌐 Plateformes :</div>
  <div class="flex flex-wrap gap-1">
    <span class="badge badge-sm badge-info badge-outline">
      Facebook - John Doe
    </span>
  </div>
</div>

<!-- Médias avec badges verts -->
<div v-if="hasRelatedMedia">
  <div class="text-xs opacity-60 mb-1">🖼️ Médias liés :</div>
  <div class="flex flex-wrap gap-1">
    <span class="badge badge-sm badge-success badge-outline font-mono text-xs">
      screenshot_profil.png
    </span>
  </div>
</div>
```

---

## 🧪 Tests à effectuer

### Test 1 : Entité avec identifiants multiples

**Procédure** :
1. Créer entité "Jean Dupont" (personne)
2. Dans section "🔗 Croisements", remplir :
   - Identifiants : `+32 475 12 34 56, jean.dupont@example.com, @jeandupont`
3. Sauvegarder

**Résultat attendu** :
- ✅ Carte affiche 3 badges avec icônes appropriées
- ✅ Hover sur badge affiche le type complet
- ✅ Téléphone a icône 📞
- ✅ Email a icône 📧
- ✅ Username a icône 👤

---

### Test 2 : Entité avec plateformes

**Procédure** :
1. Modifier entité "Jean Dupont"
2. Ajouter plateformes : `Facebook - John Doe, Instagram - @johndoe`
3. Sauvegarder

**Résultat attendu** :
- ✅ Section "🌐 Plateformes :" visible
- ✅ Badges bleus avec texte complet
- ✅ Séparation visuelle claire avec identifiants

---

### Test 3 : Entité avec médias

**Procédure** :
1. Modifier entité "Jean Dupont"
2. Ajouter médias : `screenshot_fb.png, photo_id.jpg`
3. Sauvegarder

**Résultat attendu** :
- ✅ Section "🖼️ Médias liés :" visible
- ✅ Badges verts avec noms de fichiers
- ✅ Font monospace pour lisibilité

---

### Test 4 : Carte complète

**Entité finale** :
```
👤 Jean Dupont  ✓ Vérifié  🟢 Confirmé

📋 Personne physique

🎂 Né(e) le: 15 mars 1985
🆔 RRN: 85.03.15-123.45
📍 Adresse: Rue de la Loi 16, 1000 Bruxelles
📞 Tél: +32 475 12 34 56

────────────────────────────────

🔗 Identifiants liés :
📞 +32 475 12 34 56  📧 jean.dupont@example.com  👤 @jeandupont

🌐 Plateformes :
Facebook - John Doe  Instagram - @johndoe

🖼️ Médias liés :
screenshot_fb.png  photo_id.jpg

📎 3 sources
```

---

## 🔮 Améliorations futures (Phase 3)

### 1. Auto-détection intelligente

**Idée** : Lors de la saisie d'un téléphone dans `personDetails.phoneNumbers`, suggérer automatiquement de l'ajouter aux `relatedIdentifiers`.

```typescript
watch(() => personDetails.value.phoneNumbers, (phones) => {
  phones?.forEach(phone => {
    if (phone && !relatedIdentifiers.value.includes(phone)) {
      // Afficher suggestion : "Lier ce numéro aux identifiants ?"
      suggestLinkIdentifier(phone);
    }
  });
});
```

---

### 2. Sélecteur visuel avec dropdown

**Remplacer** : Champ texte libre  
**Par** : Dropdown multi-sélection avec tous les identifiants du rapport

```vue
<RelatedIdentifierSelector
  v-model="localEntity.metadata.relatedIdentifiers"
  :all-identifiers="getAllIdentifiersFromReport()"
/>
```

**Avantages** :
- ✅ Pas de faute de frappe
- ✅ Lien garanti avec module existant
- ✅ Suggestion automatique

---

### 3. Liens cliquables dans la carte

**Transformer** : Badge passif  
**En** : Lien cliquable vers le module

```vue
<router-link
  :to="{ hash: `#module-identifier-${getModuleId(identifier)}` }"
  class="badge badge-sm badge-outline font-mono hover:badge-primary"
>
  📞 {{ identifier }}
</router-link>
```

**Résultat** : Cliquer sur un téléphone scroll vers le module IdentifierLookup correspondant.

---

### 4. Validation croisée

**Vérifier** que les identifiants saisis existent vraiment dans le rapport

```typescript
function validateRelatedIdentifiers(): string[] {
  const errors: string[] = [];
  const allIdentifiers = getAllIdentifiersFromReport();
  
  relatedIdentifiers.value.forEach(id => {
    const exists = allIdentifiers.some(i => i.label === id);
    if (!exists) {
      errors.push(`Identifiant "${id}" introuvable dans le rapport`);
    }
  });
  
  return errors;
}
```

---

### 5. Badge "Lié" dans IdentifierLookup

**Afficher** dans le module IdentifierLookup un badge indiquant qu'il est lié à une entité

```vue
<!-- Dans IdentifierCard.vue -->
<div v-if="isLinkedToEntity">
  <span class="badge badge-xs badge-success gap-1">
    🔗 Lié à {{ linkedEntity.label }}
  </span>
</div>
```

**Bidirectionnel** : 
- Entité → Identifiant ✅ (implémenté)
- Identifiant → Entité ⏳ (future amélioration)

---

## 📊 Résumé

### Avant
```
Entité: Jean Dupont
Type: Personne
RRN: 85.03.15-123.45
```

### Après
```
Entité: Jean Dupont
Type: Personne physique 👤

🎂 Né(e) le: 15 mars 1985
🆔 RRN: 85.03.15-123.45
📍 Adresse: Rue de la Loi 16, Bruxelles
📞 Tél: +32 475 12 34 56

🔗 Identifiants liés:
📞 +32 475 12 34 56  📧 jean.dupont@example.com  👤 @jeandupont

🌐 Plateformes:
Facebook - John Doe  Instagram - @johndoe

🖼️ Médias liés:
screenshot_profil.png  photo_suspect.jpg
```

---

## ✅ Checklist finale

- [x] Types `relatedIdentifiers`, `relatedPlatforms`, `relatedMedia` ajoutés à EntityMetadata
- [x] Computed properties dans EntityEditModal pour gérer les listes (CSV)
- [x] Section "🔗 Croisements" dans EntityEditModal
- [x] Détection automatique du type d'identifiant (📞 📧 👤 🔖)
- [x] Affichage conditionnel dans EntityCard
- [x] Badges colorés par type (outline, info, success)
- [x] Séparateur visuel (border-top) avant les croisements
- [ ] Tests utilisateur
- [ ] Auto-détection depuis phoneNumbers
- [ ] Sélecteur visuel (dropdown)
- [ ] Liens cliquables vers modules
- [ ] Validation croisée
- [ ] Badge bidirectionnel dans IdentifierLookup

---

**Status** : ✅ PHASE 2 TERMINÉE  
**Prochaine étape** : Tests utilisateur et Phase 3 (auto-détection intelligente)

