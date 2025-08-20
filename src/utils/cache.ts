/**
 * Simple in-memory cache with TTL support
 * @module utils/cache
 */

interface CacheOptions {
  maxSize?: number;
  ttl?: number;
}

/**
 * Cache implementation with TTL and size limits
 */
export class Cache {
  private maxSize: number;
  private ttl: number;
  private cache: Map<string, any>;
  private timestamps: Map<string, number>;

  /**
   * @param {Object} options - Cache configuration
   * @param {number} options.maxSize - Maximum number of entries
   * @param {number} options.ttl - Time to live in milliseconds
   */
  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key: string): any {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const timestamp = this.timestamps.get(key);
    if (!timestamp) {
      return undefined;
    }
    const age = Date.now() - timestamp;

    // Check if expired
    if (age > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Move to end (LRU)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key: string, value: any): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete from cache
   * @param {string} key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of cached entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

// Default cache instances
export const evaluationCache = new Cache({ maxSize: 500, ttl: 3600000 });
export const improvementCache = new Cache({ maxSize: 200, ttl: 7200000 });
export const patternCache = new Cache({ maxSize: 50, ttl: 86400000 });