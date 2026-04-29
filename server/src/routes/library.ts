/**
 * 音乐库路由
 * 提供音乐文件夹和歌曲的管理接口
 */
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { FolderRow, TrackRow, UserRow } from '../types/index.js';
import { LIB_001, LIB_002, sendError } from '../types/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { parseId, isValidId } from '../utils/params.js';

/**
 * 注册音乐库路由
 * @param fastify Fastify 实例
 */
export default async function libraryRoutes(fastify: FastifyInstance) {
  /**
   * 获取文件夹列表接口
   * GET /library/folders
   * 
   * 需要认证，返回所有音乐文件夹列表
   */
  fastify.get('/library/folders', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
    const db = getDb();
    const folders = db.prepare('SELECT id, name, path, parent_id, track_count FROM folders ORDER BY id').all() as FolderRow[];

    return reply.send({
      data: folders.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        parentId: f.parent_id,
        trackCount: f.track_count,
      })),
    });
  });

  /**
   * 获取文件夹内歌曲列表接口
   * GET /library/folders/:id/tracks
   * 
   * 需要认证，返回指定文件夹中的歌曲列表（分页）
   * 特殊：folderId=1 表示根目录，返回所有歌曲
   */
  fastify.get('/library/folders/:id/tracks', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { sort = 'title', order = 'asc' } = request.query as {
      sort?: string;
      order?: string;
    };

    const db = getDb();
    const folderId = parseId(id);

    if (!isValidId(folderId)) {
      return sendError(reply, LIB_001);
    }

    // 检查文件夹是否存在
    const folder = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId) as { id: number } | undefined;
    if (!folder) {
      return sendError(reply, LIB_001);
    }

    // 验证排序参数
    const validSorts = ['title', 'artist', 'duration'];
    const sortField = validSorts.includes(sort) ? sort : 'title';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    const { limit: safeLimit, offset: safeOffset } = parsePagination(request.query as { limit?: number; offset?: number });

    let tracks: TrackRow[];
    let total: number;

    const trackColumns = 'id, title, artist, album, duration, cover_path, has_lyrics, folder_id';

    if (folderId === 1) {
      // 根目录：返回所有歌曲
      tracks = db.prepare(`
        SELECT ${trackColumns} FROM tracks
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `).all(safeLimit, safeOffset) as TrackRow[];
      total = (db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number }).count;
    } else {
      // 指定文件夹：返回该文件夹下的歌曲
      tracks = db.prepare(`
        SELECT ${trackColumns} FROM tracks
        WHERE folder_id = ?
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `).all(folderId, safeLimit, safeOffset) as TrackRow[];
      total = (db.prepare('SELECT COUNT(*) as count FROM tracks WHERE folder_id = ?').get(folderId) as { count: number }).count;
    }

    return reply.send({
      data: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        hasCover: !!t.cover_path,
        hasLyrics: t.has_lyrics === 1,
        folderId: t.folder_id,
      })),
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  });

  /**
   * 获取歌曲详情接口
   * GET /library/tracks/:id
   * 
   * 需要认证，返回指定歌曲的详细信息，包括歌词和收藏状态
   */
  fastify.get('/library/tracks/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();
    const trackId = parseId(id);

    if (!isValidId(trackId)) {
      return sendError(reply, LIB_002);
    }

    // 查询歌曲信息
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;
    if (!track) {
      return sendError(reply, LIB_002);
    }

    // 检查是否已收藏
    const fav = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?').get(
      request.userId, trackId,
    );

    return reply.send({
      data: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        bitrate: track.bitrate,
        sampleRate: track.sample_rate,
        mimeType: track.mime_type,
        fileSize: track.file_size,
        hasCover: !!track.cover_path,
        hasLyrics: track.has_lyrics === 1,
        lyrics: track.lyrics,
        folderId: track.folder_id,
        isFavorited: !!fav,
      },
    });
  });
}
