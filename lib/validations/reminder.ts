import { z } from "zod";

export const recurrenceSchema = z.enum([
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const reminderSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.coerce.date(),
  assignedToId: z.string().min(1).optional().nullable(),
  shared: z.boolean().optional(),
  noteId: z.string().min(1).optional().nullable(),
  journalEntryId: z.string().min(1).optional().nullable(),
  eventId: z.string().min(1).optional().nullable(),
  recurrence: recurrenceSchema.optional(),
});

export const updateReminderSchema = reminderSchema.extend({
  id: z.string().min(1),
});

export const reminderIdSchema = z.object({
  id: z.string().min(1),
});
