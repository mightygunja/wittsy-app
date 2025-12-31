/**
 * Error Tracking Service
 * Centralized error handling and reporting
 */

import { analytics } from './analytics';

class ErrorTrackingService {
  private errorHandlers: ((error: Error, context?: any) => void)[] = [];

  /**
   * Initialize error tracking
   */
  initialize() {
    // Set up global error handler
    if (ErrorUtils) {
      const defaultHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.logError(error, { isFatal });
        defaultHandler(error, isFatal);
      });
    }

    // Handle unhandled promise rejections (web only)
    // Note: React Native doesn't support window.addEventListener
    // Unhandled rejections will be caught by ErrorUtils instead
  }

  /**
   * Log error to analytics and console
   */
  logError(error: Error, context?: any) {
    // Log to console in development
    if (__DEV__) {
      console.error('Error:', error, context);
    }

    // Log to analytics
    analytics.logError(error.name, error.message);

    // Notify error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (e) {
        console.error('Error handler failed:', e);
      }
    });
  }

  /**
   * Add custom error handler
   */
  addErrorHandler(handler: (error: Error, context?: any) => void) {
    this.errorHandlers.push(handler);
  }

  /**
   * Remove error handler
   */
  removeErrorHandler(handler: (error: Error, context?: any) => void) {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  /**
   * Wrap async function with error handling
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    func: T,
    context?: string
  ): T {
    return (async (...args: any[]) => {
      try {
        return await func(...args);
      } catch (error) {
        this.logError(error as Error, { context, args });
        throw error;
      }
    }) as T;
  }

  /**
   * Wrap sync function with error handling
   */
  wrapSync<T extends (...args: any[]) => any>(
    func: T,
    context?: string
  ): T {
    return ((...args: any[]) => {
      try {
        return func(...args);
      } catch (error) {
        this.logError(error as Error, { context, args });
        throw error;
      }
    }) as T;
  }

  /**
   * Try-catch wrapper with default value
   */
  async tryCatch<T>(
    func: () => Promise<T>,
    defaultValue: T,
    context?: string
  ): Promise<T> {
    try {
      return await func();
    } catch (error) {
      this.logError(error as Error, { context });
      return defaultValue;
    }
  }

  /**
   * Log warning (non-critical error)
   */
  logWarning(message: string, context?: any) {
    if (__DEV__) {
      console.warn('Warning:', message, context);
    }
    
    analytics.logEvent('warning', {
      message,
      context: JSON.stringify(context),
    });
  }

  /**
   * Log info message
   */
  logInfo(message: string, context?: any) {
    if (__DEV__) {
      console.log('Info:', message, context);
    }
    
    analytics.logEvent('info', {
      message,
      context: JSON.stringify(context),
    });
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService();

// Export convenience functions
export const errorTracking = {
  initialize: () => errorTrackingService.initialize(),
  logError: (error: Error, context?: any) => errorTrackingService.logError(error, context),
  addErrorHandler: (handler: (error: Error, context?: any) => void) =>
    errorTrackingService.addErrorHandler(handler),
  removeErrorHandler: (handler: (error: Error, context?: any) => void) =>
    errorTrackingService.removeErrorHandler(handler),
  wrapAsync: <T extends (...args: any[]) => Promise<any>>(func: T, context?: string) =>
    errorTrackingService.wrapAsync(func, context),
  wrapSync: <T extends (...args: any[]) => any>(func: T, context?: string) =>
    errorTrackingService.wrapSync(func, context),
  tryCatch: <T>(func: () => Promise<T>, defaultValue: T, context?: string) =>
    errorTrackingService.tryCatch(func, defaultValue, context),
  logWarning: (message: string, context?: any) => errorTrackingService.logWarning(message, context),
  logInfo: (message: string, context?: any) => errorTrackingService.logInfo(message, context),
};
