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
