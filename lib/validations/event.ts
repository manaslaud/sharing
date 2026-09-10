import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional().nullable(),
});

export const updateEventSchema = eventSchema.extend({
  id: z.string().min(1),
});
