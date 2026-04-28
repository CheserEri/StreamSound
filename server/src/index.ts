import Fastify from 'fastify';
import { config } from './config.js';
import { initDb, closeDb } from './db/client.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import authRoutes from './routes/auth.js';
import libraryRoutes from './routes/library.js';
import streamRoutes from './routes/stream.js';
import coversRoutes from './routes/covers.js';
import searchRoutes from './routes/search.js';
import favoritesRoutes from './routes/favorites.js';
import historyRoutes from './routes/history.js';
import adminRoutes from './routes/admin.js';
import { startScan } from './services/scanner.js';
import { startScheduler, stopScheduler } from './services/scheduler.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
});

async function main() {
  // Initialize database
  console.log('[DB] Initializing database...');
  initDb();
  console.log('[DB] Database initialized.');

  // Register plugins
  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(libraryRoutes);
  await fastify.register(streamRoutes);
  await fastify.register(coversRoutes);
  await fastify.register(searchRoutes);
  await fastify.register(favoritesRoutes);
  await fastify.register(historyRoutes);
  await fastify.register(adminRoutes);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Start server
  await fastify.listen({ port: config.PORT, host: config.HOST });
  console.log(`[Server] Listening on ${config.HOST}:${config.PORT}`);

  // Start initial scan if configured
  if (config.SCAN_ON_START) {
    console.log('[Scanner] Starting initial scan...');
    startScan().then(() => {
      console.log('[Scanner] Initial scan completed.');
    });
  }

  // Start cron scheduler
  startScheduler();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  stopScheduler();
  await fastify.close();
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Shutting down...');
  stopScheduler();
  await fastify.close();
  closeDb();
  process.exit(0);
});
