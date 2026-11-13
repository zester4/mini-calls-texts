import twilio from 'twilio';
import { env } from '../config/env.js';

export function validateTwilioSignature(req) {
  const signature = req.headers['x-twilio-signature'];
  const url = `${env.PUBLIC_BASE_URL}${req.originalUrl}`;
  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body);
}
