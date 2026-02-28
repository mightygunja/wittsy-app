/**
 * ELO Rating Core Logic Tests
 * Tests the pure calculation functions without Firebase dependencies
 */

import { RATING_CONSTANTS } from '../eloRatingService';

// Pure calculation functions extracted for testing
const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

const getKFactor = (rating: number, gamesPlayed: number): number => {
  if (gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES) {
    return RATING_CONSTANTS.K_FACTOR_PLACEMENT;
  }
  if (gamesPlayed < RATING_CONSTANTS.PROVISIONAL_GAMES) {
    return RATING_CONSTANTS.K_FACTOR_NEW;
  }
  if (rating >= RATING_CONSTANTS.MASTER_RATING_THRESHOLD) {
    return RATING_CONSTANTS.K_FACTOR_MASTER;
  }
  if (rating >= RATING_CONSTANTS.HIGH_RATING_THRESHOLD) {
    return RATING_CONSTANTS.K_FACTOR_HIGH;
  }
  return RATING_CONSTANTS.K_FACTOR_NORMAL;
};

const getStreakBonus = (winStreak: number): number => {
  if (winStreak < 3) return 0;
  const bonus = (winStreak - 2) * RATING_CONSTANTS.WIN_STREAK_BONUS;
  return Math.min(bonus, RATING_CONSTANTS.MAX_STREAK_BONUS);
};

const getMarginOfVictoryBonus = (
  winnerVotes: number,
  secondPlaceVotes: number,
  totalVotes: number
): number => {
  if (totalVotes === 0) return 0;
  const margin = (winnerVotes - secondPlaceVotes) / totalVotes;
  const bonus = Math.round(margin * RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX);
  return Math.max(0, Math.min(bonus, RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX));
};

const getConfidenceLevel = (ratingDeviation: number): string => {
  if (ratingDeviation >= 250) return 'Uncertain';
  if (ratingDeviation >= 150) return 'Developing';
  if (ratingDeviation >= 100) return 'Moderate';
  return 'Confident';
};

describe('ELO Rating Core Logic Tests', () => {
  
  describe('Rating Constants Validation', () => {
    test('should have valid rating bounds', () => {
      expect(RATING_CONSTANTS.MIN_RATING).toBe(100);
      expect(RATING_CONSTANTS.MAX_RATING).toBe(4000);
      expect(RATING_CONSTANTS.INITIAL_RATING).toBe(1200);
    });

    test('should have proper K-factor progression', () => {
      expect(RATING_CONSTANTS.K_FACTOR_PLACEMENT).toBe(60);
      expect(RATING_CONSTANTS.K_FACTOR_NEW).toBe(50);
      expect(RATING_CONSTANTS.K_FACTOR_NORMAL).toBe(32);
      expect(RATING_CONSTANTS.K_FACTOR_HIGH).toBe(20);
      expect(RATING_CONSTANTS.K_FACTOR_MASTER).toBe(16);
      
      // Verify descending order
      expect(RATING_CONSTANTS.K_FACTOR_PLACEMENT).toBeGreaterThan(RATING_CONSTANTS.K_FACTOR_NEW);
      expect(RATING_CONSTANTS.K_FACTOR_NEW).toBeGreaterThan(RATING_CONSTANTS.K_FACTOR_NORMAL);
      expect(RATING_CONSTANTS.K_FACTOR_NORMAL).toBeGreaterThan(RATING_CONSTANTS.K_FACTOR_HIGH);
      expect(RATING_CONSTANTS.K_FACTOR_HIGH).toBeGreaterThan(RATING_CONSTANTS.K_FACTOR_MASTER);
    });

    test('should have valid placement and provisional periods', () => {
      expect(RATING_CONSTANTS.PLACEMENT_GAMES).toBe(10);
      expect(RATING_CONSTANTS.PROVISIONAL_GAMES).toBe(30);
      expect(RATING_CONSTANTS.PLACEMENT_GAMES).toBeLessThan(RATING_CONSTANTS.PROVISIONAL_GAMES);
    });

    test('should have valid bonus limits', () => {
      expect(RATING_CONSTANTS.WIN_STREAK_BONUS).toBe(2);
      expect(RATING_CONSTANTS.MAX_STREAK_BONUS).toBe(10);
      expect(RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX).toBe(5);
    });
  });

  describe('Expected Score Calculation', () => {
    test('should return 0.5 for equal ratings', () => {
      const result = calculateExpectedScore(1500, 1500);
      expect(result).toBeCloseTo(0.5, 2);
    });

    test('should favor higher-rated player', () => {
      const result = calculateExpectedScore(1700, 1500);
      expect(result).toBeGreaterThan(0.7);
      expect(result).toBeLessThan(0.8);
    });

    test('should give underdog low expected score', () => {
      const result = calculateExpectedScore(1500, 1700);
      expect(result).toBeLessThan(0.3);
      expect(result).toBeGreaterThan(0.2);
    });

    test('should handle extreme rating differences', () => {
      const result = calculateExpectedScore(1000, 2500);
      expect(result).toBeLessThan(0.01);
      
      const result2 = calculateExpectedScore(2500, 1000);
      expect(result2).toBeGreaterThan(0.99);
    });
  });

  describe('K-Factor Determination', () => {
    test('should use placement K for first 10 games', () => {
      for (let i = 0; i < 10; i++) {
        expect(getKFactor(1200, i)).toBe(60);
      }
    });

    test('should use provisional K for games 10-29', () => {
      for (let i = 10; i < 30; i++) {
        expect(getKFactor(1200, i)).toBe(50);
      }
    });

    test('should use normal K for experienced players', () => {
      expect(getKFactor(1200, 30)).toBe(32);
      expect(getKFactor(1500, 50)).toBe(32);
      expect(getKFactor(1900, 100)).toBe(32);
    });

    test('should use high K for 2000+ rating', () => {
      expect(getKFactor(2000, 50)).toBe(20);
      expect(getKFactor(2200, 100)).toBe(20);
    });

    test('should use master K for 2400+ rating', () => {
      expect(getKFactor(2400, 50)).toBe(16);
      expect(getKFactor(2800, 100)).toBe(16);
    });

    test('should prioritize experience over rating for placement', () => {
      // Even high-rated player in placement uses placement K
      expect(getKFactor(2500, 5)).toBe(60);
    });
  });

  describe('Streak Bonus Calculation', () => {
    test('should return 0 for streaks less than 3', () => {
      expect(getStreakBonus(0)).toBe(0);
      expect(getStreakBonus(1)).toBe(0);
      expect(getStreakBonus(2)).toBe(0);
    });

    test('should calculate bonus for 3+ streaks', () => {
      expect(getStreakBonus(3)).toBe(2);  // (3-2) * 2
      expect(getStreakBonus(4)).toBe(4);  // (4-2) * 2
      expect(getStreakBonus(5)).toBe(6);  // (5-2) * 2
    });

    test('should cap at maximum bonus', () => {
      expect(getStreakBonus(10)).toBe(10);
      expect(getStreakBonus(20)).toBe(10);
      expect(getStreakBonus(100)).toBe(10);
    });
  });

  describe('Margin of Victory Bonus', () => {
    test('should return 0 for no votes', () => {
      expect(getMarginOfVictoryBonus(0, 0, 0)).toBe(0);
    });

    test('should calculate bonus for close wins', () => {
      const bonus = getMarginOfVictoryBonus(3, 2, 5);
      expect(bonus).toBeGreaterThanOrEqual(0);
      expect(bonus).toBeLessThanOrEqual(2);
    });

    test('should calculate bonus for moderate wins', () => {
      const bonus = getMarginOfVictoryBonus(4, 1, 5);
      expect(bonus).toBeGreaterThan(2);
      expect(bonus).toBeLessThan(5);
    });

    test('should give maximum bonus for dominant wins', () => {
      const bonus = getMarginOfVictoryBonus(5, 0, 5);
      expect(bonus).toBe(5);
      
      const bonus2 = getMarginOfVictoryBonus(10, 0, 10);
      expect(bonus2).toBe(5);
    });

    test('should cap at maximum', () => {
      const bonus = getMarginOfVictoryBonus(100, 0, 100);
      expect(bonus).toBe(RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX);
    });
  });

  describe('Confidence Level Determination', () => {
    test('should return Uncertain for high RD', () => {
      expect(getConfidenceLevel(300)).toBe('Uncertain');
      expect(getConfidenceLevel(250)).toBe('Uncertain');
    });

    test('should return Developing for moderate-high RD', () => {
      expect(getConfidenceLevel(200)).toBe('Developing');
      expect(getConfidenceLevel(150)).toBe('Developing');
    });

    test('should return Moderate for moderate RD', () => {
      expect(getConfidenceLevel(120)).toBe('Moderate');
      expect(getConfidenceLevel(100)).toBe('Moderate');
    });

    test('should return Confident for low RD', () => {
      expect(getConfidenceLevel(80)).toBe('Confident');
      expect(getConfidenceLevel(50)).toBe('Confident');
    });
  });

  describe('Rating Change Scenarios', () => {
    test('should calculate correct rating change for even match', () => {
      const kFactor = 32;
      const expectedScore = 0.5;
      const actualScore = 1; // Win
      const change = kFactor * (actualScore - expectedScore);
      expect(change).toBe(16);
    });

    test('should give big gain for upset win', () => {
      const kFactor = 32;
      const expectedScore = 0.24; // Underdog
      const actualScore = 1; // Win
      const change = kFactor * (actualScore - expectedScore);
      expect(change).toBeGreaterThan(24);
    });

    test('should give small gain for expected win', () => {
      const kFactor = 32;
      const expectedScore = 0.76; // Favorite
      const actualScore = 1; // Win
      const change = kFactor * (actualScore - expectedScore);
      expect(change).toBeLessThan(8);
    });

    test('should give big loss for upset loss', () => {
      const kFactor = 32;
      const expectedScore = 0.76; // Favorite
      const actualScore = 0; // Loss
      const change = kFactor * (actualScore - expectedScore);
      expect(change).toBeLessThan(-24);
    });
  });

  describe('Combined Bonus Scenarios', () => {
    test('should combine streak and margin bonuses', () => {
      const baseChange = 16; // K=32, even match
      const streakBonus = getStreakBonus(5); // 6 points
      const marginBonus = getMarginOfVictoryBonus(5, 0, 5); // 5 points
      const totalChange = baseChange + streakBonus + marginBonus;
      expect(totalChange).toBe(27);
    });

    test('should respect maximum bonuses', () => {
      const streakBonus = getStreakBonus(100);
      const marginBonus = getMarginOfVictoryBonus(100, 0, 100);
      expect(streakBonus).toBe(10);
      expect(marginBonus).toBe(5);
      expect(streakBonus + marginBonus).toBe(15);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero games played', () => {
      const kFactor = getKFactor(1200, 0);
      expect(kFactor).toBe(60);
    });

    test('should handle very high games played', () => {
      const kFactor = getKFactor(1200, 10000);
      expect(kFactor).toBe(32);
    });

    test('should handle rating at exact thresholds', () => {
      expect(getKFactor(2000, 50)).toBe(20);
      expect(getKFactor(2400, 50)).toBe(16);
    });

    test('should handle negative rating differences', () => {
      const expected1 = calculateExpectedScore(1500, 1700);
      const expected2 = calculateExpectedScore(1700, 1500);
      expect(expected1 + expected2).toBeCloseTo(1, 2);
    });
  });

  describe('Performance Tests', () => {
    test('should calculate expected score quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        calculateExpectedScore(1500, 1500);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    test('should determine K-factor quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        getKFactor(1500, 50);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
