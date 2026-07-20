import { useToastStore } from '../store/useToastStore';

interface MeshOptions {
  name: string;
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

/**
 * Service Mesh Pattern for Frontend Logic
 * Wraps asynchronous functions to provide:
 * 1. Performance Tracing (Logging execution time)
 * 2. Timeout Control
 * 3. Automatic Retries
 * 4. Centralized Error Handling (Toasts)
 */
export class ServiceMesh {
  static async execute<T>(
    operation: () => Promise<T>,
    options: MeshOptions
  ): Promise<T> {
    const { name, timeoutMs, retryCount = 0, retryDelayMs = 1000 } = options;
    const startTime = performance.now();
    let attempt = 0;

    const runWithTimeout = async (): Promise<T> => {
      if (!timeoutMs) return operation();

      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        operation()
          .then((res) => {
            clearTimeout(timer);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    while (attempt <= retryCount) {
      try {
        const result = await runWithTimeout();
        const duration = performance.now() - startTime;
        console.log(`[ServiceMesh] ${name} completed successfully in ${duration.toFixed(2)}ms (Attempt ${attempt + 1}/${retryCount + 1})`);
        return result;
      } catch (error: any) {
        attempt++;
        const isLastAttempt = attempt > retryCount;
        
        console.warn(`[ServiceMesh] ${name} failed on attempt ${attempt}. Error: ${error.message}`);
        
        if (isLastAttempt) {
          // Centralized Error Boundary
          useToastStore.getState().addToast({
            type: 'error',
            message: `[${name} Error] ${error.message}`
          });
          throw error;
        }

        // Wait before retry
        await new Promise(res => setTimeout(res, retryDelayMs));
      }
    }

    throw new Error('Unreachable state in ServiceMesh');
  }
}
