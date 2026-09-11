"use client";

import { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { DocumentEditor, type SaveStatus } from "@/components/editor/document-editor";
import { ShareToggle } from "@/components/share-toggle";
import { BackLink } from "@/components/ui-extras";
import { SubmitButton } from "@/components/ui/submit-button";
import { JournalDateNav } from "@/components/journal/journal-date-nav";
import {
  deleteJournalAction,
  updateJournalAction,
} from "@/lib/actions/journal";
import { formatLongDate } from "@/lib/dates";

export function JournalWorkspace({
  date,
  datesWithEntries,
  entry,
  partnerName,
  canDelete,
}: {
  date: string;
  datesWithEntries: string[];
  entry: {
    id: string;
    title: string;
    content: unknown;
    visibility: "PRIVATE" | "SHARED";
    authorId: string;
  };
  partnerName?: string | null;
  canDelete: boolean;
}) {
  const [title, setTitle] = useState(entry.title);
  const [status, setStatus] = useState<SaveStatus>("idle");

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-4 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackLink href="/journal" />
        <div className="flex items-center gap-1">
          <ShareToggle
            id={entry.id}
            kind="journal"
            visibility={entry.visibility}
            partnerName={partnerName}
          />
          {canDelete ? (
            <form action={deleteJournalAction}>
              <input type="hidden" name="id" value={entry.id} />
              <SubmitButton size="icon-sm" variant="ghost" aria-label="Delete">
                <Trash2 />
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </div>
      <p className="mb-4 font-serif text-2xl">{formatLongDate(date)}</p>
      <JournalDateNav date={date} datesWithEntries={datesWithEntries} />
      <DocumentEditor
        documentId={entry.id}
        kind="journal"
        journalDate={date}
        title={title}
        content={entry.content as JSONContent}
        placeholder="Today was..."
        onTitleChange={setTitle}
        status={status}
        setStatus={setStatus}
        onSave={(payload) =>
          updateJournalAction({ id: entry.id, date, ...payload })
        }
      />
    </div>
  );
}
