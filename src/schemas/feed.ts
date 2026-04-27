import { z } from "zod";

export const SourceTypeSchema = z.enum(["rss", "reddit", "hackernews"]);

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SourceTypeSchema,
  url: z.string().url(),
  max_items: z.number().int().positive().default(25),
});

export const FeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  schedule: z.string(),
  synthesis_prompt: z.string(),
  relevance_criteria: z.string(),
  sources: z.array(SourceSchema),
});

export type SourceType = z.infer<typeof SourceTypeSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Feed = z.infer<typeof FeedSchema>;
