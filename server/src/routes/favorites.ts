/**
 * 收藏路由
 * 处理用户收藏歌曲的增删查操作
 */
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { FAV_001, FAV_002, FAV_003, sendError } from '../types/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { parseId, isValidId } from '../utils/params.js';

/**
 * 注册收藏路由
 * @param fastify Fastify 实例
 */
export default async function favoritesRoutes(fastify: FastifyInstance) {
  /**
   * 获取用户收藏列表接口
   * GET /favorites
   * 
   * 需要认证，返回当前用户的收藏歌曲列表
   */
  fastify.get('/favorites', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit: safeLimit, offset: safeOffset } = parsePagination(request.query as { limit?: number; offset?: number });
    const db = getDb();

    // 查询用户收藏的歌曲
    const tracks = db.prepare(`
      SELECT t.id, t.title, t.artist, t.album, t.duration, t.cover_path, f.created_at as favorited_at
      FROM favorites f
      JOIN tracks t ON t.id = f.track_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(request.userId, safeLimit, safeOffset) as (TrackRow & { favorited_at: number })[];

    // 查询收藏总数
    const total = (db.prepare(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
    ).get(request.userId) as { count: number }).count;

    return reply.send({
      data: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        hasCover: !!t.cover_path,
        favoritedAt: t.favorited_at,
      })),
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  });

  /**
   * 添加收藏接口
   * POST /favorites/:id
   * 
   * 需要认证，将指定歌曲添加到用户收藏
   */
  fastify.post('/favorites/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseId(id);

    if (!isValidId(trackId)) {
      return sendError(reply, FAV_001);
    }

    const db = getDb();

    // 检查歌曲是否存在
    const track = db.prepare('SELECT id FROM tracks WHERE id = ?').get(trackId);
    if (!track) {
      return sendError(reply, FAV_001);
    }

    // 检查是否已收藏
    const existing = db.prepare(
      'SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?',
    ).get(request.userId, trackId);

    if (existing) {
      return sendError(reply, FAV_002);
    }

    // 添加收藏
    const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO favorites (user_id, track_id, created_at) VALUES (?, ?, ?)').run(
      request.userId, trackId, now,
    );

    return reply.code(201).send({
      data: {
        trackId,
        favoritedAt: now,
      },
    });
  });

  /**
   * 删除收藏接口
   * DELETE /favorites/:id
   * 
   * 需要认证，从用户收藏中移除指定歌曲
   */
  fastify.delete('/favorites/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseId(id);

    if (!isValidId(trackId)) {
      return sendError(reply, FAV_003);
    }

    const db = getDb();

    // 删除收藏
    const result = db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND track_id = ?',
    ).run(request.userId, trackId);

    // 如果没有删除任何记录，说明收藏不存在
    if (result.changes === 0) {
      return sendError(reply, FAV_003);
    }

    return reply.send({
      data: { trackId },
    });
  });
}
