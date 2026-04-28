import { useState, useCallback, useRef } from 'react';
import api from '../services/api';
import type { SearchResult } from '../types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/search', { params: { q, limit: 20 } });
      setResult(response.data.data);
    } catch (err) {
      setError('搜索失败，请检查网络');
      setResult(null);
    } finally {
      setIsLoading(false);
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
    setQuery('');
    setResult(null);
    setError(null);
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
