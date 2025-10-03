# Guide de test : Modules Phase 3 ✅

**Date** : 3 octobre 2025  
**Objectif** : Tester les 3 composants de modules créés (Summary, Objectives, Conclusions)  
**Frontend URL** : http://localhost:5174/

---

## 🎯 Prérequis

1. ✅ Frontend démarré sur http://localhost:5174/
2. ✅ Backend démarré (vérifier que l'API répond)
3. ✅ Au moins 1 rapport existant en base de données

---

## 📝 Scénarios de test

### Test 1 : Module "Résumé des faits" (Summary)

#### 1.1 Création du module

**Étapes** :
1. Se connecter à l'application
2. Ouvrir un rapport existant
3. Cliquer sur "➕ Ajouter un module"
4. Dans le dropdown "Type de module", sélectionner **"📋 Résumé des faits"**
5. Entrer un titre : `Résumé de l'affaire`
6. Cliquer "Créer le module"

**Résultat attendu** :
- ✅ Module créé sans erreur 500
- ✅ Module apparaît dans la liste avec icône 📋
- ✅ Contenu vide affiché : "Aucun contenu"
- ✅ Bouton "✏️ Modifier" visible

#### 1.2 Édition du contenu Markdown

**Étapes** :
1. Sur le module "Résumé de l'affaire", cliquer "✏️ Modifier"
2. Entrer ce texte dans le textarea :
   ```
   **Contexte de l'affaire**
   
   Le 15 septembre 2025, une plainte a été déposée concernant une fraude en ligne.
   
   **Éléments recueillis** :
   - Numéro de téléphone : +32475123456
   - Adresse email : suspect@example.com
   - Profil Facebook actif
   
   *Note* : Les recherches sont en cours.
   ```
3. Cliquer "💾 Enregistrer"

**Résultat attendu** :
- ✅ Alert "✅ Module mis à jour" apparaît
- ✅ Mode lecture activé
- ✅ Texte affiché avec :
  - **Gras** pour "Contexte de l'affaire" et "Éléments recueillis"
  - Liste à puces pour les 3 éléments
  - *Italique* pour "Note"
- ✅ Bouton "✏️ Modifier" de nouveau visible

#### 1.3 Annulation d'édition

**Étapes** :
1. Cliquer "✏️ Modifier"
2. Modifier le texte (ex: ajouter une ligne)
3. Cliquer "Annuler"

**Résultat attendu** :
- ✅ Retour au mode lecture
- ✅ Texte original inchangé (pas de sauvegarde)

#### 1.4 Persistence des données

**Étapes** :
1. Recharger la page (F5)
2. Attendre le chargement du rapport

**Résultat attendu** :
- ✅ Module "Résumé de l'affaire" toujours présent
- ✅ Contenu Markdown intact

---

### Test 2 : Module "Objectifs" (Objectives)

#### 2.1 Création et édition

**Étapes** :
1. Cliquer "➕ Ajouter un module"
2. Sélectionner **"🎯 Objectifs OSINT"**
3. Titre : `Objectifs de l'enquête`
4. Créer le module
5. Cliquer "✏️ Modifier"
6. Cliquer "➕ Ajouter un objectif" 3 fois
7. Remplir les 3 objectifs :
   - `Identifier les profils sur les réseaux sociaux`
   - `Analyser les connexions téléphoniques (CDR)`
   - `Récupérer les données de géolocalisation`
8. Cliquer "💾 Enregistrer"

**Résultat attendu** :
- ✅ Module créé avec icône 🎯
- ✅ Mode édition : 3 inputs affichés
- ✅ Boutons 🗑️ présents à côté de chaque input
- ✅ Après sauvegarde : liste à puces avec 3 objectifs

#### 2.2 Suppression d'un objectif

**Étapes** :
1. Cliquer "✏️ Modifier"
2. Cliquer 🗑️ sur le 2ème objectif ("Analyser les connexions...")
3. Cliquer "💾 Enregistrer"

**Résultat attendu** :
- ✅ 2ème objectif supprimé en mode édition
- ✅ Après sauvegarde : seulement 2 objectifs affichés
- ✅ Ordre préservé (1er et 3ème objectifs)

#### 2.3 Module vide

**Étapes** :
1. Créer un nouveau module "Objectifs"
2. Titre : `Objectifs futurs`
3. Ne rien ajouter, cliquer "Créer"

**Résultat attendu** :
- ✅ Module créé
- ✅ Texte affiché : "Aucun objectif défini"

---

### Test 3 : Module "Conclusions" (Conclusions)

#### 3.1 Création avec plusieurs statements

**Étapes** :
1. Cliquer "➕ Ajouter un module"
2. Sélectionner **"✓ Conclusions et recommandations"**
3. Titre : `Conclusions de l'enquête`
4. Créer le module
5. Cliquer "✏️ Modifier"
6. Cliquer "➕ Ajouter une conclusion" 2 fois
7. Remplir :
   - Statement 1 :
     ```
     Les recherches ont permis d'identifier formellement le suspect via son profil Facebook actif depuis 2020. Le numéro de téléphone +32475123456 est confirmé comme étant utilisé par le suspect.
     ```
   - Statement 2 :
     ```
     Il est recommandé de poursuivre l'analyse des connexions téléphoniques et de demander une géolocalisation pour les 30 derniers jours.
     ```
8. Cliquer "💾 Enregistrer"

**Résultat attendu** :
- ✅ Module créé avec icône ✓
- ✅ Mode édition : 2 textareas (pas des inputs simples)
- ✅ Après sauvegarde : liste à puces avec 2 statements longs
- ✅ Texte multi-lignes bien affiché

#### 3.2 Ajout après création

**Étapes** :
1. Sur le module "Conclusions de l'enquête", cliquer "✏️ Modifier"
2. Cliquer "➕ Ajouter une conclusion"
3. Entrer : `Des suites judiciaires sont envisageables.`
4. Cliquer "💾 Enregistrer"

**Résultat attendu** :
- ✅ 3 conclusions affichées
- ✅ Nouvelle conclusion en dernière position

---

## 🧪 Tests transversaux

### Test 4 : Suppression de module

**Étapes** :
1. Sur n'importe quel module, cliquer 🗑️ (en haut à droite)
2. Confirmer la suppression

**Résultat attendu** :
- ✅ Popup de confirmation
- ✅ Module supprimé de la liste
- ✅ Pas d'erreur 500

### Test 5 : Plusieurs modules du même type

**Étapes** :
1. Créer 2 modules "Résumé des faits" avec titres différents :
   - `Résumé - Suspect A`
   - `Résumé - Suspect B`
2. Éditer chacun avec un contenu différent

**Résultat attendu** :
- ✅ 2 modules distincts affichés
- ✅ Édition indépendante (modifier A n'affecte pas B)
- ✅ Sauvegarde correcte pour chacun

### Test 6 : Navigation et rechargement

**Étapes** :
1. Créer un module Summary avec contenu
2. Aller sur la page "Rapports" (liste)
3. Revenir sur le rapport

**Résultat attendu** :
- ✅ Module toujours présent
- ✅ Contenu intact

---

## ✅ Checklist de validation

### Fonctionnalités de base
- [ ] Création de module Summary sans erreur
- [ ] Création de module Objectives sans erreur
- [ ] Création de module Conclusions sans erreur
- [ ] Bouton "Modifier" fonctionne (mode édition)
- [ ] Bouton "Annuler" fonctionne (pas de sauvegarde)
- [ ] Bouton "Enregistrer" sauvegarde correctement
- [ ] Bouton 🗑️ supprime le module

### Affichage
- [ ] Icônes corrects (📋, 🎯, ✓)
- [ ] Titres affichés
- [ ] Labels de type corrects (MODULE_TYPE_METADATA)
- [ ] Entité liée affichée (si configurée)

### SummaryModule spécifique
- [ ] Texte vide → "Aucun contenu"
- [ ] Markdown **gras** rendu
- [ ] Markdown *italique* rendu
- [ ] Listes à puces rendues
- [ ] Textarea monospace en mode édition
- [ ] Indication "💡 Supporte le Markdown"

### ObjectivesModule spécifique
- [ ] Liste vide → "Aucun objectif défini"
- [ ] Bouton ➕ ajoute un input
- [ ] Bouton 🗑️ supprime un objectif
- [ ] Placeholder contextuel
- [ ] Liste à puces en mode lecture

### ConclusionsModule spécifique
- [ ] Liste vide → "Aucune conclusion"
- [ ] Bouton ➕ ajoute une textarea (pas input)
- [ ] Bouton 🗑️ supprime une conclusion
- [ ] Placeholder détaillé
- [ ] Texte multi-lignes bien affiché

### Persistence
- [ ] Rechargement page (F5) → données intactes
- [ ] Navigation aller-retour → données intactes
- [ ] Plusieurs modules du même type gérés correctement

---

## 🐛 Bugs à signaler

Si vous rencontrez des problèmes, notez :

1. **Type de module** concerné
2. **Action effectuée** (création, édition, suppression)
3. **Erreur affichée** (console, alert, 500)
4. **Comportement attendu** vs **comportement observé**

### Problèmes connus

Aucun pour l'instant.

---

## 📊 Résultat du test

Une fois tous les tests effectués, remplir :

**Tests réussis** : __ / 25  
**Tests échoués** : __  
**Bugs critiques** : __  
**Bugs mineurs** : __

**Verdict** : ✅ Phase 3 validée | ⚠️ Corrections nécessaires

---

## 🚀 Après validation

Si tous les tests passent :
- ✅ Marquer la tâche "Tester les 3 composants via UI" comme complète
- ✅ Passer à la Phase 4 (composants avancés)

Si des bugs sont trouvés :
- 🔧 Corriger les problèmes identifiés
- 🔄 Re-tester
- ✅ Valider avant de continuer
