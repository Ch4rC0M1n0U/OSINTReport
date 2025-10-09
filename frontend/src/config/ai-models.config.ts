/**
 * Configuration des modèles IA disponibles par fournisseur (Frontend)
 */

export interface AIModel {
  value: string;
  label: string;
  description: string;
}

export interface AIProvider {
  id: 'gemini' | 'openai' | 'claude';
  name: string;
  models: AIModel[];
  apiKeyExample: string;
  docsUrl: string;
  apiKeyUrl: string;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyExample: 'AIzaSy...',
    docsUrl: 'https://ai.google.dev/docs',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    models: [
      {
        value: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash 🆕',
        description: 'Dernière génération stable - Oct 2025 - RECOMMANDÉ',
      },
      {
        value: 'gemini-2.0-flash-exp',
        label: 'Gemini 2.0 Flash (Expérimental)',
        description: 'Version expérimentale 2.0',
      },
      {
        value: 'gemini-exp-1206',
        label: 'Gemini Exp 1206',
        description: 'Version expérimentale avancée de Déc 2024',
      },
      {
        value: 'gemini-1.5-flash-002',
        label: 'Gemini 1.5 Flash 002',
        description: 'Version stable 1.5, rapide et efficace',
      },
      {
        value: 'gemini-1.5-flash',
        label: 'Gemini 1.5 Flash',
        description: 'Rapide et efficace (legacy)',
      },
      {
        value: 'gemini-1.5-flash-8b',
        label: 'Gemini 1.5 Flash 8B',
        description: 'Version optimisée et ultra-rapide, économique',
      },
      {
        value: 'gemini-1.5-pro-002',
        label: 'Gemini 1.5 Pro 002',
        description: 'Modèle avancé pour tâches complexes',
      },
      {
        value: 'gemini-1.5-pro',
        label: 'Gemini 1.5 Pro',
        description: 'Modèle avancé (legacy)',
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKeyExample: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/docs',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        value: 'gpt-5',
        label: 'GPT-5 🚀',
        description: 'Dernière génération OpenAI - Oct 2025 - RECOMMANDÉ',
      },
      {
        value: 'gpt-5-preview',
        label: 'GPT-5 Preview',
        description: 'Version préliminaire de GPT-5',
      },
      {
        value: 'gpt-4o-2024-11-20',
        label: 'GPT-4o (Latest Nov 2024)',
        description: 'Version la plus récente de GPT-4o',
      },
      {
        value: 'gpt-4o-2024-08-06',
        label: 'GPT-4o (Août 2024)',
        description: 'Version stable d\'Août 2024',
      },
      {
        value: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Modèle multimodal rapide et intelligent',
      },
      {
        value: 'gpt-4o-mini-2024-07-18',
        label: 'GPT-4o Mini (Latest)',
        description: 'Version stable de GPT-4o Mini - Économique',
      },
      {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        description: 'Version légère et très économique',
      },
      {
        value: 'o1-2024-12-17',
        label: 'o1 (Latest Dec 2024)',
        description: 'Modèle de raisonnement avancé',
      },
      {
        value: 'o1-preview',
        label: 'o1 Preview',
        description: 'Version préliminaire du modèle de raisonnement',
      },
      {
        value: 'o1-mini',
        label: 'o1 Mini',
        description: 'Version compacte et rapide du modèle de raisonnement',
      },
      {
        value: 'gpt-4-turbo-2024-04-09',
        label: 'GPT-4 Turbo',
        description: 'GPT-4 Turbo stable (legacy)',
      },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    apiKeyExample: 'sk-ant-api03-...',
    docsUrl: 'https://docs.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        value: 'claude-sonnet-4-5-20250514',
        label: 'Claude Sonnet 4.5 🆕',
        description: 'Modèle le plus avancé d\'Anthropic - Mai 2025 - RECOMMANDÉ',
      },
      {
        value: 'claude-opus-4-20250514',
        label: 'Claude Opus 4 🆕',
        description: 'Intelligence maximale pour tâches ultra-complexes - Mai 2025',
      },
      {
        value: 'claude-3-5-sonnet-20241022',
        label: 'Claude 3.5 Sonnet (Oct 2024)',
        description: 'Excellente version stable de génération 3.5',
      },
      {
        value: 'claude-3-5-sonnet-20240620',
        label: 'Claude 3.5 Sonnet (Juin 2024)',
        description: 'Version stable précédente',
      },
      {
        value: 'claude-3-5-haiku-20241022',
        label: 'Claude 3.5 Haiku',
        description: 'Version rapide et économique de Claude 3.5',
      },
      {
        value: 'claude-3-opus-20240229',
        label: 'Claude 3 Opus',
        description: 'Modèle intelligent génération 3 (legacy)',
      },
      {
        value: 'claude-3-sonnet-20240229',
        label: 'Claude 3 Sonnet',
        description: 'Équilibre performance/coût génération 3 (legacy)',
      },
      {
        value: 'claude-3-haiku-20240307',
        label: 'Claude 3 Haiku',
        description: 'Rapide et économique génération 3 (legacy)',
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
 * Liste de tous les fournisseurs disponibles
 */
export const AVAILABLE_PROVIDERS = Object.values(AI_PROVIDERS);

/**
 * Modèle par défaut pour chaque fournisseur
 * Note: En octobre 2025, les modèles les plus récents sont :
 * - Gemini 2.5 Flash ✨ (stable, Oct 2025)
 * - GPT-5 🚀 (Oct 2025) + GPT-4o et o1
 * - Claude Sonnet 4.5 et Opus 4 (Mai 2025) ✨
 */
export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-5',
  claude: 'claude-sonnet-4-5-20250514',
};
