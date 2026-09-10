import Link from "next/link";
import { archiveNoteAction, listAccessibleNotes } from "@/lib/actions/notes";
import { EmptyState, PageHeader } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { previewText } from "@/lib/content";

export default async function ArchivedNotesPage() {
  const notes = await listAccessibleNotes(true);

  return (
    <div>
      <PageHeader
        title="Archived"
        actions={
          <Link href="/notes" className="text-sm text-muted-foreground hover:text-foreground">
            Back to notes
          </Link>
        }
      />
      {notes.length === 0 ? (
        <EmptyState
          title="Nothing archived"
          description="Archived notes will wait here until you restore them."
        />
      ) : (
        <div className="grid gap-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/notes/${note.id}`} className="font-medium">
                  {note.title || "Untitled"}
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await archiveNoteAction(note.id, false);
                  }}
                >
                  <Button size="xs" variant="secondary">
                    Restore
                  </Button>
                </form>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {previewText(note.content)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
