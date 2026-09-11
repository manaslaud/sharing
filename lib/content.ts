import type { Prisma } from "@prisma/client";

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

export const emptyDoc: Prisma.InputJsonValue = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function extractText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const parts: string[] = [];
  walk(content as TipTapNode, parts);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function walk(node: TipTapNode, parts: string[]) {
  if (node.text) parts.push(node.text);
  if (Array.isArray(node.content)) {
    for (const child of node.content) walk(child, parts);
  }
}

export function previewText(content: unknown, max = 140) {
  const text = extractText(content);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function isEmptyDoc(content: unknown) {
  return extractText(content).length === 0;
}

function clipSnippet(text: string, max = 80) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max).trim()}…`;
}

export type RevisionChangeSummary = {
  label: string;
  tooltip: string;
};

function comparedPhrase(comparedWith: "current" | "next") {
  return comparedWith === "current" ? "the current note" : "the next version";
}

function summarizeBodyChange(
  before: string,
  after: string,
  comparedWith: "current" | "next",
): RevisionChangeSummary | null {
  const other = comparedPhrase(comparedWith);
  if (before === after) return null;
  if (!before) {
    return {
      label: "Next version added content",
      tooltip: `This snapshot had an empty body. ${capitalize(other)} added writing after it.`,
    };
  }
  if (!after) {
    return {
      label: "Next version cleared the body",
      tooltip: `After this snapshot, ${other} removed all of the body text.`,
    };
  }

  if (after.startsWith(before)) {
    const added = after.slice(before.length).trim();
    return added ? addedChange(added, other) : null;
  }
  if (before.startsWith(after)) {
    const extra = before.slice(after.length).trim();
    return extra ? removedChange(extra, other) : null;
  }
  if (after.endsWith(before)) {
    const added = after.slice(0, after.length - before.length).trim();
    return added ? addedChange(added, other) : null;
  }
  if (before.endsWith(after)) {
    const extra = before.slice(0, before.length - after.length).trim();
    return extra ? removedChange(extra, other) : null;
  }
  return {
    label: "Next version rewrote the body",
    tooltip: `${capitalize(other)} replaced this wording with different text. The preview above is this snapshot.`,
  };
}

function addedChange(added: string, other: string): RevisionChangeSummary {
  const snippet = clipSnippet(added);
  return {
    label: `Next version added “${snippet}”`,
    tooltip: `After this snapshot, ${other} added “${snippet}”. This card is how the note looked before that change.`,
  };
}

function removedChange(extra: string, other: string): RevisionChangeSummary {
  const snippet = clipSnippet(extra);
  return {
    label: `Next version removed “${snippet}”`,
    tooltip: `After this snapshot, ${other} removed “${snippet}”. Restore this card to bring that text back.`,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function summarizeRevisionChange(
  snapshot: { title: string; text: string },
  later: { title: string; text: string },
  comparedWith: "current" | "next" = "next",
): RevisionChangeSummary | null {
  const snapTitle = snapshot.title.trim() || "Untitled";
  const laterTitle = later.title.trim() || "Untitled";
  const before = snapshot.text.replace(/\s+/g, " ").trim();
  const after = later.text.replace(/\s+/g, " ").trim();

  const labels: string[] = [];
  const tooltips: string[] = [];

  if (snapTitle !== laterTitle) {
    labels.push(`Next version renamed to “${laterTitle}”`);
    tooltips.push(
      `After this snapshot, the title changed from “${snapTitle}” to “${laterTitle}”.`,
    );
  }

  const body = summarizeBodyChange(before, after, comparedWith);
  if (body) {
    labels.push(
      labels.length ? body.label.replace(/^Next version /, "") : body.label,
    );
    tooltips.push(body.tooltip);
  }

  if (!labels.length) return null;
  return { label: labels.join(" · "), tooltip: tooltips.join(" ") };
}
