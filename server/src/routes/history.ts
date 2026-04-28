import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { HIST_001, sendError } from '../types/errors.js';

const MAX_HISTORY = 50;

export default async function historyRoutes(fastify: FastifyInstance) {
  // GET /history
  fastify.get('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };
    const db = getDb();
    const safeLimit = Math.min(Math.max(1, limit), MAX_HISTORY);
    const safeOffset = Math.max(0, offset);

    const tracks = db.prepare(`
      SELECT t.*, h.played_at
      FROM play_history h
      JOIN tracks t ON t.id = h.track_id
      WHERE h.user_id = ?
      GROUP BY h.track_id
      ORDER BY MAX(h.played_at) DESC
      LIMIT ? OFFSET ?
    `).all(request.userId, safeLimit, safeOffset) as (TrackRow & { played_at: number })[];

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

  // POST /history/:id
  fastify.post('/history/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseInt(id, 10);
    const db = getDb();

    const track = db.prepare('SELECT id FROM tracks WHERE id = ?').get(trackId);
    if (!track) {
      return sendError(reply, HIST_001);
    }

    const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO play_history (user_id, track_id, played_at) VALUES (?, ?, ?)').run(
      request.userId, trackId, now,
    );

    // Keep only the latest MAX_HISTORY entries per user
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
