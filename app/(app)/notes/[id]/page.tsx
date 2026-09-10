import { notFound } from "next/navigation";
import { NoteWorkspace } from "@/components/notes/note-workspace";
import { prisma } from "@/lib/db";
import { canAccessNote } from "@/lib/authz";
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

  const [activities, revisions] = await Promise.all([
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
  ]);

  return (
    <NoteWorkspace
      note={note}
      partnerName={ctx.partner?.name}
      currentUserId={ctx.userId}
      activities={activities}
      revisions={revisions}
    />
  );
}
