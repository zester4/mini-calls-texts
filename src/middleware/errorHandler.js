import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  logger.error('request_failed', {
    method: req.method,
    route: req.route?.path ?? 'unmatched',
    status,
    code,
    message: status === 500 ? 'Internal server error' : err.message,
  });
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    code,
  });
}
