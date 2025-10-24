# Intégration IA - Google Gemini pour OSINTReport

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète de l'intégration IA dans OSINTReport, permettant la génération automatique de texte dans les rapports d'enquête grâce à Google Gemini (et potentiellement OpenAI).

## ✅ Fonctionnalités implémentées

### 1. Backend - Gestion des clés API

#### Fichiers créés/modifiés :

**`backend/prisma/schema.prisma`**
- Ajout de champs IA au modèle `SystemSettings`:
  - `geminiApiKey` : Clé API Google Gemini (chiffrée)
  - `openaiApiKey` : Clé API OpenAI (chiffrée)
  - `aiProvider` : Fournisseur actif ('gemini' | 'openai')
  - `aiModel` : Modèle à utiliser
  - `aiEnabled` : Activation/désactivation de l'IA

**Migration :**
```bash
npx prisma migrate dev --name add_ai_api_keys
```

**`backend/src/modules/settings/api-key-encryption.ts`** ⭐ NOUVEAU
- Service de chiffrement AES-256-GCM pour les clés API
- Méthodes principales :
  - `encrypt(apiKey: string)` : Chiffre une clé API
  - `decrypt(encrypted: string)` : Déchiffre une clé API
  - `mask(apiKey: string)` : Masque une clé pour l'affichage
  - `validateGeminiKey(key: string)` : Valide le format Gemini
  - `validateOpenAIKey(key: string)` : Valide le format OpenAI

**Variables d'environnement :**
```env
# Optionnel : généré automatiquement si absent
API_KEY_ENCRYPTION_KEY=<256-bit-hex-key>
```

#### Extensions des services existants :

**`backend/src/modules/settings/settings.service.ts`**
- Ajout de l'interface `AISettings` :
  ```typescript
  interface AISettings {
    geminiApiKey?: string | null;
    openaiApiKey?: string | null;
    aiProvider?: 'gemini' | 'openai';
    aiModel?: string;
    aiEnabled?: boolean;
  }
  ```

- Nouvelles méthodes :
  - `updateAISettings(data: AISettings)` : Met à jour les paramètres IA
  - `getDecryptedApiKey(provider)` : Récupère une clé déchiffrée
  - `isAIEnabled()` : Vérifie si l'IA est activée
  - `getSettingsRaw()` : Récupère les settings bruts (privé)

**`backend/src/modules/settings/settings.controller.ts`**
- Nouvelles routes :
  - `PUT /api/settings/ai` : Mise à jour des paramètres IA
  - `GET /api/settings/ai/status` : Statut de l'IA
  - `POST /api/settings/ai/test` : Test de connexion API

**`backend/src/modules/settings/settings.router.ts`**
- Ajout des routes IA avec permission `SYSTEM_SETTINGS`

### 2. Backend - Service Gemini

**`backend/src/modules/ai/gemini.service.ts`** ⭐ NOUVEAU
- Service d'intégration Google Gemini
- Package utilisé : `@google/generative-ai`

**Méthodes principales :**

```typescript
// Vérifier la disponibilité
static async isAvailable(): Promise<boolean>

// Générer un résumé de rapport
static async generateReportSummary(context: ReportGenerationContext): Promise<GeneratedText>

// Générer du texte pour un module
static async generateModuleText(context: ReportGenerationContext): Promise<GeneratedText>

// Générer une analyse d'entité
static async generateEntityAnalysis(context: ReportGenerationContext): Promise<GeneratedText>

// Tester la connexion
static async testConnection(): Promise<{ success: boolean; message: string; model?: string }>
```

**Types :**

```typescript
interface ReportGenerationContext {
  reportTitle?: string;
  reportType?: string;
  classification?: string;
  legalBasis?: string;
  existingContent?: string;
  moduleType?: string;
  moduleName?: string;
  entityData?: Record<string, any>;
  additionalContext?: string;
}

interface GeneratedText {
  content: string;
  model: string;
  tokensUsed?: number;
  generatedAt: Date;
}
```

**Modèles supportés :**
- `gemini-1.5-flash` (par défaut, rapide)
- `gemini-1.5-pro` (avancé)
- `gemini-pro`

### 3. Backend - API IA

**`backend/src/modules/ai/ai.controller.ts`** ⭐ NOUVEAU
- Contrôleur pour les endpoints IA
- Validation avec Zod
- Gestion des erreurs

**`backend/src/modules/ai/ai.router.ts`** ⭐ NOUVEAU
- Routes IA :
  - `POST /api/ai/generate/summary` : Générer un résumé
  - `POST /api/ai/generate/module` : Générer texte de module
  - `POST /api/ai/generate/entity-analysis` : Analyser une entité
  - `GET /api/ai/status` : Statut de l'IA
  - `POST /api/ai/test` : Test de connexion

**Permissions :**
- Génération : `REPORTS_WRITE`
- Test : `SYSTEM_SETTINGS`

**`backend/src/routes/index.ts`**
- Enregistrement du router IA : `router.use("/ai", aiRouter)`

### 4. Frontend - Page de configuration IA

**`frontend/src/pages/admin/AISettingsPage.vue`** ⭐ NOUVEAU

**Fonctionnalités :**
- ✅ Toggle activation/désactivation de l'IA
- ✅ Sélection du fournisseur (Gemini/OpenAI)
- ✅ Configuration de la clé API avec masquage/affichage
- ✅ Sélection du modèle IA
- ✅ Bouton de test de connexion
- ✅ Affichage du statut (clé configurée ou non)
- ✅ Liens vers les pages d'obtention des clés API
- ✅ Indicateurs de chargement
- ✅ Messages d'erreur et de succès

**Endpoints utilisés :**
- `GET /api/settings/ai/status` : Charger les paramètres
- `PUT /api/settings/ai` : Sauvegarder les paramètres
- `POST /api/settings/ai/test` : Tester la connexion

**`frontend/src/router/index.ts`**
- Ajout de la route `/admin/ai`
- Permissions : `system:settings` ou `system:admin`

## 🔒 Sécurité

### Chiffrement des clés API
- **Algorithme** : AES-256-GCM
- **Clé de chiffrement** : 256 bits (générée automatiquement)
- **IV** : 128 bits (aléatoire pour chaque chiffrement)
- **Tag d'authentification** : 128 bits

### Format de stockage
```
<iv>:<encrypted>:<authTag>
```

### Validation des clés
- **Gemini** : Format `AIza...` (39 caractères)
- **OpenAI** : Format `sk-...` (minimum 20 caractères)

## 📦 Dépendances ajoutées

```json
{
  "@google/generative-ai": "^0.21.0"
}
```

## 🚀 Utilisation

### 1. Configuration initiale (Admin)

1. Se connecter en tant qu'administrateur
2. Aller dans **Admin → Paramètres IA** (`/admin/ai`)
3. Activer l'IA
4. Choisir le fournisseur (Gemini recommandé)
5. Entrer la clé API
6. Sélectionner un modèle
7. Tester la connexion
8. Enregistrer

### 2. Obtenir une clé API Gemini

1. Visiter https://makersuite.google.com/app/apikey
2. Se connecter avec un compte Google
3. Créer une nouvelle clé API
4. Copier la clé (format `AIza...`)

**Quotas gratuits Gemini :**
- Gemini 1.5 Flash : 15 requêtes/minute, 1500/jour
- Gemini 1.5 Pro : 2 requêtes/minute, 50/jour

### 3. Utilisation dans les rapports (À venir)

L'interface utilisateur pour la génération de texte dans les rapports sera ajoutée dans une prochaine étape.

**Endpoints disponibles :**

```typescript
// Générer un résumé de rapport
POST /api/ai/generate/summary
{
  "reportTitle": "Enquête XYZ",
  "reportType": "Surveillance",
  "classification": "CONFIDENTIEL",
  "existingContent": "...",
  "additionalContext": "..."
}

// Générer du texte pour un module
POST /api/ai/generate/module
{
  "reportTitle": "Enquête XYZ",
  "moduleType": "person",
  "moduleName": "John Doe",
  "entityData": { ... },
  "existingContent": "...",
  "additionalContext": "..."
}

// Analyser une entité
POST /api/ai/generate/entity-analysis
{
  "entityData": { ... },
  "existingContent": "...",
  "additionalContext": "..."
}
```

## 🧪 Tests

### Test de connexion (via UI)
1. Aller dans Paramètres IA
2. Configurer une clé API
3. Cliquer sur "Tester la connexion"
4. Vérifier le message de succès

### Test manuel (via API)

```bash
# 1. Se connecter et récupérer le token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 2. Configurer l'IA
curl -X PUT http://localhost:3000/api/settings/ai \
  -H "Content-Type: application/json" \
  -H "Cookie: token=..." \
  -d '{
    "geminiApiKey": "AIza...",
    "aiProvider": "gemini",
    "aiModel": "gemini-1.5-flash",
    "aiEnabled": true
  }'

# 3. Tester la génération
curl -X POST http://localhost:3000/api/ai/generate/summary \
  -H "Content-Type: application/json" \
  -H "Cookie: token=..." \
  -d '{
    "reportTitle": "Test Report",
    "reportType": "Investigation",
    "additionalContext": "This is a test"
  }'
```

## 📝 Prompts système

### Résumé de rapport
```
Tu es un assistant spécialisé dans la rédaction de rapports d'enquête OSINT 
pour les forces de l'ordre.

Génère un résumé professionnel et concis de ce rapport d'enquête OSINT. 
Le résumé doit :
- Être rédigé en français professionnel
- Faire entre 150 et 250 mots
- Résumer les points clés de l'enquête
- Mentionner les principales découvertes
- Être objectif et factuel
- Respecter le ton formel d'un rapport officiel
```

### Texte de module
```
Tu es un assistant spécialisé dans la rédaction de rapports d'enquête OSINT 
pour les forces de l'ordre.

Génère un texte professionnel pour ce module du rapport.
Le texte doit :
- Être rédigé en français professionnel
- Faire entre 100 et 200 mots
- Être factuel et objectif
- Présenter les informations de manière claire et structurée
- Respecter le ton formel d'un rapport d'enquête
```

### Analyse d'entité
```
Tu es un analyste OSINT spécialisé dans l'analyse d'entités pour les 
forces de l'ordre.

Génère une analyse professionnelle de cette entité.
L'analyse doit :
- Être rédigée en français professionnel
- Faire entre 150 et 250 mots
- Synthétiser les informations clés
- Identifier les points importants ou inhabituels
- Être factuelle et objective
- Respecter le ton d'un rapport d'enquête officiel
```

## 🔮 Prochaines étapes

### Phase 2 : Interface utilisateur dans les rapports

1. **Bouton "Générer avec IA" dans l'éditeur de rapport**
   - Composant : `GenerateAITextButton.vue`
   - Position : Dans la barre d'outils WYSIWYG
   - Action : Ouvre une modal de configuration

2. **Modal de génération de texte**
   - Composant : `AITextGenerationModal.vue`
   - Champs :
     - Type de génération (résumé, module, analyse)
     - Contexte additionnel (textarea)
     - Bouton "Générer"
   - Prévisualisation du texte généré
   - Boutons : Utiliser / Régénérer / Annuler

3. **Indicateur de disponibilité IA**
   - Badge dans la barre de navigation
   - Tooltip expliquant si l'IA est disponible ou non

4. **Historique des générations**
   - Table pour stocker les textes générés
   - Possibilité de réutiliser des générations précédentes

### Phase 3 : Optimisations

1. **Cache des réponses IA**
   - Éviter de regénérer le même texte plusieurs fois
   - TTL : 24 heures

2. **Suggestions contextuelles**
   - Analyser le contenu existant pour suggérer des améliorations
   - "Cette section pourrait bénéficier d'une analyse IA"

3. **Templates de prompts personnalisables**
   - Permettre aux admins de modifier les prompts système
   - Base de templates prédéfinis

4. **Support multi-langues**
   - Détection automatique de la langue du rapport
   - Génération dans la langue appropriée

## 🐛 Dépannage

### L'IA n'est pas disponible

**Vérifications :**
1. L'IA est-elle activée dans les paramètres ? (`aiEnabled: true`)
2. Le fournisseur est-il correctement configuré ? (`aiProvider: 'gemini'`)
3. Une clé API est-elle configurée ?
4. La clé API est-elle valide ? (Tester via l'UI)

### Erreur de quota dépassé

**Gemini :**
```
Error: 429 Resource has been exhausted
```

**Solutions :**
- Attendre la réinitialisation du quota (minute/jour)
- Passer à un modèle avec un quota plus élevé
- Souscrire à un plan payant

### Texte généré de mauvaise qualité

**Améliorations possibles :**
1. Fournir plus de contexte dans `additionalContext`
2. Utiliser un modèle plus avancé (gemini-1.5-pro)
3. Modifier le prompt système (à venir en Phase 3)

### Clé API invalide

**Erreur :**
```
Error: API key not valid
```

**Solutions :**
1. Vérifier que la clé n'a pas expiré
2. Vérifier les restrictions IP/domaine sur la clé
3. Créer une nouvelle clé API

## 📊 Statistiques et monitoring

### Logs

Tous les appels IA sont loggés avec Pino :

```typescript
logger.info('Génération de résumé de rapport réussie');
logger.error({ err: error }, 'Erreur génération résumé de rapport');
```

### Métriques à suivre (à implémenter)

- Nombre de générations par jour/mois
- Temps de réponse moyen
- Taux de succès/échec
- Coût estimé des appels API
- Modèles les plus utilisés

## 🔐 Permissions

| Action | Permission requise |
|--------|-------------------|
| Configurer l'IA | `SYSTEM_SETTINGS` |
| Voir le statut IA | Authentifié |
| Générer du texte | `REPORTS_WRITE` |
| Tester la connexion (settings) | `SYSTEM_SETTINGS` |
| Tester la connexion (API) | `SYSTEM_SETTINGS` |

## 📚 Ressources

- [Documentation Google Gemini API](https://ai.google.dev/docs)
- [Console Google AI Studio](https://makersuite.google.com/)
- [Guide AES-256-GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [Best practices sécurité clés API](https://owasp.org/www-community/vulnerabilities/Insecure_Storage_of_Sensitive_Information)

## ✅ Checklist de déploiement

- [x] Migration Prisma appliquée
- [x] Service de chiffrement créé
- [x] Service Gemini créé
- [x] Controller et router IA créés
- [x] Routes enregistrées dans l'app
- [x] Page frontend de configuration créée
- [x] Route frontend ajoutée
- [x] Package `@google/generative-ai` installé
- [x] Backend compile sans erreurs
- [x] Frontend compile sans erreurs
- [x] Tests de connexion Gemini réussis (via UI)
- [x] Documentation utilisateur créée
- [ ] Interface de génération dans les rapports (Phase 2)

## 🎉 Conclusion

L'intégration IA est maintenant **opérationnelle** pour la configuration backend et l'administration. Les administrateurs peuvent configurer les clés API Google Gemini de manière sécurisée via une interface dédiée.

**La prochaine étape** consiste à créer l'interface utilisateur dans les modules de rapports pour permettre aux enquêteurs de générer automatiquement du texte professionnel pour leurs rapports OSINT.

---

**Auteur** : GitHub Copilot  
**Date** : 2025-01-08  
**Version** : 1.0
