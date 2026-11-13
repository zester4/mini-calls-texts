import { z } from 'zod';

export const createCallSchema = z.object({
  to: z.string().min(10),
});
