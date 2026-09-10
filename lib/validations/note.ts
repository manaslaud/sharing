import { z } from "zod";

export const noteContentSchema = z.unknown();

export const updateNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(200).optional(),
  content: noteContentSchema.optional(),
});

export const noteIdSchema = z.object({
  id: z.string().min(1),
});

export const setTagsSchema = z.object({
  id: z.string().min(1),
  tags: z.array(z.string().trim().min(1).max(32)).max(20),
});
