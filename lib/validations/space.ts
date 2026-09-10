import { z } from "zod";

export const createSpaceSchema = z.object({
  name: z.string().trim().min(1, "Give your space a name").max(60),
});

export const joinSpaceSchema = z.object({
  inviteCode: z.string().trim().min(6, "Enter an invite code").max(16),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  timezone: z.string().trim().min(1).max(80),
});
