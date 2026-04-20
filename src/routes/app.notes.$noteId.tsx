import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui-ns/Button";
import { Badge } from "@/components/ui-ns/Badge";
import {
  deleteNote, loadNotes, updateNote, formatDate,
  type RevisionNote, type NoteColor,
} from "@/mockData/notes";

export const Route = createFileRoute("/app/notes/$noteId")({
  head: () => ({ meta: [{ title: "Note · Nano Syllabus" }] }),
  component: NoteDetail,
});

const COLOR_DOT: Record<NoteColor, string> = {
  red: "bg-destructive",
  yellow: "bg-warning",
  green: "bg-success",
};
const COLOR_LABEL: Record<NoteColor, string> = {
  red: "🔴 Must revise",
  yellow: "🟡 Review later",
  green: "🟢 Got it",
};

function NoteDetail() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<RevisionNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setNote(loadNotes().find((n) => n.id === noteId) || null);
  }, [noteId]);

  if (!note) {
    return (
      <AppShell title="Note not found">
        <div className="p-10 text-center text-sm text-text-muted">
          This note doesn't exist.{" "}
          <Link to="/app/notes" className="underline">Back to library</Link>
        </div>
      </AppShell>
    );
  }

  const onColor = (c: NoteColor) => {
    const next = updateNote(note.id, { color: c });
    if (next) setNote(next);
  };

  const onDelete = () => {
    deleteNote(note.id);
    navigate({ to: "/app/notes" });
  };

  return (
    <AppShell
      title={
        <Link to="/app/notes" className="text-text-secondary hover:text-text-primary">
          ← My Notes
        </Link>
      }
      actions={
        <>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDel(true)}>Delete</Button>
        </>
      }
    >
      <article className="mx-auto max-w-3xl px-5 py-10 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${COLOR_DOT[note.color]}`} />
          <span className="text-[11px] font-mono-ui uppercase tracking-wider text-text-muted">
            {COLOR_LABEL[note.color]}
          </span>
          <Badge variant="outline">{note.subject}</Badge>
          {note.topic && <Badge>{note.topic}</Badge>}
          <span className="ml-auto text-[11px] text-text-muted font-mono-ui">{formatDate(note.createdAt)}</span>
        </div>

        <h1 className="mt-5 font-display text-4xl leading-[1.1] sm:text-5xl">{note.title}</h1>

        <blockquote className="mt-8 rounded-md border-l-2 border-border-strong bg-bg-secondary px-4 py-3 text-sm italic text-text-secondary">
          <span className="font-mono-ui text-[10px] uppercase not-italic text-text-muted">Original question</span>
          <p className="mt-1">{note.question}</p>
        </blockquote>

        <div className="mt-8">
          <Markdown text={note.answer} className="text-base" />
        </div>

        {note.annotation && (
          <div className="mt-8 rounded-md bg-[color:var(--note-yellow)] p-4">
            <p className="text-[10px] font-mono-ui uppercase text-text-muted">Your annotation</p>
            <p className="mt-1 text-sm">{note.annotation}</p>
          </div>
        )}

        <div className="mt-10 border-t border-border pt-6">
          <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">Re-classify</p>
          <div className="flex flex-wrap gap-2">
            {(["red", "yellow", "green"] as const).map((c) => (
              <button
                key={c}
                onClick={() => onColor(c)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs transition " +
                  (note.color === c
                    ? "border-text-primary bg-bg-secondary font-medium"
                    : "border-border hover:border-border-strong")
                }
              >
                {COLOR_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {note.sessionId && (
            <Link to="/app/chat">
              <Button variant="outline" size="sm">← Back to chat</Button>
            </Link>
          )}
          <Link to="/app/chat">
            <Button size="sm">Ask follow-up →</Button>
          </Link>
        </div>

        <div className="mt-12 rounded-md border border-border bg-bg-secondary p-4 text-xs text-text-muted">
          <div className="flex justify-between font-mono-ui">
            <span>Reviewed</span>
            <span>{note.reviewedCount} times</span>
          </div>
          {note.lastReviewedAt && (
            <div className="mt-1 flex justify-between font-mono-ui">
              <span>Last revised</span>
              <span>{formatDate(note.lastReviewedAt)}</span>
            </div>
          )}
        </div>
      </article>

      {editing && <EditModal note={note} onClose={() => setEditing(false)} onSaved={(n) => { setNote(n); setEditing(false); }} />}
      {confirmDel && (
        <ConfirmDelete onCancel={() => setConfirmDel(false)} onConfirm={onDelete} />
      )}
    </AppShell>
  );
}

function EditModal({
  note, onClose, onSaved,
}: {
  note: RevisionNote;
  onClose: () => void;
  onSaved: (n: RevisionNote) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [topic, setTopic] = useState(note.topic ?? "");
  const [annotation, setAnnotation] = useState(note.annotation ?? "");
  const [color, setColor] = useState<NoteColor>(note.color);
  const save = () => {
    const next = updateNote(note.id, { title, topic: topic || undefined, annotation: annotation || undefined, color });
    if (next) onSaved(next);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-border bg-bg-primary p-6 animate-slide-up">
        <h3 className="font-display text-2xl">Edit note</h3>
        <div className="mt-5 space-y-4">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="ns-input" />
          </Field>
          <Field label="Chapter / topic">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="ns-input" />
          </Field>
          <Field label="Annotation">
            <textarea value={annotation} rows={3} onChange={(e) => setAnnotation(e.target.value)} className="ns-input" />
          </Field>
          <div>
            <p className="mb-2 text-[10px] font-mono-ui uppercase text-text-muted">Colour</p>
            <div className="flex gap-2">
              {(["red", "yellow", "green"] as const).map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={"flex-1 rounded-md border px-2 py-2 text-xs transition " + (color === c ? "border-text-primary bg-bg-secondary font-medium" : "border-border")}>
                  {COLOR_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </div>
        <style>{`.ns-input{display:block;width:100%;border-radius:6px;border:1px solid var(--border);background:var(--bg-primary);padding:8px 12px;font-size:13px;color:var(--text-primary);}.ns-input:focus{outline:none;border-color:var(--border-strong);}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-mono-ui uppercase text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function ConfirmDelete({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-primary p-6 animate-slide-up">
        <h3 className="font-display text-2xl">Delete this note?</h3>
        <p className="mt-2 text-sm text-text-muted">This can't be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
