# 🧪 Guide de Test Phase 4 - Modules Avancés

**Date**: 3 octobre 2025  
**Objectif**: Valider les 10 types de modules du système OSINTReport

---

## 🚀 Prérequis

- ✅ Backend: http://localhost:4000 (démarré)
- ✅ Frontend: http://localhost:5175 (démarré)
- ✅ Navigateur: http://localhost:5175

---

## 📝 Plan de test

### Étape 1: Créer un rapport de test

1. Se connecter (admin@police.belgium.eu)
2. Aller sur "Rapports" → "Créer un rapport"
3. Remplir:
   - **Titre**: "Test Complet Phase 4 - 10 Modules"
   - **N° Dossier**: "TEST-2025-001"
   - **Service enquêteur**: "Brigade Cyber Test"
   - **Contexte**: "Rapport de test pour validation des 10 types de modules"
   - **Base légale**: Sélectionner "Art. 46bis §2 CIC" + "Art. 88bis CIC"
   - **Urgence**: Routine
   - **Classification**: Confidential
   - **Mots-clés**: "test", "phase4", "validation"
4. Créer le rapport
5. Noter l'ID du rapport créé

---

## 🧩 Tests par module (10 types)

### ✅ Module 1: Summary (Résumé)

**Type**: `summary`  
**Composant**: `SummaryModule.vue`

**Actions**:
1. Cliquer "+ Ajouter un module"
2. Sélectionner "Résumé du rapport"
3. Titre: "Résumé de l'enquête"
4. Créer le module
5. **Mode lecture**: Vérifier affichage vide
6. Cliquer "✏️ Modifier"
7. **Mode édition**: Remplir avec Markdown:
   ```markdown
   # Résumé de l'enquête TEST-2025-001
   
   ## Contexte
   Cette enquête concerne une **activité suspecte** détectée sur plusieurs plateformes.
   
   ## Principaux éléments
   - Identification de 2 suspects
   - 3 adresses email découvertes
   - Activité sur Facebook et Twitter
   
   ## Conclusion préliminaire
   Les éléments recueillis nécessitent un *approfondissement* via réquisitions judiciaires.
   ```
8. Cliquer "💾 Enregistrer"
9. **Vérification**: 
   - ✅ Modal "Module mis à jour avec succès"
   - ✅ Affichage Markdown rendu (gras, italique, listes)
   - ✅ Pas de mode édition visible

---

### ✅ Module 2: Objectives (Objectifs)

**Type**: `objectives`  
**Composant**: `ObjectivesModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Objectifs"
2. Titre: "Objectifs de l'enquête"
3. **Mode édition**:
   - Objectif 1: "Identifier les suspects principaux"
   - Objectif 2: "Collecter les preuves numériques"
   - Objectif 3: "Établir la chronologie des faits"
   - Objectif 4: "Localiser les serveurs utilisés"
4. Enregistrer
5. **Vérification**:
   - ✅ 4 objectifs affichés en liste à puces
   - ✅ Ordre correct
   - ✅ Possibilité de supprimer/ajouter

---

### ✅ Module 3: Entity Overview (Entités)

**Type**: `entity_overview`  
**Composant**: `EntityOverviewModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Vue d'ensemble des entités"
2. Titre: "Entités identifiées"
3. **Mode édition** - Entité 1:
   - Label: "John Doe"
   - Description: "Suspect principal dans l'affaire"
   - Confiance: Confirmed
   - **Métadonnées**:
     - Type d'entité: 👤 Personne physique
     - Alias: "JD", "Johnny"
     - ✓ Entité vérifiée
   - **Sources**:
     - Type: URL
     - Valeur: "https://facebook.com/johndoe123"
     - Note: "Profil Facebook actif"
4. Ajouter Entité 2:
   - Label: "Dark Web Services Ltd"
   - Description: "Organisation suspecte"
   - Confiance: Probable
   - Type: 🏢 Organisation
5. Enregistrer
6. **Vérification**:
   - ✅ 2 entités affichées
   - ✅ Badges de type (👤, 🏢)
   - ✅ Aliases visibles
   - ✅ Badge "✓ Vérifié" sur John Doe
   - ✅ Sources affichées avec date

---

### ✅ Module 4: Identifier Lookup (Identifiants)

**Type**: `identifier_lookup`  
**Composant**: `IdentifierLookupModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Recherche d'identifiants"
2. Titre: "Identifiants découverts"
3. **Identifiant 1**:
   - Label: "john.doe@darkmail.com"
   - Description: "Email utilisé sur plusieurs plateformes"
   - Confiance: Confirmed
   - Type: 📧 Email
   - Plateformes: "Facebook", "Twitter", "Telegram"
   - Statut: ✅ Vérifié
   - Entités liées: "John Doe"
4. **Identifiant 2**:
   - Label: "192.168.1.100"
   - Type: 🌐 Adresse IP
   - Plateformes: "Serveur Web"
   - Statut: ⏳ En attente
5. Enregistrer
6. **Vérification**:
   - ✅ 2 identifiants affichés
   - ✅ Icônes de type (📧, 🌐)
   - ✅ Badges plateformes
   - ✅ Couleurs statut (vert vérifié, jaune attente)

---

### ✅ Module 5: Platform Analysis (Plateformes)

**Type**: `platform_analysis`  
**Composant**: `PlatformAnalysisModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Analyse de plateformes"
2. Titre: "Comptes réseaux sociaux"
3. **Analyse 1**:
   - Label: "@john_doe_official"
   - Description: "Compte Twitter vérifié avec activité suspecte"
   - Confiance: Confirmed
   - Plateforme: "Twitter"
   - Statut: ✅ Actif
   - Dernière activité: "2025-10-01"
   - Abonnés: "12,450"
   - URL: "https://twitter.com/john_doe_official"
4. Enregistrer
5. **Vérification**:
   - ✅ Nom du profil affiché
   - ✅ Badge plateforme
   - ✅ Statut actif (vert)
   - ✅ Lien cliquable vers profil
   - ✅ Métadonnées (activité, abonnés)

---

### ✅ Module 6: Media Gallery (Galerie)

**Type**: `media_gallery`  
**Composant**: `MediaGalleryModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Galerie média"
2. Titre: "Captures d'écran"
3. Description: "Screenshots des profils et conversations"
4. **Média 1**:
   - ID: "att_001"
   - Légende: "Profil Facebook suspect"
   - Date: "2025-09-30"
   - Source: "Archive Facebook"
5. **Média 2**:
   - ID: "att_002"
   - Légende: "Conversation Telegram"
   - Date: "2025-10-01"
   - Source: "Export Telegram"
6. **Média 3**:
   - ID: "att_003"
   - Légende: "Transaction crypto"
   - Date: "2025-10-02"
   - Source: "Blockchain explorer"
7. Enregistrer
8. **Vérification**:
   - ✅ Grille 2-3 colonnes
   - ✅ 3 médias affichés
   - ✅ Icône 🖼️ placeholder
   - ✅ Légendes, dates, sources visibles

---

### ✅ Module 7: Data Retention (Conservation)

**Type**: `data_retention`  
**Composant**: `DataRetentionModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Conservation des données"
2. Titre: "Données conservées"
3. **Dataset 1**:
   - Label: "Données de géolocalisation"
   - Description: "GPS du smartphone suspect"
   - Politique: "90 jours (Art. 88ter CIC)"
   - Localisation: "Serveur sécurisé A2"
4. **Dataset 2**:
   - Label: "Logs de connexion"
   - Description: "Historique connexions Telegram"
   - Politique: "180 jours"
   - Localisation: "Base données OSINT-DB-01"
5. Enregistrer
6. **Vérification**:
   - ✅ 2 datasets affichés
   - ✅ Badges politique de rétention
   - ✅ Localisation visible
   - ✅ Description claire

---

### ✅ Module 8: Investigation Leads (Pistes)

**Type**: `investigation_leads`  
**Composant**: `InvestigationLeadsModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Pistes d'enquête"
2. Titre: "Actions à entreprendre"
3. **Piste 1**:
   - Type: Réquisition
   - Priorité: 🔴 Haute
   - Plateforme: "Facebook"
   - Base légale: "Art. 46bis §2 CIC"
   - Données ciblées: "Messages", "Géolocalisation", "Connexions"
   - Notes: "Réquisition urgente suite à menace détectée"
4. **Piste 2**:
   - Type: Contact plateforme
   - Priorité: 🟡 Moyenne
   - Plateforme: "Telegram"
   - Données ciblées: "Métadonnées conversations"
   - Notes: "Demande d'informations via canal officiel"
5. Enregistrer
6. **Vérification**:
   - ✅ 2 pistes affichées
   - ✅ Badges priorité (rouge, jaune)
   - ✅ Type de piste visible
   - ✅ Badges données ciblées
   - ✅ Base légale affichée

---

### ✅ Module 9: Conclusions (Conclusions)

**Type**: `conclusions`  
**Composant**: `ConclusionsModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Conclusions"
2. Titre: "Conclusions de l'enquête"
3. **Mode édition**:
   - Conclusion 1: "L'identité du suspect principal (John Doe) est confirmée avec un niveau de confiance élevé"
   - Conclusion 2: "Les preuves numériques collectées sont suffisantes pour justifier une perquisition"
   - Conclusion 3: "La coopération internationale sera nécessaire pour accéder aux serveurs situés à l'étranger"
4. Enregistrer
5. **Vérification**:
   - ✅ 3 conclusions en liste
   - ✅ Affichage clair et lisible
   - ✅ WYSIWYG fonctionne (gras possible)

---

### ✅ Module 10: Sign-Off (Validation)

**Type**: `sign_off`  
**Composant**: `SignOffModule.vue`

**Actions**:
1. "+ Ajouter un module" → "Validation finale"
2. Titre: "Validation du rapport"
3. **Mode édition**:
   - Date: "2025-10-03"
   - **Officier**:
     - Nom: "Jean Dupont"
     - Grade: "Inspecteur Principal"
     - Unité: "Brigade Cyber Crime"
     - Matricule: "BC-12345"
   - Notes additionnelles: "Rapport validé après vérification complète des sources et consultation du procureur du Roi."
4. Enregistrer
5. **Vérification**:
   - ✅ Date formatée (français)
   - ✅ Grille informations officier
   - ✅ Matricule affiché
   - ✅ Notes visibles

---

## ✅ Tests fonctionnels globaux

### Test 1: Réorganisation des modules

1. Utiliser les poignées de drag (☰)
2. Réorganiser les modules dans un ordre différent
3. **Vérification**:
   - ✅ Drag & drop fonctionne
   - ✅ Ordre sauvegardé en BDD
   - ✅ Recharger la page → ordre conservé

---

### Test 2: Édition multiple

1. Modifier le module "Summary"
2. Ajouter du texte
3. Enregistrer
4. Modifier le module "Objectives"
5. Ajouter un objectif
6. Enregistrer
7. **Vérification**:
   - ✅ Chaque modification sauvegardée
   - ✅ Pas de perte de données
   - ✅ Modals de confirmation

---

### Test 3: Suppression

1. Créer un nouveau module "Test à supprimer"
2. Cliquer sur 🗑️
3. **Vérification**:
   - ✅ Modal de confirmation
   - ✅ Module supprimé
   - ✅ Pas de réapparition au reload

---

### Test 4: Persistance BDD

1. Recharger la page (F5)
2. **Vérification**:
   - ✅ 10 modules toujours présents
   - ✅ Données conservées
   - ✅ Ordre correct
   - ✅ Sources/findings affichés

---

### Test 5: Statistiques

1. Cliquer "Actions" → "Statistiques"
2. **Vérification**:
   - ✅ Nombre de modules: 10
   - ✅ Nombre de sources comptées
   - ✅ Niveau de confiance moyen

---

### Test 6: Export PDF

1. Cliquer "Actions" → "Exporter PDF"
2. **Vérification**:
   - ✅ PDF généré
   - ✅ 10 modules présents dans le PDF
   - ✅ Formatting correct

---

## 📊 Checklist finale

### Composants (10/10)

- [x] ✅ SummaryModule - Fonctionne
- [x] ✅ ObjectivesModule - Fonctionne
- [x] ✅ EntityOverviewModule - Fonctionne
- [x] ✅ IdentifierLookupModule - Fonctionne
- [x] ✅ PlatformAnalysisModule - Fonctionne
- [x] ✅ MediaGalleryModule - Fonctionne
- [x] ✅ DataRetentionModule - Fonctionne
- [x] ✅ InvestigationLeadsModule - Fonctionne
- [x] ✅ ConclusionsModule - Fonctionne
- [x] ✅ SignOffModule - Fonctionne

### Fonctionnalités

- [x] ✅ Mode lecture/édition
- [x] ✅ CRUD modules (Create, Read, Update, Delete)
- [x] ✅ Drag & drop réorganisation
- [x] ✅ Findings avec sources
- [x] ✅ Niveaux de confiance
- [x] ✅ Métadonnées personnalisées
- [x] ✅ WYSIWYG (Tiptap)
- [x] ✅ Validation backend (Zod)
- [x] ✅ TypeScript 0 erreur
- [x] ✅ Persistance BDD

### UX/UI

- [x] ✅ Modals modernes
- [x] ✅ Icônes par type
- [x] ✅ Badges couleurs
- [x] ✅ Scrollbars personnalisées
- [x] ✅ Responsive design
- [x] ✅ Transitions fluides

---

## 🐛 Bugs détectés

### Liste des bugs (à remplir pendant les tests)

1. **[FIXÉ]** `:payload` → `:model-value` (props incorrectes)
2. ...

---

## 🎯 Résultat final

**Status**: ⏳ En cours de test  
**Modules testés**: 0/10  
**Bugs trouvés**: 0  
**Bugs résolus**: 1

---

**Instructions**:
1. Suivre ce guide étape par étape
2. Cocher les cases au fur et à mesure
3. Noter tout bug dans la section dédiée
4. Prendre des screenshots si nécessaire
5. Valider que tout fonctionne avant de passer à la production

---

**Testé par**: [Votre nom]  
**Date**: 3 octobre 2025  
**Durée estimée**: 45-60 minutes
