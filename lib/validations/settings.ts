import { z } from "zod";

export const notificationPrefsSchema = z.object({
  sharedContent: z.boolean(),
  reminders: z.boolean(),
  events: z.boolean(),
  pushEnabled: z.boolean().optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
