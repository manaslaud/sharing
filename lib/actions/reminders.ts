"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { reminderAccessWhere } from "@/lib/authz";
import { nextDueAt, snoozeUntil } from "@/lib/recurrence";
import { getSpaceContext } from "@/lib/session";
import {
  reminderIdSchema,
  reminderSchema,
  updateReminderSchema,
} from "@/lib/validations/reminder";

function revalidateReminderPaths() {
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

export async function createReminderAction(input: unknown) {
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Check the reminder details." };
  }
  const ctx = await getSpaceContext();
  const shared = parsed.data.shared ?? false;

  const reminder = await prisma.reminder.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueAt: parsed.data.dueAt,
      creatorId: ctx.userId,
      assignedToId: shared ? (parsed.data.assignedToId ?? null) : ctx.userId,
      sharedSpaceId: shared ? ctx.space.id : null,
      noteId: parsed.data.noteId ?? null,
      journalEntryId: parsed.data.journalEntryId ?? null,
      eventId: parsed.data.eventId ?? null,
      recurrence: parsed.data.recurrence ?? "NONE",
    },
  });

  revalidateReminderPaths();
  return { ok: true as const, id: reminder.id };
}

export async function updateReminderAction(input: unknown) {
  const parsed = updateReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Check the reminder details." };
  }
  const ctx = await getSpaceContext();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: parsed.data.id,
      ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
    },
  });
  if (!reminder) {
    return { ok: false as const, error: "Reminder not found." };
  }

  const shared = parsed.data.shared ?? Boolean(reminder.sharedSpaceId);

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueAt: parsed.data.dueAt,
      assignedToId: shared ? (parsed.data.assignedToId ?? null) : ctx.userId,
      sharedSpaceId: shared ? ctx.space.id : null,
      noteId: parsed.data.noteId ?? null,
      journalEntryId: parsed.data.journalEntryId ?? null,
      eventId: parsed.data.eventId ?? null,
      recurrence: parsed.data.recurrence ?? reminder.recurrence,
      lastNotifiedAt: null,
    },
  });

  revalidateReminderPaths();
  return { ok: true as const };
}

export async function completeReminderAction(id: string) {
  const parsed = reminderIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };
  const ctx = await getSpaceContext();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: parsed.data.id,
      ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
    },
  });
  if (!reminder) return { ok: false };

  const next = nextDueAt(reminder.dueAt, reminder.recurrence);
  if (next) {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        dueAt: next,
        completedAt: null,
        lastNotifiedAt: null,
        snoozedUntil: null,
      },
    });
  } else {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { completedAt: new Date() },
    });
  }

  revalidateReminderPaths();
  return { ok: true };
}

export async function snoozeReminderAction(id: string) {
  const parsed = reminderIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };
  const ctx = await getSpaceContext();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: parsed.data.id,
      ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
    },
  });
  if (!reminder) return { ok: false };

  const until = snoozeUntil(new Date(), 1);
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: {
      dueAt: until,
      snoozedUntil: until,
      lastNotifiedAt: null,
    },
  });

  revalidateReminderPaths();
  return { ok: true };
}

export async function deleteReminderAction(id: string) {
  const parsed = reminderIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };
  const ctx = await getSpaceContext();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: parsed.data.id,
      ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
    },
  });
  if (!reminder) return { ok: false };

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { deletedAt: new Date() },
  });

  revalidateReminderPaths();
  return { ok: true };
}
