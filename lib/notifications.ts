import { prisma } from "@/lib/db";
import { firstName } from "@/lib/names";
import type { NotificationType } from "@prisma/client";

type SharedKind = "note" | "journal";

async function memberIdsExcept(spaceId: string, actorId: string) {
  const members = await prisma.sharedSpaceMember.findMany({
    where: { sharedSpaceId: spaceId, userId: { not: actorId } },
    select: { userId: true },
  });
  return members.map((member) => member.userId);
}

async function prefsFor(userIds: string[]) {
  return prisma.notificationPreference.findMany({
    where: { userId: { in: userIds } },
  });
}

async function createForUsers(args: {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  noteId?: string;
  journalEntryId?: string;
  reminderId?: string;
  eventId?: string;
  preference: "sharedContent" | "reminders" | "events";
}) {
  if (!args.userIds.length) return;
  const prefs = await prefsFor(args.userIds);
  const prefMap = new Map(prefs.map((pref) => [pref.userId, pref]));
  const eligible = args.userIds.filter((userId) => {
    const pref = prefMap.get(userId);
    if (!pref) return true;
    return pref[args.preference];
  });

  if (!eligible.length) return;

  await prisma.notification.createMany({
    data: eligible.map((userId) => ({
      userId,
      type: args.type,
      title: args.title,
      body: args.body,
      noteId: args.noteId,
      journalEntryId: args.journalEntryId,
      reminderId: args.reminderId,
      eventId: args.eventId,
    })),
  });
}

export async function notifySharedItem(args: {
  spaceId: string;
  actorId: string;
  actorName: string;
  kind: SharedKind;
  title: string;
  noteId?: string;
  journalEntryId?: string;
}) {
  const userIds = await memberIdsExcept(args.spaceId, args.actorId);
  const who = firstName(args.actorName);
  await createForUsers({
    userIds,
    type: args.kind === "note" ? "NOTE_SHARED" : "JOURNAL_SHARED",
    title:
      args.kind === "note"
        ? `${who} shared a note with you`
        : `${who} shared a journal entry with you`,
    body: args.title,
    noteId: args.noteId,
    journalEntryId: args.journalEntryId,
    preference: "sharedContent",
  });
}

export async function notifySharedEdit(args: {
  spaceId: string;
  actorId: string;
  actorName: string;
  kind: SharedKind;
  title: string;
  noteId?: string;
  journalEntryId?: string;
}) {
  const userIds = await memberIdsExcept(args.spaceId, args.actorId);
  const who = firstName(args.actorName);
  await createForUsers({
    userIds,
    type: args.kind === "note" ? "NOTE_EDITED" : "JOURNAL_EDITED",
    title:
      args.kind === "note"
        ? `${who} edited “${args.title}”`
        : `${who} edited a journal entry`,
    body: args.title,
    noteId: args.noteId,
    journalEntryId: args.journalEntryId,
    preference: "sharedContent",
  });
}

export async function notifyReminderDue(args: {
  userIds: string[];
  title: string;
  reminderId: string;
}) {
  await createForUsers({
    userIds: [...new Set(args.userIds)],
    type: "REMINDER_DUE",
    title: `Reminder: ${args.title}`,
    reminderId: args.reminderId,
    preference: "reminders",
  });
}

export async function notifyEventSoon(args: {
  userIds: string[];
  title: string;
  eventId: string;
}) {
  await createForUsers({
    userIds: [...new Set(args.userIds)],
    type: "EVENT_SOON",
    title: `${args.title} starts in 30 minutes`,
    eventId: args.eventId,
    preference: "events",
  });
}

export { memberIdsExcept };
