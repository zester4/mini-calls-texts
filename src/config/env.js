import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  APP_API_KEY: z.string().optional(),
  PUBLIC_BASE_URL: z.string().url().transform((value) => value.replace(/\\/+$/, '')).optional(),
  FORWARD_CALL_TO: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error('Invalid environment configuration: ' + parsed.error.issues.map((issue) => issue.path.join('.')).join(', '));
}

export const env = parsed.data;

export function assertProductionConfig() {
  if (env.NODE_ENV !== 'production') return;
  const required = ['DATABASE_URL', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'APP_API_KEY', 'PUBLIC_BASE_URL', 'FORWARD_CALL_TO'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error('Missing required production environment variables: ' + missing.join(', '));
  if (env.APP_API_KEY.length < 32) throw new Error('APP_API_KEY must be at least 32 characters in production');
  if (!env.PUBLIC_BASE_URL.startsWith('https://')) throw new Error('PUBLIC_BASE_URL must use HTTPS in production');
  for (const key of ['TWILIO_PHONE_NUMBER', 'FORWARD_CALL_TO']) {
    if (!/^\\+[1-9]\\d{7,14}$/.test(env[key])) throw new Error(key + ' must be a valid E.164 phone number');
  }
  if (!/^AC[0-9a-fA-F]{32}$/.test(env.TWILIO_ACCOUNT_SID)) throw new Error('TWILIO_ACCOUNT_SID is invalid');
  if (env.TWILIO_MESSAGING_SERVICE_SID && !/^MG[0-9a-fA-F]{32}$/.test(env.TWILIO_MESSAGING_SERVICE_SID)) {
    throw new Error('TWILIO_MESSAGING_SERVICE_SID must be a valid Messaging Service SID');
  }
}
