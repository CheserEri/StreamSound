/**
 * 认证路由
 * 处理用户注册、登录和令牌刷新
 */
import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import type { UserRow } from '../types/index.js';
import { AUTH_001, AUTH_002, AUTH_005, AUTH_006, AUTH_007, sendError } from '../types/errors.js';

/**
 * 注册认证路由
 * @param fastify Fastify 实例
 */
export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * 用户注册接口
   * POST /auth/register
   * 
   * 第一个注册的用户自动成为管理员，其他用户根据配置决定是否需要审核
   */
  fastify.post('/auth/register', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    // 参数验证
    if (!username || !password) {
      return sendError(reply, AUTH_001);
    }

    // 用户名格式验证：2-32个字符，只允许字母、数字和下划线
    if (username.length < 2 || username.length > 32 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return reply.code(400).send({
        error: {
          code: 'AUTH_001',
          message: '用户名格式不正确',
          detail: 'Username must be 2-32 characters, alphanumeric and underscore only',
        },
      });
    }

    // 密码长度验证：8-72个字符
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

    // 检查用户名是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return sendError(reply, AUTH_007);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = Math.floor(Date.now() / 1000);

    // 检查是否是第一个用户
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const isFirstUser = userCount.count === 0;

    // 第一个用户自动成为管理员，其他用户根据配置决定是否需要审核
    const role = isFirstUser ? 'admin' : 'user';
    const approved = isFirstUser || !config.REQUIRE_APPROVAL ? 1 : 0;

    // 插入用户记录
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

  /**
   * 用户登录接口
   * POST /auth/login
   * 
   * 验证用户凭据并返回访问令牌和刷新令牌
   */
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    // 参数验证
    if (!username || !password) {
      return sendError(reply, AUTH_001);
    }

    const db = getDb();
    // 查询用户
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;

    // 用户不存在
    if (!user) {
      return sendError(reply, AUTH_002);
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return sendError(reply, AUTH_002);
    }

    // 检查用户是否已通过审核
    if (!user.approved) {
      return sendError(reply, AUTH_006);
    }

    // 生成访问令牌
    const accessToken = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      { expiresIn: config.JWT_ACCESS_EXPIRES },
    );

    // 生成刷新令牌
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

  /**
   * 刷新访问令牌接口
   * POST /auth/refresh
   * 
   * 使用刷新令牌获取新的访问令牌
   */
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    // 参数验证
    if (!refreshToken) {
      return sendError(reply, AUTH_005);
    }

    try {
      // 验证刷新令牌
      const decoded = fastify.jwt.verify<{ id: number; username: string; role: 'user' | 'admin' }>(refreshToken);

      // 生成新的访问令牌
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
