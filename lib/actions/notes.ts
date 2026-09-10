"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { emptyDoc, extractText } from "@/lib/content";
import {
  canAccessNote,
  canDeleteNote,
  canEditNote,
  canShareNote,
  noteAccessWhere,
} from "@/lib/authz";
import { getSpaceContext } from "@/lib/session";
import {
  noteIdSchema,
  setTagsSchema,
  updateNoteSchema,
} from "@/lib/validations/note";
import { notifySharedEdit, notifySharedItem } from "@/lib/notifications";

async function loadNoteForUser(id: string) {
  const ctx = await getSpaceContext();
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || !canAccessNote(note, ctx.userId, ctx.spaceIds)) {
    return { ctx, note: null };
  }
  return { ctx, note };
}

export async function createNoteAction(_formData?: FormData) {
  const ctx = await getSpaceContext();
  const note = await prisma.note.create({
    data: {
      title: "",
      content: emptyDoc,
      contentText: "",
      ownerId: ctx.userId,
    },
  });
  redirect(`/notes/${note.id}`);
}

export async function updateNoteAction(input: unknown) {
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid note data." };
  }

  const { ctx, note } = await loadNoteForUser(parsed.data.id);
  if (!note || !canEditNote(note, ctx.userId, ctx.spaceIds)) {
    return { ok: false as const, error: "You can't edit this note." };
  }

  const nextTitle = parsed.data.title ?? note.title;
  const nextContent = (parsed.data.content ?? note.content) as Prisma.InputJsonValue;
  const nextText =
    parsed.data.content !== undefined
      ? extractText(parsed.data.content)
      : note.contentText;

  const titleChanged = nextTitle !== note.title;
  const contentChanged = parsed.data.content !== undefined;

  if (note.visibility === "SHARED" && (titleChanged || contentChanged)) {
    const lastRevision = await prisma.noteRevision.findFirst({
      where: { noteId: note.id },
      orderBy: { createdAt: "desc" },
    });
    const shouldSnapshot =
      !lastRevision ||
      lastRevision.editorId !== ctx.userId ||
      Date.now() - lastRevision.createdAt.getTime() > 2 * 60 * 1000;

    if (shouldSnapshot) {
      await prisma.noteRevision.create({
        data: {
          noteId: note.id,
          title: note.title,
          content: note.content as Prisma.InputJsonValue,
          editorId: ctx.userId,
        },
      });
    }

    const lastEdit = await prisma.activity.findFirst({
      where: { noteId: note.id, actorId: ctx.userId, type: "EDIT" },
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
          sharedSpaceId: note.sharedSpaceId ?? ctx.space.id,
          noteId: note.id,
        },
      });
      await notifySharedEdit({
        spaceId: note.sharedSpaceId ?? ctx.space.id,
        actorId: ctx.userId,
        actorName: ctx.user.name ?? "Someone",
        kind: "note",
        title: nextTitle || "Untitled note",
        noteId: note.id,
      });
    }
  }

  await prisma.note.update({
    where: { id: note.id },
    data: {
      title: nextTitle,
      content: nextContent,
      contentText: nextText,
    },
  });

  return { ok: true as const, savedAt: new Date().toISOString() };
}

export async function deleteNoteAction(formData: FormData) {
  const parsed = noteIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const { ctx, note } = await loadNoteForUser(parsed.data.id);
  if (!note || !canDeleteNote(note, ctx.userId)) return;

  await prisma.note.update({
    where: { id: note.id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/notes");
  revalidatePath("/");
  redirect("/notes");
}

export async function archiveNoteAction(id: string, archived: boolean) {
  const parsed = noteIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };
  const { ctx, note } = await loadNoteForUser(parsed.data.id);
  if (!note || !canEditNote(note, ctx.userId, ctx.spaceIds)) {
    return { ok: false };
  }

  await prisma.note.update({
    where: { id: note.id },
    data: { isArchived: archived },
  });
  revalidatePath("/notes");
  revalidatePath("/notes/archived");
  revalidatePath("/");
  return { ok: true };
}

export async function pinNoteAction(id: string, pinned: boolean) {
  const parsed = noteIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };
  const { ctx, note } = await loadNoteForUser(parsed.data.id);
  if (!note || !canEditNote(note, ctx.userId, ctx.spaceIds)) {
    return { ok: false };
  }

  await prisma.note.update({
    where: { id: note.id },
    data: { isPinned: pinned },
  });
  revalidatePath("/notes");
  revalidatePath("/");
  return { ok: true };
}

export async function shareNoteAction(id: string, share: boolean) {
  const parsed = noteIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid note." };
  const { ctx, note } = await loadNoteForUser(parsed.data.id);
  if (!note || !canShareNote(note, ctx.userId)) {
    return { ok: false, error: "You can't change sharing on this note." };
  }

  await prisma.note.update({
    where: { id: note.id },
    data: share
      ? { visibility: "SHARED", sharedSpaceId: ctx.space.id }
      : { visibility: "PRIVATE", sharedSpaceId: null },
  });

  await prisma.activity.create({
    data: {
      type: share ? "SHARE" : "UNSHARE",
      actorId: ctx.userId,
      sharedSpaceId: ctx.space.id,
      noteId: note.id,
    },
  });

  if (share) {
    await notifySharedItem({
      spaceId: ctx.space.id,
      actorId: ctx.userId,
      actorName: ctx.user.name ?? "Someone",
      kind: "note",
      title: note.title || "Untitled note",
      noteId: note.id,
    });
  }

  revalidatePath(`/notes/${note.id}`);
  revalidatePath("/shared");
  revalidatePath("/notes");
  revalidatePath("/");
  return { ok: true };
}

export async function restoreNoteRevisionAction(noteId: string, revisionId: string) {
  const { ctx, note } = await loadNoteForUser(noteId);
  if (!note || !canEditNote(note, ctx.userId, ctx.spaceIds)) {
    return { ok: false as const, error: "You can't restore this note." };
  }

  const revision = await prisma.noteRevision.findFirst({
    where: { id: revisionId, noteId: note.id },
  });
  if (!revision) {
    return { ok: false as const, error: "Revision not found." };
  }

  await prisma.noteRevision.create({
    data: {
      noteId: note.id,
      title: note.title,
      content: note.content as Prisma.InputJsonValue,
      editorId: ctx.userId,
    },
  });

  await prisma.note.update({
    where: { id: note.id },
    data: {
      title: revision.title,
      content: revision.content as Prisma.InputJsonValue,
      contentText: extractText(revision.content),
    },
  });

  revalidatePath(`/notes/${note.id}`);
  return { ok: true as const };
}

export async function setNoteTagsAction(input: unknown) {
  const parsed = setTagsSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { ctx, note } = await loadNoteForUser(parsed.data.id);
  if (!note || !canEditNote(note, ctx.userId, ctx.spaceIds)) {
    return { ok: false };
  }

  const names = [
    ...new Set(
      parsed.data.tags.map((tag) => tag.replace(/^#/, "").toLowerCase()),
    ),
  ];

  const tags = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: {
          name_createdById: { name, createdById: ctx.userId },
        },
        update: {},
        create: { name, createdById: ctx.userId },
      }),
    ),
  );

  await prisma.noteTag.deleteMany({ where: { noteId: note.id } });
  if (tags.length) {
    await prisma.noteTag.createMany({
      data: tags.map((tag) => ({ noteId: note.id, tagId: tag.id })),
    });
  }

  revalidatePath(`/notes/${note.id}`);
  revalidatePath("/notes");
  return { ok: true };
}

export async function listAccessibleNotes(archived = false) {
  const ctx = await getSpaceContext();
  return prisma.note.findMany({
    where: {
      ...noteAccessWhere(ctx.userId, ctx.spaceIds),
      isArchived: archived,
    },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });
}
