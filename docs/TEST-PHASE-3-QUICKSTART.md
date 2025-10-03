# 🎯 Guide rapide de test - Phase 3

## 🚀 Environnement prêt

- ✅ **Frontend** : http://localhost:5174/
- ✅ **Backend** : http://localhost:4000/
- ✅ **Compte admin** : admin@police.belgium.eu / admin123

---

## 📝 Tests à effectuer (10 min)

### 1️⃣ Module "Résumé des faits" (2 min)

```
1. Se connecter
2. Ouvrir un rapport existant (ou en créer un)
3. Cliquer "➕ Ajouter un module"
4. Type : "📋 Résumé des faits"
5. Titre : "Résumé de l'affaire"
6. Créer → Cliquer "✏️ Modifier"
7. Entrer :
   **Contexte**
   
   Le 15 septembre 2025, plainte déposée.
   
   **Éléments** :
   - Téléphone : +32475123456
   - Email : suspect@example.com
   
8. Cliquer "💾 Enregistrer"
9. Vérifier le rendu Markdown (gras, listes)
```

**Attendu** : 
- Texte en gras pour "Contexte" et "Éléments"
- Liste à puces avec téléphone et email
- Bouton "✏️ Modifier" visible

---

### 2️⃣ Module "Objectifs" (2 min)

```
1. Cliquer "➕ Ajouter un module"
2. Type : "🎯 Objectifs OSINT"
3. Titre : "Objectifs de l'enquête"
4. Créer → Cliquer "✏️ Modifier"
5. Cliquer "➕ Ajouter un objectif" 3 fois
6. Remplir :
   - Identifier les profils sociaux
   - Analyser les connexions téléphoniques
   - Récupérer la géolocalisation
7. Cliquer "💾 Enregistrer"
```

**Attendu** :
- Liste à puces avec 3 objectifs
- Possibilité de modifier/supprimer

---

### 3️⃣ Module "Conclusions" (2 min)

```
1. Cliquer "➕ Ajouter un module"
2. Type : "✓ Conclusions et recommandations"
3. Titre : "Conclusions"
4. Créer → Cliquer "✏️ Modifier"
5. Cliquer "➕ Ajouter une conclusion" 2 fois
6. Remplir :
   - Les recherches ont permis d'identifier le suspect.
   - Il est recommandé de poursuivre l'analyse.
7. Cliquer "💾 Enregistrer"
```

**Attendu** :
- Liste à puces avec 2 conclusions
- Textareas (pas inputs simples) en édition

---

### 4️⃣ Tests transversaux (4 min)

**Test suppression** :
```
1. Sur un module, cliquer 🗑️
2. Confirmer
```
→ Module supprimé

**Test persistence** :
```
1. Recharger la page (F5)
```
→ Modules toujours présents

**Test annulation** :
```
1. Modifier un module
2. Cliquer "Annuler"
```
→ Modifications non sauvegardées

**Test édition** :
```
1. Modifier le contenu d'un module
2. Sauvegarder
3. Vérifier le changement
```
→ Modifications sauvegardées

---

## ✅ Checklist rapide

- [ ] Module Summary créé et édité
- [ ] Markdown rendu (gras, listes)
- [ ] Module Objectives avec 3 objectifs
- [ ] Module Conclusions avec 2 statements
- [ ] Suppression fonctionne
- [ ] Bouton "Annuler" fonctionne
- [ ] Rechargement page → données intactes
- [ ] Alert "✅ Module mis à jour" apparaît

---

## 🐛 Si problème

**Console navigateur** : F12 → Console → Chercher erreurs rouges  
**Network** : F12 → Network → Chercher 500/400 errors  

**Erreurs courantes** :
- 500 → Vérifier backend console
- Payload invalid → Vérifier Zod validation
- Module ne s'affiche pas → Vérifier type dans componentMap

---

## 📊 Résultat

Si tous les tests passent → ✅ **Phase 3 validée**  
Prochaine étape → **Phase 4** (composants avancés)

---

## 📄 Documentation complète

Voir `docs/TEST-PHASE-3.md` pour la version détaillée avec 25 tests.
