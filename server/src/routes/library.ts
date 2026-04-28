import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { FolderRow, TrackRow, UserRow } from '../types/index.js';
import { LIB_001, LIB_002, sendError } from '../types/errors.js';

export default async function libraryRoutes(fastify: FastifyInstance) {
  // GET /library/folders
  fastify.get('/library/folders', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
    const db = getDb();
    const folders = db.prepare('SELECT * FROM folders ORDER BY id').all() as FolderRow[];

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

  // GET /library/folders/:id/tracks
  fastify.get('/library/folders/:id/tracks', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { limit = 50, offset = 0, sort = 'title', order = 'asc' } = request.query as {
      limit?: number;
      offset?: number;
      sort?: string;
      order?: string;
    };

    const db = getDb();
    const folderId = parseInt(id, 10);

    const folder = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId) as { id: number } | undefined;
    if (!folder) {
      return sendError(reply, LIB_001);
    }

    const validSorts = ['title', 'artist', 'duration'];
    const sortField = validSorts.includes(sort) ? sort : 'title';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const safeOffset = Math.max(0, offset);

    let tracks: TrackRow[];
    let total: number;

    if (folderId === 1) {
      // Root folder: all tracks
      tracks = db.prepare(`
        SELECT * FROM tracks
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `).all(safeLimit, safeOffset) as TrackRow[];
      total = (db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number }).count;
    } else {
      // Specific folder: tracks in this folder
      tracks = db.prepare(`
        SELECT * FROM tracks
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

  // GET /library/tracks/:id
  fastify.get('/library/tracks/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();
    const trackId = parseInt(id, 10);

    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;
    if (!track) {
      return sendError(reply, LIB_002);
    }

    // Check if favorited
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
