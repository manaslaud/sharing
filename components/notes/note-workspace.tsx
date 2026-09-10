"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Archive, Pin, Trash2 } from "lucide-react";
import { DocumentEditor, type SaveStatus } from "@/components/editor/document-editor";
import { ShareToggle } from "@/components/share-toggle";
import { BackLink } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveNoteAction,
  deleteNoteAction,
  pinNoteAction,
  restoreNoteRevisionAction,
  setNoteTagsAction,
  updateNoteAction,
} from "@/lib/actions/notes";
import { formatRelative } from "@/lib/dates";

type Activity = {
  id: string;
  type: "CREATE" | "EDIT" | "SHARE" | "UNSHARE";
  createdAt: Date;
  actor: { id: string; name: string };
};

type Revision = {
  id: string;
  title: string;
  createdAt: Date;
  editor: { id: string; name: string };
};

export function NoteWorkspace({
  note,
  partnerName,
  currentUserId,
  activities,
  revisions,
}: {
  note: {
    id: string;
    title: string;
    content: unknown;
    visibility: "PRIVATE" | "SHARED";
    isPinned: boolean;
    isArchived: boolean;
    ownerId: string;
    tags: { tag: { name: string } }[];
  };
  partnerName?: string | null;
  currentUserId: string;
  activities: Activity[];
  revisions: Revision[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [tagValue, setTagValue] = useState(
    note.tags.map((item) => item.tag.name).join(", "),
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-4 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackLink href="/notes" />
        <div className="flex flex-wrap items-center justify-end gap-1">
          {note.ownerId === currentUserId ? (
            <ShareToggle
              id={note.id}
              kind="note"
              visibility={note.visibility}
              partnerName={partnerName}
            />
          ) : null}
          <Button
            size="icon-sm"
            variant={note.isPinned ? "secondary" : "ghost"}
            aria-label="Pin"
            onClick={() => pinNoteAction(note.id, !note.isPinned)}
          >
            <Pin className={note.isPinned ? "fill-current" : ""} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Archive"
            onClick={async () => {
              await archiveNoteAction(note.id, !note.isArchived);
              router.push(note.isArchived ? `/notes/${note.id}` : "/notes/archived");
            }}
          >
            <Archive />
          </Button>
          {note.ownerId === currentUserId ? (
            <form action={deleteNoteAction}>
              <input type="hidden" name="id" value={note.id} />
              <Button size="icon-sm" variant="ghost" aria-label="Delete">
                <Trash2 />
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <DocumentEditor
        documentId={note.id}
        kind="note"
        title={title}
        content={note.content as JSONContent}
        onTitleChange={setTitle}
        status={status}
        setStatus={setStatus}
        onSave={(payload) => updateNoteAction({ id: note.id, ...payload })}
      />

      <form
        className="mt-4 flex gap-2"
        action={async (formData) => {
          const tags = String(formData.get("tags") ?? "")
            .split(/[,\s]+/)
            .filter(Boolean);
          await setNoteTagsAction({ id: note.id, tags });
        }}
      >
        <Input
          name="tags"
          value={tagValue}
          onChange={(event) => setTagValue(event.target.value)}
          placeholder="tags: important, ideas"
        />
        <Button type="submit" variant="secondary" size="sm">
          Save tags
        </Button>
      </form>

      {note.visibility === "SHARED" && (
        <div className="mt-8 grid gap-6 pb-10 md:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Activity
            </h2>
            <div className="grid gap-2 text-sm">
              {activities.length === 0 ? (
                <p className="text-muted-foreground">No activity yet.</p>
              ) : (
                activities.map((item) => (
                  <p key={item.id}>
                    {item.actor.id === currentUserId ? "You" : item.actor.name}{" "}
                    {labelFor(item.type)} · {formatRelative(item.createdAt)}
                  </p>
                ))
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Version history
            </h2>
            <div className="grid gap-2 text-sm">
              {revisions.length === 0 ? (
                <p className="text-muted-foreground">No previous versions yet.</p>
              ) : (
                revisions.map((revision) => (
                  <div key={revision.id} className="flex items-center justify-between gap-2">
                    <p>
                      {formatRelative(revision.createdAt)} ·{" "}
                      {revision.editor.id === currentUserId
                        ? "you"
                        : revision.editor.name}
                    </p>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        restoreNoteRevisionAction(note.id, revision.id)
                      }
                    >
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function labelFor(type: Activity["type"]) {
  switch (type) {
    case "SHARE":
      return "shared this note";
    case "UNSHARE":
      return "stopped sharing";
    case "EDIT":
      return "edited this note";
    default:
      return "created this note";
  }
}
