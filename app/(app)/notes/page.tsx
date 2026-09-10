import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui-extras";
import { listAccessibleNotes, createNoteAction } from "@/lib/actions/notes";
import { previewText } from "@/lib/content";
import { formatRelative } from "@/lib/dates";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const notes = await listAccessibleNotes(false);
  const filtered = tag
    ? notes.filter((note) =>
        note.tags.some((item) => item.tag.name === tag.replace(/^#/, "")),
      )
    : notes;

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
      {filtered.length === 0 ? (
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
          {filtered.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="rounded-2xl border bg-card px-4 py-3"
            >
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
              <p className="mt-2 text-xs text-muted-foreground">
                {formatRelative(note.updatedAt)}
                {note.tags.length
                  ? ` · ${note.tags.map((item) => `#${item.tag.name}`).join(" ")}`
                  : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
