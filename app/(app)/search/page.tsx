import Link from "next/link";
import { PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { searchContent } from "@/lib/actions/search";
import { previewText } from "@/lib/content";
import { formatLongDate, toDateParam } from "@/lib/dates";

const filters = ["all", "notes", "journal", "shared", "private"] as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const result = await searchContent({
    q: params.q ?? "",
    filter: params.filter ?? "all",
    tag: params.tag,
  });

  return (
    <div>
      <PageHeader title="Search" />
      <form className="mb-4 grid gap-3">
        <input
          name="q"
          defaultValue={result.q}
          placeholder="Search notes and journal…"
          className="h-11 rounded-xl border border-input bg-card px-3"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter}
              href={`/search?q=${encodeURIComponent(result.q)}&filter=${filter}`}
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                result.filter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
            >
              {filter}
            </Link>
          ))}
        </div>
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>
      <div className="grid gap-2">
        {result.notes.map((note) => (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="rounded-2xl border bg-card px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">📝 {note.title || "Untitled"}</p>
              <VisibilityBadge visibility={note.visibility} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {previewText(note.content)}
            </p>
          </Link>
        ))}
        {result.journal.map((entry) => (
          <Link
            key={entry.id}
            href={`/journal/${toDateParam(entry.date)}`}
            className="rounded-2xl border bg-card px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">
                ❤️ {entry.title || formatLongDate(entry.date)}
              </p>
              <VisibilityBadge visibility={entry.visibility} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {previewText(entry.content)}
            </p>
          </Link>
        ))}
        {result.notes.length === 0 && result.journal.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {result.q ? "No matching notes or journal entries." : "Try a search."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
