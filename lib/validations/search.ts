import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().trim().max(200).default(""),
  filter: z
    .enum(["all", "notes", "journal", "shared", "private"])
    .default("all"),
  tag: z.string().trim().max(32).optional(),
});
