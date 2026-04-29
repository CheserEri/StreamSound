/**
 * 数据库客户端
 * 管理 SQLite 数据库连接和初始化
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { config } from '../config.js';

// 数据库连接实例
let db: Database.Database | null = null;

/**
 * 获取数据库连接
 * @returns SQLite 数据库实例
 * @throws Error 如果数据库未初始化
 */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

/**
 * 初始化数据库连接
 * 创建数据库目录、连接数据库并执行 schema
 * @returns SQLite 数据库实例
 */
export function initDb(): Database.Database {
  // 确保数据库目录存在
  const dbDir = dirname(resolve(config.DB_PATH));
  mkdirSync(dbDir, { recursive: true });

  // 创建数据库连接
  db = new Database(resolve(config.DB_PATH));

  // 配置数据库
  db.pragma('journal_mode = WAL');  // 使用 WAL 模式提高并发性能
  db.pragma('foreign_keys = ON');  // 启用外键约束

  // 执行 schema 初始化
  const schemaPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'schema.sql',
  );
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
