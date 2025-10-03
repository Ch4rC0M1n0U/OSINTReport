# Bugfix : Erreur "Cannot read properties of undefined"

**Date** : 3 octobre 2025  
**Gravité** : Critique 🔴  
**Statut** : Résolu ✅

---

## 🐛 Symptôme

```
ConclusionsModule.vue:45 Uncaught (in promise) TypeError: 
Cannot read properties of undefined (reading 'length')
    at Proxy._sfc_render (ConclusionsModule.vue:45:47)
```

**Modules affectés** :
- ❌ ConclusionsModule.vue
- ❌ ObjectivesModule.vue
- ⚠️ SummaryModule.vue (potentiellement)

---

## 🔍 Analyse

### Cause racine
Lorsqu'un module est créé avec un payload vide, le backend renvoie `{}` au lieu de :
```typescript
// Attendu
{ objectives: [] }
{ statements: [] }
{ content: "" }

// Reçu du backend
{}
```

### Code problématique

**ConclusionsModule.vue (ligne 5)** :
```vue
<div v-if="payload.statements && payload.statements.length > 0">
  <!-- ❌ payload.statements est undefined, donc .length crash -->
</div>
```

**ObjectivesModule.vue (ligne 5)** :
```vue
<div v-if="payload.objectives && payload.objectives.length > 0">
  <!-- ❌ payload.objectives est undefined, donc .length crash -->
</div>
```

### Pourquoi le payload est vide ?
Le backend Zod utilise `.default([])` mais cela s'applique **pendant la validation**, pas lors de la récupération depuis la base de données.

Si le module a été créé **avant** le fix de validation, le payload stocké en DB est `{}`.

---

## ✅ Solution

### 1. Utiliser `computed` pour gérer les valeurs undefined

**ConclusionsModule.vue** :
```typescript
// AVANT
const props = defineProps<Props>();

<div v-if="payload.statements && payload.statements.length > 0">
  <li v-for="statement in payload.statements">

// APRÈS
const safeStatements = computed(() => {
  return props.payload?.statements || [];
});

<div v-if="safeStatements.length > 0">
  <li v-for="statement in safeStatements">
```

**ObjectivesModule.vue** :
```typescript
// APRÈS
const safeObjectives = computed(() => {
  return props.payload?.objectives || [];
});

<div v-if="safeObjectives.length > 0">
  <li v-for="objective in safeObjectives">
```

**SummaryModule.vue** :
```typescript
// APRÈS
const safeContent = computed(() => {
  return props.payload?.content || "";
});

<div v-if="safeContent" v-html="renderMarkdown(safeContent)">
```

### 2. Corriger la fonction `startEditing()`

**Avant** :
```typescript
function startEditing() {
  editablePayload.value = JSON.parse(JSON.stringify(props.payload));
  // ❌ Si payload = {}, on copie un objet vide sans la structure attendue
  isEditing.value = true;
}
```

**Après** :
```typescript
function startEditing() {
  editablePayload.value = {
    statements: props.payload?.statements ? [...props.payload.statements] : []
  };
  // ✅ On garantit toujours un tableau, même si undefined
  isEditing.value = true;
}
```

---

## 📊 Changements appliqués

### ConclusionsModule.vue
- ✅ Ligne 5 : `payload.statements` → `safeStatements`
- ✅ Ligne 8 : Utilise `safeStatements` dans v-for
- ✅ Ligne 110 : Ajout `computed` safeStatements
- ✅ Ligne 115 : startEditing() avec fallback `|| []`

### ObjectivesModule.vue
- ✅ Ligne 5 : `payload.objectives` → `safeObjectives`
- ✅ Ligne 7 : Utilise `safeObjectives` dans v-for
- ✅ Ligne 88 : Ajout `computed` safeObjectives
- ✅ Ligne 93 : startEditing() avec fallback `|| []`

### SummaryModule.vue
- ✅ Ligne 6 : `payload.content` → `safeContent`
- ✅ Ligne 89 : Ajout `computed` safeContent
- ✅ Ligne 94 : startEditing() avec fallback `|| ""`

---

## 🧪 Tests de validation

### Test 1 : Module existant avec payload vide
```
1. Ouvrir un rapport avec module Objectives/Conclusions créé avant le fix
2. Payload en DB = {}
```
**Avant** : ❌ Crash "Cannot read properties of undefined"  
**Après** : ✅ Affiche "Aucun objectif défini" / "Aucune conclusion"

### Test 2 : Édition d'un module vide
```
1. Module avec payload = {}
2. Cliquer "Modifier"
3. Ajouter un objectif/conclusion
4. Sauvegarder
```
**Avant** : ❌ editablePayload.value.statements = undefined → crash  
**Après** : ✅ editablePayload.value.statements = [] → ajout OK

### Test 3 : Nouveau module
```
1. Créer un nouveau module Objectives
2. Ne rien ajouter
3. Sauvegarder
```
**Avant** : ✅ Fonctionne (backend renvoie { objectives: [] } grâce au .default([]))  
**Après** : ✅ Fonctionne toujours

---

## 🔒 Prévention

### Backend
Le fix de validation Zod (`.default([])`) empêche les **nouveaux** modules d'avoir un payload vide :
```typescript
// backend/src/modules/reports/report.validation.ts
objectives: z.object({
  objectives: z.array(z.string().min(1)).default([]), // ✅
}),
```

### Frontend
Le code est maintenant **défensif** et gère les 3 cas :
1. `payload = { objectives: [] }` → ✅ Tableau vide
2. `payload = { objectives: undefined }` → ✅ Converti en []
3. `payload = {}` → ✅ Converti en []

---

## 📈 Impact

| Avant | Après |
|-------|-------|
| ❌ Crash sur modules existants vides | ✅ Affichage "Aucun objectif/conclusion" |
| ❌ Impossible d'éditer modules vides | ✅ Édition fonctionne |
| ⚠️ Code fragile (assume payload correct) | ✅ Code défensif (gère undefined) |

---

## 🎯 Résultat

**Erreur "Cannot read properties of undefined"** : ✅ CORRIGÉE

Tous les modules (existants et nouveaux) fonctionnent maintenant correctement, même avec un payload vide ou incomplet.

**Test recommandé** : Créer/éditer modules Objectives et Conclusions pour vérifier le bon fonctionnement.
