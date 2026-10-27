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
   * 流式传输指定歌曲文件，支持 Range 请求（断点续传）
   */
  fastify.get('/stream/:id', async (request, reply) => {
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

      // 交给 Fastify 发送流：hijack 后 reply.header 不会随响应写出，浏览器与播放器
      // 拿到的将是没有 Content-Type/Range 的裸数据。
      return reply
        .code(206)
        .header('Content-Range', `bytes ${start}-${end}/${fileSize}`)
        .header('Content-Length', chunkSize)
        .header('Content-Type', mimeType)
        .header('Accept-Ranges', 'bytes')
        .send(createReadStream(track.path, { start, end }));
    }

    // 没有 Range 头：传输整个文件
    return reply
      .code(200)
      .header('Content-Length', fileSize)
      .header('Content-Type', mimeType)
      .header('Accept-Ranges', 'bytes')
      .send(createReadStream(track.path));
  });
}
