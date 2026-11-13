import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

export function requireApiKey(req, res, next) {
  const supplied = req.get('x-api-key');
  const expected = env.APP_API_KEY;
  if (!expected) return res.status(503).json({ error: 'API authentication is not configured', code: 'AUTH_NOT_CONFIGURED' });
  if (typeof supplied !== 'string') return res.status(401).json({ error: 'Invalid or missing API key', code: 'UNAUTHORIZED' });
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return res.status(401).json({ error: 'Invalid or missing API key', code: 'UNAUTHORIZED' });
  }
  return next();
}
