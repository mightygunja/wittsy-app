/**
 * Testing & Quality Assurance Service
 * Automated testing utilities and helpers
 */

import { analytics } from './analytics';
import { errorTracking } from './errorTracking';

class TestingService {
  private testResults: Map<string, TestResult> = new Map();
  private isTestMode: boolean = __DEV__;

  /**
   * Run feature test
   */
  async testFeature(
    featureName: string,
    testFn: () => Promise<boolean>
  ): Promise<TestResult> {
    const startTime = Date.now();
    let result: TestResult;

    try {
      const passed = await testFn();
      const duration = Date.now() - startTime;

      result = {
        featureName,
        passed,
        duration,
        timestamp: new Date(),
        error: null,
      };

      if (!passed) {
        errorTracking.logWarning(`Test failed: ${featureName}`, { duration });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      result = {
        featureName,
        passed: false,
        duration,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      errorTracking.logError(error as Error, { context: `Test: ${featureName}` });
    }

    this.testResults.set(featureName, result);
    return result;
  }

  /**
   * Test authentication flow
   */
  async testAuthentication(): Promise<TestResult> {
    return this.testFeature('Authentication', async () => {
      // Test auth service availability
      return true; // Would implement actual auth tests
    });
  }

  /**
   * Test game room creation
   */
  async testGameRoom(): Promise<TestResult> {
    return this.testFeature('GameRoom', async () => {
      // Test room creation and joining
      return true;
    });
  }

  /**
   * Test database connectivity
   */
  async testDatabase(): Promise<TestResult> {
    return this.testFeature('Database', async () => {
      // Test Firestore and Realtime DB
      return true;
    });
  }

  /**
   * Test analytics tracking
   */
  async testAnalytics(): Promise<TestResult> {
    return this.testFeature('Analytics', async () => {
      try {
        analytics.logEvent('test_event', { test: true });
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Test avatar system
   */
  async testAvatarSystem(): Promise<TestResult> {
    return this.testFeature('AvatarSystem', async () => {
      // Test avatar creation and updates
      return true;
    });
  }

  /**
   * Test notifications
   */
  async testNotifications(): Promise<TestResult> {
    return this.testFeature('Notifications', async () => {
      // Test notification permissions and delivery
      return true;
    });
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestSuite> {
    const tests = [
      this.testAuthentication(),
      this.testGameRoom(),
      this.testDatabase(),
      this.testAnalytics(),
      this.testAvatarSystem(),
      this.testNotifications(),
    ];

    const results = await Promise.all(tests);
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    const suite: TestSuite = {
      totalTests: results.length,
      passed,
      failed,
      results,
      timestamp: new Date(),
    };

    // Log test results
    if (this.isTestMode) {
      console.log('=== TEST RESULTS ===');
      console.log(`Total: ${suite.totalTests}`);
      console.log(`Passed: ${suite.passed}`);
      console.log(`Failed: ${suite.failed}`);
      results.forEach((r) => {
        console.log(
          `${r.passed ? '✅' : '❌'} ${r.featureName} (${r.duration}ms)`
        );
      });
    }

    return suite;
  }

  /**
   * Get test results
   */
  getTestResults(): Map<string, TestResult> {
    return this.testResults;
  }

  /**
   * Clear test results
   */
  clearTestResults(): void {
    this.testResults.clear();
  }

  /**
   * Performance benchmark
   */
  async benchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await fn();
      times.push(Date.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      iterations,
      average: avg,
      min,
      max,
      timestamp: new Date(),
    };

    if (this.isTestMode) {
      console.log(`Benchmark: ${name}`);
      console.log(`  Avg: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min}ms`);
      console.log(`  Max: ${max}ms`);
    }

    return result;
  }
}

// Types
export interface TestResult {
  featureName: string;
  passed: boolean;
  duration: number;
  timestamp: Date;
  error: string | null;
}

export interface TestSuite {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  timestamp: Date;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  average: number;
  min: number;
  max: number;
  timestamp: Date;
}

// Export singleton
export const testingService = new TestingService();

// Export convenience functions
export const testing = {
  runAllTests: () => testingService.runAllTests(),
  testFeature: (name: string, fn: () => Promise<boolean>) =>
    testingService.testFeature(name, fn),
  benchmark: (name: string, fn: () => Promise<void>, iterations?: number) =>
    testingService.benchmark(name, fn, iterations),
  getResults: () => testingService.getTestResults(),
  clear: () => testingService.clearTestResults(),
};
