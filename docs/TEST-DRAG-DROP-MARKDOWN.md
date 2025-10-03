# 🧪 Test Rapide - Drag & Drop + Markdown

## ⚡ Test en 3 minutes

### Préparation
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Ouvrir http://localhost:5173 et se connecter.

---

## Test 1: Rendu Markdown (30 secondes)

1. Ouvrir un rapport existant
2. Créer un module "Objectifs OSINT"
3. Ajouter cet objectif :
   ```
   **Urgent** : Identifier les _comptes sociaux_ du suspect :
   - Facebook
   - Instagram
   ```
4. Sauvegarder
5. ✅ **Vérifier** : Le texte doit afficher :
   - "**Urgent**" en **gras**
   - "_comptes sociaux_" en _italique_
   - Liste avec puces

---

## Test 2: Drag & Drop (1 minute)

1. Dans le même rapport, créer 3 modules :
   - "Résumé des faits" (type: summary)
   - "Objectifs OSINT" (type: objectives)
   - "Conclusions" (type: conclusions)

2. Observer l'icône **☰** (hamburger) à gauche de chaque module

3. Glisser "Conclusions" en première position :
   - Cliquer sur ☰ de "Conclusions"
   - Maintenir et glisser vers le haut
   - Relâcher au-dessus de "Résumé"

4. ✅ **Vérifier** : L'ordre a changé

5. Recharger la page (F5)

6. ✅ **Vérifier** : L'ordre persiste (sauvegardé)

---

## Test 3: Poignée de Drag (15 secondes)

1. Essayer de drag en cliquant sur le **titre** du module
   - ✅ **Attendu** : Ne fonctionne PAS (titre non draggable)

2. Essayer de drag en cliquant sur **☰**
   - ✅ **Attendu** : Fonctionne (poignée active)

---

## Test 4: WYSIWYG + Markdown (45 secondes)

1. Créer un module "Résumé des faits"

2. En mode édition, utiliser la barre d'outils WYSIWYG :
   - Taper "Analyse du dossier"
   - Sélectionner le texte
   - Cliquer sur **B** (bold)
   - Ajouter une ligne
   - Taper "Points clés :" puis cliquer sur le bouton **liste** (•)
   - Ajouter 2 items

3. Sauvegarder

4. ✅ **Vérifier en mode lecture** :
   - "Analyse du dossier" en **gras**
   - Liste avec puces affichée correctement

---

## 🐛 Bugs à Signaler

Si vous rencontrez :
- ❌ Markdown affiché en texte brut (ex: `**gras**`)
- ❌ Drag ne fonctionne pas
- ❌ Ordre ne persiste pas après rechargement
- ❌ Erreur console

→ Signaler avec :
1. Capture d'écran
2. Console du navigateur (F12)
3. Étapes de reproduction

---

## ✅ Résultat Attendu

**Markdown** : Formatage correct (gras, italique, listes)  
**Drag & Drop** : Réorganisation fluide avec poignée ☰  
**Persistance** : Ordre sauvegardé en base de données  

**Prêt pour Phase 4** 🚀
