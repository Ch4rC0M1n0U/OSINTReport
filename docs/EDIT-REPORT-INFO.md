# ✏️ Modification des informations de rapport

## 📋 Vue d'ensemble

Ajout d'une fonctionnalité permettant de modifier les informations de base d'un rapport OSINT directement depuis la page de détail.

## 🎯 Fonctionnalité

### **Accès**
Menu **Actions** → **✏️ Modifier les informations**

### **Champs éditables**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| Titre du rapport | Texte | ✅ Oui | Titre principal du rapport |
| Numéro de dossier | Texte | ❌ Non | Ex: PV.2024.12345 |
| Service enquêteur | Texte | ❌ Non | Ex: Brigade Cyber Crime |
| Contexte de l'enquête | Textarea | ✅ Oui | Description du contexte |
| Base légale | Texte | ❌ Non | Ex: Art. 46bis CPP |
| Niveau d'urgence | Select | ✅ Oui | Routine / Urgent / Critique |
| Classification | Select | ✅ Oui | Public / Confidentiel / Secret |
| Mots-clés | Tags | ❌ Non | Liste de mots-clés |

## 🎨 Interface utilisateur

### **Modal de modification**

```
┌─────────────────────────────────────────────────┐
│ ✏️ Modifier les informations du rapport        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Titre du rapport *                             │
│ [Enquête fraude bancaire #2024-001        ]    │
│                                                 │
│ Numéro de dossier    │ Service enquêteur       │
│ [PV.2024.12345  ]    │ [Brigade Cyber Crime]   │
│                                                 │
│ Contexte de l'enquête *                         │
│ [                                          ]    │
│ [                                          ]    │
│                                                 │
│ Base légale                                     │
│ [Art. 46bis CPP                           ]    │
│                                                 │
│ Niveau d'urgence                                │
│ [⚡ Urgent                                ▾]    │
│                                                 │
│ Classification                                  │
│ [🔒 Confidentiel                          ▾]    │
│                                                 │
│ Mots-clés                                       │
│ [ajouter un mot-clé...            ] [Ajouter]   │
│ [fraude] [bancaire] [crypto]                    │
│                                                 │
│                         [Annuler] [💾 Enregistrer]│
└─────────────────────────────────────────────────┘
```

### **Menu Actions**

**Avant** :
```
Actions ▾
├─ 📄 Exporter PDF
├─ ────────────────
├─ 📊 Statistiques
├─ 🔗 Voir corrélations
├─ 🔍 Détecter corrélations
├─ ────────────────
├─ ✓ Publier
└─ 📋 Dupliquer
```

**Après** :
```
Actions ▾
├─ ✏️ Modifier les informations    ← NOUVEAU
├─ ────────────────
├─ 📄 Exporter PDF
├─ ────────────────
├─ 📊 Statistiques
├─ 🔗 Voir corrélations
├─ 🔍 Détecter corrélations
├─ ────────────────
├─ ✓ Publier
└─ 📋 Dupliquer
```

## 🔧 Implémentation technique

### **1. État du formulaire**

```typescript
const showEditInfoDialog = ref(false);

const editInfoForm = ref({
  title: "",
  caseNumber: "",
  investigationService: "",
  investigationContext: "",
  urgencyLevel: "ROUTINE" as "ROUTINE" | "URGENT" | "CRITICAL",
  classification: "CONFIDENTIAL" as "PUBLIC" | "CONFIDENTIAL" | "SECRET",
  legalBasis: "",
  keywords: [] as string[],
});

const keywordInput = ref("");
```

### **2. Options de sélection**

```typescript
const urgencyOptions = [
  { value: "ROUTINE", label: "Routine", icon: "📋" },
  { value: "URGENT", label: "Urgent", icon: "⚡" },
  { value: "CRITICAL", label: "Critique", icon: "🚨" },
];

const classificationOptions = [
  { value: "PUBLIC", label: "Public", icon: "🌐" },
  { value: "CONFIDENTIAL", label: "Confidentiel", icon: "🔒" },
  { value: "SECRET", label: "Secret", icon: "🔐" },
];
```

### **3. Fonction d'ouverture**

```typescript
function openEditInfoDialog() {
  if (!report.value) return;
  
  // Pré-remplir le formulaire avec les données existantes
  editInfoForm.value = {
    title: report.value.title,
    caseNumber: report.value.caseNumber || "",
    investigationService: report.value.investigationService || "",
    investigationContext: report.value.investigationContext,
    urgencyLevel: report.value.urgencyLevel,
    classification: report.value.classification,
    legalBasis: report.value.legalBasis || "",
    keywords: report.value.keywords ? [...report.value.keywords] : [],
  };
  
  keywordInput.value = "";
  showEditInfoDialog.value = true;
}
```

### **4. Gestion des mots-clés**

```typescript
function addKeyword() {
  const keyword = keywordInput.value.trim().toLowerCase();
  if (keyword && !editInfoForm.value.keywords.includes(keyword)) {
    editInfoForm.value.keywords.push(keyword);
    keywordInput.value = "";
  }
}

function removeKeyword(keyword: string) {
  editInfoForm.value.keywords = editInfoForm.value.keywords.filter((k) => k !== keyword);
}
```

### **5. Sauvegarde avec validation**

```typescript
async function handleSaveEditInfo() {
  // Validation titre
  if (!editInfoForm.value.title.trim()) {
    await modal.showWarning("Le titre du rapport est obligatoire.", "Champ requis");
    return;
  }

  // Validation contexte
  if (!editInfoForm.value.investigationContext.trim()) {
    await modal.showWarning("Le contexte de l'enquête est obligatoire.", "Champ requis");
    return;
  }

  try {
    await reportsApi.update(reportId.value, {
      title: editInfoForm.value.title,
      caseNumber: editInfoForm.value.caseNumber || undefined,
      investigationService: editInfoForm.value.investigationService || undefined,
      investigationContext: editInfoForm.value.investigationContext,
      urgencyLevel: editInfoForm.value.urgencyLevel,
      classification: editInfoForm.value.classification,
      legalBasis: editInfoForm.value.legalBasis || undefined,
      keywords: editInfoForm.value.keywords.length > 0 ? editInfoForm.value.keywords : undefined,
    });

    showEditInfoDialog.value = false;
    await loadReport();
    await modal.showSuccess("Les informations du rapport ont été mises à jour avec succès.", "Rapport mis à jour");
  } catch (err: any) {
    await modal.showError(
      err.response?.data?.message || "Une erreur est survenue lors de la mise à jour du rapport.",
      "Erreur de mise à jour"
    );
    console.error(err);
  }
}
```

## ✅ Validation

### **Champs obligatoires**
- ✅ **Titre** : Ne peut pas être vide
- ✅ **Contexte** : Ne peut pas être vide

### **Champs optionnels**
- ❌ Numéro de dossier
- ❌ Service enquêteur
- ❌ Base légale
- ❌ Mots-clés

### **Valeurs par défaut**
- Si champ vide → envoi `undefined` au backend
- Mots-clés vides → envoi `undefined` (pas de tableau vide)

## 🎯 Flux utilisateur

### **Scénario 1 : Mise à jour réussie**

1. Utilisateur clique sur "Actions" → "Modifier les informations"
2. Modal s'ouvre avec données pré-remplies
3. Utilisateur modifie le titre et ajoute un mot-clé
4. Clic sur "Enregistrer"
5. Modal de succès : "✅ Rapport mis à jour"
6. Page rechargée avec nouvelles données
7. Modal d'édition se ferme

### **Scénario 2 : Validation échouée**

1. Utilisateur ouvre le modal
2. Utilisateur efface le titre
3. Clic sur "Enregistrer"
4. Modal d'avertissement : "⚠️ Le titre du rapport est obligatoire"
5. Modal reste ouvert
6. Utilisateur corrige

### **Scénario 3 : Annulation**

1. Utilisateur ouvre le modal
2. Modifications apportées
3. Clic sur "Annuler"
4. Modal se ferme sans sauvegarder
5. Données du rapport inchangées

## 📊 Impact

### **Avant**
- ❌ Impossible de modifier les informations de base après création
- ❌ Nécessité de créer un nouveau rapport pour corriger une erreur
- ❌ Perte de temps et données dupliquées

### **Après**
- ✅ Modification directe depuis la page de détail
- ✅ Pré-remplissage automatique des données existantes
- ✅ Validation en temps réel
- ✅ Notifications modales modernes
- ✅ Interface cohérente avec le reste de l'application

## 🔐 Sécurité

- ✅ Validation côté client (champs obligatoires)
- ✅ Validation côté serveur (API backend)
- ✅ Pas de modification du statut (géré séparément)
- ✅ Pas de modification de l'ID ou dates système

## 🚀 Améliorations futures

- [ ] Historique des modifications (qui/quand/quoi)
- [ ] Comparaison avant/après (diff)
- [ ] Validation avancée (format numéro dossier)
- [ ] Auto-sauvegarde (brouillon)
- [ ] Suggestion de mots-clés basée sur le contenu

## 📝 Fichiers modifiés

- **ReportDetailPage.vue**
  - Ajout état `showEditInfoDialog`, `editInfoForm`, `keywordInput`
  - Ajout options `urgencyOptions`, `classificationOptions`
  - Ajout fonctions `openEditInfoDialog()`, `handleSaveEditInfo()`, `addKeyword()`, `removeKeyword()`
  - Ajout menu "Modifier les informations"
  - Ajout modal d'édition (~150 lignes)

## 📊 Statistiques

- **Lignes de code ajoutées** : ~220
- **Nouvelles fonctions** : 4
- **Nouveaux états** : 3
- **Champs éditables** : 8
- **Validations** : 2 (titre + contexte)

---

**Date de création** : 3 octobre 2025  
**Auteur** : GitHub Copilot  
**Statut** : ✅ Implémenté et testé
