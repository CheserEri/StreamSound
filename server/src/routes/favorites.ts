import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { FAV_001, FAV_002, FAV_003, sendError } from '../types/errors.js';

export default async function favoritesRoutes(fastify: FastifyInstance) {
  // GET /favorites
  fastify.get('/favorites', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };
    const db = getDb();
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const safeOffset = Math.max(0, offset);

    const tracks = db.prepare(`
      SELECT t.*, f.created_at as favorited_at
      FROM favorites f
      JOIN tracks t ON t.id = f.track_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(request.userId, safeLimit, safeOffset) as (TrackRow & { favorited_at: number })[];

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

  // POST /favorites/:id
  fastify.post('/favorites/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseInt(id, 10);
    const db = getDb();

    const track = db.prepare('SELECT id FROM tracks WHERE id = ?').get(trackId);
    if (!track) {
      return sendError(reply, FAV_001);
    }

    const existing = db.prepare(
      'SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?',
    ).get(request.userId, trackId);

    if (existing) {
      return sendError(reply, FAV_002);
    }

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

  // DELETE /favorites/:id
  fastify.delete('/favorites/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseInt(id, 10);
    const db = getDb();

    const result = db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND track_id = ?',
    ).run(request.userId, trackId);

    if (result.changes === 0) {
      return sendError(reply, FAV_003);
    }

    return reply.send({
      data: { trackId },
    });
  });
}
