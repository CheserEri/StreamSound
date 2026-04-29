/**
 * 音频流路由
 * 提供音乐文件的流式传输服务，支持断点续传
 */
import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { STREAM_001, STREAM_002, STREAM_003, sendError } from '../types/errors.js';
import { parseId, isValidId } from '../utils/params.js';

/**
 * 注册音频流路由
 * @param fastify Fastify 实例
 */
export default async function streamRoutes(fastify: FastifyInstance) {
  /**
   * 音频流接口
   * GET /stream/:id
   * 
   * 需要认证，流式传输指定歌曲文件，支持 Range 请求（断点续传）
   */
  fastify.get('/stream/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseId(id);

    if (!isValidId(trackId)) {
      return sendError(reply, STREAM_001);
    }

    const db = getDb();
    // 查询歌曲信息
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;

    // 歌曲不存在
    if (!track) {
      return sendError(reply, STREAM_001);
    }

    // 获取文件信息
    let fileStat;
    try {
      fileStat = await stat(track.path);
    } catch {
      // 文件不存在
      return sendError(reply, STREAM_002);
    }

    const fileSize = fileStat.size;
    const mimeType = track.mime_type || 'audio/mpeg';

    // 解析 Range 请求头
    const rangeHeader = request.headers.range;

    if (rangeHeader) {
      // 处理断点续传请求
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // 验证 Range 参数
      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
        return sendError(reply, STREAM_003);
      }

      const chunkSize = end - start + 1;

      // 设置响应头
      reply.code(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      reply.header('Content-Length', chunkSize);
      reply.header('Content-Type', mimeType);
      reply.header('Accept-Ranges', 'bytes');

      // 流式传输指定范围的文件内容
      const stream = createReadStream(track.path, { start, end });
      stream.pipe(reply.raw);
      return reply.hijack();
    }

    // 没有 Range 头：传输整个文件
    reply.code(206);
    reply.header('Content-Length', fileSize);
    reply.header('Content-Type', mimeType);
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Content-Range', `bytes 0-${fileSize - 1}/${fileSize}`);

    const stream = createReadStream(track.path);
    stream.pipe(reply.raw);
    return reply.hijack();
  });
}
