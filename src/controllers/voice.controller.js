import { createVoiceAccessToken } from '../lib/voice-token.js';

export async function getToken(req, res, next) {
  try {
    const result = createVoiceAccessToken({
      identity: req.body?.identity || req.query?.identity,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
