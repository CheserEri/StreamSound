/**
 * 数据库迁移
 * 为已有数据库添加新列
 */
import { getDb } from './client.js';

export function runMigrations(): void {
  const db = getDb();

  // 检查 cover_dominant_color 列是否存在
  const columns = db.prepare("PRAGMA table_info('tracks')").all() as { name: string }[];
  const hasDominantColor = columns.some((c) => c.name === 'cover_dominant_color');

  if (!hasDominantColor) {
    db.exec('ALTER TABLE tracks ADD COLUMN cover_dominant_color TEXT');
    console.log('[DB] Migration: added cover_dominant_color column');
  }
}
