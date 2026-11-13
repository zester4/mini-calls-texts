import app from './app.js';
import { env, assertProductionConfig } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './utils/logger.js';

assertProductionConfig();

const server = app.listen(env.PORT, () => {
  logger.info('server_started', { port: env.PORT, environment: env.NODE_ENV });
});

async function shutdown(signal) {
  logger.info('shutdown_started', { signal });
  server.close(async () => {
    await prisma.$disconnect().catch((error) => logger.error('database_disconnect_failed', { message: error.message }));
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
