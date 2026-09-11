"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import type { RevisionChangeSummary } from "@/lib/content";
import { formatNoteTime, formatRelative } from "@/lib/dates";

export type VersionHistoryItem = {
  id: string;
  title: string;
  preview: string;
  change: RevisionChangeSummary | null;
  createdAt: Date;
  editor: { id: string; name: string };
};

export function NoteVersionHistory({
  currentUserId,
  revisions,
  restoringId,
  restoring,
  onRestore,
}: {
  currentUserId: string;
  revisions: VersionHistoryItem[];
  restoringId: string | null;
  restoring: boolean;
  onRestore: (revisionId: string) => void;
}) {
  return (
    <section className="mt-8 pb-10">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Version history
      </h2>
      {revisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No previous versions yet.</p>
      ) : (
        <div className="grid gap-2">
          {revisions.map((revision) => {
            const editorName =
              revision.editor.id === currentUserId ? "You" : revision.editor.name;
            return (
              <article
                key={revision.id}
                className="rounded-2xl border bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {formatNoteTime(revision.createdAt)} ·{" "}
                      {formatRelative(revision.createdAt)} · {editorName}
                    </p>
                    <p className="mt-1 font-medium">
                      {revision.title || "Untitled"}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {revision.preview || "Empty note"}
                    </p>
                    {revision.change ? (
                      <div className="mt-2 flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">
                          {revision.change.label}
                        </p>
                        <ActionTooltip label={revision.change.tooltip}>
                          <button
                            type="button"
                            className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                            aria-label={revision.change.tooltip}
                          >
                            <CircleHelp className="size-3.5" />
                          </button>
                        </ActionTooltip>
                      </div>
                    ) : null}
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    loading={restoring && restoringId === revision.id}
                    disabled={restoring}
                    onClick={() => onRestore(revision.id)}
                  >
                    Restore
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
