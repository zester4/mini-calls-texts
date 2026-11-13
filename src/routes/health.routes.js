import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.get('/', (_req, res) => res.json({ status: 'ok' }));
router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'ready', database: 'connected' });
  } catch {
    return res.status(503).json({ status: 'not_ready', database: 'unavailable' });
  }
});
export default router;
