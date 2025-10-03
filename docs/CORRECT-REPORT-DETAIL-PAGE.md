# Correction ReportDetailPage.vue - Types de Modules

## 🎯 Objectif

Remplacer les anciens types de modules (avec tirets) par les nouveaux types (avec underscores).

## 📝 Modifications à Effectuer

### 1. Ligne 4 - Ajouter import de MODULE_TYPE_METADATA

**AVANT** :
```typescript
import { reportsApi, type Report, type ReportModule, type ReportStats, type ReportModuleType } from "@/services/api/reports";
```

**APRÈS** :
```typescript
import {
  reportsApi,
  type Report,
  type ReportModule,
  type ReportStats,
  type ReportModuleType,
  MODULE_TYPE_METADATA,  // ← AJOUT
} from "@/services/api/reports";
```

### 2. Ligne 34 - Changer valeur par défaut du type

**AVANT** :
```typescript
const moduleForm = ref<{
  type: ReportModuleType;
  title: string;
  entityId: string | undefined;
  payload: Record<string, any>;
}>({
  type: "research-detail",  // ← TYPE INVALIDE
  title: "",
  entityId: undefined,
  payload: {},
});
```

**APRÈS** :
```typescript
const moduleForm = ref<{
  type: ReportModuleType;
  title: string;
  entityId: string | undefined;
  payload: Record<string, any>;
}>({
  type: "summary",  // ← TYPE VALIDE
  title: "",
  entityId: undefined,
  payload: {},
});
```

### 3. Lignes 41-52 - Remplacer l'array statique par construction dynamique

**AVANT** :
```typescript
const moduleTypes: Array<{ value: ReportModuleType; label: string; icon: string }> = [
  { value: "summary", label: "Résumé", icon: "📋" },
  { value: "entities", label: "Entités", icon: "👥" },
  { value: "objectives", label: "Objectifs", icon: "🎯" },
  { value: "research-summary", label: "Résumé de recherche", icon: "📊" },  // ← INVALIDE
  { value: "research-detail", label: "Détail de recherche", icon: "🔍" },  // ← INVALIDE
  { value: "identifier-lookup", label: "Recherche d'identifiant", icon: "🔎" },  // ← INVALIDE
  { value: "media-gallery", label: "Galerie média", icon: "🖼️" },  // ← INVALIDE
  { value: "data-retention", label: "Conservation de données", icon: "💾" },  // ← INVALIDE
  { value: "conclusions", label: "Conclusions", icon: "✅" },
  { value: "investigation", label: "Investigation", icon: "🕵️" },  // ← INVALIDE
  { value: "sign-off", label: "Signature", icon: "✍️" },  // ← INVALIDE
];
```

**APRÈS** :
```typescript
// Construire dynamiquement depuis MODULE_TYPE_METADATA
const moduleTypes = (Object.keys(MODULE_TYPE_METADATA) as ReportModuleType[])
  .map((key) => ({
    value: key,
    label: MODULE_TYPE_METADATA[key].label,
    icon: MODULE_TYPE_METADATA[key].icon,
  }))
  .sort((a, b) => MODULE_TYPE_METADATA[a.value].order - MODULE_TYPE_METADATA[b.value].order);
```

### 4. Ligne 113 (environ) - Fonction openModuleDialog

**AVANT** :
```typescript
function openModuleDialog() {
  moduleForm.value = {
    type: "research-detail",  // ← TYPE INVALIDE
    title: "",
    entityId: undefined,
    payload: {},
  };
  showModuleDialog.value = true;
}
```

**APRÈS** :
```typescript
function openModuleDialog() {
  moduleForm.value = {
    type: "summary",  // ← TYPE VALIDE
    title: "",
    entityId: undefined,
    payload: {},
  };
  showModuleDialog.value = true;
}
```

## 🔧 Script de Remplacement Automatique

Si vous préférez utiliser sed/grep :

```bash
cd /workspaces/OSINTReport/frontend/src/pages/reports

# Sauvegarder l'original
cp ReportDetailPage.vue ReportDetailPage.vue.backup

# Remplacements
sed -i 's/"research-summary"/"research_summary"/g' ReportDetailPage.vue
sed -i 's/"research-detail"/"entity_overview"/g' ReportDetailPage.vue
sed -i 's/"identifier-lookup"/"identifier_lookup"/g' ReportDetailPage.vue
sed -i 's/"media-gallery"/"media_gallery"/g' ReportDetailPage.vue
sed -i 's/"data-retention"/"data_retention"/g' ReportDetailPage.vue
sed -i 's/"investigation"/"investigation_leads"/g' ReportDetailPage.vue
sed -i 's/"sign-off"/"sign_off"/g' ReportDetailPage.vue
```

⚠️ **ATTENTION** : Vérifiez le résultat après les remplacements automatiques !

## 📋 Checklist

- [ ] Import de `MODULE_TYPE_METADATA` ajouté
- [ ] Type par défaut changé de `"research-detail"` à `"summary"`
- [ ] Array `moduleTypes` remplacé par construction dynamique
- [ ] Fonction `openModuleDialog()` mise à jour
- [ ] Pas d'erreurs TypeScript dans le fichier
- [ ] Test : Ouverture du dialogue de création de module
- [ ] Test : Dropdown affiche tous les types correctement

## ✅ Validation

Après modifications, vérifier :

```bash
# Backend
cd /workspaces/OSINTReport/backend
npm run build  # Pas d'erreurs TypeScript

# Frontend
cd /workspaces/OSINTReport/frontend
npm run build  # Pas d'erreurs TypeScript
```

Tester dans l'UI :
1. Ouvrir un rapport
2. Cliquer "Ajouter un module"
3. Vérifier que le dropdown affiche :
   - ✅ Résumé des faits
   - ✅ Entités concernées
   - ✅ Objectifs OSINT
   - ✅ Résumé des recherches
   - ✅ Vue d'ensemble d'une entité
   - ✅ Recherche d'identifiant
   - ✅ Analyse de plateforme
   - ✅ Galerie média
   - ✅ Données sauvegardées
   - ✅ Conclusions
   - ✅ Pistes d'enquête
   - ✅ Signature

4. Sélectionner "Résumé des faits", entrer un titre, créer
5. Vérifier : pas d'erreur 500, module créé avec succès

## 🚨 En Cas de Problème

Si erreur 500 persiste après correction :
1. Vérifier les logs backend : `cd backend && npm run dev`
2. Vérifier la console navigateur
3. Tester avec curl :
   ```bash
   curl -X POST http://localhost:4000/api/reports/{ID}/modules \
     -H "Content-Type: application/json" \
     -H "Cookie: or_at=..." \
     -d '{"type":"summary","title":"Test","payload":{"content":"Test contenu"}}'
   ```

---

**Fichier sauvegardé** : `/workspaces/OSINTReport/docs/CORRECT-REPORT-DETAIL-PAGE.md`
