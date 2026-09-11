import Link from "next/link";
import { startOfDay } from "date-fns";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { prisma } from "@/lib/db";
import { journalAccessWhere, noteAccessWhere, reminderAccessWhere } from "@/lib/authz";
import { formatLongDate, journalPath } from "@/lib/dates";
import { greetingForHour, hourInTimeZone } from "@/lib/names";
import { previewText } from "@/lib/content";
import { previousOccurrence, upcomingOccurrence } from "@/lib/recurrence";
import { getSpaceContext } from "@/lib/session";
import { createNoteAction } from "@/lib/actions/notes";
import { HomeQuickActions } from "@/components/home-quick-actions";
import { EventRow } from "@/components/events/event-row";
import { ReminderRow } from "@/components/reminders/reminder-row";
import { SubmitButton } from "@/components/ui/submit-button";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";

const SCHEDULE_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const SCHEDULE_LIMIT = 8;

type ScheduleItem =
  | {
      kind: "reminder";
      id: string;
      title: string;
      when: Date;
      sharedSpaceId: string | null;
    }
  | {
      kind: "event";
      id: string;
      title: string;
      when: Date;
    };

function sortByWhen(items: ScheduleItem[], direction: "asc" | "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return [...items].sort(
    (a, b) => sign * (a.when.getTime() - b.when.getTime()),
  );
}

export default async function HomePage() {
  const ctx = await getSpaceContext();
  const now = new Date();
  const timezone =
    ctx.space.members.find((member) => member.userId === ctx.userId)?.user
      .timezone ?? DEFAULT_TIMEZONE;
  const hour = hourInTimeZone(now, timezone);

  const lookbackFrom = new Date(now.getTime() - SCHEDULE_WINDOW_MS);
  const lookaheadTo = new Date(now.getTime() + SCHEDULE_WINDOW_MS);

  const [reminders, events, pinned, recentNotes, recentJournal] =
    await Promise.all([
      prisma.reminder.findMany({
        where: {
          ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
          AND: [
            {
              OR: [
                { recurrence: "NONE", dueAt: { gte: lookbackFrom, lte: lookaheadTo } },
                { recurrence: { not: "NONE" } },
              ],
            },
          ],
        },
        orderBy: { dueAt: "asc" },
      }),
      prisma.event.findMany({
        where: {
          sharedSpaceId: { in: ctx.spaceIds },
          startAt: { gte: lookbackFrom, lte: lookaheadTo },
        },
        orderBy: { startAt: "asc" },
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
      href: journalPath(entry.date, entry.id),
      title: entry.title || formatLongDate(entry.date),
      kind: entry.visibility === "SHARED" ? "shared-journal" : "journal",
      updatedAt: entry.updatedAt,
      preview: previewText(entry.content, 90),
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  const upcoming: ScheduleItem[] = [];
  const previous: ScheduleItem[] = [];

  for (const reminder of reminders) {
    const created = startOfDay(reminder.createdAt);
    const seriesStart =
      reminder.dueAt.getTime() > created.getTime() ? reminder.dueAt : created;
    const nextWhen = upcomingOccurrence(
      reminder.dueAt,
      reminder.recurrence,
      now,
      seriesStart,
    );
    const lastWhen = previousOccurrence(
      reminder.dueAt,
      reminder.recurrence,
      now,
      seriesStart,
    );
    if (nextWhen && nextWhen.getTime() <= lookaheadTo.getTime()) {
      upcoming.push({
        kind: "reminder",
        id: reminder.id,
        title: reminder.title,
        when: nextWhen,
        sharedSpaceId: reminder.sharedSpaceId,
      });
    }
    if (lastWhen && lastWhen.getTime() >= lookbackFrom.getTime()) {
      previous.push({
        kind: "reminder",
        id: reminder.id,
        title: reminder.title,
        when: lastWhen,
        sharedSpaceId: reminder.sharedSpaceId,
      });
    }
  }

  for (const event of events) {
    const item: ScheduleItem = {
      kind: "event",
      id: event.id,
      title: event.title,
      when: event.startAt,
    };
    if (event.startAt.getTime() >= now.getTime()) upcoming.push(item);
    else previous.push(item);
  }

  const upcomingItems = sortByWhen(upcoming, "asc").slice(0, SCHEDULE_LIMIT);
  const previousItems = sortByWhen(previous, "desc").slice(0, SCHEDULE_LIMIT);

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

      <ScheduleSection
        title="Upcoming"
        items={upcomingItems}
        empty={{
          title: "Nothing coming up",
          description: "Add a reminder or an event to keep track of what matters.",
        }}
      />

      <ScheduleSection title="Previous" items={previousItems} />

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

function ScheduleSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: ScheduleItem[];
  empty?: { title: string; description: string };
}) {
  if (items.length === 0) {
    if (!empty) return null;
    return (
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <EmptyState title={empty.title} description={empty.description} />
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-2">
        {items.map((item) =>
          item.kind === "reminder" ? (
            <ReminderRow
              key={`reminder-${item.id}-${item.when.getTime()}`}
              reminder={{
                id: item.id,
                title: item.title,
                dueAt: item.when,
                sharedSpaceId: item.sharedSpaceId,
              }}
            />
          ) : (
            <EventRow
              key={`event-${item.id}`}
              event={{
                id: item.id,
                title: item.title,
                startAt: item.when,
              }}
            />
          ),
        )}
      </div>
    </section>
  );
}
