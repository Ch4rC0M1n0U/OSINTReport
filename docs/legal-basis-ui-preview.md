# 🎨 Aperçu visuel du Sélecteur de Base Légale

## Interface utilisateur

### 1. Champ vide (état initial)

```
┌────────────────────────────────────────────────────────────────┐
│ Base légale                                       Optionnel    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sélectionnez un ou plusieurs articles du CIC...               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
  Articles du Code d'Instruction Criminelle belge
```

---

### 2. Dropdown ouvert (tous les articles)

```
┌────────────────────────────────────────────────────────────────┐
│ Base légale                                       Optionnel    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sélectionnez un ou plusieurs articles du CIC...               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────────────┐
  │  🔍 Rechercher un article...                                 │
  ├──────────────────────────────────────────────────────────────┤
  │  [ Tous (15) ] [ MPR ] [ Surveillance ] [ Perquisition ]     │
  │  [ Données ] [ Procédure ]                                   │
  ├──────────────────────────────────────────────────────────────┤
  │                                                               │
  │  ☐ Art. 28bis CIC       [MPR]                                │
  │     Méthodes particulières de recherche                      │
  │     Cadre général des MPR - Observation, infiltration...     │
  │                                                               │
  │  ☐ Art. 46bis CIC       [MPR]                                │
  │     Observation                                              │
  │     Observation systématique de personnes, lieux...          │
  │                                                               │
  │  ☐ Art. 46bis §2 CIC    [Données]                            │
  │     Observation via Internet                                 │
  │     Observation sur Internet et réseaux sociaux sans...      │
  │                                                               │
  │  ☐ Art. 47ter CIC       [MPR]                                │
  │     Infiltration                                             │
  │     Infiltration et techniques spéciales de recherche        │
  │                                                               │
  │  ☐ Art. 90ter CIC       [Surveillance]                       │
  │     Mesures de surveillance                                  │
  │     Mini-instruction - Mesures de surveillance...            │
  │                                                               │
  │  ... (10 autres articles) ...                                │
  │                                                               │
  ├──────────────────────────────────────────────────────────────┤
  │  0 article(s) sélectionné(s)          [ Fermer ]             │
  └──────────────────────────────────────────────────────────────┘
```

---

### 3. Recherche active : "observation"

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🔍 observation                                              │
  ├──────────────────────────────────────────────────────────────┤
  │  [ Tous (2) ] [ MPR ] [ Surveillance ] [ Perquisition ]      │
  │  [ Données ] [ Procédure ]                                   │
  ├──────────────────────────────────────────────────────────────┤
  │                                                               │
  │  ☐ Art. 46bis CIC       [MPR]                                │
  │     Observation                                              │
  │     Observation systématique de personnes, lieux...          │
  │                                                               │
  │  ☐ Art. 46bis §2 CIC    [Données]                            │
  │     Observation via Internet                                 │
  │     Observation sur Internet et réseaux sociaux sans...      │
  │                                                               │
  ├──────────────────────────────────────────────────────────────┤
  │  0 article(s) sélectionné(s)          [ Fermer ]             │
  └──────────────────────────────────────────────────────────────┘
```

---

### 4. Filtre par catégorie : "MPR"

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🔍 Rechercher un article...                                 │
  ├──────────────────────────────────────────────────────────────┤
  │  [ Tous (15) ] [[ MPR ]] [ Surveillance ] [ Perquisition ]   │
  │  [ Données ] [ Procédure ]                                   │
  ├──────────────────────────────────────────────────────────────┤
  │                                                               │
  │  ☐ Art. 28bis CIC       [MPR]                                │
  │     Méthodes particulières de recherche                      │
  │     Cadre général des MPR - Observation, infiltration...     │
  │                                                               │
  │  ☐ Art. 46bis CIC       [MPR]                                │
  │     Observation                                              │
  │     Observation systématique de personnes, lieux...          │
  │                                                               │
  │  ☐ Art. 47ter CIC       [MPR]                                │
  │     Infiltration                                             │
  │     Infiltration et techniques spéciales de recherche        │
  │                                                               │
  │  ☐ Art. 47sexies CIC    [MPR]                                │
  │     Contrôle visuel discret                                  │
  │     Pénétration discrète dans lieux privés...                │
  │                                                               │
  ├──────────────────────────────────────────────────────────────┤
  │  0 article(s) sélectionné(s)          [ Fermer ]             │
  └──────────────────────────────────────────────────────────────┘
```

---

### 5. Articles sélectionnés (3 badges)

```
┌────────────────────────────────────────────────────────────────┐
│ Base légale                                       Optionnel    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Art. 28bis CIC ✕ ]  [ Art. 46bis CIC ✕ ]                   │
│  [ Art. 90ter CIC ✕ ]                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
  Articles du Code d'Instruction Criminelle belge
```

---

### 6. Dropdown avec articles sélectionnés (checkboxes cochées)

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🔍 Rechercher un article...                                 │
  ├──────────────────────────────────────────────────────────────┤
  │  [ Tous (15) ] [ MPR ] [ Surveillance ] [ Perquisition ]     │
  │  [ Données ] [ Procédure ]                                   │
  ├──────────────────────────────────────────────────────────────┤
  │                                                               │
  │  ☑ Art. 28bis CIC       [MPR]                  ← Sélectionné │
  │     Méthodes particulières de recherche                      │
  │     Cadre général des MPR - Observation, infiltration...     │
  │                                                               │
  │  ☑ Art. 46bis CIC       [MPR]                  ← Sélectionné │
  │     Observation                                              │
  │     Observation systématique de personnes, lieux...          │
  │                                                               │
  │  ☐ Art. 46bis §2 CIC    [Données]                            │
  │     Observation via Internet                                 │
  │     Observation sur Internet et réseaux sociaux sans...      │
  │                                                               │
  │  ☑ Art. 90ter CIC       [Surveillance]         ← Sélectionné │
  │     Mesures de surveillance                                  │
  │     Mini-instruction - Mesures de surveillance...            │
  │                                                               │
  ├──────────────────────────────────────────────────────────────┤
  │  3 article(s) sélectionné(s)    [ Tout effacer ] [ Fermer ]  │
  └──────────────────────────────────────────────────────────────┘
```

---

### 7. Affichage dans le rapport (section info)

```
╔════════════════════════════════════════════════════════════════╗
║                    📊 Informations du rapport                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Titre                                                          ║
║  ─────                                                          ║
║  Investigation fraude en ligne via réseaux sociaux             ║
║                                                                 ║
║  Dossier                     Service enquêteur                  ║
║  ────────                    ─────────────────                  ║
║  2025/FR/00123              Brigade Cyber Crime                 ║
║                                                                 ║
║  Base légale                                                    ║
║  ────────────                                                   ║
║  [ Art. 28bis CIC ]  [ Art. 46bis §2 CIC ]  [ Art. 88bis CIC ] ║
║                                                                 ║
║  Contexte                                                       ║
║  ─────────                                                      ║
║  Enquête sur un réseau de fraude en ligne opérant via          ║
║  Facebook et Instagram. Les suspects utilisent de faux         ║
║  profils pour escroquer des victimes...                        ║
║                                                                 ║
║  Urgence               Classification                           ║
║  ───────               ──────────────                           ║
║  ⚡ Urgent             🔒 Confidentiel                          ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Couleurs (DaisyUI)

### Badges de catégorie (dans dropdown)

- **MPR** : `badge-primary` (bleu)
- **Surveillance** : `badge-secondary` (violet)
- **Perquisition** : `badge-accent` (rose)
- **Données** : `badge-info` (cyan)
- **Procédure** : `badge-neutral` (gris)

### Badges sélectionnés (dans champ)

- Tous : `badge-primary` (bleu)
- Police : `font-mono` (monospace)

---

## États interactifs

### Hover
```
Dropdown item:
┌──────────────────────────────────────────────────┐
│  ☐ Art. 46bis CIC       [MPR]                    │  ← Fond gris clair
│     Observation                                  │
│     Observation systématique de personnes...     │
└──────────────────────────────────────────────────┘
```

### Sélectionné (background highlight)
```
Dropdown item:
┌──────────────────────────────────────────────────┐
│  ☑ Art. 28bis CIC       [MPR]                    │  ← Fond bleu très clair
│     Méthodes particulières de recherche          │
│     Cadre général des MPR...                     │
└──────────────────────────────────────────────────┘
```

---

## Animations

### Ouverture dropdown
```
Timing: 200ms ease-out
Effect: Fade-in + slide down (translateY)
```

### Apparition badge
```
Timing: 200ms ease-out
Effect: Fade-in + scale (0.8 → 1.0)

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## Scrollbar personnalisée (dropdown)

```
Width: 8px
Track: Gris clair (--b2)
Thumb: Gris moyen (--bc/20%)
Thumb hover: Gris foncé (--bc/30%)
Border-radius: 4px
```

---

## Responsive

### Desktop (≥ 768px)
- Dropdown : `width: 100%` du champ
- Max height : `384px` (max-h-96)
- Grid info : 2 colonnes

### Mobile (< 768px)
- Dropdown : `width: 100%`
- Badges : wrap automatique
- Grid info : 1 colonne

---

## Cas d'usage visuels

### Cas 1 : OSINT passif (réseaux sociaux)
```
Sélection recommandée:
[ Art. 46bis §2 CIC ]  [ Art. 88bis CIC ]
```

### Cas 2 : Réquisition télécoms
```
Sélection recommandée:
[ Art. 39bis CIC ]  [ Art. 88sexies CIC ]  [ Art. 127 CIC ]
```

### Cas 3 : Surveillance technique
```
Sélection recommandée:
[ Art. 90ter CIC ]  [ Art. 90quater CIC ]  [ Art. 127 CIC ]
```

---

## Accessibilité

✅ **Keyboard navigation** : Tab, Enter, Espace, Escape  
✅ **Screen readers** : Labels ARIA, rôles sémantiques  
✅ **Focus visible** : Outline bleu sur focus  
✅ **Contraste** : WCAG AA compliant  
✅ **Touch targets** : Minimum 44x44px

---

**Date** : 3 octobre 2025  
**Fichier source** : `/frontend/src/components/shared/LegalBasisSelector.vue`
