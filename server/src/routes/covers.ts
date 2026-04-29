/**
 * 封面图片路由
 * 提供音乐封面图片的获取接口
 */
import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import { access } from 'fs/promises';
import { extname } from 'path';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { parseId, isValidId } from '../utils/params.js';

/**
 * 注册封面图片路由
 * @param fastify Fastify 实例
 */
export default async function coversRoutes(fastify: FastifyInstance) {
  /**
   * 获取封面图片接口
   * GET /covers/:id
   * 
   * 需要认证，返回指定歌曲的封面图片
   */
  fastify.get('/covers/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseId(id);

    if (!isValidId(trackId)) {
      return reply.code(404).send({
        error: {
          code: 'COVER_001',
          message: '封面图片不存在',
          detail: 'Invalid track ID',
        },
      });
    }

    const db = getDb();
    // 查询歌曲的封面路径
    const track = db.prepare('SELECT cover_path FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;

    // 如果歌曲不存在、没有封面或封面文件不存在，返回 404
    if (!track || !track.cover_path) {
      return reply.code(404).send({
        error: {
          code: 'COVER_001',
          message: '封面图片不存在',
          detail: 'Cover image not found',
        },
      });
    }

    try {
      await access(track.cover_path);
    } catch {
      return reply.code(404).send({
        error: {
          code: 'COVER_001',
          message: '封面图片不存在',
          detail: 'Cover image file not found on disk',
        },
      });
    }

    // 设置响应头
    const ext = extname(track.cover_path).toLowerCase();
    const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    reply.header('Content-Type', mimeMap[ext] || 'image/jpeg');
    reply.header('Cache-Control', 'public, max-age=86400');

    // 流式传输图片
    const stream = createReadStream(track.cover_path);
    stream.pipe(reply.raw);
    return reply.hijack();
  });
}
