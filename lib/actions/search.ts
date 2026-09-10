"use server";

import { prisma } from "@/lib/db";
import { journalAccessWhere, noteAccessWhere } from "@/lib/authz";
import { getSpaceContext } from "@/lib/session";
import { searchSchema } from "@/lib/validations/search";

export async function searchContent(input: unknown) {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) {
    return { notes: [], journal: [], q: "", filter: "all" as const };
  }

  const ctx = await getSpaceContext();
  const { q, filter, tag } = parsed.data;
  const query = q.trim();

  const noteWhere = {
    ...noteAccessWhere(ctx.userId, ctx.spaceIds),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { contentText: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filter === "shared" ? { visibility: "SHARED" as const } : {}),
    ...(filter === "private" ? { visibility: "PRIVATE" as const } : {}),
    ...(tag
      ? { tags: { some: { tag: { name: tag.replace(/^#/, "").toLowerCase() } } } }
      : {}),
  };

  const journalWhere = {
    ...journalAccessWhere(ctx.userId, ctx.spaceIds),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { contentText: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filter === "shared" ? { visibility: "SHARED" as const } : {}),
    ...(filter === "private" ? { visibility: "PRIVATE" as const } : {}),
    ...(tag
      ? {
          tags: {
            some: { tag: { name: tag.replace(/^#/, "").toLowerCase() } },
          },
        }
      : {}),
  };

  const [notes, journal] = await Promise.all([
    filter === "journal"
      ? Promise.resolve([])
      : prisma.note.findMany({
          where: noteWhere,
          orderBy: { updatedAt: "desc" },
          take: 40,
          include: { tags: { include: { tag: true } } },
        }),
    filter === "notes"
      ? Promise.resolve([])
      : prisma.journalEntry.findMany({
          where: journalWhere,
          orderBy: { date: "desc" },
          take: 40,
          include: { tags: { include: { tag: true } } },
        }),
  ]);

  return { notes, journal, q: query, filter, tag };
}
