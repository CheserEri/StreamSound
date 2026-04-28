import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { SEARCH_001, sendError } from '../types/errors.js';

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.get('/search', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { q, limit = 20 } = request.query as { q?: string; limit?: number };

    if (!q || q.trim().length === 0 || q.length > 100) {
      return sendError(reply, SEARCH_001);
    }

    const db = getDb();
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const keyword = q.trim();

    // Search tracks using FTS5
    const tracks = db.prepare(`
      SELECT t.*, highlight(tracks_fts, 0, '<em>', '</em>') as title_hl,
             highlight(tracks_fts, 1, '<em>', '</em>') as artist_hl,
             highlight(tracks_fts, 2, '<em>', '</em>') as album_hl
      FROM tracks_fts
      JOIN tracks t ON t.id = tracks_fts.rowid
      WHERE tracks_fts MATCH ?
      LIMIT ?
    `).all(`${keyword}*`, safeLimit) as (TrackRow & { title_hl: string; artist_hl: string; album_hl: string })[];

    // Search artists
    const artists = db.prepare(`
      SELECT artist, COUNT(*) as trackCount
      FROM tracks
      WHERE artist LIKE ?
      GROUP BY artist
      LIMIT ?
    `).all(`%${keyword}%`, safeLimit) as { artist: string; trackCount: number }[];

    // Search albums
    const albums = db.prepare(`
      SELECT album, artist, COUNT(*) as trackCount
      FROM tracks
      WHERE album LIKE ?
      GROUP BY album, artist
      LIMIT ?
    `).all(`%${keyword}%`, safeLimit) as { album: string; artist: string; trackCount: number }[];

    return reply.send({
      data: {
        tracks: tracks.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          hasCover: !!t.cover_path,
          highlight: {
            title: t.title_hl || t.title,
            artist: t.artist_hl || t.artist,
            album: t.album_hl || t.album,
          },
        })),
        artists: artists.map((a) => ({
          name: a.artist,
          trackCount: a.trackCount,
          highlight: {
            name: a.artist.replace(new RegExp(`(${escapeRegex(keyword)})`, 'gi'), '<em>$1</em>'),
          },
        })),
        albums: albums.map((a) => ({
          name: a.album,
          artist: a.artist,
          trackCount: a.trackCount,
          highlight: {
            name: a.album.replace(new RegExp(`(${escapeRegex(keyword)})`, 'gi'), '<em>$1</em>'),
          },
        })),
      },
    });
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
