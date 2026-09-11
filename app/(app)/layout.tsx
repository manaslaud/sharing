import { AppShell } from "@/components/app-shell";
import { PushKeepAlive } from "@/components/push-keep-alive";
import { prisma } from "@/lib/db";
import { formatLongDate, journalPath } from "@/lib/dates";
import { journalAccessWhere, noteAccessWhere } from "@/lib/authz";
import { getSpaceContext } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSpaceContext();
  const [pinned, recentNotes, recentJournal, unreadCount] = await Promise.all([
    prisma.note.findMany({
      where: {
        ...noteAccessWhere(ctx.userId, ctx.spaceIds),
        isPinned: true,
        isArchived: false,
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.note.findMany({
      where: {
        ...noteAccessWhere(ctx.userId, ctx.spaceIds),
        isArchived: false,
      },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.journalEntry.findMany({
      where: journalAccessWhere(ctx.userId, ctx.spaceIds),
      select: { id: true, title: true, date: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.notification.count({
      where: { userId: ctx.userId, readAt: null },
    }),
  ]);

  const recent = [
    ...recentNotes.map((note) => ({
      id: note.id,
      title: note.title || "Untitled note",
      href: `/notes/${note.id}`,
      updatedAt: note.updatedAt,
    })),
    ...recentJournal.map((entry) => ({
      id: entry.id,
      title: entry.title || formatLongDate(entry.date),
      href: journalPath(entry.date, entry.id),
      updatedAt: entry.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  return (
    <>
      <PushKeepAlive />
      <AppShell
        spaceName={ctx.space.name}
        unreadCount={unreadCount}
        pinned={pinned.map((note) => ({
          id: note.id,
          title: note.title || "Untitled",
        }))}
        recent={recent}
      >
        {children}
      </AppShell>
    </>
  );
}
