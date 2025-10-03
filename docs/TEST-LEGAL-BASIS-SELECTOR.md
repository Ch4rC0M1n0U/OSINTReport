# Test du Sélecteur de Base Légale

## 🧪 Guide de test

### Test 1 : Création d'un rapport avec base légale

**Étapes** :
1. Aller sur `/reports/new`
2. Remplir l'**Étape 1** (informations de base)
3. Passer à l'**Étape 2** (Contexte et classification)
4. Cliquer sur le champ **Base légale**

**Vérifications** :
- ✅ Le dropdown s'ouvre avec 15 articles
- ✅ Les articles sont groupés par catégorie
- ✅ Recherche "observation" filtre correctement
- ✅ Filtre par catégorie "MPR" fonctionne
- ✅ Sélection d'articles affiche des badges
- ✅ Suppression via le "✕" fonctionne
- ✅ "Tout effacer" retire tous les articles
- ✅ Clic extérieur ferme le dropdown

**Résultat attendu** :
- Format stocké : `"Art. 28bis CIC • Art. 46bis CIC"`
- Badges affichés dans le champ

---

### Test 2 : Modification de la base légale

**Pré-requis** : Avoir un rapport créé avec base légale

**Étapes** :
1. Ouvrir un rapport
2. **Actions** → **Modifier les informations**
3. Vérifier que les badges existants apparaissent
4. Ajouter/retirer des articles
5. Cliquer **Enregistrer**

**Vérifications** :
- ✅ Articles existants pré-sélectionnés
- ✅ Modification sauvegardée (HTTP 200)
- ✅ Modal de succès affichée
- ✅ Infos actualisées sans reload
- ✅ Badges mis à jour dans la section info

---

### Test 3 : Affichage de la base légale

**Étapes** :
1. Ouvrir un rapport avec base légale
2. Vérifier la section **Informations du rapport**

**Vérifications** :
- ✅ Articles affichés sous forme de badges primaires
- ✅ Police monospace pour les codes
- ✅ Si vide : affiche "—"
- ✅ Badges wrap correctement (flex-wrap)

---

### Test 4 : Recherche et filtres

**Étapes** :
1. Ouvrir le sélecteur
2. Taper "28" dans la recherche
3. Vérifier que seul Art. 28bis apparaît
4. Effacer la recherche
5. Cliquer sur filtre "Données"
6. Vérifier les articles filtrés

**Vérifications** :
- ✅ Recherche case-insensitive
- ✅ Recherche dans code + titre + description
- ✅ Filtre par catégorie fonctionne
- ✅ Compteur "Tous (15)" correct
- ✅ Badges de catégorie avec bonnes couleurs

---

### Test 5 : Validation backend

**Pré-requis** : Backend dev en cours d'exécution

**Étapes** :
1. Créer un rapport avec base légale
2. Vérifier la requête réseau (DevTools)
3. Inspecter la BDD PostgreSQL

**Vérifications** :
- ✅ POST `/api/reports` envoie `legalBasis: "Art. 28bis CIC • ..."`
- ✅ Pas d'erreur 400/500
- ✅ Colonne `legalBasis` en BDD contient la chaîne
- ✅ PATCH `/api/reports/{id}` met à jour correctement

**Commande SQL** :
```sql
SELECT id, title, "legalBasis" FROM "Report" ORDER BY "createdAt" DESC LIMIT 5;
```

---

### Test 6 : Edge cases

**Test 6.1 : Aucun article sélectionné**
- Créer rapport sans base légale
- ✅ Champ vide accepté (optionnel)
- ✅ Affiche "—" dans les infos

**Test 6.2 : Sélection massive**
- Sélectionner tous les 15 articles
- ✅ Badges wrap correctement
- ✅ Scrollbar apparaît si nécessaire
- ✅ Sauvegarde réussie

**Test 6.3 : Clic rapide**
- Ouvrir/fermer dropdown rapidement
- ✅ Pas de bug d'affichage
- ✅ État cohérent

---

### Test 7 : Performance

**Étapes** :
1. Ouvrir DevTools → Performance
2. Ouvrir le sélecteur
3. Taper rapidement dans la recherche

**Vérifications** :
- ✅ Pas de lag à la frappe
- ✅ Rendu < 16ms (60 FPS)
- ✅ Aucune fuite mémoire

---

## 📋 Checklist finale

- [ ] **Test 1** : Création avec base légale
- [ ] **Test 2** : Modification de la base légale
- [ ] **Test 3** : Affichage des badges
- [ ] **Test 4** : Recherche et filtres
- [ ] **Test 5** : Validation backend
- [ ] **Test 6** : Edge cases
- [ ] **Test 7** : Performance

---

## 🐛 Bugs connus

Aucun bug connu pour l'instant.

---

## 📸 Screenshots attendus

### 1. Dropdown ouvert
![Dropdown avec tous les articles, recherche vide, filtre "Tous"]

### 2. Recherche active
![Recherche "observation" → 2 résultats]

### 3. Filtre par catégorie
![Filtre "MPR" → 5 articles affichés]

### 4. Articles sélectionnés
![3 badges dans le champ : Art. 28bis CIC, Art. 46bis CIC, Art. 90ter CIC]

### 5. Affichage dans rapport
![Section info avec badges primaires monospace]

---

**Date** : 3 octobre 2025
