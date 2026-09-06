"use client";

import { FileCheck2, Maximize2, Minimize2, Target, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { AppShellContext } from "@/components/app-shell-context";
import type { StudentChallengeDashboard } from "@/lib/data/student-challenge-dashboard";
import type {
  StudentChallengeDetail,
  StudentChallengeSummary,
} from "@/lib/data/student-challenges";

const WEEKLY_CHALLENGE_TARGET = 15;

function challengeScore(challenge: StudentChallengeSummary) {
  if (!challenge.lastTotalMarks || challenge.lastScore === null) return null;
  return Math.max(0, Math.min(100, (challenge.lastScore / challenge.lastTotalMarks) * 100));
}

/** Advance through the daily queue in its displayed order, including a partly
 * completed challenge. Completing #1 should lead to unfinished #2, then #3. */
export function nextAvailableChallenge(
  challenges: StudentChallengeSummary[],
  currentChallenge: Pick<StudentChallengeSummary, "id" | "position">,
) {
  // A refresh removes a completed card from the dashboard list. Positions are
  // persisted with the daily queue, so they remain the reliable sequence even
  // when the just-completed card is no longer in `challenges`.
  const remaining = challenges
    .filter((challenge) => challenge.id !== currentChallenge.id && challenge.status !== "completed")
    .sort((left, right) => left.position - right.position);
  return (
    remaining.find((challenge) => challenge.position > currentChallenge.position) ??
    remaining[0] ??
    null
  );
}

type GradeResult = {
  question_id: string;
  score: number;
  marks: number;
  feedback: string;
};

type ChallengeStep = 1 | 2 | 3 | 4;

export function initialChallengeStep(challenge: StudentChallengeDetail): ChallengeStep {
  if (challenge.status === "completed") return 4;
  if (challenge.examplesReviewed) return 3;
  if (challenge.lessonRead) return 2;
  return 1;
}

function savedResults(challenge: StudentChallengeDetail): GradeResult[] {
  const marksByQuestion = new Map(
    (challenge.content?.examQuestions ?? []).map((question) => [question.id, question.marks]),
  );
  return (challenge.latestAttempt?.answers ?? []).map((answer) => ({
    question_id: answer.questionId,
    score: answer.score,
    marks: marksByQuestion.get(answer.questionId) ?? 0,
    feedback: answer.feedback,
  }));
}

async function apiJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

function ChallengeDetail({
  challenge,
  onBack,
  onChange,
  nextChallenge,
  onNext,
}: {
  challenge: StudentChallengeDetail;
  onBack: () => void;
  onChange: (challenge: StudentChallengeDetail) => void;
  nextChallenge: StudentChallengeSummary | null;
  onNext: () => Promise<boolean>;
}) {
  const router = useRouter();
  const { setSidebarSuppressed } = useContext(AppShellContext);
  const enterFocusButtonRef = useRef<HTMLButtonElement>(null);
  const exitFocusButtonRef = useRef<HTMLButtonElement>(null);
  const answerSheetInputRef = useRef<HTMLInputElement>(null);
  const focusModeWasActiveRef = useRef(false);
  const incomingStep = initialChallengeStep(challenge);
  const isCompletedChallenge = challenge.status === "completed";
  const [focusMode, setFocusMode] = useState(false);
  const [activeStep, setActiveStep] = useState<ChallengeStep>(() => incomingStep);
  const [savingStep, setSavingStep] = useState<"lesson" | "examples" | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [openingNext, setOpeningNext] = useState(false);
  const [noNextAvailable, setNoNextAvailable] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<GradeResult[]>(() => savedResults(challenge));
  const [score, setScore] = useState<{ earned: number; total: number; passed: boolean } | null>(
    () =>
      challenge.status === "completed" && challenge.lastScore !== null && challenge.lastTotalMarks
        ? { earned: challenge.lastScore, total: challenge.lastTotalMarks, passed: true }
        : null,
  );
  const [clock, setClock] = useState(() => Date.now());
  const content = challenge.content;

  useEffect(() => {
    setSidebarSuppressed(focusMode);
    return () => setSidebarSuppressed(false);
  }, [focusMode, setSidebarSuppressed]);

  useEffect(() => {
    if (!focusMode) return;
    exitFocusButtonRef.current?.focus();
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", exitOnEscape);
    return () => window.removeEventListener("keydown", exitOnEscape);
  }, [focusMode]);

  useEffect(() => {
    if (focusMode) {
      focusModeWasActiveRef.current = true;
      return;
    }
    if (focusModeWasActiveRef.current) {
      focusModeWasActiveRef.current = false;
      enterFocusButtonRef.current?.focus();
    }
  }, [focusMode]);

  useEffect(() => {
    if (challenge.status === "completed" || !content?.examExpiresAt) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [challenge.status, content?.examExpiresAt]);

  useEffect(() => {
    if (challenge.status !== "completed" || !challenge.latestAttempt) return;
    setResults(savedResults(challenge));
    if (challenge.lastScore !== null && challenge.lastTotalMarks) {
      setScore({ earned: challenge.lastScore, total: challenge.lastTotalMarks, passed: true });
    }
  }, [challenge]);

  // The detail component remains mounted when Next changes the selected card.
  // Reset local navigation and answer state for that new challenge instead of
  // carrying step four (the previous challenge's submission screen) forward.
  useEffect(() => {
    setActiveStep(incomingStep);
    setScanFile(null);
    setError("");
    setClock(Date.now());
    if (!isCompletedChallenge) {
      setResults([]);
      setScore(null);
    }
  }, [challenge.id, incomingStep, isCompletedChallenge]);

  if (!content) return null;

  const markStep = async (step: "lesson" | "examples") => {
    setSavingStep(step);
    setError("");
    try {
      const payload = await apiJson<{ challenge: StudentChallengeDetail }>(
        await fetch(`/api/student/challenges/${challenge.id}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step }),
        }),
      );
      onChange(payload.challenge);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save progress.");
      return false;
    } finally {
      setSavingStep(null);
    }
  };

  const submitScan = async () => {
    if (!scanFile) return;
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", scanFile);
      const response = await fetch(`/api/student/challenges/${challenge.id}/submit-file`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        challenge: StudentChallengeDetail;
        results: GradeResult[];
        totalScore: number;
        totalMarks: number;
        passed: boolean;
        error?: string;
      };
      if (!response.ok) {
        if (payload.challenge) onChange(payload.challenge);
        throw new Error(payload.error || "Could not grade the handwritten answer.");
      }
      setResults(payload.results);
      setScore({ earned: payload.totalScore, total: payload.totalMarks, passed: payload.passed });
      setScanFile(null);
      onChange(payload.challenge);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not grade the handwritten answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const expiresAt = Date.parse(content.examExpiresAt || "");
  const remainingSeconds = Number.isFinite(expiresAt)
    ? Math.max(0, Math.ceil((expiresAt - clock) / 1_000))
    : null;
  const examExpired = remainingSeconds === 0;
  const timeRemaining =
    remainingSeconds === null
      ? null
      : `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  const refreshExam = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = await apiJson<{ challenge: StudentChallengeDetail }>(
        await fetch(`/api/student/challenges/${challenge.id}/start`, { method: "POST" }),
      );
      setResults([]);
      setScore(null);
      setClock(Date.now());
      onChange(payload.challenge);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not issue a fresh exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const restartChallenge = async () => {
    setRestarting(true);
    setError("");
    try {
      const payload = await apiJson<{ challenge: StudentChallengeDetail }>(
        await fetch(`/api/student/challenges/${challenge.id}/restart`, { method: "POST" }),
      );
      setResults([]);
      setScore(null);
      setClock(Date.now());
      setActiveStep(
        initialChallengeStep(payload.challenge),
      );
      onChange(payload.challenge);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restart this challenge.");
    } finally {
      setRestarting(false);
    }
  };

  const openNextChallenge = async () => {
    setOpeningNext(true);
    setError("");
    try {
      const opened = await onNext();
      if (!opened) setError("Could not open the next challenge. Try again.");
      else setNoNextAvailable(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not open the next challenge.";
      setError(message);
      if (message.includes("All currently extracted topics")) setNoNextAvailable(true);
    } finally {
      setOpeningNext(false);
    }
  };

  const goNext = async () => {
    if (activeStep === 1) {
      const saved = challenge.lessonRead || (await markStep("lesson"));
      if (saved) setActiveStep(2);
      return;
    }
    if (activeStep === 2) {
      const saved = challenge.examplesReviewed || (await markStep("examples"));
      if (saved) setActiveStep(3);
      return;
    }
    if (activeStep === 3) setActiveStep(4);
  };

  const steps = [
    { number: 1, label: "Concept Reading", complete: challenge.lessonRead },
    { number: 2, label: "Solved Example", complete: challenge.examplesReviewed },
    {
      number: 3,
      label: "Practice Question",
      complete: activeStep === 4 || challenge.status === "completed",
    },
    { number: 4, label: "Submit Answer", complete: challenge.status === "completed" },
  ] as const;

  const focusButtonClass =
    "min-h-10 rounded-lg px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main
      className={
        focusMode
          ? "fixed inset-0 z-[60] w-full overflow-y-auto overscroll-contain bg-bg-primary text-text-primary"
          : "min-h-screen w-full bg-bg-secondary text-text-primary"
      }
    >
      <div
        className={`mx-auto px-4 py-6 sm:px-8 ${focusMode ? "max-w-3xl pb-32" : "max-w-5xl pb-16"}`}
      >
        <header
          className={`grid grid-cols-[1fr_auto] items-start gap-4 sm:grid-cols-[auto_1fr_auto] ${focusMode ? "sticky top-0 z-20 -mx-4 border-b border-border bg-bg-primary/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8" : ""}`}
        >
          {focusMode ? (
            <div className="hidden sm:block" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={onBack}
              className={`${focusButtonClass} border border-border bg-card text-text-primary hover:bg-bg-primary`}
            >
              ← Back to Challenge Hub
            </button>
          )}
          <div className="hidden min-w-0 text-center sm:block">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              {challenge.subjectName} challenge
            </p>
            <h1 className="mt-1 truncate font-display text-xl font-semibold">{challenge.title}</h1>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div
              aria-label={timeRemaining ? `${timeRemaining} remaining` : "Challenge timer"}
              className="min-w-20 rounded-lg border border-border bg-card px-3 py-2 text-center font-mono text-sm font-semibold tabular-nums"
            >
              {challenge.status === "completed"
                ? "Done"
                : timeRemaining || `${challenge.durationMinutes}:00`}
            </div>
            <button
              ref={focusMode ? exitFocusButtonRef : enterFocusButtonRef}
              type="button"
              aria-pressed={focusMode}
              aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
              title={focusMode ? "Exit focus mode (Esc)" : "Enter focus mode"}
              onClick={() => setFocusMode((current) => !current)}
              className={`${focusButtonClass} inline-flex items-center justify-center gap-2 border border-border bg-card px-3 text-text-primary hover:bg-bg-secondary`}
            >
              {focusMode ? (
                <Minimize2 className="size-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-4" aria-hidden="true" />
              )}
              <span className="hidden md:inline">{focusMode ? "Exit focus" : "Focus mode"}</span>
            </button>
          </div>
        </header>

        <div className="mt-5 sm:hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {challenge.subjectName} challenge
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold">{challenge.title}</h1>
        </div>

        {!focusMode ? (
          <nav
            aria-label="Challenge progress"
            className="mt-6 rounded-2xl border border-border bg-card px-3 py-4 sm:px-6"
          >
            <ol className="grid grid-cols-4">
              {steps.map((step, index) => {
                const isActive = activeStep === step.number;
                return (
                  <li
                    key={step.number}
                    className="relative flex min-w-0 flex-col items-center text-center"
                  >
                    {index < steps.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-px ${step.complete ? "bg-success" : "bg-border"}`}
                      />
                    ) : null}
                    <button
                      type="button"
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => {
                        if (step.number <= activeStep || step.complete) setActiveStep(step.number);
                      }}
                      className="relative z-10 flex min-h-10 min-w-10 flex-col items-center gap-1 rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span
                        className={`grid size-8 place-items-center rounded-full text-xs font-bold ${
                          step.complete
                            ? "bg-success text-white"
                            : isActive
                              ? "bg-blue-600 text-white"
                              : "bg-bg-secondary text-text-muted"
                        }`}
                      >
                        {step.complete ? "✓" : step.number}
                      </span>
                      <span
                        className={`hidden text-xs font-semibold sm:block ${isActive ? "text-blue-600 dark:text-blue-400" : "text-text-muted"}`}
                      >
                        {step.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        <section
          className={`mt-6 bg-card p-5 sm:p-8 ${focusMode ? "rounded-xl" : "rounded-2xl border border-border"}`}
        >
          {activeStep === 1 ? (
            <div>
              <h2 className="text-xl font-semibold">📘 Key Concepts</h2>
              <p className="mt-2 text-sm text-text-muted">
                Read these concepts carefully before moving to the worked example.
              </p>
              <h3 className="mt-6 text-base font-semibold">{content.lesson.title}</h3>
              <div className="mt-3 space-y-3">
                {content.lesson.content.map((paragraph) => (
                  <p key={paragraph} className="max-w-prose text-sm leading-7 text-text-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-blue-500/10 p-4">
                <p className="text-sm font-semibold">Core focus</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{content.lesson.focus}</p>
              </div>
              {content.prerequisites?.length ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold">Before this topic</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {content.prerequisites.map((prerequisite) => (
                      <li
                        key={prerequisite.topicKey}
                        className="rounded-xl bg-bg-secondary p-4 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <strong>{prerequisite.title}</strong>
                          <span className={prerequisite.taught ? "text-success" : "text-warning"}>
                            {prerequisite.taught ? "Available" : "Notes missing"}
                          </span>
                        </div>
                        {prerequisite.reason ? (
                          <p className="mt-1 text-text-muted">{prerequisite.reason}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {content.lesson.sources?.length ? (
                <p className="mt-5 text-xs text-text-muted">
                  Grounded in {content.lesson.sources.length} uploaded course{" "}
                  {content.lesson.sources.length === 1 ? "source" : "sources"}.
                </p>
              ) : null}
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div>
              <h2 className="text-xl font-semibold">✅ Solved Example</h2>
              <p className="mt-2 text-sm text-text-muted">
                Walk through the complete solution before trying the question yourself.
              </p>
              {content.solvedExamples.length ? (
                <div className="mt-6 space-y-4">
                  {content.solvedExamples.map((example, index) => (
                    <article
                      key={`${example.question}-${index}`}
                      className="rounded-xl border border-border bg-bg-secondary p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Example {index + 1} · {example.marks} marks
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-6">{example.question}</p>
                      <div className="mt-4 rounded-lg bg-card p-4 text-sm leading-7 text-text-secondary">
                        <strong className="text-text-primary">Solution</strong>
                        <p className="mt-1 whitespace-pre-wrap">{example.solution}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-border bg-bg-secondary p-5 text-sm text-text-muted">
                  No solved example is available for this topic yet.
                </div>
              )}
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div>
              <h2 className="text-xl font-semibold">📝 Your Turn — Practice Question</h2>
              <p className="mt-2 text-sm text-text-muted">
                {challenge.status === "completed"
                  ? "Review the questions and feedback from your completed attempt."
                  : "Write answers on paper as Q1, Q2, and so on, then upload one complete answer sheet."}
              </p>
              {challenge.status === "completed" && !challenge.latestAttempt ? (
                <div className="mt-5 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-text-secondary">
                  This result is saved, but its answer details are unavailable for review.
                </div>
              ) : null}
              {content.examQuestions.length ? (
                <div className="mt-6 space-y-5">
                  {content.examQuestions.map((question, index) => (
                    <article key={question.id} className="rounded-xl bg-bg-secondary p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Question {index + 1} · {question.marks} marks
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6">{question.question}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-border bg-bg-secondary p-5 text-sm text-text-muted">
                  No practice question is available. Return to the hub and try another challenge.
                </div>
              )}
              <p className="mt-5 text-sm text-text-muted">
                💡{" "}
                {timeRemaining
                  ? `You have ${timeRemaining} remaining.`
                  : `This challenge allows ${challenge.durationMinutes} minutes.`}
              </p>
            </div>
          ) : null}

          {activeStep === 4 ? (
            <div>
              <h2 className="text-xl font-semibold">📤 Submit Your Answer Sheet</h2>
              <p className="mt-2 text-sm text-text-muted">
                Upload one clear PDF or photo containing all numbered answers.
              </p>
              {challenge.status !== "completed" && examExpired ? (
                <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-5">
                  <p className="text-sm font-semibold">This exam session expired.</p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void refreshExam()}
                    className={`${focusButtonClass} mt-4 bg-text-primary text-text-inverse`}
                  >
                    {submitting ? "Issuing…" : "Get a fresh exam"}
                  </button>
                </div>
              ) : null}
              {challenge.status !== "completed" && !examExpired ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border-2 border-dashed border-blue-500 bg-blue-500/10 p-6 text-center sm:p-10">
                    <Upload
                      className="mx-auto size-8 text-blue-600 dark:text-blue-400"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-semibold">
                      Your complete handwritten answer sheet
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Number answers as Q1, Q2, and so on · PDF, JPG, PNG or WebP · maximum 20 MB
                    </p>
                    <input
                      ref={answerSheetInputRef}
                      id={`challenge-upload-${challenge.id}`}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      disabled={submitting}
                      onChange={(event) => {
                        const selected = event.target.files?.[0] || null;
                        if (selected && selected.size > 20 * 1024 * 1024) {
                          setScanFile(null);
                          setError("Upload an answer sheet up to 20 MB.");
                          event.currentTarget.value = "";
                          return;
                        }
                        setScanFile(selected);
                        setError("");
                      }}
                      className="sr-only"
                    />
                    {scanFile ? (
                      <div className="mx-auto mt-5 flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 text-left">
                        <FileCheck2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{scanFile.name}</p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {(scanFile.size / (1024 * 1024)).toFixed(1)} MB · ready to submit
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setScanFile(null);
                            if (answerSheetInputRef.current) answerSheetInputRef.current.value = "";
                          }}
                          aria-label="Remove selected answer sheet"
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        if (!answerSheetInputRef.current) return;
                        answerSheetInputRef.current.value = "";
                        answerSheetInputRef.current.click();
                      }}
                      className={`${focusButtonClass} mt-5 inline-flex cursor-pointer items-center justify-center gap-2 border border-border bg-card text-text-primary hover:bg-bg-secondary`}
                    >
                      <Upload className="size-4" aria-hidden="true" />
                      {scanFile ? "Replace answer sheet" : "Choose answer sheet"}
                    </button>
                    <button
                      type="button"
                      disabled={!scanFile || submitting}
                      onClick={() => void submitScan()}
                      className={`${focusButtonClass} mx-auto mt-3 block bg-blue-600 text-white`}
                    >
                      {submitting ? "Reading and grading…" : "Submit answer sheet"}
                    </button>
                  </div>
                </div>
              ) : null}
              {score ? (
                <div
                  className={`mt-6 rounded-xl border p-5 ${score.passed ? "border-success/40 bg-success/10" : "border-warning/40 bg-warning/10"}`}
                >
                  <p className="font-semibold">
                    {score.earned} / {score.total} ·{" "}
                    {score.passed ? "Challenge completed · +50 XP ✓" : "Not passed yet"}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-text-secondary">
                    {results.map((result) => (
                      <p key={result.question_id}>{result.feedback}</p>
                    ))}
                  </div>
                </div>
              ) : challenge.status === "completed" ? (
                <div className="mt-6 rounded-xl border border-success/40 bg-success/10 p-5">
                  <p className="font-semibold text-success">Challenge completed ✓</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Your result is saved in Challenge Hub.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {content.warning ? <p className="mt-4 text-xs text-warning">{content.warning}</p> : null}
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <footer
          className={
            focusMode
              ? "sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-4 border-t border-border bg-bg-primary/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-8 sm:px-8"
              : "mt-6 flex items-center justify-between gap-4"
          }
        >
          <button
            type="button"
            disabled={activeStep === 1 || submitting || savingStep !== null}
            onClick={() => setActiveStep((current) => Math.max(1, current - 1) as 1 | 2 | 3 | 4)}
            className={`${focusButtonClass} border border-border bg-card text-text-primary`}
          >
            ← Previous
          </button>
          {activeStep < 4 ? (
            <button
              type="button"
              disabled={
                savingStep !== null ||
                submitting ||
                (activeStep === 3 && !content.examQuestions.length)
              }
              onClick={() => void goNext()}
              className={`${focusButtonClass} bg-blue-600 text-white`}
            >
              {savingStep ? "Saving…" : activeStep === 3 ? "Continue to submission →" : "Next →"}
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={restarting || openingNext}
                onClick={() => void restartChallenge()}
                className={`${focusButtonClass} border border-border bg-card text-text-primary hover:bg-bg-secondary`}
              >
                {restarting ? "Restarting…" : "Restart challenge"}
              </button>
              <button
                type="button"
                disabled={noNextAvailable || restarting || openingNext}
                onClick={() => void openNextChallenge()}
                title={
                  noNextAvailable
                    ? "All currently extracted topics already have challenges."
                    : nextChallenge
                      ? "Open the next available challenge"
                      : "Find and open the next available challenge"
                }
                className={`${focusButtonClass} bg-blue-600 text-white hover:bg-blue-700`}
              >
                {openingNext
                  ? "Opening…"
                  : noNextAvailable
                    ? "All challenges complete"
                    : "Next challenge →"}
              </button>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}

export function ChallengesDashboardClient({ dashboard }: { dashboard: StudentChallengeDashboard }) {
  const router = useRouter();
  const [selected, setSelected] = useState<StudentChallengeDetail | null>(null);
  const [openingId, setOpeningId] = useState("");
  const [openError, setOpenError] = useState("");
  const selectedScopeKey = dashboard.scope
    ? `${dashboard.scope.courseId}:${dashboard.scope.subjectSlug.trim().toLowerCase()}`
    : "all";
  const selectedSubject = dashboard.subjectOptions.find(
    (subject) => subject.scopeKey === selectedScopeKey,
  );
  const weeklyProgress = Math.min(100, (dashboard.passedThisWeek / WEEKLY_CHALLENGE_TARGET) * 100);
  const weeklyLeaderTotal = Math.round((dashboard.leaderboard?.topPracticePerDay ?? 0) * 7);
  const challengesBehind = Math.max(0, weeklyLeaderTotal - dashboard.passedThisWeek);

  const completedPageHref = (page: number) => {
    const params = new URLSearchParams({ completedPage: String(page) });
    if (dashboard.scope) {
      params.set("courseId", dashboard.scope.courseId);
      params.set("subject", dashboard.scope.subjectSlug);
    }
    return `/app/challenges?${params.toString()}#completed-challenges`;
  };

  const changePrioritySubject = (scopeKey: string) => {
    if (scopeKey === "all") {
      router.replace("/app/challenges");
      return;
    }
    const subject = dashboard.subjectOptions.find((option) => option.scopeKey === scopeKey);
    if (!subject) return;
    const params = new URLSearchParams({
      courseId: subject.courseId,
      subject: subject.subjectSlug,
    });
    router.replace(`/app/challenges?${params.toString()}`);
  };

  const openChallenge = async (challenge: StudentChallengeSummary) => {
    setOpeningId(challenge.id);
    setOpenError("");
    try {
      const payload = await apiJson<{ challenge: StudentChallengeDetail }>(
        await fetch(`/api/student/challenges/${challenge.id}/start`, { method: "POST" }),
      );
      setSelected(payload.challenge);
      return true;
    } catch (cause) {
      setOpenError(cause instanceof Error ? cause.message : "Could not open this challenge.");
      return false;
    } finally {
      setOpeningId("");
    }
  };

  if (selected) {
    const nextChallenge = nextAvailableChallenge(dashboard.challenges, selected);
    return (
      <ChallengeDetail
        challenge={selected}
        onBack={() => setSelected(null)}
        onChange={setSelected}
        nextChallenge={nextChallenge}
        onNext={async () => {
          if (nextChallenge) return openChallenge(nextChallenge);
          const params = new URLSearchParams();
          if (dashboard.scope) {
            params.set("courseId", dashboard.scope.courseId);
            params.set("subject", dashboard.scope.subjectSlug);
          }
          const suffix = params.size ? `?${params.toString()}` : "";
          const payload = await apiJson<{ challenge: StudentChallengeDetail }>(
            await fetch(`/api/student/challenges/${selected.id}/next${suffix}`, { method: "POST" }),
          );
          setSelected(payload.challenge);
          router.refresh();
          return true;
        }}
      />
    );
  }

  return (
    <main className="min-h-screen w-full bg-bg-secondary text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:px-8">
        <header className="mb-8 grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
              <Target className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Challenge Hub
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                {dashboard.community
                  ? `Showing only ${dashboard.community.name} subjects, progress, and history.`
                  : "Join a community to start its challenges and track your progress."}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="priority-subject"
              className="text-xs font-semibold uppercase tracking-wide text-text-muted"
            >
              Priority subject
            </label>
            <select
              id="priority-subject"
              value={selectedScopeKey}
              onChange={(event) => changePrioritySubject(event.target.value)}
              className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-border bg-card px-3 text-sm font-medium text-text-primary transition-colors duration-100 hover:border-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary motion-reduce:transition-none"
            >
              <option value="all">All subjects</option>
              {dashboard.subjectOptions.map((subject) => (
                <option key={subject.scopeKey} value={subject.scopeKey}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-text-muted">
              {selectedSubject
                ? `Showing ${selectedSubject.subjectName} challenges.`
                : dashboard.community
                  ? `Showing all ${dashboard.community.name} subjects.`
                  : "No learner community is active."}
            </p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3" aria-label="Weekly challenge summary">
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-text-muted">Weekly Target Progress</p>
            <p className="mt-1 text-2xl font-bold">
              {dashboard.passedThisWeek} / {WEEKLY_CHALLENGE_TARGET} Completed
            </p>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-bg-tertiary"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-text-muted">Avg. Test Score</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {dashboard.averageTestScore === null
                ? "—"
                : `${dashboard.averageTestScore.toFixed(1)}%`}
            </p>
            <p className="mt-1 text-xs text-text-muted">Passing threshold: 40%</p>
          </article>

          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-text-muted">Weekly Peer Leaderboard</p>
            <p className="mt-1 text-2xl font-bold">
              {dashboard.leaderboard?.practicePerDayRank
                ? `Rank #${dashboard.leaderboard.practicePerDayRank}`
                : "Not ranked yet"}
            </p>
            <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              {challengesBehind > 0
                ? `${challengesBehind} challenge${challengesBehind === 1 ? "" : "s"} behind the weekly leader`
                : dashboard.passedThisWeek > 0
                  ? "You are level with the weekly leader"
                  : "Complete a challenge to enter the ranking"}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-5 md:px-6">
            <h2 className="text-xl font-semibold">Available Daily Micro-Topic Challenges</h2>
            {dashboard.scope ? (
              <p className="mt-1 text-sm text-text-muted">
                Showing {dashboard.scope.subjectName} challenges only.
              </p>
            ) : null}
          </div>

          {dashboard.challenges.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="bg-bg-secondary text-text-secondary">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold md:px-6">
                      Subject
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Micro Topic
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Est. Time
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      XP Reward
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold md:px-6">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.challenges.map((challenge) => {
                    const score = challengeScore(challenge);
                    const completed = challenge.status === "completed";
                    const started = challenge.status === "started";
                    return (
                      <tr key={challenge.id} className="border-t border-border">
                        <td className="px-5 py-4 font-medium md:px-6">{challenge.subjectName}</td>
                        <td className="max-w-xs px-5 py-4">
                          <span className="block font-medium">{challenge.topicTitle}</span>
                          <span className="mt-1 line-clamp-1 block text-xs text-text-muted">
                            {challenge.recommendationReason}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {challenge.durationMinutes} mins
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">+50 XP</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ${
                              completed
                                ? "bg-success/15 text-success"
                                : started
                                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                  : "bg-warning/15 text-warning"
                            }`}
                          >
                            {completed
                              ? `Completed${score === null ? "" : ` (${Math.round(score)}%)`}`
                              : started
                                ? "In Progress"
                                : "New Available"}
                          </span>
                        </td>
                        <td className="px-5 py-4 md:px-6">
                          <button
                            type="button"
                            onClick={() => void openChallenge(challenge)}
                            disabled={openingId === challenge.id}
                            aria-busy={openingId === challenge.id}
                            className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-60 ${
                              completed
                                ? "border border-border bg-bg-primary text-text-primary hover:bg-bg-secondary"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {openingId === challenge.id
                              ? "Opening…"
                              : completed
                                ? "View Details"
                                : started
                                  ? "Continue"
                                  : "Start Challenge"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold">
                {dashboard.scope
                  ? "No challenge is ready for this subject yet"
                  : "No challenges yet"}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                {dashboard.scope
                  ? "Ask the community creator to refresh this subject's extracted topics."
                  : dashboard.community
                    ? `${dashboard.community.name} has no available challenges yet. Published topics will appear here automatically.`
                    : "Join a community and its real micro-topics will appear here."}
              </p>
              <Link
                href={
                  dashboard.community
                    ? `/app/communities/${encodeURIComponent(dashboard.community.slug)}`
                    : "/communities"
                }
                className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-text-primary px-4 text-sm font-semibold text-text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {dashboard.community ? "Open Subject Explorer" : "Browse communities"}
              </Link>
            </div>
          )}
        </section>

        {openError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive"
          >
            {openError}
          </p>
        ) : null}

        {dashboard.completedChallengeTotal > 0 ? (
          <section
            id="completed-challenges"
            className="mt-8 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-5 md:px-6">
              <div>
                <h2 className="text-xl font-semibold">Completed Challenges</h2>
                <p className="mt-1 text-sm text-text-muted">
                  {dashboard.completedChallengeTotal} passed, newest first.
                </p>
              </div>
              {dashboard.completedChallengeTotalPages > 1 ? (
                <p className="text-xs text-text-muted">
                  Page {dashboard.completedChallengePage} of{" "}
                  {dashboard.completedChallengeTotalPages}
                </p>
              ) : null}
            </div>
            <div className="divide-y divide-border">
              {dashboard.completedChallenges.map((challenge) => {
                const score = challengeScore(challenge);
                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => void openChallenge(challenge)}
                    disabled={openingId === challenge.id}
                    className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-60 md:px-6"
                  >
                    <span>
                      <span className="block font-medium">{challenge.topicTitle}</span>
                      <span className="mt-1 block text-xs text-text-muted">
                        {challenge.subjectName} · {challenge.date}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">
                      {openingId === challenge.id
                        ? "Opening…"
                        : `${score === null ? "Passed" : `${Math.round(score)}%`} · Review →`}
                    </span>
                  </button>
                );
              })}
            </div>
            {dashboard.completedChallengeTotalPages > 1 ? (
              <nav
                className="flex items-center justify-between border-t border-border px-5 py-4 md:px-6"
                aria-label="Completed challenges pagination"
              >
                {dashboard.completedChallengePage > 1 ? (
                  <Link
                    href={completedPageHref(dashboard.completedChallengePage - 1)}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                {dashboard.completedChallengePage < dashboard.completedChallengeTotalPages ? (
                  <Link
                    href={completedPageHref(dashboard.completedChallengePage + 1)}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Next →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
