import Link from "next/link";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { prisma } from "@/lib/db";
import { journalAccessWhere, noteAccessWhere, reminderAccessWhere } from "@/lib/authz";
import { formatLongDate, toDateParam } from "@/lib/dates";
import { greetingForHour, hourInTimeZone } from "@/lib/names";
import { previewText } from "@/lib/content";
import { getSpaceContext } from "@/lib/session";
import { createNoteAction } from "@/lib/actions/notes";
import { HomeQuickActions } from "@/components/home-quick-actions";
import { EventRow } from "@/components/events/event-row";
import { ReminderRow } from "@/components/reminders/reminder-row";
import { SubmitButton } from "@/components/ui/submit-button";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";

export default async function HomePage() {
  const ctx = await getSpaceContext();
  const now = new Date();
  const timezone =
    ctx.space.members.find((member) => member.userId === ctx.userId)?.user
      .timezone ?? DEFAULT_TIMEZONE;
  const hour = hourInTimeZone(now, timezone);

  const [reminders, events, pinned, recentNotes, recentJournal] =
    await Promise.all([
      prisma.reminder.findMany({
        where: {
          ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
          dueAt: { lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { dueAt: "asc" },
        take: 6,
      }),
      prisma.event.findMany({
        where: {
          sharedSpaceId: { in: ctx.spaceIds },
          startAt: { gte: now },
        },
        orderBy: { startAt: "asc" },
        take: 4,
      }),
      prisma.note.findMany({
        where: {
          ...noteAccessWhere(ctx.userId, ctx.spaceIds),
          isPinned: true,
          isArchived: false,
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.note.findMany({
        where: {
          ...noteAccessWhere(ctx.userId, ctx.spaceIds),
          isArchived: false,
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.journalEntry.findMany({
        where: journalAccessWhere(ctx.userId, ctx.spaceIds),
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

  const recent = [
    ...recentNotes.map((note) => ({
      href: `/notes/${note.id}`,
      title: note.title || "Untitled note",
      kind: note.visibility === "SHARED" ? "shared-note" : "note",
      updatedAt: note.updatedAt,
      preview: previewText(note.content, 90),
    })),
    ...recentJournal.map((entry) => ({
      href: `/journal/${toDateParam(entry.date)}`,
      title: entry.title || formatLongDate(entry.date),
      kind: entry.visibility === "SHARED" ? "shared-journal" : "journal",
      updatedAt: entry.updatedAt,
      preview: previewText(entry.content, 90),
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  const greeting = `${greetingForHour(Number.isFinite(hour) ? hour : now.getHours())}`;

  return (
    <div>
      <PageHeader
        title={`${greeting} ${ctx.partner ? "❤️" : ""}`}
        description={
          ctx.partner
            ? `You and ${ctx.partner.name.split(" ")[0]}`
            : "Invite someone from Settings to start sharing."
        }
        actions={<HomeQuickActions />}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Upcoming
        </h2>
        {reminders.length === 0 && events.length === 0 ? (
          <EmptyState
            title="Nothing coming up"
            description="Add a reminder or an event to keep track of what matters."
          />
        ) : (
          <div className="grid gap-2">
            {reminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))}
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {pinned.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Pinned
          </h2>
          <div className="grid gap-2">
            {pinned.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="rounded-2xl border bg-card px-4 py-3"
              >
                ⭐ {note.title || "Untitled"}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recently updated
        </h2>
        {recent.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Start writing something important."
            action={
              <form action={createNoteAction}>
                <SubmitButton pendingLabel="Creating…">Create note</SubmitButton>
              </form>
            }
          />
        ) : (
          <div className="grid gap-2">
            {recent.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {item.kind.includes("journal") ? "❤️ " : "📝 "}
                    {item.title}
                  </p>
                  {item.kind.startsWith("shared") ? (
                    <VisibilityBadge visibility="SHARED" />
                  ) : (
                    <VisibilityBadge visibility="PRIVATE" />
                  )}
                </div>
                {item.preview ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.preview}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
