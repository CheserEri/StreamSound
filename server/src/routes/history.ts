/**
 * 播放历史路由
 * 处理用户播放历史的记录和查询
 */
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { HIST_001, sendError } from '../types/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { parseId, isValidId } from '../utils/params.js';

// 每个用户最大保存的历史记录数
const MAX_HISTORY = 50;

/**
 * 注册播放历史路由
 * @param fastify Fastify 实例
 */
export default async function historyRoutes(fastify: FastifyInstance) {
  /**
   * 获取播放历史接口
   * GET /history
   * 
   * 需要认证，返回当前用户的播放历史（按播放时间倒序，去重）
   */
  fastify.get('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit: safeLimit, offset: safeOffset } = parsePagination(request.query as { limit?: number; offset?: number }, MAX_HISTORY);
    const db = getDb();

    // 查询用户播放历史（按歌曲去重，取最后播放时间）
    const tracks = db.prepare(`
      SELECT t.id, t.title, t.artist, t.album, t.duration, t.cover_path, h.played_at
      FROM play_history h
      JOIN tracks t ON t.id = h.track_id
      WHERE h.user_id = ?
      GROUP BY h.track_id
      ORDER BY MAX(h.played_at) DESC
      LIMIT ? OFFSET ?
    `).all(request.userId, safeLimit, safeOffset) as (TrackRow & { played_at: number })[];

    // 查询历史记录总数（去重）
    const total = (db.prepare(
      'SELECT COUNT(DISTINCT track_id) as count FROM play_history WHERE user_id = ?',
    ).get(request.userId) as { count: number }).count;

    return reply.send({
      data: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        hasCover: !!t.cover_path,
        playedAt: t.played_at,
      })),
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  });

  /**
   * 添加播放记录接口
   * POST /history/:id
   * 
   * 需要认证，记录用户播放了指定歌曲
   */
  fastify.post('/history/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseId(id);

    if (!isValidId(trackId)) {
      return sendError(reply, HIST_001);
    }

    const db = getDb();

    // 检查歌曲是否存在
    const track = db.prepare('SELECT id FROM tracks WHERE id = ?').get(trackId);
    if (!track) {
      return sendError(reply, HIST_001);
    }

    // 记录播放时间
    const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO play_history (user_id, track_id, played_at) VALUES (?, ?, ?)').run(
      request.userId, trackId, now,
    );

    // 只保留最近的 MAX_HISTORY 条记录
    db.prepare(`
      DELETE FROM play_history
      WHERE user_id = ? AND id NOT IN (
        SELECT id FROM play_history
        WHERE user_id = ?
        ORDER BY played_at DESC
        LIMIT ?
      )
    `).run(request.userId, request.userId, MAX_HISTORY);

    return reply.send({
      data: {
        trackId,
        playedAt: now,
      },
    });
  });
}
