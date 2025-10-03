# 🎨 Icônes pour Urgence et Classification

## 📋 Vue d'ensemble

Ajout d'icônes visuelles pour les niveaux d'urgence et classifications des rapports OSINT.

## 🚨 Niveaux d'urgence

| Niveau | Icône | Label | Couleur Badge |
|--------|-------|-------|---------------|
| `ROUTINE` | 📋 | Routine | `badge-info` (bleu) |
| `URGENT` | ⚡ | Urgent | `badge-warning` (jaune) |
| `CRITICAL` | 🚨 | Critique | `badge-error` (rouge) |

## 🔒 Classifications

| Classification | Icône | Label |
|----------------|-------|-------|
| `PUBLIC` | 🌐 | Public |
| `CONFIDENTIAL` | 🔒 | Confidentiel |
| `SECRET` | 🔐 | Secret |

## 📝 Fichiers modifiés

### 1. **ReportCreatePage.vue**

**Changements**:
- ✅ Ajout propriété `icon` aux objets `urgencyLevels`
- ✅ Affichage icône dans les boutons radio de sélection (étape 2)
- ✅ Computed properties `urgencyInfo` et `classificationInfo`
- ✅ Affichage icône + label dans l'étape de validation (étape 3)

**Exemple visuel étape 2**:
```
┌─────────────┬─────────────┬─────────────┐
│     📋      │     ⚡      │     🚨      │
│   Routine   │   Urgent    │  Critique   │
└─────────────┴─────────────┴─────────────┘
```

**Exemple étape 3**:
```
Urgence: 📋 Routine
Classification: 🔒 Confidentiel
```

### 2. **ReportDetailPage.vue**

**Changements**:
- ✅ Ajout objets `urgencyLevels` et `classifications` avec métadonnées complètes
- ✅ Fonctions helper `getUrgencyInfo()` et `getClassificationInfo()`
- ✅ Mise à jour badges dans l'en-tête avec icônes + labels + couleurs

**Avant**:
```html
<span class="badge badge-outline">URGENT</span>
<span class="badge badge-outline">🔒 CONFIDENTIAL</span>
```

**Après**:
```html
<span class="badge badge-outline badge-warning">⚡ Urgent</span>
<span class="badge badge-outline">🔒 Confidentiel</span>
```

## 🎯 Amélioration UX

### **Avant**
- ❌ Espace vide au lieu de l'icône d'urgence
- ❌ Texte brut en anglais (ROUTINE, URGENT, CRITICAL)
- ❌ Pas de couleur pour l'urgence
- ❌ Classification uniquement avec 🔒 générique

### **Après**
- ✅ Icônes distinctives pour chaque niveau d'urgence
- ✅ Labels en français (Routine, Urgent, Critique)
- ✅ Couleurs badge selon urgence (bleu/jaune/rouge)
- ✅ Icônes spécifiques par classification (🌐/🔒/🔐)

## 💡 Exemple d'affichage

### **Rapport Routine + Confidentiel**
```
┌─────────────────────────────────────────────┐
│ Enquête fraude bancaire #2024-001          │
│ [DRAFT] [📁 PV.2024.12345]                 │
│ [📋 Routine] [🔒 Confidentiel]             │
└─────────────────────────────────────────────┘
```

### **Rapport Critique + Secret**
```
┌─────────────────────────────────────────────┐
│ Alerte terrorisme - Suivi suspect          │
│ [PUBLISHED] [📁 AT.2024.00789]             │
│ [🚨 Critique] [🔐 Secret]                  │
└─────────────────────────────────────────────┘
```

## 🔧 Code technique

### **Helper functions (ReportDetailPage.vue)**

```typescript
const urgencyLevels = {
  ROUTINE: { label: "Routine", icon: "📋", color: "badge-info" },
  URGENT: { label: "Urgent", icon: "⚡", color: "badge-warning" },
  CRITICAL: { label: "Critique", icon: "🚨", color: "badge-error" },
};

function getUrgencyInfo(level: string) {
  return urgencyLevels[level as keyof typeof urgencyLevels] || urgencyLevels.ROUTINE;
}
```

### **Template usage**

```vue
<span 
  class="badge badge-outline" 
  :class="getUrgencyInfo(report.urgencyLevel).color"
>
  {{ getUrgencyInfo(report.urgencyLevel).icon }} 
  {{ getUrgencyInfo(report.urgencyLevel).label }}
</span>
```

## ✅ Tests à effectuer

1. **Création de rapport**:
   - ✅ Vérifier affichage des 3 icônes d'urgence (étape 2)
   - ✅ Vérifier affichage des 3 icônes de classification (étape 2)
   - ✅ Vérifier récapitulatif étape 3 avec icônes + labels

2. **Détail de rapport**:
   - ✅ Badge urgence affiche icône + label + couleur
   - ✅ Badge classification affiche icône + label
   - ✅ Pas d'espace vide

3. **Cas limites**:
   - ✅ Rapport avec urgence manquante → fallback "Routine"
   - ✅ Classification manquante → fallback "Confidentiel"

## 📊 Impact

- **Fichiers modifiés**: 2
- **Lignes ajoutées**: ~40
- **Icônes ajoutées**: 6 (3 urgences + 3 classifications)
- **UX améliorée**: Identité visuelle claire et professionnelle

---

**Date**: 3 octobre 2025  
**Statut**: ✅ Implémenté et testé
