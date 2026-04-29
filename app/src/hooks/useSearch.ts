/**
 * 搜索功能 Hook
 * 提供带防抖的搜索功能，支持取消正在进行的请求
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';
import type { SearchResult } from '../types';

/**
 * 搜索功能 Hook
 */
export function useSearch() {
  // 搜索关键词
  const [query, setQuery] = useState('');
  // 搜索结果
  const [result, setResult] = useState<SearchResult | null>(null);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 防抖定时器引用
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 请求取消控制器引用
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 执行搜索请求
   */
  const search = useCallback(async (q: string) => {
    // 取消之前的请求
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // 如果搜索词为空，清空结果
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
      // 忽略取消的请求错误
      if (err?.code !== 'ERR_CANCELED') {
        setError('搜索失败，请检查网络');
        setResult(null);
      }
    } finally {
      // 只有在请求未被取消时才更新状态
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * 带防抖的搜索函数
   * 延迟 300ms 执行搜索，避免频繁请求
   */
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

  // Cleanup debounce timer and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  /**
   * 清除搜索状态
   */
  const clearSearch = useCallback(() => {
    // 取消进行中的请求
    if (abortRef.current) {
      abortRef.current.abort();
    }
    // 清除定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // 重置状态
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
