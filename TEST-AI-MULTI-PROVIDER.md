# Guide de Test - Intégration IA Multi-Provider

## 🧪 Tests à effectuer

### 1. Test de l'interface d'administration

#### Accès à la page
1. Démarrer l'application : `docker-compose up -d`
2. Se connecter en tant qu'administrateur
3. Naviguer vers `/admin/ai-settings`

#### Test de sélection de provider

**Test Gemini** :
```
1. Sélectionner "Google Gemini" dans le dropdown
2. Vérifier que les modèles affichés sont :
   - Gemini 1.5 Flash (sélectionné par défaut)
   - Gemini 1.5 Flash 8B
   - Gemini 1.5 Pro
   - Gemini 2.0 Flash (Experimental)
   - Gemini Pro
```

**Test OpenAI** :
```
1. Sélectionner "OpenAI" dans le dropdown
2. Vérifier que les modèles affichés sont :
   - GPT-4o (sélectionné par défaut)
   - GPT-4o Mini
   - GPT-4 Turbo
   - GPT-4
   - GPT-3.5 Turbo
```

**Test Claude** :
```
1. Sélectionner "Anthropic Claude" dans le dropdown
2. Vérifier que les modèles affichés sont :
   - Claude 3.5 Sonnet (Oct 2024) (sélectionné par défaut)
   - Claude 3.5 Sonnet (Jun 2024)
   - Claude 3 Opus
   - Claude 3 Sonnet
   - Claude 3 Haiku
```

#### Test de changement de provider

```
1. Sélectionner "Google Gemini"
2. Choisir manuellement "Gemini 1.5 Pro"
3. Changer pour "Anthropic Claude"
4. ✅ Vérifier que le modèle redevient "Claude 3.5 Sonnet (Oct 2024)"
```

### 2. Test de configuration des clés API

#### Test avec clé Gemini

**Clé valide** :
```
Format : AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (39 caractères)
1. Saisir une clé Gemini valide
2. Cliquer sur "Sauvegarder"
3. ✅ Vérifier que le message de succès s'affiche
4. ✅ Vérifier que hasGeminiKey est true dans la réponse
```

**Clé invalide** :
```
1. Saisir "invalid-key"
2. Cliquer sur "Sauvegarder"
3. ✅ Vérifier que l'erreur "Format de clé invalide" s'affiche
```

#### Test avec clé Claude

**Clé valide** :
```
Format : sk-ant-XXXXX... (95+ caractères)
1. Sélectionner "Anthropic Claude"
2. Saisir une clé Claude valide
3. Cliquer sur "Sauvegarder"
4. ✅ Vérifier que le message de succès s'affiche
5. ✅ Vérifier que hasClaudeKey est true dans la réponse
```

**Clé invalide** :
```
1. Saisir "sk-invalid"
2. Cliquer sur "Sauvegarder"
3. ✅ Vérifier que l'erreur "Format de clé invalide" s'affiche
```

#### Test avec clé OpenAI

**Clé valide** :
```
Format : sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (48+ caractères)
1. Sélectionner "OpenAI"
2. Saisir une clé OpenAI valide
3. Cliquer sur "Sauvegarder"
4. ✅ Vérifier que le message de succès s'affiche
5. ✅ Vérifier que hasOpenAIKey est true dans la réponse
```

### 3. Test de connexion API

#### Test connexion Gemini

```bash
# Avec curl
curl -X POST http://localhost:5001/api/ai/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Réponse attendue
{
  "success": true,
  "message": "Connexion à Gemini réussie",
  "model": "gemini-1.5-flash"
}
```

**Depuis l'interface** :
```
1. Configurer Gemini avec une vraie clé API
2. Cliquer sur "Tester la connexion"
3. ✅ Vérifier le message de succès
4. ✅ Vérifier que le nom du modèle est affiché
```

#### Test connexion Claude

```bash
# Avec curl
curl -X POST http://localhost:5001/api/ai/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Réponse attendue
{
  "success": true,
  "message": "Connexion à Claude réussie",
  "model": "claude-3-5-sonnet-20241022"
}
```

**Depuis l'interface** :
```
1. Configurer Claude avec une vraie clé API
2. Cliquer sur "Tester la connexion"
3. ✅ Vérifier le message de succès
4. ✅ Vérifier que le nom du modèle est affiché
```

### 4. Test de génération de texte

#### Test génération de résumé avec Gemini

```bash
curl -X POST http://localhost:5001/api/ai/generate/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reportTitle": "Enquête test",
    "reportType": "PRELIMINARY",
    "classification": "CONFIDENTIAL",
    "legalBasis": "Article 40 CPP",
    "additionalContext": "Test de génération avec Gemini"
  }'
```

**Vérifications** :
```
✅ Code HTTP 200
✅ success: true
✅ data.content contient du texte en français
✅ data.model = "gemini-1.5-flash" (ou le modèle configuré)
✅ data.generatedAt est une date valide
```

#### Test génération de résumé avec Claude

```bash
# 1. Changer le provider pour Claude
curl -X PUT http://localhost:5001/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "aiEnabled": true,
    "aiProvider": "claude",
    "aiModel": "claude-3-5-sonnet-20241022",
    "claudeApiKey": "sk-ant-YOUR_REAL_KEY_HERE"
  }'

# 2. Générer un résumé
curl -X POST http://localhost:5001/api/ai/generate/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reportTitle": "Enquête test Claude",
    "reportType": "PRELIMINARY",
    "classification": "CONFIDENTIAL",
    "legalBasis": "Article 40 CPP",
    "additionalContext": "Test de génération avec Claude"
  }'
```

**Vérifications** :
```
✅ Code HTTP 200
✅ success: true
✅ data.content contient du texte en français
✅ data.model = "claude-3-5-sonnet-20241022"
✅ data.generatedAt est une date valide
✅ Texte différent de Gemini (style propre à Claude)
```

#### Test génération de texte de module

```bash
curl -X POST http://localhost:5001/api/ai/generate/module \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reportTitle": "Enquête fraude",
    "moduleType": "PERSON",
    "moduleName": "Suspect principal",
    "entityData": {
      "name": "Jean Dupont",
      "age": 45,
      "occupation": "Comptable"
    },
    "additionalContext": "Transactions suspectes identifiées"
  }'
```

**Vérifications** :
```
✅ Code HTTP 200
✅ Texte adapté au type de module (PERSON)
✅ Mentionne les données de l'entité
```

#### Test génération d'analyse d'entité

```bash
curl -X POST http://localhost:5001/api/ai/generate/entity-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entityData": {
      "name": "ACME Corporation",
      "type": "Société",
      "location": "Paris",
      "employees": 250
    },
    "existingContent": "Société active dans le secteur financier",
    "additionalContext": "Liens suspectés avec fraude fiscale"
  }'
```

**Vérifications** :
```
✅ Code HTTP 200
✅ Analyse factuelle des données
✅ Ton professionnel approprié
```

### 5. Test de statut IA

```bash
curl -X GET http://localhost:5001/api/ai/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse attendue (Claude configuré)** :
```json
{
  "success": true,
  "data": {
    "available": true,
    "provider": "claude",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

**Réponse attendue (pas configuré)** :
```json
{
  "success": true,
  "data": {
    "available": false,
    "provider": "gemini",
    "model": null
  }
}
```

### 6. Tests de sécurité

#### Test chiffrement des clés

```bash
# 1. Sauvegarder une clé
curl -X PUT http://localhost:5001/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "aiEnabled": true,
    "aiProvider": "claude",
    "claudeApiKey": "sk-ant-test-key-for-encryption-test"
  }'

# 2. Vérifier en base de données
docker exec -it osintreport-postgres-1 psql -U osint -d osintreport -c \
  "SELECT \"claudeApiKey\" FROM \"SystemSettings\" LIMIT 1;"
```

**Vérifications** :
```
✅ La clé en base commence par des caractères aléatoires (chiffrée)
✅ Ne ressemble PAS à "sk-ant-test-key-for-encryption-test"
✅ Format : <iv_hex>:<encrypted_hex>:<tag_hex>
```

#### Test récupération de clé chiffrée

```bash
curl -X GET http://localhost:5001/api/settings/ai \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Vérifications** :
```
✅ hasClaudeKey: true (clé présente)
✅ claudeApiKey n'est PAS retournée dans la réponse (sécurité)
✅ Seuls les flags hasXxxKey sont retournés
```

### 7. Tests de validation

#### Test validation provider invalide

```bash
curl -X PUT http://localhost:5001/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "aiEnabled": true,
    "aiProvider": "invalid-provider",
    "aiModel": "test"
  }'
```

**Vérifications** :
```
✅ Code HTTP 400
✅ Message d'erreur de validation Zod
✅ Mention des providers valides : gemini, openai, claude
```

#### Test génération sans clé API configurée

```bash
# 1. Désactiver l'IA ou ne pas configurer de clé
curl -X PUT http://localhost:5001/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "aiEnabled": false
  }'

# 2. Tenter de générer un résumé
curl -X POST http://localhost:5001/api/ai/generate/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reportTitle": "Test"
  }'
```

**Vérifications** :
```
✅ Code HTTP 503 (Service Unavailable)
✅ success: false
✅ Message : "Service IA non disponible. Vérifiez la configuration."
```

### 8. Test de basculement entre providers

```bash
# 1. Configurer Gemini
curl -X PUT http://localhost:5001/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "aiEnabled": true,
    "aiProvider": "gemini",
    "aiModel": "gemini-1.5-flash",
    "geminiApiKey": "YOUR_GEMINI_KEY"
  }'

# 2. Générer avec Gemini
curl -X POST http://localhost:5001/api/ai/generate/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"reportTitle": "Test Gemini"}'

# 3. Basculer vers Claude
curl -X PUT http://localhost:5001/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "aiEnabled": true,
    "aiProvider": "claude",
    "aiModel": "claude-3-5-sonnet-20241022",
    "claudeApiKey": "YOUR_CLAUDE_KEY"
  }'

# 4. Générer avec Claude
curl -X POST http://localhost:5001/api/ai/generate/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"reportTitle": "Test Claude"}'
```

**Vérifications** :
```
✅ Les deux générations fonctionnent
✅ data.model change selon le provider
✅ Pas d'erreur lors du basculement
✅ Les clés API restent stockées (pas besoin de les re-saisir)
```

## 🎯 Checklist de validation complète

### Configuration UI
- [ ] Dropdown providers fonctionne
- [ ] Dropdown modèles change selon le provider
- [ ] Auto-sélection du modèle par défaut
- [ ] Toggle visibilité des clés API
- [ ] Sauvegarde des paramètres
- [ ] Messages de succès/erreur

### API Backend
- [ ] Validation des clés par provider
- [ ] Chiffrement AES-256-GCM fonctionnel
- [ ] Endpoints de génération (summary, module, entity)
- [ ] Test de connexion
- [ ] Statut IA
- [ ] Gestion d'erreurs

### Services IA
- [ ] GeminiService opérationnel
- [ ] ClaudeService opérationnel
- [ ] Routage multi-provider
- [ ] Cache des clients
- [ ] Gestion des erreurs API

### Sécurité
- [ ] Clés chiffrées en base
- [ ] Clés non retournées dans les APIs
- [ ] Validation des formats de clés
- [ ] Gestion des permissions (admin only)

### Performance
- [ ] Cache des clients fonctionne
- [ ] Temps de réponse acceptable (<5s)
- [ ] Pas de fuites mémoire

## 📊 Résultats attendus

**Build Backend** :
```
✅ 0 erreurs TypeScript
✅ Compilation réussie
```

**Build Frontend** :
```
✅ 277 modules transformés
✅ 976.62 kB output
✅ Compilation réussie en ~5.5s
```

**Tests API** :
```
✅ Tous les endpoints répondent
✅ Codes HTTP corrects
✅ Validation fonctionnelle
✅ Génération de texte cohérente
```

## 🐛 Debugging

### Logs backend

```bash
# Logs de génération
docker logs -f osintreport-backend-1 | grep -i "génération"

# Logs d'erreurs
docker logs -f osintreport-backend-1 | grep -i "error"

# Logs AI service
docker logs -f osintreport-backend-1 | grep -i "ai\|gemini\|claude"
```

### Vérification base de données

```bash
# Voir la configuration actuelle
docker exec -it osintreport-postgres-1 psql -U osint -d osintreport -c \
  "SELECT \"aiEnabled\", \"aiProvider\", \"aiModel\", 
   \"geminiApiKey\" IS NOT NULL as has_gemini,
   \"openaiApiKey\" IS NOT NULL as has_openai,
   \"claudeApiKey\" IS NOT NULL as has_claude
   FROM \"SystemSettings\" LIMIT 1;"
```

---

**Date** : 9 janvier 2025  
**Auteur** : AI Integration Team  
**Statut** : 🧪 Prêt pour les tests
