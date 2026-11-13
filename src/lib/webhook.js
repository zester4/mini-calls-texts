import twilio from 'twilio';
import { env } from '../config/env.js';

export function validateTwilioSignature(req) {
  const signature = req.get('X-Twilio-Signature');
  if (!signature || !env.TWILIO_AUTH_TOKEN || !env.PUBLIC_BASE_URL) return false;
  if (!req.is('application/x-www-form-urlencoded')) return false;

  // Use the configured public origin rather than untrusted Host/X-Forwarded-Host headers.
  const url = new URL(req.originalUrl, env.PUBLIC_BASE_URL).toString();
  try {
    return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body ?? {});
  } catch {
    return false;
  }
}
