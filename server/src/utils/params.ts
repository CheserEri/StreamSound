/**
 * 路由参数解析工具
 */

/**
 * 解析路径参数中的 ID，返回正整数或 NaN
 */
export function parseId(id: string): number {
  return parseInt(id, 10);
}

/**
 * 检查 ID 是否有效（正整数）
 */
export function isValidId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}
