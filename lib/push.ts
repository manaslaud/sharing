import webpush from "web-push";
import { prisma } from "@/lib/db";
import {
  notifyEventSoon,
  notifyReminderDue,
} from "@/lib/notifications";
import {
  shouldFinalizeDispatch,
  type PushSendResult,
} from "@/lib/push-result";
import { nextOccurrence } from "@/lib/recurrence";

export type { PushSendResult } from "@/lib/push-result";
export { shouldFinalizeDispatch } from "@/lib/push-result";

function configurePush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:shared-space@localhost";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function sendPush(
  userId: string,
  payload: { title: string; body?: string; url?: string },
): Promise<PushSendResult> {
  if (!configurePush()) {
    return { attempted: 0, delivered: 0, awaitingSubscription: true };
  }
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  if (!pref?.pushEnabled) {
    return { attempted: 0, delivered: 0, awaitingSubscription: false };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  if (subscriptions.length === 0) {
    return { attempted: 0, delivered: 0, awaitingSubscription: true };
  }

  const outcomes = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        return true;
      } catch (error) {
        const status =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        return false;
      }
    }),
  );

  const delivered = outcomes.filter(Boolean).length;
  return {
    attempted: subscriptions.length,
    delivered,
    awaitingSubscription: delivered === 0,
  };
}

async function pushToUsers(
  userIds: string[],
  payload: { title: string; body?: string; url?: string },
) {
  const results: PushSendResult[] = [];
  for (const userId of userIds) {
    results.push(await sendPush(userId, payload));
  }
  return results;
}

export async function dispatchDueNotifications() {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000);
  const eventRetryAfter = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const reminders = await prisma.reminder.findMany({
    where: {
      deletedAt: null,
      dueAt: { lte: now },
      OR: [{ lastNotifiedAt: null }, { recurrence: { not: "NONE" } }],
    },
    include: {
      sharedSpace: { include: { members: true } },
    },
  });

  let remindersPushed = 0;

  for (const reminder of reminders) {
    const recurring = reminder.recurrence !== "NONE";
    const needsNotify = reminder.lastNotifiedAt == null;
    const userIds = [
      ...(reminder.sharedSpaceId
        ? reminder.assignedToId
          ? [reminder.assignedToId]
          : reminder.sharedSpace?.members.map((member) => member.userId) ?? [
              reminder.creatorId,
            ]
        : [reminder.assignedToId ?? reminder.creatorId]),
    ].filter(Boolean);

    if (needsNotify) {
      await notifyReminderDue({
        userIds,
        title: reminder.title,
        reminderId: reminder.id,
      });

      const results = await pushToUsers(userIds, {
        title: "Reminder",
        body: reminder.title,
        url: "/",
      });

      if (!shouldFinalizeDispatch(results)) continue;
      remindersPushed += 1;
    }

    if (recurring) {
      const next = nextOccurrence(reminder.dueAt, reminder.recurrence, now);
      if (next) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            dueAt: next,
            lastNotifiedAt: null,
          },
        });
      }
    } else if (needsNotify) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { lastNotifiedAt: now },
      });
    }
  }

  const events = await prisma.event.findMany({
    where: {
      lastNotifiedAt: null,
      startAt: { gt: eventRetryAfter, lte: soon },
    },
    include: {
      sharedSpace: { include: { members: true } },
    },
  });

  let eventsPushed = 0;

  for (const event of events) {
    const userIds = event.sharedSpace.members.map((member) => member.userId);
    await notifyEventSoon({
      userIds,
      title: event.title,
      eventId: event.id,
    });
    const minutes = Math.round(
      (event.startAt.getTime() - now.getTime()) / 60_000,
    );
    const results = await pushToUsers(userIds, {
      title: "Upcoming event",
      body:
        minutes > 0
          ? `${event.title} starts in ${minutes} minutes`
          : `${event.title} is starting`,
      url: "/calendar",
    });
    if (shouldFinalizeDispatch(results)) {
      await prisma.event.update({
        where: { id: event.id },
        data: { lastNotifiedAt: now },
      });
      eventsPushed += 1;
    }
  }

  return { reminders: remindersPushed, events: eventsPushed };
}
