/**
 * 扫描路由
 * 提供音乐扫描与扫描状态查询接口
 */
import type { FastifyInstance } from 'fastify';
import { access } from 'fs/promises';
import { config } from '../config.js';
import { SCAN_001, SCAN_002, sendError } from '../types/errors.js';
import { startScan, getScanState } from '../services/scanner.js';

/**
 * 注册扫描路由
 * @param fastify Fastify 实例
 */
export default async function scanRoutes(fastify: FastifyInstance) {
  /**
   * 获取音乐根目录接口
   * GET /scan/music-root
   * 
   * 返回当前配置的音乐目录路径
   */
  fastify.get('/scan/music-root', async (_request, reply) => {
    return reply.send({
      data: {
        musicRoot: config.MUSIC_ROOT,
      },
    });
  });

  /**
   * 启动音乐扫描接口
   * POST /scan
   * 
   * 启动后台音乐扫描任务
   */
  fastify.post('/scan', async (request, reply) => {
    // 检查是否已有扫描任务在运行
    const state = getScanState();
    if (state.status === 'running') {
      return sendError(reply, SCAN_001);
    }

    const { musicRoot } = (request.body || {}) as { musicRoot?: string };

    // 验证提供的路径是否存在
    if (musicRoot) {
      try {
        await access(musicRoot);
      } catch {
        return sendError(reply, SCAN_002);
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
   * GET /scan/status
   * 
   * 返回当前扫描任务的状态
   */
  fastify.get('/scan/status', async (_request, reply) => {
    const state = getScanState();
    return reply.send({ data: state });
  });
}