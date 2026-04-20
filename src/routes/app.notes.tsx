import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui-ns/Button";
import { Badge } from "@/components/ui-ns/Badge";
import { loadNotes, type RevisionNote, type NoteColor, formatDate } from "@/mockData/notes";

export const Route = createFileRoute("/app/notes")({
  head: () => ({ meta: [{ title: "Revision Notes · Nano Syllabus" }] }),
  component: NotesLibrary,
});

const COLOR_LABEL: Record<NoteColor, string> = {
  red: "Must revise",
  yellow: "Review later",
  green: "Got it",
};
const COLOR_DOT: Record<NoteColor, string> = {
  red: "bg-destructive",
  yellow: "bg-warning",
  green: "bg-success",
};

function NotesLibrary() {
  const [notes, setNotes] = useState<RevisionNote[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const [colorFilter, setColorFilter] = useState<NoteColor | "All">("All");

  useEffect(() => { setNotes(loadNotes()); }, []);

  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((n) => n.subject)))],
    [notes],
  );

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (subjectFilter !== "All" && n.subject !== subjectFilter) return false;
      if (colorFilter !== "All" && n.color !== colorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.answer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notes, subjectFilter, colorFilter, search]);

  return (
    <AppShell
      title={
        <span className="flex items-center gap-3">
          My Notes
          <span className="font-mono-ui text-xs text-text-muted">{notes.length} saved</span>
        </span>
      }
      actions={
        <Link to="/app/notes/revision">
          <Button size="sm">Start revision →</Button>
        </Link>
      }
    >
      <div className="border-b border-border bg-bg-secondary px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="h-9 w-full rounded-full border border-border bg-bg-primary pl-9 pr-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-border-strong"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">⌕</span>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 rounded-full border border-border bg-bg-primary px-3 text-xs focus:outline-none"
          >
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>

          <div className="inline-flex rounded-full border border-border p-0.5">
            {(["All", "red", "yellow", "green"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setColorFilter(c)}
                className={
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition " +
                  (colorFilter === c ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                }
              >
                {c !== "All" && <span className={`h-2 w-2 rounded-full ${COLOR_DOT[c as NoteColor]}`} />}
                {c === "All" ? "All" : COLOR_LABEL[c as NoteColor]}
              </button>
            ))}
          </div>

          <div className="ml-auto inline-flex rounded-full border border-border p-0.5">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={
                  "rounded-full px-2.5 py-1 text-[11px] font-mono-ui transition " +
                  (view === v ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                }
              >
                {v === "grid" ? "▦" : "≡"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((n) => <NoteCard key={n.id} n={n} />)}
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {filtered.map((n) => (
              <li key={n.id}>
                <Link
                  to="/app/notes/$noteId"
                  params={{ noteId: n.id }}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-bg-secondary"
                >
                  <span className={`h-8 w-1 rounded-full ${COLOR_DOT[n.color]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-text-muted">{n.subject}{n.topic ? ` · ${n.topic}` : ""}</p>
                  </div>
                  <span className="text-xs text-text-muted">{formatDate(n.createdAt)}</span>
                  <span className="text-text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function NoteCard({ n }: { n: RevisionNote }) {
  return (
    <Link
      to="/app/notes/$noteId"
      params={{ noteId: n.id }}
      className="group relative block overflow-hidden rounded-lg border border-border bg-bg-primary p-5 transition hover:border-border-strong hover:-translate-y-0.5"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${COLOR_DOT[n.color]}`} />
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline">{n.subject}</Badge>
        <span className="text-[10px] text-text-muted">{formatDate(n.createdAt)}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 font-display text-xl leading-snug">{n.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs text-text-secondary">{n.answer.replace(/[*_`#]/g, "")}</p>
      <div className="mt-4 flex items-center justify-between text-[11px] text-text-muted">
        <span className="font-mono-ui">{n.reviewedCount} reviews</span>
        <span className="opacity-0 transition group-hover:opacity-100">Open →</span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center">
      <p className="text-3xl">📭</p>
      <h3 className="mt-3 font-display text-2xl">No notes match these filters</h3>
      <p className="mt-2 text-sm text-text-muted">
        Save AI answers from the chat by clicking the bookmark icon.
      </p>
      <Link to="/app/chat" className="mt-6 inline-block">
        <Button variant="outline">Go to chat</Button>
      </Link>
    </div>
  );
}
