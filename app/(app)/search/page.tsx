import Link from "next/link";
import { PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { SearchForm } from "@/components/search/search-form";
import { searchContent } from "@/lib/actions/search";
import { previewText } from "@/lib/content";
import { formatLongDate, journalPath } from "@/lib/dates";

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
      <SearchForm
        key={`${result.q}|${result.filter}|${result.tag ?? ""}`}
        q={result.q}
        filter={result.filter}
        tag={result.tag}
      >
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
              {note.tags.length ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {note.tags.map((item) => `#${item.tag.name}`).join(" ")}
                </p>
              ) : null}
            </Link>
          ))}
          {result.journal.map((entry) => (
            <Link
              key={entry.id}
              href={journalPath(entry.date, entry.id)}
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
              {result.q || result.tag
                ? "No matching notes or journal entries."
                : "Try a search."}
            </p>
          ) : null}
        </div>
      </SearchForm>
    </div>
  );
}
