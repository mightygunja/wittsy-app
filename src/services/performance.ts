/**
 * Performance Optimization Service
 * Monitor and optimize app performance
 */

import { InteractionManager } from 'react-native';
import { analytics } from './analytics';

class PerformanceService {
  private metrics: Map<string, number> = new Map();

  /**
   * Measure component render time
   */
  startMeasure(metricName: string) {
    this.metrics.set(metricName, Date.now());
  }

  /**
   * End measurement and log to analytics
   */
  endMeasure(metricName: string) {
    const startTime = this.metrics.get(metricName);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.metrics.delete(metricName);
      
      // Log to analytics if duration is significant
      if (duration > 100) {
        analytics.measurePerformance(metricName, duration);
      }
      
      return duration;
    }
    return 0;
  }

  /**
   * Run task after interactions complete
   */
  async runAfterInteractions(task: () => void | Promise<void>) {
    return new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(async () => {
        await task();
        resolve();
      });
    });
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Memoize expensive function results
   */
  memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Batch multiple updates together
   */
  batchUpdates<T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<void>
  ): Promise<void> {
    return new Promise(async (resolve) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await processor(batch);
        
        // Allow UI to update between batches
        await new Promise(r => setTimeout(r, 0));
      }
      resolve();
    });
  }

  /**
   * Lazy load data with pagination
   */
  async lazyLoad<T>(
    loader: (offset: number, limit: number) => Promise<T[]>,
    pageSize: number = 20
  ): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await loader(offset, pageSize);
      results.push(...batch);
      
      if (batch.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }
    }

    return results;
  }

  /**
   * Monitor memory usage (development only)
   */
  logMemoryUsage() {
    if (__DEV__) {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        console.log('Memory Usage:', {
          used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
        });
      }
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();

// Export convenience functions
export const performance = {
  startMeasure: (name: string) => performanceService.startMeasure(name),
  endMeasure: (name: string) => performanceService.endMeasure(name),
  runAfterInteractions: (task: () => void | Promise<void>) => performanceService.runAfterInteractions(task),
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => performanceService.debounce(func, wait),
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => performanceService.throttle(func, limit),
  memoize: <T extends (...args: any[]) => any>(func: T) => performanceService.memoize(func),
  batchUpdates: <T>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<void>) =>
    performanceService.batchUpdates(items, batchSize, processor),
  lazyLoad: <T>(loader: (offset: number, limit: number) => Promise<T[]>, pageSize?: number) =>
    performanceService.lazyLoad(loader, pageSize),
  logMemoryUsage: () => performanceService.logMemoryUsage(),
};
