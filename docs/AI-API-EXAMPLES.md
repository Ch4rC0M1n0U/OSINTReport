# Exemples d'utilisation de l'API IA

## 🎯 Exemples pratiques pour intégrer l'IA dans vos rapports

Ce document fournit des exemples concrets d'utilisation de l'API IA d'OSINTReport.

## 📋 Prérequis

1. L'IA doit être activée et configurée (voir `/admin/ai`)
2. L'utilisateur doit avoir la permission `REPORTS_WRITE`
3. Une clé API Gemini valide doit être configurée

## 🔧 Exemples Backend

### 1. Générer un résumé de rapport

```typescript
import { GeminiService } from '@/modules/ai/gemini.service';

async function generateReportSummary(report: Report) {
  try {
    // Vérifier que l'IA est disponible
    const isAvailable = await GeminiService.isAvailable();
    if (!isAvailable) {
      throw new Error('IA non disponible');
    }

    // Générer le résumé
    const result = await GeminiService.generateReportSummary({
      reportTitle: report.title,
      reportType: report.type,
      classification: report.classification,
      legalBasis: report.legalBasis,
      existingContent: report.description,
      additionalContext: `Ce rapport concerne une enquête ${report.type}.`
    });

    console.log('Résumé généré:', result.content);
    console.log('Modèle utilisé:', result.model);
    console.log('Date de génération:', result.generatedAt);

    return result.content;
  } catch (error) {
    console.error('Erreur génération résumé:', error);
    throw error;
  }
}
```

### 2. Générer du texte pour un module Person

```typescript
import { GeminiService } from '@/modules/ai/gemini.service';

async function generatePersonModuleText(person: Person, report: Report) {
  try {
    const result = await GeminiService.generateModuleText({
      reportTitle: report.title,
      moduleType: 'person',
      moduleName: `${person.firstName} ${person.lastName}`,
      entityData: {
        firstName: person.firstName,
        lastName: person.lastName,
        birthDate: person.birthDate,
        nationality: person.nationality,
        occupation: person.occupation,
        addresses: person.addresses,
        phoneNumbers: person.phoneNumbers,
        emails: person.emails,
      },
      existingContent: person.notes,
      additionalContext: 'Analyse OSINT approfondie demandée'
    });

    return result.content;
  } catch (error) {
    console.error('Erreur génération texte module:', error);
    throw error;
  }
}
```

### 3. Analyser une organisation

```typescript
import { GeminiService } from '@/modules/ai/gemini.service';

async function analyzeOrganization(org: Organization) {
  try {
    const result = await GeminiService.generateEntityAnalysis({
      entityData: {
        name: org.name,
        legalForm: org.legalForm,
        siret: org.siret,
        address: org.address,
        activities: org.activities,
        employees: org.employeeCount,
        revenue: org.revenue,
      },
      existingContent: org.description,
      additionalContext: 'Identifier les points importants et les anomalies potentielles'
    });

    return result.content;
  } catch (error) {
    console.error('Erreur analyse organisation:', error);
    throw error;
  }
}
```

## 🌐 Exemples Frontend (API calls)

### 1. Générer un résumé depuis un composant Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/http';

const generating = ref(false);
const generatedText = ref('');
const error = ref('');

async function generateSummary(report: any) {
  try {
    generating.value = true;
    error.value = '';
    
    const response = await api.post('/api/ai/generate/summary', {
      reportTitle: report.title,
      reportType: report.type,
      classification: report.classification,
      legalBasis: report.legalBasis,
      existingContent: report.description,
      additionalContext: 'Générer un résumé professionnel'
    });
    
    if (response.data.success) {
      generatedText.value = response.data.data.content;
      console.log('Texte généré par:', response.data.data.model);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de la génération';
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <div>
    <button
      @click="generateSummary(currentReport)"
      :disabled="generating"
      class="btn btn-primary"
    >
      <span v-if="generating" class="loading loading-spinner"></span>
      {{ generating ? 'Génération...' : 'Générer un résumé IA' }}
    </button>
    
    <div v-if="error" class="alert alert-error mt-4">
      {{ error }}
    </div>
    
    <div v-if="generatedText" class="card bg-base-200 mt-4">
      <div class="card-body">
        <h3 class="card-title">Texte généré</h3>
        <p>{{ generatedText }}</p>
        <div class="card-actions">
          <button @click="useGeneratedText" class="btn btn-primary">
            Utiliser ce texte
          </button>
          <button @click="generateSummary(currentReport)" class="btn btn-outline">
            Régénérer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 2. Composant réutilisable AITextGenerator

```vue
<!-- components/ai/AITextGenerator.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { api } from '@/services/http';

interface Props {
  type: 'summary' | 'module' | 'entity-analysis';
  context: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'generated', text: string): void;
}>();

const generating = ref(false);
const generatedText = ref('');
const error = ref('');

const endpoint = computed(() => {
  switch (props.type) {
    case 'summary':
      return '/api/ai/generate/summary';
    case 'module':
      return '/api/ai/generate/module';
    case 'entity-analysis':
      return '/api/ai/generate/entity-analysis';
  }
});

async function generate() {
  try {
    generating.value = true;
    error.value = '';
    generatedText.value = '';
    
    const response = await api.post(endpoint.value, props.context);
    
    if (response.data.success) {
      generatedText.value = response.data.data.content;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de la génération';
  } finally {
    generating.value = false;
  }
}

function useText() {
  emit('generated', generatedText.value);
  generatedText.value = '';
}
</script>

<template>
  <div class="ai-text-generator">
    <button
      @click="generate"
      :disabled="generating"
      class="btn btn-primary gap-2"
    >
      <svg v-if="!generating" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
      <span v-if="generating" class="loading loading-spinner"></span>
      {{ generating ? 'Génération en cours...' : 'Générer avec IA' }}
    </button>
    
    <div v-if="error" class="alert alert-error mt-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>
    
    <div v-if="generatedText" class="card bg-gradient-to-br from-primary/10 to-secondary/10 mt-4">
      <div class="card-body">
        <div class="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-primary">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <h3 class="card-title text-lg">Texte généré par IA</h3>
        </div>
        <div class="prose max-w-none">
          <p class="whitespace-pre-wrap">{{ generatedText }}</p>
        </div>
        <div class="card-actions justify-end mt-4">
          <button @click="generatedText = ''" class="btn btn-ghost">
            Annuler
          </button>
          <button @click="generate" class="btn btn-outline">
            Régénérer
          </button>
          <button @click="useText" class="btn btn-primary">
            Utiliser ce texte
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 3. Utilisation du composant AITextGenerator

```vue
<script setup lang="ts">
import { ref } from 'vue';
import AITextGenerator from '@/components/ai/AITextGenerator.vue';

const reportDescription = ref('');

function handleGeneratedText(text: string) {
  reportDescription.value = text;
}
</script>

<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text">Description du rapport</span>
    </label>
    <textarea
      v-model="reportDescription"
      class="textarea textarea-bordered h-32"
      placeholder="Entrez la description du rapport..."
    ></textarea>
    
    <!-- Bouton de génération IA -->
    <AITextGenerator
      type="summary"
      :context="{
        reportTitle: 'Mon rapport',
        reportType: 'Investigation',
        classification: 'CONFIDENTIEL',
        additionalContext: 'Enquête sur fraude financière'
      }"
      @generated="handleGeneratedText"
      class="mt-2"
    />
  </div>
</template>
```

## 🚀 Cas d'usage avancés

### 1. Génération batch (plusieurs modules)

```typescript
async function generateAllModuleTexts(report: Report) {
  const results = [];
  
  for (const module of report.modules) {
    try {
      const text = await GeminiService.generateModuleText({
        reportTitle: report.title,
        moduleType: module.type,
        moduleName: module.name,
        entityData: module.data,
      });
      
      results.push({
        moduleId: module.id,
        text: text.content,
        success: true
      });
      
      // Pause de 2 secondes entre chaque appel (respect des quotas)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      results.push({
        moduleId: module.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### 2. Enrichissement progressif

```typescript
async function enrichReportWithAI(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      modules: true
    }
  });
  
  // 1. Générer résumé si absent
  if (!report.summary) {
    const summary = await GeminiService.generateReportSummary({
      reportTitle: report.title,
      reportType: report.type,
      classification: report.classification,
    });
    
    await prisma.report.update({
      where: { id: reportId },
      data: { summary: summary.content }
    });
  }
  
  // 2. Générer texte pour chaque module sans description
  for (const module of report.modules) {
    if (!module.description) {
      const text = await GeminiService.generateModuleText({
        reportTitle: report.title,
        moduleType: module.type,
        moduleName: module.name,
        entityData: module.data,
      });
      
      await prisma.module.update({
        where: { id: module.id },
        data: { description: text.content }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### 3. Vérification de disponibilité avant génération

```typescript
import { GeminiService } from '@/modules/ai/gemini.service';
import { SettingsService } from '@/modules/settings/settings.service';

async function smartGenerate(context: any) {
  // 1. Vérifier si l'IA est disponible
  const isAvailable = await GeminiService.isAvailable();
  
  if (!isAvailable) {
    // Fallback : retourner un template ou lancer une erreur
    throw new Error('IA non disponible. Veuillez configurer une clé API dans les paramètres.');
  }
  
  // 2. Vérifier le fournisseur configuré
  const settings = await SettingsService.getSettings();
  
  if (settings.aiProvider === 'gemini') {
    return await GeminiService.generateReportSummary(context);
  } else if (settings.aiProvider === 'openai') {
    // Support OpenAI à implémenter
    throw new Error('OpenAI pas encore supporté');
  }
  
  throw new Error('Fournisseur IA non reconnu');
}
```

## 📊 Monitoring et logs

### Ajouter des logs pour tracker l'utilisation

```typescript
import { logger } from '@/config/logger';
import { GeminiService } from '@/modules/ai/gemini.service';

async function generateWithLogging(userId: string, context: any) {
  const startTime = Date.now();
  
  try {
    logger.info({
      userId,
      action: 'ai_generation_start',
      type: 'summary'
    }, 'Début de génération IA');
    
    const result = await GeminiService.generateReportSummary(context);
    
    const duration = Date.now() - startTime;
    
    logger.info({
      userId,
      action: 'ai_generation_success',
      type: 'summary',
      model: result.model,
      duration,
      textLength: result.content.length
    }, 'Génération IA réussie');
    
    return result;
  } catch (error) {
    logger.error({
      userId,
      action: 'ai_generation_error',
      type: 'summary',
      error: error.message,
      duration: Date.now() - startTime
    }, 'Erreur génération IA');
    
    throw error;
  }
}
```

## 🎯 Bonnes pratiques

### 1. Gestion des erreurs

```typescript
async function safeGenerate(context: any) {
  try {
    return await GeminiService.generateReportSummary(context);
  } catch (error) {
    if (error.message.includes('quota')) {
      // Quota dépassé : suggérer d'attendre
      throw new Error('Quota API dépassé. Veuillez réessayer dans quelques minutes.');
    } else if (error.message.includes('API key')) {
      // Problème de clé API
      throw new Error('Clé API invalide. Veuillez vérifier la configuration.');
    } else {
      // Erreur générique
      throw new Error('Erreur lors de la génération. Veuillez réessayer.');
    }
  }
}
```

### 2. Cache des résultats (Redis/Memory)

```typescript
const generationCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

async function cachedGenerate(cacheKey: string, context: any) {
  // Vérifier le cache
  const cached = generationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    logger.info({ cacheKey }, 'Résultat récupéré du cache');
    return { content: cached.content, fromCache: true };
  }
  
  // Générer
  const result = await GeminiService.generateReportSummary(context);
  
  // Mettre en cache
  generationCache.set(cacheKey, {
    content: result.content,
    timestamp: Date.now()
  });
  
  return { content: result.content, fromCache: false };
}
```

### 3. Rate limiting

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const aiRateLimiter = new RateLimiterMemory({
  points: 10, // 10 requêtes
  duration: 60, // par minute
});

async function rateLimitedGenerate(userId: string, context: any) {
  try {
    await aiRateLimiter.consume(userId);
    return await GeminiService.generateReportSummary(context);
  } catch (rateLimiterRes) {
    throw new Error(`Limite atteinte. Réessayez dans ${rateLimiterRes.msBeforeNext}ms`);
  }
}
```

## 🧪 Tests

### Test unitaire

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GeminiService } from '@/modules/ai/gemini.service';

describe('GeminiService', () => {
  it('devrait générer un résumé', async () => {
    const result = await GeminiService.generateReportSummary({
      reportTitle: 'Test Report',
      reportType: 'Investigation'
    });
    
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(50);
    expect(result.model).toContain('gemini');
  });
  
  it('devrait gérer les erreurs de quota', async () => {
    // Mock pour simuler quota dépassé
    vi.spyOn(GeminiService as any, 'getModel').mockRejectedValueOnce(
      new Error('429 Resource has been exhausted')
    );
    
    await expect(
      GeminiService.generateReportSummary({})
    ).rejects.toThrow();
  });
});
```

---

**Prochaines étapes** : Créer l'interface utilisateur pour faciliter la génération dans les rapports (Phase 2).
