/**
 * 管理员路由
 * 提供管理员专属功能，包括音乐扫描、用户管理等
 */
import type { FastifyInstance } from 'fastify';
import { access } from 'fs/promises';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import type { UserRow } from '../types/index.js';
import { ADMIN_002, ADMIN_003, ADMIN_004, sendError } from '../types/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { parseId, isValidId } from '../utils/params.js';
import { startScan, getScanState } from '../services/scanner.js';

/**
 * 注册管理员路由
 * @param fastify Fastify 实例
 */
export default async function adminRoutes(fastify: FastifyInstance) {
  /**
   * 获取音乐根目录接口
   * GET /admin/scan/music-root
   * 
   * 需要管理员权限，返回当前配置的音乐目录路径
   */
  fastify.get('/admin/scan/music-root', { preHandler: [fastify.requireAdmin] }, async (_request, reply) => {
    return reply.send({
      data: {
        musicRoot: config.MUSIC_ROOT,
      },
    });
  });

  /**
   * 启动音乐扫描接口
   * POST /admin/scan
   * 
   * 需要管理员权限，启动后台音乐扫描任务
   */
  fastify.post('/admin/scan', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    // 检查是否已有扫描任务在运行
    const state = getScanState();
    if (state.status === 'running') {
      return sendError(reply, ADMIN_003);
    }

    const { musicRoot } = (request.body || {}) as { musicRoot?: string };

    // 验证提供的路径是否存在
    if (musicRoot) {
      try {
        await access(musicRoot);
      } catch {
        return sendError(reply, ADMIN_004);
      }
    }

    // 在后台启动扫描
    startScan(musicRoot);

    return reply.code(202).send({
      data: {
        status: 'started',
        message: '扫描任务已启动，将在后台异步执行',
      },
    });
  });

  /**
   * 获取扫描状态接口
   * GET /admin/scan/status
   * 
   * 需要管理员权限，返回当前扫描任务的状态
   */
  fastify.get('/admin/scan/status', { preHandler: [fastify.requireAdmin] }, async (_request, reply) => {
    const state = getScanState();
    return reply.send({ data: state });
  });

  /**
   * 获取用户列表接口
   * GET /admin/users
   * 
   * 需要管理员权限，返回所有用户列表（分页）
   */
  fastify.get('/admin/users', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { limit: safeLimit, offset: safeOffset } = parsePagination(request.query as { limit?: number; offset?: number });
    const db = getDb();

    // 查询用户列表
    const users = db.prepare('SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?').all(
      safeLimit, safeOffset,
    ) as UserRow[];

    // 查询用户总数
    const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;

    return reply.send({
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        approved: u.approved === 1,
        createdAt: u.created_at,
      })),
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  });

  /**
   * 审核用户接口
   * PATCH /admin/users/:id/approve
   * 
   * 需要管理员权限，批准或拒绝用户注册请求
   */
  fastify.patch('/admin/users/:id/approve', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approved } = request.body as { approved?: boolean };
    const userId = parseId(id);

    if (!isValidId(userId)) {
      return sendError(reply, ADMIN_002);
    }
    const db = getDb();

    // 检查用户是否存在
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as { id: number; username: string } | undefined;
    if (!user) {
      return sendError(reply, ADMIN_002);
    }

    // 更新用户审核状态
    db.prepare('UPDATE users SET approved = ? WHERE id = ?').run(approved ? 1 : 0, userId);

    return reply.send({
      data: {
        id: user.id,
        username: user.username,
        approved: approved ?? false,
      },
    });
  });
}
