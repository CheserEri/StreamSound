import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import type { UserRow } from '../types/index.js';
import { AUTH_001, AUTH_002, AUTH_005, AUTH_006, AUTH_007, sendError } from '../types/errors.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    if (!username || !password) {
      return sendError(reply, AUTH_001);
    }

    if (username.length < 2 || username.length > 32 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return reply.code(400).send({
        error: {
          code: 'AUTH_001',
          message: '用户名格式不正确',
          detail: 'Username must be 2-32 characters, alphanumeric and underscore only',
        },
      });
    }

    if (password.length < 8 || password.length > 72) {
      return reply.code(400).send({
        error: {
          code: 'AUTH_001',
          message: '密码长度不正确',
          detail: 'Password must be 8-72 characters',
        },
      });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return sendError(reply, AUTH_007);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = Math.floor(Date.now() / 1000);

    // Check if this is the first user
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const isFirstUser = userCount.count === 0;

    // First user is auto-admin, others follow REQUIRE_APPROVAL setting
    const role = isFirstUser ? 'admin' : 'user';
    const approved = isFirstUser || !config.REQUIRE_APPROVAL ? 1 : 0;

    const result = db.prepare(
      'INSERT INTO users (username, password, role, approved, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(username, hashedPassword, role, approved, now);

    return reply.code(201).send({
      data: {
        id: result.lastInsertRowid,
        username,
        role,
        approved: approved === 1,
        message: approved === 1
          ? '注册成功'
          : '注册成功，请等待管理员审核',
      },
    });
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    if (!username || !password) {
      return sendError(reply, AUTH_001);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;

    if (!user) {
      return sendError(reply, AUTH_002);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return sendError(reply, AUTH_002);
    }

    if (!user.approved) {
      return sendError(reply, AUTH_006);
    }

    const accessToken = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      { expiresIn: config.JWT_ACCESS_EXPIRES },
    );

    const refreshToken = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      { expiresIn: config.JWT_REFRESH_EXPIRES },
    );

    return reply.send({
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (!refreshToken) {
      return sendError(reply, AUTH_005);
    }

    try {
      const decoded = fastify.jwt.verify<{ id: number; username: string; role: 'user' | 'admin' }>(refreshToken);

      const accessToken = fastify.jwt.sign(
        { id: decoded.id, username: decoded.username, role: decoded.role },
        { expiresIn: config.JWT_ACCESS_EXPIRES },
      );

      return reply.send({
        data: { accessToken },
      });
    } catch {
      return sendError(reply, AUTH_005);
    }
  });
}
