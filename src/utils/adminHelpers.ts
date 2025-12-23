/**
 * Admin Helper Functions
 * Quick utilities for testing and setup
 */

import { checkAndRotateSeason } from '../services/seasons';

/**
 * Initialize the first season
 * Call this once to create Season 1
 */
export const initializeFirstSeason = async (): Promise<void> => {
  console.log('🎯 Initializing Season 1...');
  await checkAndRotateSeason();
  console.log('✅ Season 1 created!');
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).createSeason = initializeFirstSeason;
}
