/**
 * A/B Testing Service
 * Feature flags and experimentation framework
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './analytics';

// Experiment definitions
export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  enabled: boolean;
  startDate: Date;
  endDate?: Date;
  targetPercentage: number;
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100
  config: any;
}

export interface UserExperiment {
  experimentId: string;
  variantId: string;
  assignedAt: Date;
}

// Active experiments
const EXPERIMENTS: Experiment[] = [
  {
    id: 'coin_prices_v1',
    name: 'Coin Pricing Test',
    description: 'Test different coin package prices',
    enabled: true,
    startDate: new Date('2025-01-01'),
    targetPercentage: 50,
    variants: [
      {
        id: 'control',
        name: 'Original Prices',
        weight: 50,
        config: {
          small: 0.99,
          medium: 2.99,
          large: 4.99,
        },
      },
      {
        id: 'variant_a',
        name: 'Lower Prices',
        weight: 50,
        config: {
          small: 0.79,
          medium: 2.49,
          large: 3.99,
        },
      },
    ],
  },
  {
    id: 'onboarding_flow_v1',
    name: 'Onboarding Flow Test',
    description: 'Test different onboarding experiences',
    enabled: true,
    startDate: new Date('2025-01-01'),
    targetPercentage: 100,
    variants: [
      {
        id: 'control',
        name: 'Standard Onboarding',
        weight: 50,
        config: {
          steps: 3,
          showVideo: false,
        },
      },
      {
        id: 'variant_a',
        name: 'Extended Onboarding',
        weight: 50,
        config: {
          steps: 5,
          showVideo: true,
        },
      },
    ],
  },
  {
    id: 'avatar_shop_layout_v1',
    name: 'Avatar Shop Layout',
    description: 'Test grid vs list layout',
    enabled: true,
    startDate: new Date('2025-01-01'),
    targetPercentage: 50,
    variants: [
      {
        id: 'control',
        name: 'Grid Layout',
        weight: 50,
        config: {
          layout: 'grid',
          columns: 2,
        },
      },
      {
        id: 'variant_a',
        name: 'List Layout',
        weight: 50,
        config: {
          layout: 'list',
          columns: 1,
        },
      },
    ],
  },
];

class ABTestingService {
  private userExperiments: Map<string, UserExperiment> = new Map();
  private storageKey = '@wittz_experiments';

  /**
   * Initialize A/B testing
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const experiments = JSON.parse(stored);
        this.userExperiments = new Map(Object.entries(experiments));
      }
    } catch (error) {
      console.error('Failed to initialize A/B testing:', error);
    }
  }

  /**
   * Get variant for experiment
   */
  async getVariant(experimentId: string): Promise<Variant | null> {
    const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
    if (!experiment || !experiment.enabled) {
      return null;
    }

    // Check if user already assigned
    const existing = this.userExperiments.get(experimentId);
    if (existing) {
      const variant = experiment.variants.find((v) => v.id === existing.variantId);
      return variant || null;
    }

    // Assign new variant
    const variant = this.assignVariant(experiment);
    if (variant) {
      const userExperiment: UserExperiment = {
        experimentId,
        variantId: variant.id,
        assignedAt: new Date(),
      };

      this.userExperiments.set(experimentId, userExperiment);
      await this.saveExperiments();

      // Track assignment
      analytics.logEvent('experiment_assigned', {
        experiment_id: experimentId,
        experiment_name: experiment.name,
        variant_id: variant.id,
        variant_name: variant.name,
      });
    }

    return variant;
  }

  /**
   * Assign variant based on weights
   */
  private assignVariant(experiment: Experiment): Variant | null {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return experiment.variants[0] || null;
  }

  /**
   * Track experiment event
   */
  trackEvent(experimentId: string, eventName: string, params?: any): void {
    const userExperiment = this.userExperiments.get(experimentId);
    if (!userExperiment) return;

    analytics.logEvent(`experiment_${eventName}`, {
      experiment_id: experimentId,
      variant_id: userExperiment.variantId,
      ...params,
    });
  }

  /**
   * Check if user is in experiment
   */
  isInExperiment(experimentId: string): boolean {
    return this.userExperiments.has(experimentId);
  }

  /**
   * Get user's variant ID
   */
  getUserVariant(experimentId: string): string | null {
    return this.userExperiments.get(experimentId)?.variantId || null;
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): Experiment[] {
    return EXPERIMENTS.filter((e) => e.enabled);
  }

  /**
   * Save experiments to storage
   */
  private async saveExperiments(): Promise<void> {
    try {
      const data = Object.fromEntries(this.userExperiments);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save experiments:', error);
    }
  }

  /**
   * Clear all experiments (for testing)
   */
  async clearExperiments(): Promise<void> {
    this.userExperiments.clear();
    await AsyncStorage.removeItem(this.storageKey);
  }
}

// Export singleton
export const abTestingService = new ABTestingService();

// Export convenience functions
export const abTesting = {
  initialize: () => abTestingService.initialize(),
  getVariant: (experimentId: string) => abTestingService.getVariant(experimentId),
  trackEvent: (experimentId: string, eventName: string, params?: any) =>
    abTestingService.trackEvent(experimentId, eventName, params),
  isInExperiment: (experimentId: string) => abTestingService.isInExperiment(experimentId),
  getUserVariant: (experimentId: string) => abTestingService.getUserVariant(experimentId),
  getActiveExperiments: () => abTestingService.getActiveExperiments(),
  clearExperiments: () => abTestingService.clearExperiments(),
};
