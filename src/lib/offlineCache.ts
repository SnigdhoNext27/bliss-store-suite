import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const CACHE_PREFIX = 'almans_cache_';
const CACHE_EXPIRY_KEY = 'almans_cache_expiry_';
const DEFAULT_CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CacheOptions {
  duration?: number; // Cache duration in milliseconds
}

class OfflineCacheService {
  private isNative = Capacitor.isNativePlatform();
  private memoryCache = new Map<string, { data: unknown; expiry: number }>();

  /**
   * Store data in cache
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const { duration = DEFAULT_CACHE_DURATION } = options;
    const expiry = Date.now() + duration;
    const cacheKey = CACHE_PREFIX + key;
    const expiryKey = CACHE_EXPIRY_KEY + key;

    // Always store in memory cache
    this.memoryCache.set(key, { data, expiry });

    if (this.isNative) {
      // Use Capacitor Preferences for native
      await Preferences.set({ key: cacheKey, value: JSON.stringify(data) });
      await Preferences.set({ key: expiryKey, value: expiry.toString() });
    } else {
      // Use localStorage for web
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(expiryKey, expiry.toString());
      } catch (e) {
        console.warn('Failed to store in localStorage:', e);
      }
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiry > Date.now()) {
      return memoryEntry.data as T;
    }

    const cacheKey = CACHE_PREFIX + key;
    const expiryKey = CACHE_EXPIRY_KEY + key;

    try {
      let data: string | null = null;
      let expiry: string | null = null;

      if (this.isNative) {
        const dataResult = await Preferences.get({ key: cacheKey });
        const expiryResult = await Preferences.get({ key: expiryKey });
        data = dataResult.value;
        expiry = expiryResult.value;
      } else {
        data = localStorage.getItem(cacheKey);
        expiry = localStorage.getItem(expiryKey);
      }

      if (!data || !expiry) return null;

      // Check if expired
      if (parseInt(expiry) < Date.now()) {
        await this.remove(key);
        return null;
      }

      const parsed = JSON.parse(data) as T;
      
      // Update memory cache
      this.memoryCache.set(key, { data: parsed, expiry: parseInt(expiry) });
      
      return parsed;
    } catch (e) {
      console.warn('Failed to get from cache:', e);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = CACHE_PREFIX + key;
    const expiryKey = CACHE_EXPIRY_KEY + key;

    this.memoryCache.delete(key);

    if (this.isNative) {
      await Preferences.remove({ key: cacheKey });
      await Preferences.remove({ key: expiryKey });
    } else {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();

    if (this.isNative) {
      const { keys } = await Preferences.keys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_EXPIRY_KEY));
      for (const key of cacheKeys) {
        await Preferences.remove({ key });
      }
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_KEY))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Check if we're online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Fetch with cache fallback - tries network first, falls back to cache
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ data: T; fromCache: boolean } | null> {
    // If online, try to fetch fresh data
    if (this.isOnline()) {
      try {
        const data = await fetcher();
        await this.set(key, data, options);
        return { data, fromCache: false };
      } catch (e) {
        console.warn('Network fetch failed, trying cache:', e);
      }
    }

    // Fallback to cache
    const cached = await this.get<T>(key);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    return null;
  }
}

export const offlineCache = new OfflineCacheService();
