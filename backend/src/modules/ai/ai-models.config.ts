/**
 * Configuration des modèles IA disponibles par fournisseur
 */

export interface AIModel {
  value: string;
  label: string;
  description: string;
  maxTokens?: number;
  costPer1kTokens?: number;
}

export interface AIProvider {
  id: 'gemini' | 'openai' | 'claude';
  name: string;
  models: AIModel[];
  apiKeyFormat: RegExp;
  apiKeyExample: string;
  docsUrl: string;
  apiKeyUrl: string;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyFormat: /^AIza[0-9A-Za-z_-]{35}$/,
    apiKeyExample: 'AIzaSy...',
    docsUrl: 'https://ai.google.dev/docs',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    models: [
      {
        value: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash 🆕',
        description: 'Dernière génération stable - Oct 2025 - RECOMMANDÉ',
        maxTokens: 8192,
      },
      {
        value: 'gemini-2.0-flash-exp',
        label: 'Gemini 2.0 Flash (Expérimental)',
        description: 'Version expérimentale 2.0',
        maxTokens: 8192,
      },
      {
        value: 'gemini-exp-1206',
        label: 'Gemini Exp 1206',
        description: 'Version expérimentale avancée de Déc 2024',
        maxTokens: 8192,
      },
      {
        value: 'gemini-1.5-flash-002',
        label: 'Gemini 1.5 Flash 002',
        description: 'Version stable 1.5, rapide et efficace',
        maxTokens: 8192,
      },
      {
        value: 'gemini-1.5-flash',
        label: 'Gemini 1.5 Flash',
        description: 'Rapide et efficace (legacy)',
        maxTokens: 8192,
      },
      {
        value: 'gemini-1.5-flash-8b',
        label: 'Gemini 1.5 Flash 8B',
        description: 'Version optimisée et ultra-rapide, économique',
        maxTokens: 8192,
      },
      {
        value: 'gemini-1.5-pro-002',
        label: 'Gemini 1.5 Pro 002',
        description: 'Modèle avancé pour tâches complexes',
        maxTokens: 8192,
      },
      {
        value: 'gemini-1.5-pro',
        label: 'Gemini 1.5 Pro',
        description: 'Modèle avancé (legacy)',
        maxTokens: 8192,
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKeyFormat: /^sk-[a-zA-Z0-9]{20,}$/,
    apiKeyExample: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/docs',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        value: 'gpt-5',
        label: 'GPT-5 🚀',
        description: 'Dernière génération OpenAI - Oct 2025 - RECOMMANDÉ',
        maxTokens: 128000,
        costPer1kTokens: 0.01,
      },
      {
        value: 'gpt-5-preview',
        label: 'GPT-5 Preview',
        description: 'Version préliminaire de GPT-5',
        maxTokens: 32768,
        costPer1kTokens: 0.03,
      },
      {
        value: 'gpt-4o-2024-11-20',
        label: 'GPT-4o (Latest Nov 2024)',
        description: 'Version la plus récente de GPT-4o',
        maxTokens: 16384,
        costPer1kTokens: 0.0025,
      },
      {
        value: 'gpt-4o-2024-08-06',
        label: 'GPT-4o (Août 2024)',
        description: 'Version stable d\'Août 2024',
        maxTokens: 16384,
        costPer1kTokens: 0.0025,
      },
      {
        value: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Modèle multimodal rapide et intelligent',
        maxTokens: 4096,
        costPer1kTokens: 0.005,
      },
      {
        value: 'gpt-4o-mini-2024-07-18',
        label: 'GPT-4o Mini (Latest)',
        description: 'Version stable de GPT-4o Mini',
        maxTokens: 16384,
        costPer1kTokens: 0.00015,
      },
      {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        description: 'Version légère et très économique, excellentes performances',
        maxTokens: 16384,
        costPer1kTokens: 0.00015,
      },
      {
        value: 'o1-2024-12-17',
        label: 'o1 (Latest Dec 2024)',
        description: 'Modèle de raisonnement le plus avancé - NOUVEAU',
        maxTokens: 100000,
        costPer1kTokens: 0.015,
      },
      {
        value: 'o1-preview',
        label: 'o1 Preview',
        description: 'Version préliminaire du modèle de raisonnement',
        maxTokens: 32768,
        costPer1kTokens: 0.015,
      },
      {
        value: 'o1-mini',
        label: 'o1 Mini',
        description: 'Version compacte et rapide du modèle de raisonnement',
        maxTokens: 65536,
        costPer1kTokens: 0.003,
      },
      {
        value: 'gpt-4-turbo-2024-04-09',
        label: 'GPT-4 Turbo',
        description: 'GPT-4 Turbo stable (legacy)',
        maxTokens: 4096,
        costPer1kTokens: 0.01,
      },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    apiKeyFormat: /^sk-ant-[a-zA-Z0-9_-]{95,}$/,
    apiKeyExample: 'sk-ant-api03-...',
    docsUrl: 'https://docs.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        value: 'claude-3-5-sonnet-20241022',
        label: 'Claude 3.5 Sonnet (Oct 2024) 🆕',
        description: 'Modèle le plus avancé d\'Anthropic - RECOMMANDÉ',
        maxTokens: 8192,
        costPer1kTokens: 0.003,
      },
      {
        value: 'claude-3-5-sonnet-20240620',
        label: 'Claude 3.5 Sonnet (Juin 2024)',
        description: 'Version stable précédente de génération 3.5',
        maxTokens: 8192,
        costPer1kTokens: 0.003,
      },
      {
        value: 'claude-3-5-haiku-20241022',
        label: 'Claude 3.5 Haiku',
        description: 'Version rapide et économique de Claude 3.5',
        maxTokens: 8192,
        costPer1kTokens: 0.0008,
      },
      {
        value: 'claude-3-5-sonnet-20240620',
        label: 'Claude 3.5 Sonnet (Juin 2024)',
        description: 'Version stable précédente',
        maxTokens: 8192,
        costPer1kTokens: 0.003,
      },
      {
        value: 'claude-3-5-haiku-20241022',
        label: 'Claude 3.5 Haiku',
        description: 'Version rapide et économique de Claude 3.5',
        maxTokens: 8192,
        costPer1kTokens: 0.0008,
      },
      {
        value: 'claude-3-opus-20240229',
        label: 'Claude 3 Opus',
        description: 'Modèle intelligent génération 3 (legacy)',
        maxTokens: 4096,
        costPer1kTokens: 0.015,
      },
      {
        value: 'claude-3-sonnet-20240229',
        label: 'Claude 3 Sonnet',
        description: 'Équilibre performance/coût génération 3 (legacy)',
        maxTokens: 4096,
        costPer1kTokens: 0.003,
      },
      {
        value: 'claude-3-haiku-20240307',
        label: 'Claude 3 Haiku',
        description: 'Rapide et économique génération 3 (legacy)',
        maxTokens: 4096,
        costPer1kTokens: 0.00025,
      },
    ],
  },
};

/**
 * Récupère les modèles disponibles pour un fournisseur
 */
export function getModelsForProvider(providerId: string): AIModel[] {
  return AI_PROVIDERS[providerId]?.models || [];
}

/**
 * Récupère les informations d'un fournisseur
 */
export function getProviderInfo(providerId: string): AIProvider | undefined {
  return AI_PROVIDERS[providerId];
}

/**
 * Valide le format d'une clé API selon le fournisseur
 */
export function validateApiKeyFormat(providerId: string, apiKey: string): boolean {
  const provider = AI_PROVIDERS[providerId];
  if (!provider) return false;
  return provider.apiKeyFormat.test(apiKey);
}

/**
 * Liste de tous les fournisseurs disponibles
 */
export const AVAILABLE_PROVIDERS = Object.values(AI_PROVIDERS);

/**
 * Modèle par défaut pour chaque fournisseur
 * Note: En octobre 2025, les modèles les plus récents sont :
 * - Gemini 2.5 Flash ✨ (stable, Oct 2025)
 * - GPT-5 🚀 (Oct 2025) + GPT-4o et o1
 * - Claude 3.5 Sonnet (Oct 2024) ✨
 */
export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-5',
  claude: 'claude-3-5-sonnet-20241022',
};
