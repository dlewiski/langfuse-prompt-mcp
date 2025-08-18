/**
 * Simple in-memory cache with TTL support
 * @module utils/cache
 */

/**
 * Cache implementation with TTL and size limits
 */
export class Cache {
  /**
   * @param {Object} options - Cache configuration
   * @param {number} options.maxSize - Maximum number of entries
   * @param {number} options.ttl - Time to live in milliseconds
   */
  constructor(options = {}) {
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
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const timestamp = this.timestamps.get(key);
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
  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    // Update or add
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete entry from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    this.timestamps.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of entries
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   * @returns {number} Number of entries removed
   */
  cleanExpired() {
    const now = Date.now();
    let removed = 0;

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton caches for different purposes
export const evaluationCache = new Cache({ maxSize: 50, ttl: 600000 }); // 10 min
export const patternCache = new Cache({ maxSize: 20, ttl: 1800000 }); // 30 min
export const categoryCache = new Cache({ maxSize: 200, ttl: 3600000 }); // 1 hour