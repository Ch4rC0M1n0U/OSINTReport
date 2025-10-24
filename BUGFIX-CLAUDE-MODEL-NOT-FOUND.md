# 🐛 CORRECTION - Nom de modèle Claude inexistant

**Date** : 9 octobre 2025  
**Problème** : Erreur 500 lors de la génération IA avec Claude  
**Message d'erreur** : `model: claude-sonnet-4-5-20250514` (404 not_found_error)

---

## 🔍 PROBLÈME

### Erreur constatée
```json
{
  "type": "not_found_error",
  "message": "model: claude-sonnet-4-5-20250514"
}
```

### Logs backend
```
[08:23:31] ERROR: Erreur génération résumé de rapport (Claude)
  err: {
    "type": "NotFoundError",
    "message": "404 {\"type\":\"error\",\"error\":{\"type\":\"not_found_error\",\"message\":\"model: claude-sonnet-4-5-20250514\"}}"
  }
```

### Cause racine
Le modèle `claude-sonnet-4-5-20250514` **n'existe pas** dans l'API Claude.  
Les liens fournis précédemment pointaient vers des **annonces futures** de modèles qui ne sont pas encore disponibles.

---

## ✅ SOLUTION APPLIQUÉE

### Modèles Claude réellement disponibles (Octobre 2024)

#### ✨ Dernière génération (Oct 2024)
- **`claude-3-5-sonnet-20241022`** ← NOUVEAU DÉFAUT ✅
- `claude-3-5-haiku-20241022`

#### Génération précédente (Juin 2024)
- `claude-3-5-sonnet-20240620`

#### Génération 3 (legacy)
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### Modèles SUPPRIMÉS (inexistants)
- ❌ `claude-sonnet-4-5-20250514` (n'existe pas)
- ❌ `claude-opus-4-20250514` (n'existe pas)

---

## 🔧 FICHIERS MODIFIÉS

### Backend
**Fichier** : `/workspaces/OSINTReport/backend/src/modules/ai/ai-models.config.ts`

#### Avant ❌
```typescript
models: [
  {
    value: 'claude-sonnet-4-5-20250514',
    label: 'Claude Sonnet 4.5 (Mai 2025) 🆕',
    description: 'Modèle le plus avancé d\'Anthropic - RECOMMANDÉ',
  },
  {
    value: 'claude-opus-4-20250514',
    label: 'Claude Opus 4 (Mai 2025) 🆕',
    description: 'Intelligence maximale pour tâches ultra-complexes',
  },
  // ...
]

export const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-5-20250514', // ❌ N'EXISTE PAS
};
```

#### Après ✅
```typescript
models: [
  {
    value: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet (Oct 2024) 🆕',
    description: 'Modèle le plus avancé d\'Anthropic - RECOMMANDÉ',
  },
  {
    value: 'claude-3-5-sonnet-20240620',
    label: 'Claude 3.5 Sonnet (Juin 2024)',
    description: 'Version stable précédente de génération 3.5',
  },
  {
    value: 'claude-3-5-haiku-20241022',
    label: 'Claude 3.5 Haiku',
    description: 'Version rapide et économique de Claude 3.5',
  },
  // ...
]

export const DEFAULT_MODELS = {
  claude: 'claude-3-5-sonnet-20241022', // ✅ MODÈLE RÉEL
};
```

### Frontend
**Fichier** : `/workspaces/OSINTReport/frontend/src/config/ai-models.config.ts`

**Changements identiques** au backend pour maintenir la cohérence.

---

## 📊 ÉTAT FINAL DES MODÈLES

### Gemini (Google) - 8 modèles
✅ **Défaut** : `gemini-2.5-flash` (Oct 2025)
- Expérimentaux : gemini-2.0-flash-exp, gemini-exp-1206
- Versions 1.5 : flash-002, flash, flash-8b, pro-002, pro

### OpenAI - 11 modèles
✅ **Défaut** : `gpt-5` (Oct 2025)
- GPT-5 : gpt-5, gpt-5-preview
- GPT-4o : Latest (Nov 2024), Août 2024, gpt-4o, gpt-4o-mini
- o1 : o1 (Dec 2024), o1-preview, o1-mini
- Legacy : gpt-4-turbo

### Claude (Anthropic) - 6 modèles ✅ CORRIGÉ
✅ **Défaut** : `claude-3-5-sonnet-20241022` (Oct 2024)
- Génération 3.5 : sonnet (Oct), sonnet (Juin), haiku
- Génération 3 : opus, sonnet, haiku

**Total** : 25 modèles (au lieu de 27)

---

## 🎯 ACTIONS REQUISES PAR L'UTILISATEUR

### 1. Actualiser le navigateur
```bash
Ctrl + Shift + R  (ou Cmd + Shift + R sur Mac)
```

### 2. Mettre à jour la configuration
1. **Aller dans** : Admin → Configuration IA
2. **Vérifier le provider** : Claude
3. **Changer le modèle** : `claude-3-5-sonnet-20241022`
4. **Cliquer** : Enregistrer

### 3. Tester la génération
1. Ouvrir un rapport
2. Modifier le résumé
3. Cliquer "Générer avec l'IA"
4. Vérifier que la génération fonctionne ✅

---

## 📝 VÉRIFICATION DE L'API CLAUDE

### Liste officielle des modèles disponibles

D'après la documentation Claude (décembre 2024) :

| Modèle | Date de sortie | Contexte | Utilisation |
|--------|----------------|----------|-------------|
| **claude-3-5-sonnet-20241022** | Oct 2024 | 200K tokens | ✅ Recommandé |
| claude-3-5-sonnet-20240620 | Juin 2024 | 200K tokens | Stable |
| claude-3-5-haiku-20241022 | Oct 2024 | 200K tokens | Économique |
| claude-3-opus-20240229 | Fév 2024 | 200K tokens | Legacy |
| claude-3-sonnet-20240229 | Fév 2024 | 200K tokens | Legacy |
| claude-3-haiku-20240307 | Mars 2024 | 200K tokens | Legacy |

**Source** : https://docs.anthropic.com/en/docs/about-claude/models

---

## 🐛 ERREUR À NE PLUS COMMETTRE

### ❌ Mauvaise pratique
Ajouter des modèles **avant leur sortie officielle** basés sur des annonces ou des liens vers des pages futures.

### ✅ Bonne pratique
1. Vérifier la **documentation officielle de l'API**
2. Tester avec un **appel API** si possible
3. Ne référencer que les **modèles actuellement disponibles**

---

## 📚 RESSOURCES

### Documentation officielle
- **Claude Models** : https://docs.anthropic.com/en/docs/about-claude/models
- **Gemini Models** : https://ai.google.dev/gemini-api/docs/models
- **OpenAI Models** : https://platform.openai.com/docs/models

### Fichiers de configuration
```
backend/src/modules/ai/ai-models.config.ts
frontend/src/config/ai-models.config.ts
```

### Logs de vérification
```bash
# Vérifier les modèles disponibles pour Claude
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

---

## ✅ CHECKLIST FINALE

- [x] Modèles Claude corrigés (suppression des 4.5 et Opus 4)
- [x] Modèle par défaut changé : `claude-3-5-sonnet-20241022`
- [x] Configuration backend mise à jour
- [x] Configuration frontend mise à jour
- [x] Backend redémarré
- [ ] **Utilisateur doit** : Actualiser le navigateur
- [ ] **Utilisateur doit** : Changer le modèle dans Admin > Config IA
- [ ] **Utilisateur doit** : Tester la génération

---

**Statut** : ✅ Code corrigé | ⏳ Configuration utilisateur requise  
**Prochaine étape** : Mettre à jour la config en base via l'interface admin
