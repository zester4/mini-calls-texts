import twilio from 'twilio';
import { env } from '../config/env.js';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const DEFAULT_TTL_SECONDS = 3600;

/**
 * Build a short-lived JWT for the Twilio Voice JavaScript SDK.
 * Requires TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_TWIML_APP_SID.
 */
export function createVoiceAccessToken({ identity, ttlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const apiKeySid = env.TWILIO_API_KEY_SID;
  const apiKeySecret = env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = env.TWILIO_TWIML_APP_SID;
  const clientIdentity = identity || env.VOICE_CLIENT_IDENTITY || 'mini_calls_web';

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
    const error = new Error(
      'Browser voice is not configured. Set TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_TWIML_APP_SID',
    );
    error.status = 503;
    error.code = 'VOICE_NOT_CONFIGURED';
    throw error;
  }

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity: clientIdentity,
    ttl: ttlSeconds,
  });
  token.addGrant(voiceGrant);

  return {
    identity: clientIdentity,
    token: token.toJwt(),
    expiresIn: ttlSeconds,
  };
}
