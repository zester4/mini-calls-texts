import twilio from 'twilio';
import { env } from '../config/env.js';

export const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const phoneNumber = env.TWILIO_PHONE_NUMBER;
