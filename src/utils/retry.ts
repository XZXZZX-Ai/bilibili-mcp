import { redactSecrets } from "./logger.js";

/**
 * 重试机制模块
 * 提供带指数退避的请求重试功能
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatusCodes?: number[];
  retryableErrorTypes?: string[];
}

interface RetryStats {
  attempts: number;
  successes: number;
  failures: number;
  lastError?: Error;
  lastAttemptTime?: number;
}

class RetryManager {
  private stats: RetryStats = {
    attempts: 0,
    successes: 0,
    failures: 0
  };

  constructor() {}

  /**
   * 带重试的函数执行
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      retryableStatusCodes = [408, 429, 500, 502, 503, 504],
      retryableErrorTypes = ['NetworkError', 'TimeoutError', 'AbortError']
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.stats.attempts++;
        const startTime = Date.now();
        
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt, baseDelay, maxDelay);
          console.error(`Retrying attempt ${attempt}/${maxRetries} after ${delay}ms...`);
          await this.delay(delay);
        }

        const result = await fn();
        
        this.stats.successes++;
        this.stats.lastAttemptTime = Date.now() - startTime;
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // 检查是否应该重试
        if (attempt >= maxRetries) {
          this.stats.failures++;
          this.stats.lastError = error;
          throw error;
        }

        // 检查是否为可重试的错误
        if (!this.shouldRetry(error, retryableStatusCodes, retryableErrorTypes)) {
          this.stats.failures++;
          this.stats.lastError = error;
          throw error;
        }

        console.error(
          `Attempt ${attempt} failed, will retry:`,
          redactSecrets(error.message),
        );
      }
    }

    throw lastError;
  }

  /**
   * 计算重试延迟（指数退避 + 抖动）
   */
  private calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
    // 指数退避: baseDelay * (2^attempt) * (1 + 0.1 * 随机数)
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = 1 + Math.random() * 0.2; // 10% 抖动
    const delay = Math.min(exponentialDelay * jitter, maxDelay);
    return Math.floor(delay);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查是否应该重试
   */
  private shouldRetry(
    error: any,
    retryableStatusCodes: number[],
    retryableErrorTypes: string[]
  ): boolean {
    // 状态码优先：有明确状态码时只看状态码
    if (typeof error.statusCode === 'number') {
      return retryableStatusCodes.includes(error.statusCode);
    }

    // 检查错误类型
    if (error.name && retryableErrorTypes.includes(error.name)) {
      return true;
    }

    // 检查网络错误
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }

  /**
   * 获取重试统计
   */
  getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0
    };
  }
}

// 导出单例实例
export const retryManager = new RetryManager();

/**
 * 便捷的重试包装函数
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryManager.execute(fn, options);
}
