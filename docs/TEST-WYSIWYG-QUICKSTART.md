# 🎨 Test WYSIWYG + Correctifs - Guide Rapide

**Frontend** : http://localhost:5174/  
**Backend** : http://localhost:4000/  
**Connexion** : admin@police.belgium.eu / admin123

---

## 🐛 Correctif 1 : Modules Objectives/Conclusions vides

### Test
```
1. Créer un module "🎯 Objectifs OSINT"
2. Titre : "Objectifs futurs"
3. Cliquer "Créer le module" SANS rien ajouter
```

**AVANT** : ❌ Erreur 500 (Zod validation failed)  
**APRÈS** : ✅ Module créé, "Aucun objectif défini" affiché

**Même test pour "Conclusions"** : ✅ Doit fonctionner

---

## 🎨 Nouveauté : Éditeur WYSIWYG

### Où le trouver ?
- **Module "Résumé des faits"** → Mode édition
- **Module "Conclusions"** → Mode édition (chaque conclusion)
- **FindingEditor** → Champ "Description" (dans modules avancés)

### Test 1 : Résumé des faits avec WYSIWYG

```
1. Créer un module "📋 Résumé des faits"
2. Titre : "Résumé de l'affaire"
3. Créer → Cliquer "✏️ Modifier"
4. Dans l'éditeur :
   - Cliquer "B" (gras) → taper "Contexte de l'affaire" → cliquer à nouveau "B"
   - Appuyer Entrée 2 fois
   - Cliquer "⦿" (liste à puces)
   - Taper "Téléphone : +32475123456" → Entrée
   - Taper "Email : suspect@example.com" → Entrée
   - Taper "Profil Facebook actif"
   - Cliquer en dehors de la liste
   - Appuyer Entrée 2 fois
   - Cliquer "I" (italique) → taper "Note : recherches en cours"
5. Cliquer "💾 Enregistrer"
```

**Attendu** :
- ✅ "Contexte de l'affaire" en **gras**
- ✅ Liste à puces avec 3 items
- ✅ "Note : recherches en cours" en *italique*
- ✅ Pas de code HTML visible

### Test 2 : Conclusions avec WYSIWYG

```
1. Créer un module "✓ Conclusions et recommandations"
2. Titre : "Conclusions de l'enquête"
3. Créer → Modifier → "Ajouter une conclusion"
4. Dans l'éditeur :
   - Cliquer "H2" → taper "Identification formelle"
   - Appuyer Entrée 2 fois
   - Taper "Les recherches ont permis d'identifier "
   - Cliquer "B" → taper "formellement" → cliquer "B"
   - Taper " le suspect."
5. Ajouter une 2ème conclusion :
   - Cliquer "H2" → taper "Recommandations"
   - Appuyer Entrée 2 fois
   - Cliquer "1." (liste numérotée)
   - Taper "Géolocalisation sur 30 jours" → Entrée
   - Taper "Analyse des connexions CDR"
6. Cliquer "💾 Enregistrer"
```

**Attendu** :
- ✅ 2 conclusions affichées
- ✅ Titres en taille H2
- ✅ Mot "formellement" en gras
- ✅ Liste numérotée avec 2 items

---

## 🛠️ Toolbar WYSIWYG - Boutons disponibles

| Bouton | Fonction | Raccourci |
|--------|----------|-----------|
| **B** | Gras | Ctrl+B |
| *I* | Italique | Ctrl+I |
| ~~S~~ | Barré | - |
| H1 | Titre 1 | - |
| H2 | Titre 2 | - |
| H3 | Titre 3 | - |
| ⦿ | Liste à puces | - |
| 1. | Liste numérotée | - |
| " | Citation | - |
| ― | Ligne horizontale | - |
| ↶ | Annuler | Ctrl+Z |
| ↷ | Refaire | Ctrl+Shift+Z |

---

## 🔒 Sécurité : Stockage Markdown

### Test vérification
```
1. Créer un module avec texte formaté (gras, listes)
2. Ouvrir DevTools (F12) → Onglet Network
3. Filtrer par "modules"
4. Cliquer "💾 Enregistrer"
5. Cliquer sur la requête PUT/POST
6. Onglet "Payload" → Regarder le JSON
```

**Attendu dans le payload** :
```json
{
  "payload": {
    "content": "**Contexte de l'affaire**\n\n- Téléphone : +32475123456\n- Email : suspect@example.com\n\n*Note : recherches en cours*"
  }
}
```

✅ **Markdown** (`**gras**`, `*italique*`, `- item`)  
❌ **PAS de HTML** (`<strong>`, `<em>`, `<li>`)

---

## ✅ Checklist de validation

- [ ] Module Objectives vide créé sans erreur
- [ ] Module Conclusions vide créé sans erreur
- [ ] Toolbar WYSIWYG affichée
- [ ] Bouton "B" (gras) fonctionne
- [ ] Bouton "⦿" (liste à puces) fonctionne
- [ ] Bouton "H2" (titre) fonctionne
- [ ] Annuler (Ctrl+Z) fonctionne
- [ ] Sauvegarde → Markdown dans payload
- [ ] Affichage lecture → Rendu HTML correct
- [ ] Pas de code HTML visible

---

## 🎯 Résultat attendu

Si tous les tests passent :
- ✅ Bug Objectives/Conclusions **CORRIGÉ**
- ✅ Éditeur WYSIWYG **FONCTIONNEL**
- ✅ Stockage Markdown **SÉCURISÉ**

Vous pouvez alors tester de créer des rapports complets avec modules formatés !

---

**Prêt à tester ?** → http://localhost:5174/ 🚀
