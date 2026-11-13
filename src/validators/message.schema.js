import { z } from 'zod';
import { normalizePhone } from '../lib/phone.js';

export const createMessageSchema = z.object({
  to: z.string().trim().min(1).max(40).transform((value) => normalizePhone(value) ?? value)
    .refine((value) => /^\+[1-9]\d{7,14}$/.test(value), 'Use a valid international phone number in E.164 format (for example, +14155552671)'),
  body: z.string().trim().min(1).max(1600),
});

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const threadParamsSchema = z.object({
  phone: z.string().transform((value) => normalizePhone(value) ?? value)
    .refine((value) => /^\+[1-9]\d{7,14}$/.test(value), 'Phone must be in E.164 format'),
});
