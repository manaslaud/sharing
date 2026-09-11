import { z } from "zod";

export const journalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const updateJournalSchema = z
  .object({
    id: z.string().min(1).optional(),
    date: journalDateSchema.optional(),
    title: z.string().max(200).optional(),
    content: z.unknown().optional(),
  })
  .refine((value) => Boolean(value.id || value.date), {
    message: "Journal id or date is required.",
  });

export const journalIdSchema = z.object({
  id: z.string().min(1),
});
