import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { GlassCard } from "@/components/GlassCard";
import { useState, useEffect } from "react";
import { Hash, Phone, Video, Paperclip, Send, Code2, FileText, Pencil, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AV = (seed: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&backgroundColor=3b82f6,8b5cf6,06b6d4`;

const now = Date.now();
const iso = (offsetMin: number) => new Date(now + offsetMin * 60_000).toISOString();

const mockUsers = [
  { id: "u_me", name: "Amogh S Y", avatar: AV("Amogh") },
  { id: "u_1", name: "Maya Lin", avatar: AV("Maya") },
  { id: "u_2", name: "Diego Alvarez", avatar: AV("Diego") },
  { id: "u_3", name: "Sara Okafor", avatar: AV("Sara") },
  { id: "u_4", name: "Kenji Watanabe", avatar: AV("Kenji") },
];

const userById = (id: string) => mockUsers.find((u) => u.id === id) || mockUsers[0];

const threads = [
  { id: "t_1", kind: "dm", title: "Maya Lin", participantIds: ["u_me","u_1"], unread: 2, lastTs: iso(-3) },
  { id: "t_2", kind: "dm", title: "Diego Alvarez", participantIds: ["u_me","u_2"], unread: 0, lastTs: iso(-30) },
  { id: "t_3", kind: "circle", title: "Frontend Forge", participantIds: ["u_me","u_1"], unread: 5, lastTs: iso(-10) },
  { id: "t_4", kind: "circle", title: "AI Research Reading", participantIds: ["u_me","u_2"], unread: 0, lastTs: iso(-120) },
  { id: "t_5", kind: "dm", title: "Sara Okafor", participantIds: ["u_me","u_3"], unread: 0, lastTs: iso(-240) },
];

const messagesByThread: Record<string, any[]> = {
  t_1: [
    { id:"m1", threadId:"t_1", authorId:"u_1", body:"Loved your token doc draft — can we pair on color contrast next?", ts: iso(-22) },
    { id:"m2", threadId:"t_1", authorId:"u_me", body:"Yes! I'll bring oklch swatches.", ts: iso(-18) },
    { id:"m3", threadId:"t_1", authorId:"u_1", body:"Also — pushed the Figma library update.", ts: iso(-3) },
  ],
  t_3: [
    { id:"m1", threadId:"t_3", authorId:"u_1", body:"Anyone benchmarked Suspense + RSC streaming this week?", ts: iso(-40) },
    { id:"m3", threadId:"t_3", authorId:"u_1", body:"Bringing snacks 🍪", ts: iso(-10) },
  ],
};

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat · SkillSwap X" }] }),
  component: Chat,
});

function Chat() {
  const [activeId, setActiveId] = useState(threads[0].id);
  const [tab, setTab] = useState<"chat" | "notes" | "code" | "board">("chat");

  useEffect(() => {
    const title = localStorage.getItem("active_chat_title");
    if (title) {
      const match = threads.find((t) => t.title.toLowerCase().includes(title.toLowerCase()));
      if (match) {
        setActiveId(match.id);
      }
      localStorage.removeItem("active_chat_title");
    }
  }, []);

  const active = threads.find((t) => t.id === activeId)!;
  const msgs = messagesByThread[activeId] ?? [];

  return (
    <>
      <TopNav title="Chat" />
      <div className="grid h-[calc(100dvh-65px)] grid-cols-1 md:grid-cols-[280px_1fr] md:px-0">
        <aside className="hidden flex-col border-r border-white/5 bg-sidebar/50 md:flex">
          <div className="border-b border-white/5 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Inbox</div>
            <input placeholder="Search messages" className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-primary/50" />
          </div>
          <ul className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {threads.map((t) => {
              const u = t.kind === "dm" ? userById(t.participantIds[1]) : null;
              const active = t.id === activeId;
              return (
                <li key={t.id}>
                  <button onClick={() => setActiveId(t.id)} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left ${active ? "bg-white/5" : "hover:bg-white/[0.04]"}`}>
                    {u ? (
                      <img src={u.avatar} alt="" className="size-9 rounded-full ring-1 ring-white/10" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30"><Hash className="size-4" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(t.lastTs))}</div>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{t.kind === "circle" ? "Circle" : "Direct message"}</div>
                    </div>
                    {t.unread > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">{t.unread}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div>
              <div className="flex items-center gap-2 font-display text-base font-semibold">
                {active.kind === "circle" ? <Hash className="size-4 text-primary" /> : null}
                {active.title}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-300"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> typing…</div>
            </div>
            <div className="flex items-center gap-1">
              {[
                { id: "chat", icon: MessageSquare, label: "Chat" },
                { id: "notes", icon: FileText, label: "Notes" },
                { id: "code", icon: Code2, label: "Code" },
                { id: "board", icon: Pencil, label: "Board" },
              ].map((x) => (
                <button key={x.id} onClick={() => setTab(x.id as typeof tab)} aria-label={x.label} className={`grid size-9 place-items-center rounded-lg ${tab === x.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"}`}>
                  <x.icon className="size-4" />
                </button>
              ))}
              <span className="mx-1 h-5 w-px bg-white/10" />
              <button aria-label="Call" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/5"><Phone className="size-4" /></button>
              <button aria-label="Video" className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 text-foreground"><Video className="size-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {tab === "chat" && (
              <ul className="space-y-4">
                {msgs.map((m) => {
                  const u = userById(m.authorId)!;
                  const me = m.authorId === "u_me";
                  return (
                    <li key={m.id} className={`flex gap-3 ${me ? "flex-row-reverse" : ""}`}>
                      <img src={u.avatar} className="size-8 rounded-full ring-1 ring-white/10" alt="" />
                      <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${me ? "bg-gradient-to-br from-primary/30 to-accent/30" : "bg-white/[0.06]"}`}>
                        <div className="mb-0.5 text-[10px] text-muted-foreground">{u.name} · {formatDistanceToNow(new Date(m.ts))} ago</div>
                        <div>{m.body}</div>
                      </div>
                    </li>
                  );
                })}
                {msgs.length === 0 && <div className="grid h-full place-items-center text-sm text-muted-foreground">Say hello 👋</div>}
              </ul>
            )}
            {tab === "notes" && (
              <GlassCard className="mx-auto max-w-3xl">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Shared notes</div>
                <h3 className="mt-1 font-display text-xl font-semibold">Design Tokens — Session 4</h3>
                <p className="mt-3 text-sm text-muted-foreground">- Decide oklch ramps for primary + accent.<br />- Audit contrast vs background.<br />- Ship token JSON to engineering.</p>
              </GlassCard>
            )}
            {tab === "code" && (
              <GlassCard className="mx-auto max-w-3xl">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Live code · TypeScript</div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed text-cyan-glow">
{`const useDebounce = <T,>(v: T, ms = 200) => {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
};`}
                </pre>
              </GlassCard>
            )}
            {tab === "board" && (
              <GlassCard className="mx-auto grid h-[60vh] max-w-3xl place-items-center">
                <div className="text-center">
                  <Pencil className="mx-auto size-8 text-muted-foreground" />
                  <div className="mt-2 text-sm">Collaborative whiteboard</div>
                  <p className="mt-1 text-xs text-muted-foreground">Sketch, vote, plan together. Real-time canvas coming soon.</p>
                </div>
              </GlassCard>
            )}
          </div>

          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <button aria-label="Attach" className="text-muted-foreground hover:text-foreground"><Paperclip className="size-4" /></button>
              <input placeholder="Message" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button aria-label="Send" className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-sm font-semibold text-primary-foreground">Send <Send className="size-3.5" /></button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
