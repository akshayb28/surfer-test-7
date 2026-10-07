import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Chat } from "@/components/chat";

export const dynamic = "force-dynamic";

export default async function TouristChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const user = await requireRole("TOURIST", "ADMIN");
  const { conversationId } = await params;
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { booking: { include: { guide: { include: { user: { select: { name: true } } } }, tourist: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!convo || convo.booking.tourist.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-bold">Chat with {convo.booking.guide.user.name}</h1>
      <Chat conversationId={convo.id} currentUserId={user.id}
        initialMessages={convo.messages.map((m) => ({ id: m.id, body: m.body, senderId: m.senderId, createdAt: m.createdAt.toISOString() }))} />
    </div>
  );
}
