"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Archive, Pin, Trash2 } from "lucide-react";
import { DocumentEditor, type EditorSaveControls, type SaveStatus } from "@/components/editor/document-editor";
import {
  NoteVersionHistory,
  type VersionHistoryItem,
} from "@/components/notes/note-version-history";
import { ShareToggle } from "@/components/share-toggle";
import { TagPicker } from "@/components/tags/tag-picker";
import { BackLink } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  archiveNoteAction,
  deleteNoteAction,
  pinNoteAction,
  restoreNoteRevisionAction,
  setNoteTagsAction,
  updateNoteAction,
} from "@/lib/actions/notes";
import { formatRelative } from "@/lib/dates";
import { usePendingAction } from "@/lib/use-pending-action";

type Activity = {
  id: string;
  type: "CREATE" | "EDIT" | "SHARE" | "UNSHARE";
  createdAt: Date;
  actor: { id: string; name: string };
};

type Revision = VersionHistoryItem & {
  content: unknown;
};

export function NoteWorkspace({
  note,
  partnerName,
  currentUserId,
  activities,
  revisions,
  suggestedTags,
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
  suggestedTags: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [editorContent, setEditorContent] = useState(
    note.content as JSONContent,
  );
  const [editorKey, setEditorKey] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const { pending: pinning, run: runPin } = usePendingAction();
  const { pending: archiving, run: runArchive } = usePendingAction();
  const { pending: restoring, run: runRestore } = usePendingAction();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const saveControlsRef = useRef<EditorSaveControls | null>(null);
  const loadedNoteId = useRef(note.id);
  const toolbarBusy = pinning || archiving;

  useEffect(() => {
    if (loadedNoteId.current === note.id) return;
    loadedNoteId.current = note.id;
    setTitle(note.title);
    setEditorContent(note.content as JSONContent);
    setEditorKey((key) => key + 1);
  }, [note.id, note.title, note.content]);

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
            loading={pinning}
            disabled={toolbarBusy}
            onClick={() =>
              runPin(() => pinNoteAction(note.id, !note.isPinned))
            }
          >
            <Pin className={note.isPinned ? "fill-current" : ""} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Archive"
            loading={archiving}
            disabled={toolbarBusy}
            onClick={() =>
              runArchive(async () => {
                await archiveNoteAction(note.id, !note.isArchived);
                router.push(note.isArchived ? `/notes/${note.id}` : "/notes/archived");
              })
            }
          >
            <Archive />
          </Button>
          {note.ownerId === currentUserId ? (
            <form action={deleteNoteAction}>
              <input type="hidden" name="id" value={note.id} />
              <SubmitButton size="icon-sm" variant="ghost" aria-label="Delete">
                <Trash2 />
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      <DocumentEditor
        key={`${note.id}-${editorKey}`}
        documentId={note.id}
        kind="note"
        title={title}
        content={editorContent}
        onTitleChange={setTitle}
        status={status}
        setStatus={setStatus}
        onSave={(payload) => updateNoteAction({ id: note.id, ...payload })}
        saveControlsRef={saveControlsRef}
      />

      <div className="mt-4">
        <TagPicker
          selected={note.tags.map((item) => item.tag.name)}
          suggestions={suggestedTags}
          onChange={(tags) => setNoteTagsAction({ id: note.id, tags })}
        />
      </div>

      {note.visibility === "SHARED" && (
        <>
          <section className="mt-8">
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
          <NoteVersionHistory
            currentUserId={currentUserId}
            revisions={revisions}
            restoringId={restoringId}
            restoring={restoring}
            onRestore={(revisionId) => {
              setRestoringId(revisionId);
              runRestore(async () => {
                await saveControlsRef.current?.pause();
                const result = await restoreNoteRevisionAction(
                  note.id,
                  revisionId,
                );
                if (result.ok) {
                  setTitle(result.title);
                  setEditorContent(result.content as JSONContent);
                  setStatus("saved");
                  setEditorKey((key) => key + 1);
                  router.refresh();
                } else {
                  saveControlsRef.current?.resume();
                }
                setRestoringId(null);
              });
            }}
          />
        </>
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
