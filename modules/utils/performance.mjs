/**
 * Performance optimization utilities
 * Provides memoization, caching, and debouncing for better performance
 */

/**
 * Creates a memoized version of a function
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Optional key generator function
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyGenerator = null) {
    const cache = new Map();
    
    return function(...args) {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
    let timeoutId;
    
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Creates a throttled version of a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * LRU Cache implementation for managing memory usage
 */
export class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    
    get(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return undefined;
    }
    
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove least recently used item
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }
    
    has(key) {
        return this.cache.has(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    get size() {
        return this.cache.size;
    }
}

/**
 * Optimized DOM operations
 */
export const DOMOptimizer = {
    /**
     * Batches DOM reads to avoid layout thrashing
     * @param {Function[]} readOperations - Array of read operations
     * @returns {Array} Results of read operations
     */
    batchReads(readOperations) {
        return readOperations.map(fn => fn());
    },
    
    /**
     * Batches DOM writes to avoid layout thrashing
     * @param {Function[]} writeOperations - Array of write operations
     */
    batchWrites(writeOperations) {
        requestAnimationFrame(() => {
            writeOperations.forEach(fn => fn());
        });
    },
    
    /**
     * Creates a document fragment for efficient DOM manipulation
     * @param {HTMLElement[]} elements - Elements to add to fragment
     * @returns {DocumentFragment} Document fragment
     */
    createFragment(elements) {
        const fragment = document.createDocumentFragment();
        elements.forEach(el => fragment.appendChild(el));
        return fragment;
    }
};

/**
 * Performance monitor for debugging
 */
export class PerformanceMonitor {
    constructor() {
        this.timings = new Map();
    }
    
    start(label) {
        this.timings.set(label, performance.now());
    }
    
    end(label) {
        const startTime = this.timings.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`${label}: ${duration.toFixed(2)}ms`);
            this.timings.delete(label);
            return duration;
        }
    }
    
    measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label);
        return result;
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();