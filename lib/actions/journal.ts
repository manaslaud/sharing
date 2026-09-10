"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { emptyDoc, extractText } from "@/lib/content";
import {
  canAccessJournal,
  canDeleteJournal,
  canEditJournal,
  canShareJournal,
} from "@/lib/authz";
import { getSpaceContext } from "@/lib/session";
import {
  journalDateSchema,
  journalIdSchema,
  updateJournalSchema,
} from "@/lib/validations/journal";
import { notifySharedEdit, notifySharedItem } from "@/lib/notifications";
import { setTagsSchema } from "@/lib/validations/note";
import { isValidTagName, normalizeTagName } from "@/lib/tags";

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

async function loadEntry(id: string) {
  const ctx = await getSpaceContext();
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry || !canAccessJournal(entry, ctx.userId, ctx.spaceIds)) {
    return { ctx, entry: null };
  }
  return { ctx, entry };
}

export async function ensureJournalEntryAction(date: string) {
  const parsed = journalDateSchema.safeParse(date);
  if (!parsed.success) {
    redirect("/journal");
  }
  const ctx = await getSpaceContext();
  const day = parseDate(parsed.data);

  const existing = await prisma.journalEntry.findUnique({
    where: { authorId_date: { authorId: ctx.userId, date: day } },
  });

  if (existing?.deletedAt) {
    await prisma.journalEntry.update({
      where: { id: existing.id },
      data: { deletedAt: null },
    });
  } else if (!existing) {
    await prisma.journalEntry.create({
      data: {
        date: day,
        title: "",
        content: emptyDoc,
        contentText: "",
        authorId: ctx.userId,
      },
    });
  }

  redirect(`/journal/${parsed.data}`);
}

export async function writeJournalFormAction(formData: FormData) {
  await ensureJournalEntryAction(String(formData.get("date") ?? ""));
}

export async function updateJournalAction(input: unknown) {
  const parsed = updateJournalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid journal data." };
  }

  const ctx = await getSpaceContext();
  const day = parseDate(parsed.data.date);
  const byId = parsed.data.id
    ? await prisma.journalEntry.findUnique({ where: { id: parsed.data.id } })
    : null;
  const entry =
    byId ??
    (await prisma.journalEntry.findUnique({
      where: { authorId_date: { authorId: ctx.userId, date: day } },
    }));

  const target =
    entry && canEditJournal(entry, ctx.userId, ctx.spaceIds)
      ? entry
      : await prisma.journalEntry.findFirst({
          where: {
            date: day,
            visibility: "SHARED",
            sharedSpaceId: { in: ctx.spaceIds },
            deletedAt: null,
          },
        });

  if (!target || !canEditJournal(target, ctx.userId, ctx.spaceIds)) {
    return { ok: false as const, error: "You can't edit this entry." };
  }

  const nextTitle = parsed.data.title ?? target.title;
  const nextContent = (parsed.data.content ??
    target.content) as Prisma.InputJsonValue;
  const nextText =
    parsed.data.content !== undefined
      ? extractText(parsed.data.content)
      : target.contentText;

  if (target.visibility === "SHARED" && target.sharedSpaceId) {
    const lastEdit = await prisma.activity.findFirst({
      where: {
        journalEntryId: target.id,
        actorId: ctx.userId,
        type: "EDIT",
      },
      orderBy: { createdAt: "desc" },
    });
    if (
      !lastEdit ||
      Date.now() - lastEdit.createdAt.getTime() > 2 * 60 * 1000
    ) {
      await prisma.activity.create({
        data: {
          type: "EDIT",
          actorId: ctx.userId,
          sharedSpaceId: target.sharedSpaceId,
          journalEntryId: target.id,
        },
      });
      await notifySharedEdit({
        spaceId: target.sharedSpaceId,
        actorId: ctx.userId,
        actorName: ctx.user.name ?? "Someone",
        kind: "journal",
        title: nextTitle || parsed.data.date,
        journalEntryId: target.id,
      });
    }
  }

  await prisma.journalEntry.update({
    where: { id: target.id },
    data: {
      title: nextTitle,
      content: nextContent,
      contentText: nextText,
      deletedAt: null,
    },
  });

  return { ok: true as const, savedAt: new Date().toISOString() };
}

export async function shareJournalAction(id: string, share: boolean) {
  const parsed = journalIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };
  const { ctx, entry } = await loadEntry(parsed.data.id);
  if (!entry || !canShareJournal(entry, ctx.userId)) {
    return { ok: false, error: "You can't change sharing on this entry." };
  }

  await prisma.journalEntry.update({
    where: { id: entry.id },
    data: share
      ? { visibility: "SHARED", sharedSpaceId: ctx.space.id }
      : { visibility: "PRIVATE", sharedSpaceId: null },
  });

  await prisma.activity.create({
    data: {
      type: share ? "SHARE" : "UNSHARE",
      actorId: ctx.userId,
      sharedSpaceId: ctx.space.id,
      journalEntryId: entry.id,
    },
  });

  if (share) {
    await notifySharedItem({
      spaceId: ctx.space.id,
      actorId: ctx.userId,
      actorName: ctx.user.name ?? "Someone",
      kind: "journal",
      title: entry.title || "Journal entry",
      journalEntryId: entry.id,
    });
  }

  revalidatePath("/journal");
  revalidatePath("/shared");
  return { ok: true };
}

export async function deleteJournalAction(formData: FormData) {
  const parsed = journalIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const { ctx, entry } = await loadEntry(parsed.data.id);
  if (!entry || !canDeleteJournal(entry, ctx.userId)) return;

  await prisma.journalEntry.update({
    where: { id: entry.id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/journal");
  redirect("/journal");
}

export async function setJournalTagsAction(input: unknown) {
  const parsed = setTagsSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { ctx, entry } = await loadEntry(parsed.data.id);
  if (!entry || !canEditJournal(entry, ctx.userId, ctx.spaceIds)) {
    return { ok: false };
  }

  const names = [
    ...new Set(
      parsed.data.tags
        .map((tag) => normalizeTagName(tag))
        .filter(isValidTagName),
    ),
  ];
  const tags = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: { name_createdById: { name, createdById: ctx.userId } },
        update: {},
        create: { name, createdById: ctx.userId },
      }),
    ),
  );

  await prisma.journalEntryTag.deleteMany({
    where: { journalEntryId: entry.id },
  });
  if (tags.length) {
    await prisma.journalEntryTag.createMany({
      data: tags.map((tag) => ({
        journalEntryId: entry.id,
        tagId: tag.id,
      })),
    });
  }

  revalidatePath("/journal");
  return { ok: true };
}
