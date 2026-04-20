export type NoteColor = "red" | "yellow" | "green";

export interface RevisionNote {
  id: string;
  title: string;
  question: string;
  answer: string;
  subject: string;
  topic?: string;
  annotation?: string;
  color: NoteColor;
  createdAt: number;
  sessionId?: string;
  messageId?: string;
  reviewedCount: number;
  lastReviewedAt?: number;
}

const KEY = "ns-notes";

const SEED: RevisionNote[] = [
  {
    id: "n_seed1",
    title: "Newton's third law",
    question: "Newton's third law in simple words?",
    answer:
      "**Newton's third law** says: *for every action, there is an equal and opposite reaction.*\n\nIf you push a wall with 10N of force, the wall pushes back with 10N. The two forces:\n\n1. Are **equal in magnitude**\n2. Act in **opposite directions**\n3. Act on **different bodies**\n\nExample: a rocket pushes gas downward, the gas pushes the rocket upward.",
    subject: "Physics",
    topic: "Laws of Motion",
    annotation: "Forces act on different bodies — that's the trick they always test.",
    color: "red",
    createdAt: Date.now() - 86400000 * 2,
    reviewedCount: 1,
    lastReviewedAt: Date.now() - 86400000,
  },
  {
    id: "n_seed2",
    title: "Logarithm: log(ab) = log a + log b",
    question: "Key log properties for the exam",
    answer:
      "Key properties:\n\n- **Product rule**: log(ab) = log a + log b\n- **Quotient rule**: log(a/b) = log a − log b\n- **Power rule**: log(a^n) = n · log a\n- **Change of base**: log_b(x) = log(x) / log(b)",
    subject: "Mathematics",
    topic: "Logarithms",
    color: "yellow",
    createdAt: Date.now() - 86400000 * 5,
    reviewedCount: 3,
  },
  {
    id: "n_seed3",
    title: "Photosynthesis",
    question: "Photosynthesis ko process k ho?",
    answer:
      "Photosynthesis bhaneko biruwa le sunlight, paani ra CO₂ use garera glucose ra oxygen banaune process ho.\n\n**Equation**: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\n\nYo process **chloroplast** ma hunchha, jasma chlorophyll naam ko green pigment hunchha.",
    subject: "Biology",
    topic: "Plant Physiology",
    color: "green",
    createdAt: Date.now() - 86400000 * 7,
    reviewedCount: 5,
  },
];

export function loadNotes(): RevisionNote[] {
  if (typeof window === "undefined") return SEED;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try { return JSON.parse(raw) as RevisionNote[]; } catch { return SEED; }
}

export function saveNotes(notes: RevisionNote[]) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function addNote(n: Omit<RevisionNote, "id" | "createdAt" | "reviewedCount">): RevisionNote {
  const note: RevisionNote = {
    ...n,
    id: "n_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    reviewedCount: 0,
  };
  const all = loadNotes();
  saveNotes([note, ...all]);
  return note;
}

export function updateNote(id: string, patch: Partial<RevisionNote>) {
  const all = loadNotes().map((n) => (n.id === id ? { ...n, ...patch } : n));
  saveNotes(all);
  return all.find((n) => n.id === id) || null;
}

export function deleteNote(id: string) {
  saveNotes(loadNotes().filter((n) => n.id !== id));
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
