import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui-extras";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/db";
import { getSpaceContext } from "@/lib/session";
import { formatRelative, journalPath, toDateParam } from "@/lib/dates";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";

function hrefFor(
  item: {
    noteId: string | null;
    journalEntryId: string | null;
    reminderId: string | null;
    eventId: string | null;
  },
  journalDates: Map<string, string>,
) {
  if (item.noteId) return `/notes/${item.noteId}`;
  if (item.journalEntryId) {
    const date = journalDates.get(item.journalEntryId);
    return date ? journalPath(date, item.journalEntryId) : "/journal";
  }
  if (item.eventId) return "/calendar";
  return "/";
}

export default async function NotificationsPage() {
  const ctx = await getSpaceContext();
  const notifications = await prisma.notification.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const journalIds = [
    ...new Set(
      notifications
        .map((item) => item.journalEntryId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const journalEntries = journalIds.length
    ? await prisma.journalEntry.findMany({
        where: { id: { in: journalIds } },
        select: { id: true, date: true },
      })
    : [];
  const journalDates = new Map(
    journalEntries.map((entry) => [entry.id, toDateParam(entry.date)]),
  );
  const hasUnread = notifications.some((item) => !item.readAt);

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          hasUnread ? (
            <form action={markAllNotificationsReadAction}>
              <SubmitButton variant="secondary" size="sm" pendingLabel="Updating…">
                Mark all read
              </SubmitButton>
            </form>
          ) : null
        }
      />
      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="Reminders, shared notes, and events will show up here."
        />
      ) : (
        <div className="grid gap-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 ${
                item.readAt ? "bg-card" : "bg-accent"
              }`}
            >
              <Link href={hrefFor(item, journalDates)} className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                {item.body ? (
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelative(item.createdAt)}
                </p>
              </Link>
              {!item.readAt ? (
                <form
                  className="shrink-0"
                  action={async () => {
                    "use server";
                    await markNotificationReadAction(item.id);
                  }}
                >
                  <SubmitButton
                    size="xs"
                    variant="secondary"
                    pendingLabel="Updating…"
                  >
                    Mark read
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
