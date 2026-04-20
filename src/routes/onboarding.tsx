import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/MarketingNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui-ns/Button";
import { Field, Input } from "@/components/ui-ns/Field";
import { COLLEGES, GRADES } from "@/mockData/subjects";
import { getCurrentUser, updateCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started · Nano Syllabus" }] }),
  component: Onboarding,
});

const SUBJECT_OPTIONS = [
  "Physics", "Chemistry", "Mathematics", "Biology", "English",
  "Computer Science", "Accountancy", "Economics", "Nepali", "Statistics",
];

const GRADE_TARGETS = ["A+", "A", "B+", "B", "C+", "C"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [collegeQuery, setCollegeQuery] = useState("");
  const [college, setCollege] = useState("");
  const [grade, setGrade] = useState("");
  const [scoreType, setScoreType] = useState<"%" | "GPA">("%");
  const [score, setScore] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [target, setTarget] = useState("A+");
  const [language, setLanguage] = useState<"EN" | "RN">("EN");

  useEffect(() => {
    if (!getCurrentUser()) navigate({ to: "/login" });
  }, [navigate]);

  const filteredColleges = useMemo(
    () =>
      COLLEGES.filter((c) =>
        c.toLowerCase().includes(collegeQuery.toLowerCase()),
      ),
    [collegeQuery],
  );

  const total = 5;

  const next = () => setStep((s) => Math.min(total, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    updateCurrentUser({
      onboarded: true,
      college: college || collegeQuery,
      grade,
      boardScore: score ? `${score}${scoreType}` : undefined,
      subjects,
      targetGrade: target,
      language,
    });
    navigate({ to: "/app/chat" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="border-b border-border bg-bg-secondary">
        <div className="mx-auto max-w-2xl px-5 py-3">
          <div className="flex items-center justify-between text-xs font-mono-ui text-text-muted">
            <span>Step {step} of {total}</span>
            <span>{Math.round((step / total) * 100)}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full bg-text-primary transition-all"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-12">
        <div key={step} className="animate-fade-in">
          {step === 1 && (
            <Step title="Where do you study?" subtitle="Pick your college or institution.">
              <Field label="Search">
                <Input value={collegeQuery} onChange={(e) => { setCollegeQuery(e.target.value); setCollege(""); }} placeholder="Type to search…" />
              </Field>
              <div className="mt-3 max-h-64 overflow-auto rounded-md border border-border">
                {filteredColleges.length === 0 ? (
                  <button
                    onClick={() => setCollege(collegeQuery)}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-bg-secondary"
                  >
                    Use "{collegeQuery}" as my institution
                  </button>
                ) : (
                  filteredColleges.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCollege(c); setCollegeQuery(c); }}
                      className={
                        "block w-full px-4 py-3 text-left text-sm transition hover:bg-bg-secondary " +
                        (college === c ? "bg-bg-secondary font-medium" : "")
                      }
                    >
                      {c}
                    </button>
                  ))
                )}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="Which grade or year?" subtitle="Pick what you're currently in.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={
                      "rounded-md border px-3 py-3 text-sm transition " +
                      (grade === g
                        ? "border-text-primary bg-text-primary text-text-inverse"
                        : "border-border hover:border-border-strong")
                    }
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step title="Last board score" subtitle="So we can calibrate difficulty. You can skip this.">
              <div className="mb-3 inline-flex rounded-full border border-border p-1">
                {(["%", "GPA"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setScoreType(t)}
                    className={
                      "rounded-full px-4 py-1.5 text-xs font-mono-ui transition " +
                      (scoreType === t ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Field label={scoreType === "%" ? "Score (0–100)" : "GPA (0–4.0)"}>
                <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder={scoreType === "%" ? "82" : "3.4"} />
              </Field>
            </Step>
          )}

          {step === 4 && (
            <Step title="Pick your subjects" subtitle="Select all that apply.">
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((s) => {
                  const on = subjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSubjects((prev) => on ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={
                        "rounded-full border px-4 py-1.5 text-sm transition " +
                        (on
                          ? "border-text-primary bg-text-primary text-text-inverse"
                          : "border-border hover:border-border-strong")
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step title="Goals & language" subtitle="Personalise your AI companion.">
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-mono-ui uppercase text-text-muted">Target grade</p>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_TARGETS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setTarget(g)}
                        className={
                          "h-10 w-12 rounded-md border text-sm transition " +
                          (target === g
                            ? "border-text-primary bg-text-primary text-text-inverse"
                            : "border-border hover:border-border-strong")
                        }
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-mono-ui uppercase text-text-muted">Default response language</p>
                  <div className="inline-flex rounded-full border border-border p-1">
                    {(["EN", "RN"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={
                          "rounded-full px-5 py-1.5 text-xs font-mono-ui transition " +
                          (language === l ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                        }
                      >
                        {l === "EN" ? "English" : "Roman Nepali"}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 rounded-md border border-border bg-bg-secondary p-3 text-xs text-text-secondary">
                    <span className="font-mono-ui text-text-muted">Roman Nepali example: </span>
                    "Newton ko teesro law explain gardinus na" → AI answers in the same style.
                  </p>
                </div>
              </div>
            </Step>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-10">
          <Button variant="ghost" onClick={back} disabled={step === 1}>← Back</Button>
          {step < total ? (
            <Button onClick={next}>Next →</Button>
          ) : (
            <Button onClick={finish}>Start learning →</Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-mono-ui uppercase text-text-muted">Onboarding</p>
      <h1 className="mt-2 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
