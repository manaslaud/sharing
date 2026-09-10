import { z } from "zod";
import { MAX_TAG_LENGTH, MAX_TAGS } from "@/lib/tags";

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
  tags: z.array(z.string().trim().min(1).max(MAX_TAG_LENGTH)).max(MAX_TAGS),
});
