"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { JSONContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Heading1,
  Heading2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cacheDocument, enqueueJob, saveDraft } from "@/lib/offline";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

export type EditorSaveControls = {
  pause: () => Promise<void>;
  resume: () => void;
};

type Props = {
  documentId: string;
  kind: "note" | "journal";
  journalDate?: string;
  title: string;
  content: JSONContent;
  placeholder?: string;
  onTitleChange: (title: string) => void;
  onSave: (payload: {
    title: string;
    content: JSONContent;
  }) => Promise<{ ok: boolean }>;
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
  saveControlsRef?: MutableRefObject<EditorSaveControls | null>;
};

export function DocumentEditor({
  documentId,
  kind,
  journalDate,
  title,
  content,
  placeholder = "Start writing...",
  onTitleChange,
  onSave,
  status,
  setStatus,
  saveControlsRef,
}: Props) {
  const [localTitle, setLocalTitle] = useState(title);
  const persistGeneration = useRef(0);
  const timeoutRef = useRef<number | undefined>(undefined);
  const inflightRef = useRef<Promise<void> | null>(null);
  const savePausedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-neutral dark:prose-invert max-w-none px-1 py-4 text-base leading-8",
      },
    },
  });

  const persistRef = useCallback(
    async (nextTitle: string, nextContent: JSONContent) => {
      const generation = persistGeneration.current;
      const work = (async () => {
        if (generation !== persistGeneration.current) return;

        const payload = { title: nextTitle, content: nextContent };
        await saveDraft(documentId, payload);
        await cacheDocument(documentId, payload);
        if (generation !== persistGeneration.current) return;

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await enqueueJob({
            id: documentId,
            kind,
            payload:
              kind === "note"
                ? { id: documentId, ...payload }
                : { id: documentId, date: journalDate ?? documentId, ...payload },
            createdAt: new Date().toISOString(),
          });
          if (generation !== persistGeneration.current) return;
          setStatus("offline");
          return;
        }

        setStatus("saving");
        try {
          const result = await onSave(payload);
          if (generation !== persistGeneration.current) return;
          if (result.ok) {
            setStatus("saved");
          } else {
            setStatus("error");
          }
        } catch {
          if (generation !== persistGeneration.current) return;
          await enqueueJob({
            id: documentId,
            kind,
            payload:
              kind === "note"
                ? { id: documentId, ...payload }
                : { id: documentId, date: journalDate ?? documentId, ...payload },
            createdAt: new Date().toISOString(),
          });
          if (generation !== persistGeneration.current) return;
          setStatus("error");
        }
      })();

      inflightRef.current = work;
      try {
        await work;
      } finally {
        if (inflightRef.current === work) inflightRef.current = null;
      }
    },
    [documentId, journalDate, kind, onSave, setStatus],
  );

  const persistLatest = useRef(persistRef);
  useEffect(() => {
    persistLatest.current = persistRef;
  }, [persistRef]);

  const clearScheduledPersist = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!saveControlsRef) return undefined;
    saveControlsRef.current = {
      pause: async () => {
        savePausedRef.current = true;
        persistGeneration.current += 1;
        clearScheduledPersist();
        if (inflightRef.current) await inflightRef.current;
      },
      resume: () => {
        savePausedRef.current = false;
      },
    };
    return () => {
      saveControlsRef.current = null;
    };
  }, [clearScheduledPersist, saveControlsRef]);

  useEffect(() => {
    if (!editor) return undefined;
    const schedule = () => {
      if (savePausedRef.current) return;
      clearScheduledPersist();
      timeoutRef.current = window.setTimeout(() => {
        persistLatest.current(localTitle, editor.getJSON() as JSONContent);
      }, 800);
    };
    editor.on("update", schedule);
    return () => {
      editor.off("update", schedule);
      clearScheduledPersist();
    };
  }, [clearScheduledPersist, editor, localTitle]);

  useEffect(() => {
    if (!editor) return undefined;
    if (savePausedRef.current) return undefined;
    clearScheduledPersist();
    timeoutRef.current = window.setTimeout(() => {
      persistLatest.current(localTitle, editor.getJSON() as JSONContent);
    }, 800);
    return () => clearScheduledPersist();
  }, [clearScheduledPersist, editor, localTitle]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const tools = useMemo(
    () => [
      {
        key: "h1",
        icon: Heading1,
        action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor?.isActive("heading", { level: 1 }),
      },
      {
        key: "h2",
        icon: Heading2,
        action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor?.isActive("heading", { level: 2 }),
      },
      {
        key: "bold",
        icon: Bold,
        action: () => editor?.chain().focus().toggleBold().run(),
        active: editor?.isActive("bold"),
      },
      {
        key: "italic",
        icon: Italic,
        action: () => editor?.chain().focus().toggleItalic().run(),
        active: editor?.isActive("italic"),
      },
      {
        key: "underline",
        icon: UnderlineIcon,
        action: () => editor?.chain().focus().toggleUnderline().run(),
        active: editor?.isActive("underline"),
      },
      {
        key: "bullet",
        icon: List,
        action: () => editor?.chain().focus().toggleBulletList().run(),
        active: editor?.isActive("bulletList"),
      },
      {
        key: "ordered",
        icon: ListOrdered,
        action: () => editor?.chain().focus().toggleOrderedList().run(),
        active: editor?.isActive("orderedList"),
      },
      {
        key: "task",
        icon: ListTodo,
        action: () => editor?.chain().focus().toggleTaskList().run(),
        active: editor?.isActive("taskList"),
      },
      {
        key: "quote",
        icon: Quote,
        action: () => editor?.chain().focus().toggleBlockquote().run(),
        active: editor?.isActive("blockquote"),
      },
      { key: "link", icon: Link2, action: setLink, active: editor?.isActive("link") },
    ],
    [editor, setLink],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 -mx-1 mb-2 flex gap-0.5 overflow-x-auto rounded-xl bg-background/90 p-1 backdrop-blur">
        {tools.map((tool) => (
          <Button
            key={tool.key}
            type="button"
            size="icon-sm"
            variant={tool.active ? "secondary" : "ghost"}
            onClick={tool.action}
            aria-label={tool.key}
          >
            <tool.icon />
          </Button>
        ))}
      </div>
      <input
        value={localTitle}
        onChange={(event) => {
          setLocalTitle(event.target.value);
          onTitleChange(event.target.value);
        }}
        placeholder="Title"
        className="w-full bg-transparent font-serif text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
      />
      <EditorContent editor={editor} className="flex-1" />
      <SaveStatusBar
        status={status}
        onRetry={() => {
          if (!editor || status === "saving") return;
          setStatus("saving");
          void persistLatest.current(localTitle, editor.getJSON() as JSONContent);
        }}
      />
    </div>
  );
}

function SaveStatusBar({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  return (
    <div className="sticky bottom-0 flex h-10 items-center justify-end gap-2 text-xs text-muted-foreground">
      {status === "saving" && <span>Saving…</span>}
      {status === "saved" && <span>Saved ✓</span>}
      {status === "offline" && <span>Saved on this device</span>}
      {status === "error" && (
        <>
          <span>Unable to save</span>
          <Button size="xs" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
