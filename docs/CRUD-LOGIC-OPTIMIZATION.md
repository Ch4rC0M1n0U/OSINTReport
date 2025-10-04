# 🎯 Logique CRUD Optimisée par Module - Analyse

**Date**: 3 octobre 2025  
**Objectif**: Définir la meilleure UX pour chaque type de module

---

## 🧠 Principes directeurs

### 1. **Modules d'analyse/découvertes** (Findings-based)
- **Logique**: CRUD complet avec validation
- **Caractéristiques**: 
  - Données évolutives (ajout/suppression fréquents)
  - Sources multiples
  - Niveau de confiance important
  - Métadonnées complexes

### 2. **Modules de narration** (Content-based)
- **Logique**: WYSIWYG avec auto-save
- **Caractéristiques**:
  - Contenu textuel riche
  - Édition fréquente
  - Pas de structure rigide
  - Markdown pour formatage

### 3. **Modules de validation** (Immutable/Semi-immutable)
- **Logique**: Création unique ou modification limitée
- **Caractéristiques**:
  - Données officielles
  - Traçabilité importante
  - Modifications rares après création
  - Validation juridique/procédurale

---

## 📊 Matrice de logique par module

| Module | Type | CRUD | WYSIWYG | Auto-save | Immutable | Logique optimale |
|--------|------|------|---------|-----------|-----------|------------------|
| **Summary** | Narration | ❌ | ✅ | ✅ | ❌ | Édition directe WYSIWYG |
| **Objectives** | Liste | ✅ | ✅ | ❌ | ❌ | CRUD avec WYSIWYG par item |
| **EntityOverview** | Findings | ✅ | ❌ | ❌ | ⚠️ | CRUD complet, création validée |
| **IdentifierLookup** | Findings | ✅ | ❌ | ❌ | ⚠️ | CRUD complet, création validée |
| **PlatformAnalysis** | Findings | ✅ | ❌ | ❌ | ❌ | CRUD complet |
| **MediaGallery** | Collection | ✅ | ❌ | ❌ | ❌ | CRUD complet |
| **DataRetention** | Liste | ✅ | ❌ | ❌ | ⚠️ | CRUD limité après création |
| **InvestigationLeads** | Action | ✅ | ✅ | ❌ | ❌ | CRUD avec WYSIWYG notes |
| **Conclusions** | Narration | ❌ | ✅ | ✅ | ❌ | Édition directe WYSIWYG |
| **SignOff** | Validation | ❌ | ❌ | ❌ | ✅ | Création unique, lecture seule après |

**Légende**:
- ✅ = Recommandé
- ❌ = Non recommandé
- ⚠️ = Semi-immutable (création facile, modification contrôlée)

---

## 🎨 Design patterns par catégorie

### Pattern 1: WYSIWYG Direct (Summary, Conclusions)

**Comportement**:
```
[Mode lecture par défaut]
└─ Bouton "✏️ Modifier"
   └─ Passe en mode WYSIWYG inline
      ├─ Auto-save après 2 secondes d'inactivité
      ├─ Indicateur "💾 Sauvegarde..."
      └─ Bouton "✓ Terminer l'édition"
```

**Avantages**:
- ✅ Édition fluide
- ✅ Pas de modal
- ✅ Sauvegarde automatique
- ✅ Pas de perte de données

---

### Pattern 2: CRUD Modal avec Findings (EntityOverview, IdentifierLookup, PlatformAnalysis)

**Comportement**:
```
[Liste des findings en mode lecture]
├─ Bouton "+ Ajouter" → Modal création
├─ Bouton "✏️" sur finding → Modal édition
└─ Bouton "🗑️" sur finding → Confirmation + Suppression

[Modal création/édition]
├─ Formulaire structuré
├─ FindingEditor avec sources
├─ Validation temps réel
└─ Boutons "Annuler" / "Enregistrer"
```

**Avantages**:
- ✅ Structure claire
- ✅ Validation avant sauvegarde
- ✅ Pas de modification accidentelle
- ✅ Traçabilité (sources, confiance)

---

### Pattern 3: CRUD Inline (Objectives, InvestigationLeads)

**Comportement**:
```
[Mode lecture]
└─ Bouton "✏️ Modifier tout"
   └─ Passe en mode édition inline
      ├─ Formulaires pour chaque item
      ├─ Boutons "+/-" par item
      ├─ WYSIWYG pour champs texte riche
      └─ Bouton "💾 Enregistrer tout" / "Annuler"
```

**Avantages**:
- ✅ Vue d'ensemble
- ✅ Modification batch
- ✅ WYSIWYG pour notes
- ✅ Flexibilité

---

### Pattern 4: Immutable/Locked (SignOff, DataRetention après validation)

**Comportement**:
```
[État non créé]
└─ Formulaire de création

[État créé - Lecture seule]
├─ Affichage complet
├─ Badge "🔒 Validé"
└─ Bouton "✏️ Modifier" désactivé
    └─ Tooltip: "Modification restreinte aux administrateurs"
```

**Avantages**:
- ✅ Intégrité des données
- ✅ Traçabilité juridique
- ✅ Pas de modification accidentelle
- ✅ Audit trail

---

## 🔧 Optimisations techniques à implémenter

### 1. Auto-save pour WYSIWYG

```typescript
// Dans Summary et Conclusions
const debouncedSave = debounce(async (content: string) => {
  await handleUpdateModule(moduleId, { content });
  showToast('💾 Sauvegardé', 'success');
}, 2000);

watch(() => editedContent.value, (newContent) => {
  if (isEditing.value) {
    debouncedSave(newContent);
  }
});
```

### 2. Validation création pour Findings

```typescript
// Dans EntityOverview, IdentifierLookup
function validateFinding(finding: Finding): string[] {
  const errors: string[] = [];
  
  if (!finding.label.trim()) {
    errors.push('Le label est requis');
  }
  
  if (finding.sources.length === 0) {
    errors.push('Au moins une source est requise');
  }
  
  // Vérifier unicité (pas de doublon)
  const isDuplicate = findings.value.some(f => 
    f.label.toLowerCase() === finding.label.toLowerCase()
  );
  if (isDuplicate) {
    errors.push('Cette entité existe déjà');
  }
  
  return errors;
}
```

### 3. Lock mechanism pour SignOff

```typescript
// Dans SignOffModule
const isLocked = computed(() => {
  return props.modelValue.date && props.modelValue.officer?.name;
});

const canEdit = computed(() => {
  return !isLocked.value || userStore.hasPermission('admin');
});
```

### 4. Confirmation suppression

```typescript
// Dans tous les modules CRUD
async function confirmDelete(item: any, index: number) {
  const confirmed = await modal.showConfirm(
    `Êtes-vous sûr de vouloir supprimer "${item.label}" ?`,
    'Confirmation de suppression',
    { 
      confirmText: 'Supprimer',
      confirmClass: 'btn-error'
    }
  );
  
  if (confirmed) {
    removeItem(index);
  }
}
```

---

## 📝 Recommandations finales

### À implémenter prioritairement:

1. **Auto-save WYSIWYG** (Summary, Conclusions)
   - Meilleure UX
   - Pas de perte de données
   - Indicateur visuel

2. **Modal CRUD pour Findings** (EntityOverview, IdentifierLookup, PlatformAnalysis)
   - Validation structurée
   - Pas de modification accidentelle
   - Traçabilité complète

3. **Lock SignOff** après validation
   - Intégrité juridique
   - Audit trail
   - Permissions admin

4. **Confirmation suppression** partout
   - Éviter erreurs
   - UX cohérente

5. **Validation unicité** (EntityOverview, IdentifierLookup)
   - Pas de doublons
   - Qualité données

---

## 🎯 Priorisation

### Phase 4.1 - Critique (aujourd'hui)
- ✅ Auto-save WYSIWYG (Summary, Conclusions)
- ✅ Modal CRUD Findings (EntityOverview, IdentifierLookup)
- ✅ Lock SignOff

### Phase 4.2 - Important (demain)
- ⏳ Validation unicité
- ⏳ Confirmation suppression globale
- ⏳ Indicateurs sauvegarde

### Phase 4.3 - Nice to have (plus tard)
- ⏳ Undo/Redo
- ⏳ Historique modifications
- ⏳ Drafts auto-sauvegardés

---

**Prêt à implémenter** ! 🚀
