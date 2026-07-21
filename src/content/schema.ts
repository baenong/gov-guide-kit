import { z } from 'zod';

export const guideSchema = z.object({
  title: z.string(),
  order: z.number(),
  description: z.string().optional(),
});
