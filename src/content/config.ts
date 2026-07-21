import { defineCollection } from 'astro:content';
import { guideSchema } from './schema';

const guide = defineCollection({
  type: 'content',
  schema: guideSchema,
});

export const collections = { guide };
