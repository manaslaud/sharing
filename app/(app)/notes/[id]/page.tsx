import { notFound } from "next/navigation";
import { NoteWorkspace } from "@/components/notes/note-workspace";
import { prisma } from "@/lib/db";
import { canAccessNote } from "@/lib/authz";
import { extractText, previewText, summarizeRevisionChange } from "@/lib/content";
import { getSpaceContext } from "@/lib/session";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getSpaceContext();
  const note = await prisma.note.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!note || !canAccessNote(note, ctx.userId, ctx.spaceIds)) {
    notFound();
  }

  const [activities, revisions, suggestedTags] = await Promise.all([
    prisma.activity.findMany({
      where: { noteId: note.id },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.noteRevision.findMany({
      where: { noteId: note.id },
      include: { editor: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.tag.findMany({
      where: { createdById: ctx.userId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const currentState = {
    title: note.title,
    text: extractText(note.content),
  };
  const revisionItems = revisions.map((revision, index) => {
    const later =
      index === 0
        ? currentState
        : {
            title: revisions[index - 1].title,
            text: extractText(revisions[index - 1].content),
          };
    return {
      id: revision.id,
      title: revision.title,
      preview: previewText(revision.content) || "Empty note",
      change: summarizeRevisionChange(
        { title: revision.title, text: extractText(revision.content) },
        later,
        index === 0 ? "current" : "next",
      ),
      createdAt: revision.createdAt,
      editor: revision.editor,
      content: revision.content,
    };
  });

  return (
    <NoteWorkspace
      note={note}
      partnerName={ctx.partner?.name}
      currentUserId={ctx.userId}
      activities={activities}
      revisions={revisionItems}
      suggestedTags={suggestedTags.map((tag) => tag.name)}
    />
  );
}
