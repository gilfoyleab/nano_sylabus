import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/MarketingNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppNav, useRequireAuth } from "@/components/AppNav";
import { Badge } from "@/components/ui-ns/Badge";
import { Button } from "@/components/ui-ns/Button";
import { SEED_SESSIONS, MOCK_AI_RESPONSES, SUGGESTED_FOLLOWUPS, type ChatMessage, type ChatSession } from "@/mockData/chats";
import { updateCurrentUser } from "@/lib/auth";
import { addNote, type NoteColor } from "@/mockData/notes";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "Chat · Nano Syllabus" }] }),
  component: ChatPage,
});

const SESSIONS_KEY = "ns-sessions";

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return SEED_SESSIONS;
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(SEED_SESSIONS));
    return SEED_SESSIONS;
  }
  try { return JSON.parse(raw) as ChatSession[]; } catch { return SEED_SESSIONS; }
}
function saveSessions(s: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(s));
}

function ChatPage() {
  const [user, setUser] = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = sessions.find((s) => s.id === activeId) || null;

  const [language, setLanguage] = useState<"EN" | "RN">("EN");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [savePanel, setSavePanel] = useState<{ msg: ChatMessage } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { setSessions(loadSessions()); }, []);
  useEffect(() => { if (user?.language) setLanguage(user.language); }, [user]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages.length, streamText]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const grouped = useMemo(() => {
    const filtered = sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
    return (["Today", "Yesterday", "Last 7 Days", "Older"] as const).map((g) => ({
      group: g, items: filtered.filter((s) => s.group === g),
    }));
  }, [sessions, search]);

  const newChat = () => {
    setActiveId(null);
    setSidebarOpen(false);
  };

  const persist = (next: ChatSession[]) => { setSessions(next); saveSessions(next); };

  const send = () => {
    const text = input.trim();
    if (!text || streaming || !user) return;
    if (user.credits < 1) { setToast("Out of credits — upgrade your plan"); return; }

    const userMsg: ChatMessage = {
      id: "m" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      language,
    };

    let session = active;
    let nextSessions = sessions;
    if (!session) {
      session = {
        id: "s" + Date.now(),
        title: text.slice(0, 60),
        subject: "General",
        language,
        updatedAt: "Just now",
        group: "Today",
        messages: [userMsg],
      };
      nextSessions = [session, ...sessions];
    } else {
      session = { ...session, messages: [...session.messages, userMsg], updatedAt: "Just now" };
      nextSessions = sessions.map((s) => (s.id === session!.id ? session! : s));
    }
    persist(nextSessions);
    setActiveId(session.id);
    setInput("");

    // Stream a mocked AI response
    const reply = MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];
    setStreaming(true);
    setStreamText("");
    let i = 0;
    const interval = setInterval(() => {
      i += Math.max(2, Math.floor(Math.random() * 6));
      setStreamText(reply.slice(0, i));
      if (i >= reply.length) {
        clearInterval(interval);
        const aiMsg: ChatMessage = {
          id: "m" + Date.now() + "a",
          role: "ai",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          language,
        };
        const finalSession = { ...session!, messages: [...session!.messages, aiMsg] };
        const finalAll = nextSessions.map((s) => (s.id === finalSession.id ? finalSession : s));
        persist(finalAll);
        setStreaming(false);
        setStreamText("");
        // deduct credit
        const u = updateCurrentUser({ credits: Math.max(0, user.credits - 1) });
        if (u) setUser(u);
      }
    }, 28);
  };

  const renameActive = (title: string) => {
    if (!active) return;
    const next = sessions.map((s) => (s.id === active.id ? { ...s, title } : s));
    persist(next);
  };

  const deleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    persist(next);
    if (activeId === id) setActiveId(null);
  };

  const saveNote = (data: { title: string; topic: string; annotation: string; color: NoteColor }) => {
    if (!savePanel || !active) return;
    // Find the user question that produced this AI message
    const idx = active.messages.findIndex((m) => m.id === savePanel.msg.id);
    const question = idx > 0 ? active.messages[idx - 1].content : active.title;
    addNote({
      title: data.title || savePanel.msg.content.slice(0, 80),
      question,
      answer: savePanel.msg.content,
      subject: active.subject,
      topic: data.topic || undefined,
      annotation: data.annotation || undefined,
      color: data.color,
      sessionId: active.id,
      messageId: savePanel.msg.id,
    });
    setSavePanel(null);
    setToast("Note saved to Revision Notes ↗");
    const next = sessions.map((s) =>
      s.id === active.id
        ? { ...s, messages: s.messages.map((m) => m.id === savePanel.msg.id ? { ...m, saved: true } : m) }
        : s,
    );
    persist(next);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col border-r border-border bg-bg-primary transition-transform md:static md:translate-x-0 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
          <button className="md:hidden text-text-muted" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div className="px-3">
          <Button onClick={newChat} className="w-full" variant="outline">+ New chat</Button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          <AppNav user={user} />

          <div className="mt-2 border-t border-border px-3 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono-ui uppercase text-text-muted">History</span>
              <button onClick={() => setShowSearch((v) => !v)} className="text-text-muted hover:text-text-primary">⌕</button>
            </div>
            {showSearch && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="mb-3 w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-xs focus:outline-none"
              />
            )}
            <div className="space-y-4">
              {grouped.map(({ group, items }) =>
                items.length === 0 ? null : (
                  <div key={group}>
                    <p className="mb-1 px-1 text-[10px] font-mono-ui uppercase text-text-muted">{group}</p>
                    <ul className="space-y-0.5">
                      {items.map((s) => (
                        <li key={s.id} className="group relative">
                          <button
                            onClick={() => { setActiveId(s.id); setSidebarOpen(false); }}
                            className={
                              "w-full rounded-md border-l-2 px-2 py-1.5 text-left text-xs transition " +
                              (activeId === s.id
                                ? "border-text-primary bg-bg-secondary"
                                : "border-transparent hover:bg-bg-secondary")
                            }
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="truncate flex-1">{s.title}</span>
                              <Badge variant="outline" className="shrink-0 !px-1.5 !text-[9px]">{s.language}</Badge>
                            </div>
                            <div className="mt-0.5 text-[10px] text-text-muted">{s.subject} · {s.updatedAt}</div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                            className="absolute right-1 top-1.5 hidden h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-bg-tertiary hover:text-destructive group-hover:flex"
                            title="Delete"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
              {sessions.length === 0 && <p className="text-xs text-text-muted">No chats yet.</p>}
              <button className="text-[11px] text-text-muted hover:text-text-primary">Load older chats…</button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
        />
      )}

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden text-text-muted" onClick={() => setSidebarOpen(true)}>☰</button>
            {active ? (
              <>
                <input
                  defaultValue={active.title}
                  onBlur={(e) => renameActive(e.target.value)}
                  className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium focus:outline-none"
                />
                <Badge variant="outline">{active.subject}</Badge>
              </>
            ) : (
              <span className="text-sm text-text-muted">New chat</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 sm:flex" title="Language for AI answers — you can ask in either">
              <span className="text-[10px] font-mono-ui uppercase text-text-muted">Answer in</span>
              <div className="inline-flex rounded-full border border-border p-0.5">
                {(["EN", "RN"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={
                      "rounded-full px-3 py-1 text-[11px] font-mono-ui transition " +
                      (language === l ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-5 py-8">
            {!active && !streaming && (
              <div className="mt-10 text-center animate-fade-in">
                <p className="font-mono-ui text-xs uppercase text-text-muted">Hi {user.name.split(" ")[0]}</p>
                <h2 className="mt-3 font-display text-4xl">What are we studying today?</h2>
                <p className="mt-3 text-sm text-text-secondary">Ask anything. Type in English or Roman Nepali.</p>
                <div className="mt-8 grid gap-2 sm:grid-cols-2">
                  {[
                    "Explain Newton's third law in Roman Nepali",
                    "Make 5 MCQs from Chapter 6 Physics",
                    "Difference between covalent and ionic bonds",
                    "Essay structure for Class 11 English",
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="rounded-lg border border-border p-3 text-left text-sm text-text-secondary transition hover:border-border-strong hover:bg-bg-secondary"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active?.messages.map((m, i) => (
              <Message
                key={m.id}
                m={m}
                isLast={i === active.messages.length - 1}
                onSave={() => setSavePanel({ msg: m })}
                onCopy={() => { navigator.clipboard.writeText(m.content); setToast("Copied"); }}
                onSuggest={(s) => setInput(s)}
                creditsLeft={user.credits}
              />
            ))}

            {streaming && (
              <div className="mb-6 animate-fade-in">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-secondary p-4">
                  <Markdown text={streamText || ""} />
                  <div className="mt-2 flex items-center"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-bg-primary px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-bg-primary p-2 focus-within:border-border-strong">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                rows={1}
                placeholder={`Ask anything in English or Roman Nepali — answer will be in ${language === "EN" ? "English" : "Roman Nepali"}  (Enter to send)`}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-text-muted focus:outline-none"
                style={{ minHeight: 40, maxHeight: 200 }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-text-primary text-text-inverse transition hover:opacity-90 disabled:opacity-40"
                aria-label="Send"
              >
                ↑
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] font-mono-ui text-text-muted">
              1 credit per response · {user.credits} remaining
            </p>
          </div>
        </div>
      </main>

      {savePanel && (
        <SaveNotePanel msg={savePanel.msg} subject={active?.subject ?? "General"} onClose={() => setSavePanel(null)} onSave={saveNote} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full border border-border bg-bg-primary px-4 py-2 text-sm shadow-lg animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}

function Message({
  m, isLast, onSave, onCopy, onSuggest, creditsLeft,
}: {
  m: ChatMessage;
  isLast: boolean;
  onSave: () => void;
  onCopy: () => void;
  onSuggest: (s: string) => void;
  creditsLeft: number;
}) {
  if (m.role === "user") {
    return (
      <div className="mb-6 flex justify-end animate-fade-in">
        <div className="max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm bg-text-primary px-4 py-2.5 text-sm text-text-inverse">
            {m.content}
          </div>
          <div className="mt-1 text-right text-[10px] text-text-muted">{m.timestamp}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="group mb-6 animate-fade-in">
      <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-secondary p-4">
        <Markdown text={m.content} />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-text-muted">{m.timestamp}</span>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <IconBtn onClick={onCopy} label="Copy">📋</IconBtn>
          <IconBtn label="Helpful">👍</IconBtn>
          <IconBtn label="Not helpful">👎</IconBtn>
          <IconBtn onClick={onSave} label="Save">{m.saved ? "🔖" : "🏷️"}</IconBtn>
        </div>
      </div>
      {isLast && (
        <>
          <p className="mt-2 text-[10px] text-text-muted">This used 1 credit. {creditsLeft} remaining.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_FOLLOWUPS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggest(s)}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition hover:border-border-strong hover:text-text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function IconBtn({ onClick, label, children }: { onClick?: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label} className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-text-muted hover:bg-bg-tertiary hover:text-text-primary">
      {children}
    </button>
  );
}

/** Tiny markdown renderer: bold, italic, lists, code, paragraphs. */
function Markdown({ text }: { text: string }) {
  const html = renderMd(text);
  return (
    <div
      className="prose-ns text-sm leading-relaxed text-text-primary [&_strong]:font-semibold [&_em]:italic [&_code]:font-mono-ui [&_code]:rounded [&_code]:bg-bg-tertiary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc [&_li]:mt-1 [&_p]:mt-2 first:[&_p]:mt-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}
function renderMd(src: string): string {
  const lines = escapeHtml(src).split("\n");
  let out = "";
  let inList: "ol" | "ul" | null = null;
  const flush = () => { if (inList) { out += `</${inList}>`; inList = null; } };
  for (const raw of lines) {
    const line = raw;
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inList !== "ol") { flush(); out += "<ol>"; inList = "ol"; }
      out += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`;
    } else if (/^\s*[-*]\s+/.test(line)) {
      if (inList !== "ul") { flush(); out += "<ul>"; inList = "ul"; }
      out += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      out += `<p>${inline(line)}</p>`;
    }
  }
  flush();
  return out;
}
function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function SaveNotePanel({
  msg, subject, onClose, onSave,
}: {
  msg: ChatMessage;
  subject: string;
  onClose: () => void;
  onSave: (data: { title: string; topic: string; annotation: string; color: NoteColor }) => void;
}) {
  const [title, setTitle] = useState(msg.content.slice(0, 80));
  const [topic, setTopic] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [color, setColor] = useState<NoteColor>("yellow");
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-bg-primary p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Save as note</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
        </div>
        <p className="mt-1 text-xs text-text-muted">Capture this answer for revision.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-[10px] font-mono-ui uppercase text-text-muted">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm focus:outline-none focus:border-border-strong" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono-ui uppercase text-text-muted">Subject</label>
              <input value={subject} readOnly className="mt-1 w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary" />
            </div>
            <div>
              <label className="text-[10px] font-mono-ui uppercase text-text-muted">Chapter / topic</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm focus:outline-none focus:border-border-strong" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono-ui uppercase text-text-muted">Personal note</label>
            <textarea value={annotation} onChange={(e) => setAnnotation(e.target.value)} rows={3} placeholder="Why this matters to me…" className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm focus:outline-none focus:border-border-strong" />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">Colour label</p>
            <div className="flex gap-2">
              {([
                ["red", "🔴 Must revise"],
                ["yellow", "🟡 Review later"],
                ["green", "🟢 Got it"],
              ] as const).map(([c, label]) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={
                    "flex-1 rounded-md border px-2 py-2 text-xs transition " +
                    (color === c ? "border-text-primary bg-bg-secondary font-medium" : "border-border")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ title, topic, annotation, color })}>Save note</Button>
        </div>
      </div>
    </div>
  );
}
