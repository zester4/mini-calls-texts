import { z } from 'zod';

export const createMessageSchema = z.object({
  to: z.string().min(10),
  body: z.string().min(1).max(1600),
});
