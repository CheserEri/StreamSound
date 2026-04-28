import type { FastifyInstance } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';

export default async function coversRoutes(fastify: FastifyInstance) {
  fastify.get('/covers/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseInt(id, 10);

    const db = getDb();
    const track = db.prepare('SELECT cover_path FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;

    if (!track || !track.cover_path || !existsSync(track.cover_path)) {
      return reply.code(404).send();
    }

    reply.header('Content-Type', 'image/jpeg');
    reply.header('Cache-Control', 'public, max-age=86400');

    const stream = createReadStream(track.cover_path);
    stream.pipe(reply.raw);
    return reply.hijack();
  });
}
