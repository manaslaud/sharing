import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui-extras";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/db";
import { getSpaceContext } from "@/lib/session";
import { formatRelative } from "@/lib/dates";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";

function hrefFor(item: {
  noteId: string | null;
  journalEntryId: string | null;
  reminderId: string | null;
  eventId: string | null;
}) {
  if (item.noteId) return `/notes/${item.noteId}`;
  if (item.journalEntryId) return `/journal`;
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
              <Link href={hrefFor(item)} className="min-w-0 flex-1">
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
