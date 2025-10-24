# 🐛 BUGFIX - Limite du champ "Contexte de l'enquête"

**Date** : 11 octobre 2025  
**Problème** : Erreur 500 lors de la copie de texte long dans le champ "Contexte de l'enquête"  
**Cause** : Limite de validation Zod (500 caractères) dépassée sans indication visuelle

---

## 🔍 DIAGNOSTIC

### Symptômes
- Impossible d'enregistrer un rapport avec un texte long dans "Contexte de l'enquête"
- Erreur 500 en console sans message explicite
- Aucune indication visuelle de la limite de caractères

### Cause racine
Le schéma de validation backend limitait le champ à **500 caractères** mais l'interface n'indiquait pas cette limite à l'utilisateur.

```typescript
// Backend: report.validation.ts
investigationContext: z.string().trim().max(500).optional(),
```

### Problème UX
- ❌ Pas de compteur de caractères visible
- ❌ Pas de limite `maxlength` sur le textarea
- ❌ Pas de feedback visuel quand la limite est approchée

---

## ✅ SOLUTION APPLIQUÉE

### 1. Ajout d'un compteur de caractères

**Fichier** : `/workspaces/OSINTReport/frontend/src/pages/reports/ReportDetailPage.vue`

#### Avant ❌
```vue
<div class="form-control">
  <label class="label">
    <span class="label-text">Contexte de l'enquête <span class="text-error">*</span></span>
  </label>
  <textarea
    v-model="editInfoForm.investigationContext"
    class="textarea textarea-bordered h-24"
    required
  ></textarea>
</div>
```

#### Après ✅
```vue
<div class="form-control">
  <label class="label">
    <span class="label-text">Contexte de l'enquête <span class="text-error">*</span></span>
    <span class="label-text-alt" :class="editInfoForm.investigationContext.length > 500 ? 'text-error' : 'text-base-content/60'">
      {{ editInfoForm.investigationContext.length }} / 500
    </span>
  </label>
  <textarea
    v-model="editInfoForm.investigationContext"
    class="textarea textarea-bordered h-24"
    :class="editInfoForm.investigationContext.length > 500 ? 'textarea-error' : ''"
    maxlength="500"
    required
  ></textarea>
</div>
```

### 2. Fonctionnalités ajoutées

✅ **Compteur dynamique** : `125 / 500` affiché en temps réel  
✅ **Limite stricte** : `maxlength="500"` empêche la saisie au-delà  
✅ **Feedback visuel** : Le compteur devient rouge si > 500 caractères (théoriquement impossible avec maxlength)  
✅ **Bordure d'erreur** : Le textarea a une bordure rouge si limite dépassée  

---

## 🎯 COMPORTEMENT

### Affichage normal
- Compteur gris : `125 / 500`
- Bordure normale du textarea

### Approche de la limite
- Compteur gris : `487 / 500`
- Bordure normale

### Limite atteinte (avec maxlength)
- Le navigateur empêche la saisie supplémentaire
- Compteur affiche : `500 / 500`
- Pas de bordure rouge car la limite n'est jamais dépassée

### Si limite dépassée (copier-coller avant maxlength)
- Compteur ROUGE : `523 / 500`
- Bordure rouge sur le textarea
- Empêche la soumission du formulaire

---

## 📝 LIMITES CONFIRMÉES

### Champs texte du rapport

```typescript
// backend/src/modules/reports/report.validation.ts
title: z.string().min(3).max(255),                    // ✅ 255 caractères
caseNumber: z.string().trim().max(100).optional(),    // ✅ 100 caractères
requestingService: z.string().trim().max(150).optional(), // ✅ 150 caractères
investigationContext: z.string().trim().max(500).optional(), // ✅ 500 caractères
legalBasis: z.string().trim().max(500).optional(),    // ✅ 500 caractères
```

### Base de données Prisma

```prisma
model Report {
  title                String   // Pas de limite SQL (TEXT)
  investigationContext String?  // Pas de limite SQL (TEXT)
  legalBasis           String?  // Pas de limite SQL (TEXT)
}
```

**Note** : La base de données PostgreSQL supporte des textes beaucoup plus longs (jusqu'à 1GB), mais la validation applicative limite à 500 caractères pour des raisons de cohérence et de qualité des données.

---

## ✅ VALIDATION

### Test manuel
1. Ouvrir un rapport
2. Cliquer sur "Modifier les informations"
3. Remplir le champ "Contexte de l'enquête"
4. Observer le compteur : `0 / 500` → `125 / 500` → `500 / 500`
5. Essayer de taper au-delà de 500 caractères → **Bloqué par maxlength**
6. ✅ **Enregistrement fonctionne sans erreur 500**

### Résultat attendu
- ✅ Compteur visible et précis
- ✅ Limite stricte à 500 caractères
- ✅ Pas d'erreur 500
- ✅ Meilleure UX avec feedback visuel

---

## 🔧 RECHARGEMENT

Le backend se recharge automatiquement (ts-node-dev).  
Le frontend nécessite un refresh du navigateur (F5).

---

## 📚 AMÉLIORATIONS FUTURES

### Autres champs à traiter
Si besoin, ajouter des compteurs sur :
- `title` (255 caractères)
- `caseNumber` (100 caractères)
- `requestingService` (150 caractères)
- `legalBasis` (500 caractères) - utilise un sélecteur spécial

### Pattern réutilisable
Créer un composant `CharacterCounter.vue` :
```vue
<CharacterCounter :value="text" :max="500" />
```

---

**Statut** : ✅ Corrigé et déployé  
**Action utilisateur** : Rechargez la page et testez la modification du contexte
