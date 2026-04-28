import type { FastifyInstance } from 'fastify';
import { createReadStream, statSync } from 'fs';
import { getDb } from '../db/client.js';
import type { TrackRow } from '../types/index.js';
import { STREAM_001, STREAM_002, STREAM_003, sendError } from '../types/errors.js';

export default async function streamRoutes(fastify: FastifyInstance) {
  fastify.get('/stream/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trackId = parseInt(id, 10);

    const db = getDb();
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId) as TrackRow | undefined;

    if (!track) {
      return sendError(reply, STREAM_001);
    }

    let fileStat;
    try {
      fileStat = statSync(track.path);
    } catch {
      return sendError(reply, STREAM_002);
    }

    const fileSize = fileStat.size;
    const mimeType = track.mime_type || 'audio/mpeg';

    // Parse Range header
    const rangeHeader = request.headers.range;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
        return sendError(reply, STREAM_003);
      }

      const chunkSize = end - start + 1;

      reply.code(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      reply.header('Content-Length', chunkSize);
      reply.header('Content-Type', mimeType);
      reply.header('Accept-Ranges', 'bytes');

      const stream = createReadStream(track.path, { start, end });
      stream.pipe(reply.raw);
      return reply.hijack();
    }

    // No Range header: stream entire file
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
