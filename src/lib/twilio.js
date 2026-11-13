import twilio from 'twilio';
import { env } from '../config/env.js';

let client;
export function getTwilioClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    const error = new Error('Twilio is not configured');
    error.status = 503;
    error.code = 'TWILIO_NOT_CONFIGURED';
    throw error;
  }
  client ??= twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return client;
}

export function getTwilioPhoneNumber() {
  if (!env.TWILIO_PHONE_NUMBER) {
    const error = new Error('Twilio phone number is not configured');
    error.status = 503;
    error.code = 'TWILIO_NOT_CONFIGURED';
    throw error;
  }
  return env.TWILIO_PHONE_NUMBER;
}
