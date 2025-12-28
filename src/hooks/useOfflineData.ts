import { useState, useEffect, useCallback } from 'react';
import { offlineCache } from '@/lib/offlineCache';
import { useToast } from '@/hooks/use-toast';

interface UseOfflineDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  cacheDuration?: number;
  showOfflineToast?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isFromCache: boolean;
  isOffline: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOfflineData<T>({
  key,
  fetcher,
  cacheDuration,
  showOfflineToast = true,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (showOfflineToast) {
        toast({
          title: 'Back online',
          description: 'Your connection has been restored.',
        });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (showOfflineToast) {
        toast({
          title: 'You\'re offline',
          description: 'Showing cached data. Some features may be limited.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showOfflineToast, toast]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await offlineCache.fetchWithCache(key, fetcher, {
        duration: cacheDuration,
      });

      if (result) {
        setData(result.data);
        setIsFromCache(result.fromCache);

        if (result.fromCache && showOfflineToast) {
          toast({
            title: 'Showing cached data',
            description: 'Unable to fetch fresh data. Displaying previously saved content.',
          });
        }
      } else {
        setError(new Error('No data available'));
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, cacheDuration, showOfflineToast, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isFromCache,
    isOffline,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook to monitor online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
