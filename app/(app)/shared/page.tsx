import Link from "next/link";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { prisma } from "@/lib/db";
import { getSpaceContext } from "@/lib/session";
import { previewText } from "@/lib/content";
import { formatLongDate, toDateParam } from "@/lib/dates";

export default async function SharedPage() {
  const ctx = await getSpaceContext();
  const [notes, journal] = await Promise.all([
    prisma.note.findMany({
      where: {
        deletedAt: null,
        visibility: "SHARED",
        sharedSpaceId: { in: ctx.spaceIds },
        isArchived: false,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.journalEntry.findMany({
      where: {
        deletedAt: null,
        visibility: "SHARED",
        sharedSpaceId: { in: ctx.spaceIds },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const items = [
    ...notes.map((note) => ({
      href: `/notes/${note.id}`,
      title: note.title || "Untitled note",
      kind: "note" as const,
      preview: previewText(note.content),
      updatedAt: note.updatedAt,
    })),
    ...journal.map((entry) => ({
      href: `/journal/${toDateParam(entry.date)}`,
      title: entry.title || formatLongDate(entry.date),
      kind: "journal" as const,
      preview: previewText(entry.content),
      updatedAt: entry.updatedAt,
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <div>
      <PageHeader
        title="Shared with each other"
        description={
          ctx.partner
            ? `Everything currently shared with ${ctx.partner.name.split(" ")[0]}`
            : "Invite someone to start sharing."
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title="Nothing shared yet"
          description="Open a note or journal entry and share it."
        />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {item.kind === "journal" ? "❤️ " : "📝 "}
                  {item.title}
                </p>
                <VisibilityBadge visibility="SHARED" />
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
    </div>
  );
}
