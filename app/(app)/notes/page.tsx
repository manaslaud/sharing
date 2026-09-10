import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { listAccessibleNotes, createNoteAction } from "@/lib/actions/notes";
import { previewText } from "@/lib/content";
import { formatRelative } from "@/lib/dates";
import { normalizeTagName } from "@/lib/tags";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const query = q?.trim() ?? "";
  const notes = await listAccessibleNotes(false, { q: query, tag });
  const activeTag = tag ? normalizeTagName(tag) : "";
  const searching = Boolean(query || activeTag);

  return (
    <div>
      <PageHeader
        title="Notes"
        actions={
          <div className="flex gap-2">
            <Link href="/notes/archived" className="text-sm text-muted-foreground hover:text-foreground">
              Archived
            </Link>
            <form action={createNoteAction}>
              <SubmitButton pendingLabel="Creating…">New note</SubmitButton>
            </form>
          </div>
        }
      />
      <form className="mb-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search notes and tags…"
          className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
        {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
      </form>
      {activeTag ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Tagged{" "}
          <Link
            href={query ? `/notes?q=${encodeURIComponent(query)}` : "/notes"}
            className="rounded-full bg-secondary px-2.5 py-1 text-foreground hover:bg-secondary/80"
          >
            #{activeTag} ×
          </Link>
        </p>
      ) : null}
      {notes.length === 0 ? (
        <EmptyState
          title={searching ? "No matching notes" : "No notes yet"}
          description={
            searching
              ? "Try a different title, body, or tag."
              : "Start writing something important."
          }
          action={
            searching ? undefined : (
              <form action={createNoteAction}>
                <SubmitButton pendingLabel="Creating…">Create note</SubmitButton>
              </form>
            )
          }
        />
      ) : (
        <div className="grid gap-2">
          {notes.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border bg-card px-4 py-3"
            >
              <Link href={`/notes/${note.id}`} className="block">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {note.isPinned ? "⭐ " : "📝 "}
                    {note.title || "Untitled"}
                  </p>
                  <VisibilityBadge visibility={note.visibility} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {previewText(note.content) || "Empty note"}
                </p>
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatRelative(note.updatedAt)}
                {note.tags.map((item) => (
                  <Link
                    key={item.tag.id}
                    href={`/notes?tag=${encodeURIComponent(item.tag.name)}`}
                    className={
                      item.tag.name === activeTag
                        ? "ml-1 font-medium text-foreground"
                        : "ml-1 hover:text-foreground"
                    }
                  >
                    #{item.tag.name}
                  </Link>
                ))}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
