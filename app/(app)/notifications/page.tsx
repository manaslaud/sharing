import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
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

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <form action={markAllNotificationsReadAction}>
            <Button variant="secondary" size="sm">
              Mark all read
            </Button>
          </form>
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
            <form
              key={item.id}
              action={async () => {
                "use server";
                await markNotificationReadAction(item.id);
              }}
            >
              <Link
                href={hrefFor(item)}
                className={`block rounded-2xl border px-4 py-3 ${
                  item.readAt ? "bg-card" : "bg-accent"
                }`}
              >
                <p className="font-medium">{item.title}</p>
                {item.body ? (
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelative(item.createdAt)}
                </p>
              </Link>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
