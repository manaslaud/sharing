import { endOfMonth, startOfMonth } from "date-fns";
import { PageHeader } from "@/components/ui-extras";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { prisma } from "@/lib/db";
import { journalAccessWhere, reminderAccessWhere } from "@/lib/authz";
import { toDateParam } from "@/lib/dates";
import { getSpaceContext } from "@/lib/session";

export default async function CalendarPage() {
  const ctx = await getSpaceContext();
  const now = new Date();
  const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const to = endOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  const [events, reminders, journal] = await Promise.all([
    prisma.event.findMany({
      where: {
        sharedSpaceId: { in: ctx.spaceIds },
        startAt: { gte: from, lte: to },
      },
    }),
    prisma.reminder.findMany({
      where: {
        ...reminderAccessWhere(ctx.userId, ctx.spaceIds),
        completedAt: null,
        dueAt: { gte: from, lte: to },
      },
    }),
    prisma.journalEntry.findMany({
      where: {
        ...journalAccessWhere(ctx.userId, ctx.spaceIds),
        date: { gte: from, lte: to },
      },
    }),
  ]);

  const markerMap = new Map<
    string,
    { date: string; journal?: boolean; reminder?: boolean; event?: boolean }
  >();
  const itemsByDate: Record<
    string,
    (
      | { kind: "journal"; title: string; href: string; shared?: boolean }
      | { kind: "reminder"; title: string; when: Date }
      | { kind: "event"; title: string; when: Date }
    )[]
  > = {};

  function bucket(date: string) {
    if (!itemsByDate[date]) itemsByDate[date] = [];
    if (!markerMap.has(date)) markerMap.set(date, { date });
    return { items: itemsByDate[date], marker: markerMap.get(date)! };
  }

  for (const entry of journal) {
    const date = toDateParam(entry.date);
    const { items, marker } = bucket(date);
    marker.journal = true;
    items.push({
      kind: "journal",
      title: entry.title || "Journal",
      href: `/journal/${date}`,
      shared: entry.visibility === "SHARED",
    });
  }
  for (const reminder of reminders) {
    const date = toDateParam(reminder.dueAt);
    const { items, marker } = bucket(date);
    marker.reminder = true;
    items.push({ kind: "reminder", title: reminder.title, when: reminder.dueAt });
  }
  for (const event of events) {
    const date = toDateParam(event.startAt);
    const { items, marker } = bucket(date);
    marker.event = true;
    items.push({ kind: "event", title: event.title, when: event.startAt });
  }

  return (
    <div>
      <PageHeader title="Calendar" />
      <MonthCalendar
        initialMonth={toDateParam(now)}
        markers={[...markerMap.values()]}
        itemsByDate={itemsByDate}
      />
    </div>
  );
}
