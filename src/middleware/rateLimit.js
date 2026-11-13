import rateLimit from 'express-rate-limit';

const common = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }),
};

export const outboundCallLimiter = rateLimit({ ...common, windowMs: 60 * 60 * 1000, limit: 10 });
export const outboundMessageLimiter = rateLimit({ ...common, windowMs: 60 * 60 * 1000, limit: 60 });
