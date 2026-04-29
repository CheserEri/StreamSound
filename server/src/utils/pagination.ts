/**
 * 分页参数解析工具
 */

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * 从 query 参数中解析安全的分页值
 * @param query 请求 query 对象
 * @param maxLimit 最大每页条数（默认 200）
 */
export function parsePagination(
  query: { limit?: number; offset?: number },
  maxLimit = 200,
): PaginationParams {
  const limit = Number(query.limit) || 50;
  const offset = Number(query.offset) || 0;
  return {
    limit: Math.min(Math.max(1, limit), maxLimit),
    offset: Math.max(0, offset),
  };
}
