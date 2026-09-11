import { prisma } from "@/lib/db";
import { canAccessJournal, journalAccessWhere } from "@/lib/authz";
import { journalPath, toDateParam } from "@/lib/dates";
import { getSpaceContext } from "@/lib/session";
import { JournalWorkspace } from "@/components/journal/journal-workspace";
import { writeJournalFormAction } from "@/lib/actions/journal";
import { SubmitButton } from "@/components/ui/submit-button";
import { VisibilityBadge } from "@/components/ui-extras";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function JournalDatePage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ entry?: string }>;
}) {
  const { date } = await params;
  const { entry: entryId } = await searchParams;
  const ctx = await getSpaceContext();
  const day = new Date(`${date}T00:00:00.000Z`);

  const entries = await prisma.journalEntry.findMany({
    where: {
      ...journalAccessWhere(ctx.userId, ctx.spaceIds),
      date: day,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  entries.sort((a, b) => {
    if (a.authorId === ctx.userId) return -1;
    if (b.authorId === ctx.userId) return 1;
    return (a.author.name ?? "").localeCompare(b.author.name ?? "");
  });

  const selected =
    entries.find((item) => item.id === entryId) ??
    entries.find((item) => item.authorId === ctx.userId) ??
    entries[0];

  const allDates = await prisma.journalEntry.findMany({
    where: journalAccessWhere(ctx.userId, ctx.spaceIds),
    select: { date: true },
  });

  if (!selected) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start px-4 py-10">
        <h1 className="font-serif text-3xl">{date}</h1>
        <p className="mt-2 text-muted-foreground">No entry for this day yet.</p>
        <form action={writeJournalFormAction} className="mt-6">
          <input type="hidden" name="date" value={date} />
          <SubmitButton pendingLabel="Opening…">Write this day</SubmitButton>
        </form>
      </div>
    );
  }

  if (!canAccessJournal(selected, ctx.userId, ctx.spaceIds)) {
    return null;
  }

  return (
    <div>
      {entries.length > 1 && (
        <div className="mx-auto flex max-w-3xl gap-2 px-4 pt-4">
          {entries.map((item) => (
            <Link
              key={item.id}
              href={journalPath(date, item.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                item.id === selected.id && "border-primary bg-accent",
              )}
            >
              {item.author.name}{" "}
              <VisibilityBadge visibility={item.visibility} />
            </Link>
          ))}
        </div>
      )}
      <JournalWorkspace
        key={selected.id}
        date={date}
        datesWithEntries={allDates.map((item) => toDateParam(item.date))}
        entry={selected}
        partnerName={ctx.partner?.name}
        canDelete={selected.authorId === ctx.userId}
      />
    </div>
  );
}
