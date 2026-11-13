import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

export function createReadinessHandler(db = prisma) {
  return async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return res.json({ status: 'ready', database: 'connected' });
    } catch {
      return res.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
  };
}

router.get('/', (_req, res) => res.json({ status: 'ok' }));
router.get('/ready', createReadinessHandler());

export default router;
