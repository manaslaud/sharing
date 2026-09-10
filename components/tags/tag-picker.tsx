"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isValidTagName,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  normalizeTagName,
} from "@/lib/tags";

export function TagPicker({
  selected,
  suggestions,
  onChange,
}: {
  selected: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void | Promise<unknown>;
}) {
  const [tags, setTags] = useState(selected);
  const [known, setKnown] = useState(() =>
    [...new Set([...suggestions, ...selected])].sort(),
  );
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef(tags);
  const queued = useRef<string[] | null>(null);
  const inflight = useRef(false);

  const persist = async (next: string[]) => {
    tagsRef.current = next;
    setTags(next);
    queued.current = next;
    if (inflight.current) return;
    inflight.current = true;
    setSaving(true);
    try {
      while (queued.current) {
        const toSave = queued.current;
        queued.current = null;
        await onChange(toSave);
      }
    } finally {
      inflight.current = false;
      setSaving(false);
      if (queued.current) void persist(queued.current);
    }
  };

  const addTag = (raw: string) => {
    const name = normalizeTagName(raw);
    const current = tagsRef.current;
    if (!isValidTagName(name) || current.includes(name) || current.length >= MAX_TAGS) {
      setQuery("");
      return;
    }
    setKnown((existing) =>
      existing.includes(name) ? existing : [...existing, name].sort(),
    );
    setQuery("");
    void persist([...current, name]);
  };

  const removeTag = (name: string) => {
    void persist(tagsRef.current.filter((tag) => tag !== name));
    inputRef.current?.focus();
  };

  const commitQuery = () => {
    if (query.trim()) addTag(query);
  };

  const unused = useMemo(() => {
    const q = normalizeTagName(query);
    return known.filter((tag) => {
      if (tags.includes(tag)) return false;
      return !q || tag.includes(q);
    });
  }, [known, query, tags]);

  const draft = normalizeTagName(query);
  const canCreate =
    isValidTagName(draft) &&
    !tags.includes(draft) &&
    !known.includes(draft) &&
    tags.length < MAX_TAGS;

  const atLimit = tags.length >= MAX_TAGS;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Tags</p>
        <p className="text-xs text-muted-foreground">
          {saving ? "Saving…" : atLimit ? `${MAX_TAGS} max` : null}
        </p>
      </div>
      <div
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-card px-2 py-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="h-7 gap-0.5 pr-1">
            #{tag}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-foreground/10"
              aria-label={`Remove ${tag}`}
              onClick={(event) => {
                event.stopPropagation();
                removeTag(tag);
              }}
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
        {atLimit ? null : (
          <input
            ref={inputRef}
            value={query}
            maxLength={MAX_TAG_LENGTH + 1}
            onChange={(event) => {
              const value = event.target.value;
              if (value.includes(",")) {
                const parts = value.split(",");
                const last = parts.pop() ?? "";
                for (const part of parts) {
                  if (part.trim()) addTag(part);
                }
                setQuery(last);
                return;
              }
              setQuery(value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && draft) {
                event.preventDefault();
                commitQuery();
              } else if (event.key === "Backspace" && !query && tags.length) {
                removeTag(tags[tags.length - 1]!);
              }
            }}
            placeholder={tags.length ? "Add tag" : "Type a tag and press Enter"}
            aria-label="Add a tag"
            className="min-w-[12ch] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      {canCreate || unused.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {canCreate ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTag(draft)}
            >
              <Plus />
              Create #{draft}
            </Button>
          ) : null}
          {unused.slice(0, 16).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="ghost"
              size="xs"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTag(tag)}
            >
              #{tag}
            </Button>
          ))}
        </div>
      ) : tags.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Type a name and press Enter to create a tag.
        </p>
      ) : null}
    </div>
  );
}
