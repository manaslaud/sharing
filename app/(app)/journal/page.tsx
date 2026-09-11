import Link from "next/link";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { prisma } from "@/lib/db";
import { journalAccessWhere } from "@/lib/authz";
import { formatLongDate, journalPath, toDateParam } from "@/lib/dates";
import { previewText } from "@/lib/content";
import { getSpaceContext } from "@/lib/session";
import { JournalDateNav } from "@/components/journal/journal-date-nav";
import { WriteTodayButton } from "@/components/journal/write-today-button";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await getSpaceContext();
  const today = toDateParam(new Date());
  const entries = await prisma.journalEntry.findMany({
    where: {
      ...journalAccessWhere(ctx.userId, ctx.spaceIds),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { contentText: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { author: { select: { name: true } }, tags: { include: { tag: true } } },
    orderBy: { date: "desc" },
    take: 60,
  });

  const datesWithEntries = entries.map((entry) => toDateParam(entry.date));

  return (
    <div>
      <PageHeader title="Journal" actions={<WriteTodayButton />} />
      <JournalDateNav
        date={today}
        datesWithEntries={datesWithEntries}
      />
      <form className="mt-4 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search journal…"
          className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </form>
      {entries.length === 0 ? (
        <EmptyState
          title="Your journal is waiting"
          description="Write a few lines about today."
          action={
            <WriteTodayButton />
          }
        />
      ) : (
        <div className="grid gap-8">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={journalPath(entry.date, entry.id)}
              className="block border-b border-border pb-6 last:border-0"
            >
              <p className="font-serif text-xl">{formatLongDate(entry.date)}</p>
              <div className="mt-1 flex items-center gap-2">
                <VisibilityBadge visibility={entry.visibility} />
                {entry.authorId !== ctx.userId ? (
                  <span className="text-xs text-muted-foreground">
                    by {entry.author.name}
                  </span>
                ) : null}
              </div>
              {entry.title ? (
                <p className="mt-2 font-medium">{entry.title}</p>
              ) : null}
              <p className="mt-2 text-muted-foreground">
                {previewText(entry.content, 220) || "Empty entry"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
