import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { UserRow } from '../types/index.js';
import { ADMIN_002, ADMIN_003, sendError } from '../types/errors.js';
import { startScan, getScanState } from '../services/scanner.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  // POST /admin/scan
  fastify.post('/admin/scan', { preHandler: [fastify.requireAdmin] }, async (_request, reply) => {
    const state = getScanState();
    if (state.status === 'running') {
      return sendError(reply, ADMIN_003);
    }

    // Start scan in background
    startScan();

    return reply.code(202).send({
      data: {
        status: 'started',
        message: '扫描任务已启动，将在后台异步执行',
      },
    });
  });

  // GET /admin/scan/status
  fastify.get('/admin/scan/status', { preHandler: [fastify.requireAdmin] }, async (_request, reply) => {
    const state = getScanState();
    return reply.send({ data: state });
  });

  // GET /admin/users
  fastify.get('/admin/users', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };
    const db = getDb();
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const safeOffset = Math.max(0, offset);

    const users = db.prepare('SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?').all(
      safeLimit, safeOffset,
    ) as UserRow[];

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

  // PATCH /admin/users/:id/approve
  fastify.patch('/admin/users/:id/approve', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approved } = request.body as { approved?: boolean };
    const userId = parseInt(id, 10);
    const db = getDb();

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as { id: number; username: string } | undefined;
    if (!user) {
      return sendError(reply, ADMIN_002);
    }

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
