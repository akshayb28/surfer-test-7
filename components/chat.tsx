"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions/bookings";

type Msg = { id: string; body: string; senderId: string; createdAt: string };

export function Chat({ conversationId, initialMessages, currentUserId }: { conversationId: string; initialMessages: Msg[]; currentUserId: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const r = await sendMessage({ conversationId, body });
    if (r.ok) { setBody(""); setMessages((m) => [...m, { id: crypto.randomUUID(), body, senderId: currentUserId, createdAt: new Date().toISOString() }]); router.refresh(); }
  }

  return (
    <div className="card flex h-[60vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-zinc-400">Say hello to your guide 👋</p>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId === currentUserId ? "ml-auto bg-brand-600 text-white" : "bg-zinc-100"}`}>
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-zinc-100 p-3">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" className="input flex-1" />
        <button className="btn-primary">Send</button>
      </form>
    </div>
  );
}
