import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui-ns/Button";
import { Badge } from "@/components/ui-ns/Badge";
import {
  loadNotes, updateNote,
  type RevisionNote, type NoteColor,
} from "@/mockData/notes";

export const Route = createFileRoute("/app/notes/revision")({
  head: () => ({ meta: [{ title: "Revision Mode · Nano Syllabus" }] }),
  component: RevisionMode,
});

type Filter = "all" | NoteColor;
type Phase = "select" | "session" | "summary";
type Outcome = "remember" | "review" | "skip";

const COLOR_LABEL: Record<NoteColor, string> = {
  red: "Must revise",
  yellow: "Review later",
  green: "Got it",
};

function RevisionMode() {
  const [allNotes, setAllNotes] = useState<RevisionNote[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("select");

  const [deck, setDeck] = useState<RevisionNote[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Outcome[]>([]);

  useEffect(() => {
    const ns = loadNotes();
    setAllNotes(ns);
    setSelectedIds(new Set(ns.map((n) => n.id)));
  }, []);

  const filteredPool = useMemo(
    () => allNotes.filter((n) => filter === "all" || n.color === filter),
    [allNotes, filter],
  );

  const begin = () => {
    const chosen = filteredPool.filter((n) => selectedIds.has(n.id));
    if (chosen.length === 0) return;
    // shuffle
    const shuffled = [...chosen].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setIdx(0);
    setFlipped(false);
    setResults([]);
    setPhase("session");
  };

  const advance = (out: Outcome) => {
    const newResults = [...results, out];
    setResults(newResults);
    const card = deck[idx];
    if (card && out !== "skip") {
      updateNote(card.id, { reviewedCount: card.reviewedCount + 1, lastReviewedAt: Date.now() });
    }
    if (idx + 1 >= deck.length) {
      setPhase("summary");
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  if (phase === "select") {
    return (
      <AppShell
        title={<Link to="/app/notes" className="text-text-secondary hover:text-text-primary">← My Notes</Link>}
      >
        <div className="mx-auto max-w-2xl px-5 py-10">
          <p className="font-mono-ui text-xs uppercase text-text-muted">Revision Mode</p>
          <h1 className="mt-2 font-display text-4xl">Pick what to revise</h1>
          <p className="mt-2 text-sm text-text-secondary">Flip cards. Mark what you remember. Track your progress.</p>

          <div className="mt-7">
            <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">Filter by colour</p>
            <div className="inline-flex rounded-full border border-border p-0.5">
              {(["all", "red", "yellow", "green"] as const).map((c) => (
                <button key={c} onClick={() => setFilter(c)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs transition " +
                    (filter === c ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                  }>
                  {c === "all" ? "All notes" : COLOR_LABEL[c as NoteColor]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-[10px] font-mono-ui uppercase text-text-muted">
              <span>Notes ({filteredPool.length})</span>
              <div className="flex gap-3">
                <button onClick={() => setSelectedIds(new Set(filteredPool.map((n) => n.id)))}>Select all</button>
                <button onClick={() => setSelectedIds(new Set())}>Clear</button>
              </div>
            </div>
            <ul className="max-h-[40vh] overflow-y-auto rounded-md border border-border divide-y divide-border">
              {filteredPool.map((n) => {
                const on = selectedIds.has(n.id);
                return (
                  <li key={n.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-bg-secondary">
                      <input type="checkbox" checked={on} onChange={() => {
                        const next = new Set(selectedIds);
                        on ? next.delete(n.id) : next.add(n.id);
                        setSelectedIds(next);
                      }} className="accent-text-primary" />
                      <span className={`h-2 w-2 rounded-full ${n.color === "red" ? "bg-destructive" : n.color === "yellow" ? "bg-warning" : "bg-success"}`} />
                      <span className="flex-1 truncate text-sm">{n.title}</span>
                      <Badge variant="outline">{n.subject}</Badge>
                    </label>
                  </li>
                );
              })}
              {filteredPool.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-text-muted">No notes match this filter.</li>
              )}
            </ul>
          </div>

          <div className="mt-7 flex justify-end">
            <Button onClick={begin} disabled={selectedIds.size === 0}>
              Begin · {selectedIds.size} card{selectedIds.size === 1 ? "" : "s"} →
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (phase === "session") {
    const card = deck[idx];
    const total = deck.length;
    const pct = ((idx) / total) * 100;
    return (
      <AppShell title={<span>Revision · {idx + 1} / {total}</span>}
        actions={<button onClick={() => setPhase("summary")} className="text-xs text-text-muted hover:text-text-primary">End session</button>}
      >
        <div className="mx-auto flex max-w-2xl flex-col px-5 py-8">
          <div className="h-1 overflow-hidden rounded-full bg-bg-tertiary">
            <div className="h-full bg-text-primary transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="relative mt-8 [perspective:1500px]">
            <div
              className={"relative min-h-[340px] w-full transition-transform duration-500 [transform-style:preserve-3d] " + (flipped ? "[transform:rotateY(180deg)]" : "")}
            >
              {/* Front */}
              <div className="absolute inset-0 flex flex-col rounded-2xl border border-border bg-bg-primary p-8 [backface-visibility:hidden]">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{card.subject}</Badge>
                  <button onClick={() => advance("skip")} className="text-xs text-text-muted hover:text-text-primary">Skip →</button>
                </div>
                <div className="my-auto py-8 text-center">
                  <p className="font-mono-ui text-[10px] uppercase text-text-muted">Question</p>
                  <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{card.title}</h2>
                  <p className="mt-3 text-sm text-text-secondary">{card.question}</p>
                </div>
                <Button onClick={() => setFlipped(true)} variant="outline" className="mx-auto">Show answer ↻</Button>
              </div>
              {/* Back */}
              <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-secondary p-8 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{card.subject}</Badge>
                  <button onClick={() => setFlipped(false)} className="text-xs text-text-muted hover:text-text-primary">↺ Flip back</button>
                </div>
                <div className="mt-4 flex-1 overflow-y-auto pr-1">
                  <Markdown text={card.answer} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => advance("review")}>🔁 Need review</Button>
            <Button onClick={() => advance("remember")}>✓ Remember</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Summary
  const remembered = results.filter((r) => r === "remember").length;
  const reviewed = results.filter((r) => r === "review").length;
  const skipped = results.filter((r) => r === "skip").length;

  return (
    <AppShell title="Session complete">
      <div className="mx-auto max-w-md px-5 py-12 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 font-display text-4xl">Session complete</h1>
        <p className="mt-2 text-sm text-text-secondary">Nice work. Here's how it went.</p>

        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          <Stat label="Reviewed" value={results.length} />
          <Stat label="Remember" value={remembered} accent="success" />
          <Stat label="To revisit" value={reviewed + skipped} accent="warning" />
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Button onClick={() => { setPhase("select"); setResults([]); }}>Review again</Button>
          <Link to="/app/notes"><Button variant="outline" className="w-full">Back to notes</Button></Link>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "success" | "warning" }) {
  return (
    <div className="rounded-lg border border-border bg-bg-primary p-4">
      <p className="text-[10px] font-mono-ui uppercase text-text-muted">{label}</p>
      <p className={"mt-1 font-display text-3xl " + (accent === "success" ? "text-[color:var(--green)]" : accent === "warning" ? "text-[color:var(--yellow)]" : "")}>{value}</p>
    </div>
  );
}
