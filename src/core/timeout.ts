import { GPUTimeoutError } from './errors';

/**
 * Options for GPU timeout wrapper
 */
export interface TimeoutOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Custom error message */
  message?: string;
}

/**
 * Wraps a GPU async operation with a timeout
 * @param operation - The async GPU operation to wrap
 * @param options - Timeout options
 * @returns The result of the operation
 * @throws GPUTimeoutError if the operation times out
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   buffer.mapAsync(GPUMapMode.READ),
 *   { timeoutMs: 5000, message: 'Buffer mapping timed out' }
 * );
 * ```
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const { timeoutMs = 30000, message = 'GPU operation timed out' } = options;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new GPUTimeoutError(message));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Creates a timeout wrapper with default options
 * @param defaultOptions - Default timeout options
 * @returns A function that wraps operations with timeout
 */
export function createTimeoutWrapper(defaultOptions: TimeoutOptions) {
  return <T>(operation: Promise<T>, options?: TimeoutOptions) =>
    withTimeout(operation, { ...defaultOptions, ...options });
}
