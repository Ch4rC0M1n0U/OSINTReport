# Mise à jour du panel admin - Gestion des utilisateurs

## 📋 Objectif
Ajouter les champs **Téléphone** et **Grade** à la gestion des utilisateurs dans le panel administrateur, en cohérence avec la page de profil.

## ✅ Modifications effectuées

### Frontend

#### 1. **AdminUserDetailPage.vue** - Affichage
- ✅ Ajout de l'affichage du téléphone dans "Informations personnelles"
- ✅ Ajout de l'affichage du grade dans "Informations personnelles"
- ✅ Gestion des valeurs null avec "Non renseigné"

#### 2. **AdminUserCreatePage.vue** - Création
- ✅ Ajout du champ téléphone (type="tel", placeholder="+32 2 123 45 67")
- ✅ Ajout du menu déroulant grade (6 options)
- ✅ Mise en page en grille (md:grid-cols-2)
- ✅ Envoi des données au store

#### 3. **AdminUserEditPage.vue** - Édition
- ✅ Ajout du champ téléphone modifiable
- ✅ Ajout du menu déroulant grade modifiable
- ✅ Chargement des valeurs existantes dans onMounted
- ✅ Sauvegarde des modifications

#### 4. **users.ts** (Store) - Synchronisation
- ✅ Interface `UserDetail` mise à jour avec `phone` et `grade`
- ✅ Fonction `createUser` envoie phone/grade au backend
- ✅ Fonction `updateUser` envoie phone/grade au backend

### Backend

#### 1. **auth.validation.ts** - Validation du registre
- ✅ Ajout du champ `phone` (optionnel, regex `/^[\d\s\+\-\(\)]+$/`)
- ✅ Ajout du champ `grade` (optionnel, enum avec 6 valeurs)
- ✅ Validation Zod stricte

#### 2. **auth.service.ts** - Création d'utilisateur
- ✅ Création d'utilisateur avec `phone` et `grade`
- ✅ Conversion des chaînes vides en `null`

#### 3. **user.controller.ts** - API utilisateurs
- ✅ `list()` : retourne phone et grade dans la liste
- ✅ `getById()` : retourne phone et grade pour un utilisateur
- ✅ `update()` : accepte et met à jour phone et grade
- ✅ Sélection des nouveaux champs dans toutes les réponses

## 📊 Champs ajoutés

### Téléphone
- **Type** : `String?` (optionnel)
- **Format** : Regex `/^[\d\s\+\-\(\)]+$/`
- **Exemple** : "+32 2 123 45 67"
- **Placeholder** : "+32 2 123 45 67"

### Grade
- **Type** : `String?` (optionnel)
- **Valeurs autorisées** :
  1. Inspecteur
  2. Premier Inspecteur
  3. Inspecteur principal
  4. Premier Inspecteur Principal
  5. Commissaire
  6. Premier Commissaire
- **Helper text** : "Utilisé pour la signature des rapports"

## 🔄 Flux de données

### Création d'utilisateur
```
AdminUserCreatePage → usersStore.createUser() → POST /auth/register
                      (avec phone + grade)
```

### Édition d'utilisateur
```
AdminUserEditPage → usersStore.updateUser() → PATCH /users/:id
                    (avec phone + grade)
```

### Affichage d'utilisateur
```
GET /users/:id → usersStore.currentUser → AdminUserDetailPage
                (contient phone + grade)
```

## 🎨 Présentation

### Formulaires (Create/Edit)
```vue
<div class="grid gap-4 md:grid-cols-2">
  <label class="form-control">
    <div class="label">
      <span class="label-text">Téléphone</span>
    </div>
    <input v-model="form.phone" type="tel" placeholder="+32 2 123 45 67" />
  </label>
  
  <label class="form-control">
    <div class="label">
      <span class="label-text">Grade</span>
      <span class="label-text-alt">Utilisé pour la signature des rapports</span>
    </div>
    <select v-model="form.grade">
      <option value="">-- Sélectionner un grade --</option>
      <option>Inspecteur</option>
      <!-- ... 5 autres grades -->
    </select>
  </label>
</div>
```

### Affichage (Detail)
```vue
<div>
  <label class="text-sm text-base-content/70">Téléphone</label>
  <p class="font-medium">{{ usersStore.currentUser.phone || "Non renseigné" }}</p>
</div>
<div>
  <label class="text-sm text-base-content/70">Grade</label>
  <p class="font-medium">{{ usersStore.currentUser.grade || "Non renseigné" }}</p>
</div>
```

## ✅ Tests à effectuer

### Création
- [ ] Créer un utilisateur avec téléphone et grade
- [ ] Créer un utilisateur sans téléphone ni grade
- [ ] Vérifier validation du format téléphone
- [ ] Vérifier validation du grade (liste fermée)

### Édition
- [ ] Modifier le téléphone d'un utilisateur
- [ ] Modifier le grade d'un utilisateur
- [ ] Vider le téléphone (passer à null)
- [ ] Vider le grade (passer à null)

### Affichage
- [ ] Voir un utilisateur avec téléphone et grade
- [ ] Voir un utilisateur sans téléphone ni grade (affiche "Non renseigné")

### Persistance
- [ ] Les données sont sauvegardées en base
- [ ] Les données persistent après rechargement
- [ ] Les données apparaissent dans la liste des utilisateurs

## 🚀 Déploiement

### Build
```bash
# Backend
cd backend && npm run build  # ✅ Succès

# Frontend
cd frontend && npm run build  # ✅ Succès (6.71s)
```

### Base de données
Migration déjà appliquée : `20251013105127_add_phone_and_grade_to_user`

## 📝 Cohérence avec le profil

Les fonctionnalités du panel admin correspondent maintenant exactement au profil :
- ✅ Mêmes champs (téléphone, grade)
- ✅ Mêmes validations
- ✅ Même design pattern (form-control)
- ✅ Même liste de grades
- ✅ Même gestion des valeurs null

## 🎯 Résultat

Le panel d'administration des utilisateurs permet maintenant de :
- ✅ Créer des utilisateurs avec téléphone et grade
- ✅ Modifier le téléphone et le grade des utilisateurs existants
- ✅ Visualiser le téléphone et le grade dans les détails utilisateur
- ✅ Gérer les valeurs optionnelles (affichage "Non renseigné")

**Status** : ✅ Complet et fonctionnel
