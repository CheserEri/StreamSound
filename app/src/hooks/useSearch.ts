import { useState, useCallback, useRef } from 'react';
import api from '../services/api';
import type { SearchResult } from '../types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (!q.trim()) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/search', {
        params: { q, limit: 20 },
        signal: controller.signal,
      });
      setResult(response.data.data);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') {
        setError('搜索失败，请检查网络');
        setResult(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const debouncedSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        search(q);
      }, 300);
    },
    [search],
  );

  const clearSearch = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery('');
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    query,
    result,
    isLoading,
    error,
    search: debouncedSearch,
    clearSearch,
  };
}
