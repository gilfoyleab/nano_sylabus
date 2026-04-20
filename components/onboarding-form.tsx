"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { StudentProfile } from "@/lib/types";
import { COLLEGES, GRADES, SUBJECT_OPTIONS, TARGET_GRADES } from "@/lib/subjects";

export function OnboardingForm({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: StudentProfile | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(initialProfile?.fullName ?? "");
  const [collegeQuery, setCollegeQuery] = useState(initialProfile?.college ?? "");
  const [college, setCollege] = useState(initialProfile?.college ?? "");
  const [grade, setGrade] = useState(initialProfile?.grade ?? "");
  const [scoreType, setScoreType] = useState<"%" | "GPA">("%");
  const [score, setScore] = useState(initialProfile?.boardScore?.replace(/[%A-Z]+$/g, "") ?? "");
  const [subjects, setSubjects] = useState<string[]>(initialProfile?.subjects ?? []);
  const [targetGrade, setTargetGrade] = useState(initialProfile?.targetGrade ?? "A+");
  const [languagePref, setLanguagePref] = useState<"EN" | "RN">(initialProfile?.languagePref ?? "EN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredColleges = useMemo(
    () => COLLEGES.filter((value) => value.toLowerCase().includes(collegeQuery.toLowerCase())),
    [collegeQuery],
  );

  const total = 5;

  async function finish() {
    if (!fullName.trim() || !(college || collegeQuery).trim() || !grade.trim() || !targetGrade.trim()) {
      setError("Please complete your name, college, grade, and target grade.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: upsertError } = await supabase.from("student_profiles").upsert({
      user_id: userId,
      full_name: fullName,
      college: (college || collegeQuery).trim(),
      grade,
      board_score: score ? `${score}${scoreType}` : null,
      subjects,
      target_grade: targetGrade,
      language_pref: languagePref,
    });

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.replace("/app/chat");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10">
      <div className="border-b border-border bg-bg-secondary px-5 py-3">
        <div className="flex items-center justify-between text-xs font-mono-ui text-text-muted">
          <span>Step {step} of {total}</span>
          <span>{Math.round((step / total) * 100)}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-tertiary">
          <div className="h-full bg-text-primary transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>

      <main className="flex flex-1 flex-col py-12">
        {step === 1 ? (
          <Step title="Where do you study?" subtitle="Pick your college or institution.">
            <Field label="Full name">
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Search institution">
              <Input
                value={collegeQuery}
                onChange={(event) => {
                  setCollegeQuery(event.target.value);
                  setCollege("");
                }}
                placeholder="Type to search..."
              />
            </Field>
            <div className="mt-3 max-h-64 overflow-auto rounded-md border border-border">
              {filteredColleges.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setCollege(collegeQuery)}
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-bg-secondary"
                >
                  Use &quot;{collegeQuery}&quot; as my institution
                </button>
              ) : (
                filteredColleges.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => {
                      setCollege(item);
                      setCollegeQuery(item);
                    }}
                    className={
                      "block w-full px-4 py-3 text-left text-sm transition hover:bg-bg-secondary " +
                      (college === item ? "bg-bg-secondary font-medium" : "")
                    }
                  >
                    {item}
                  </button>
                ))
              )}
            </div>
          </Step>
        ) : null}

        {step === 2 ? (
          <Step title="Which grade or year?" subtitle="Pick what you are currently in.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GRADES.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setGrade(item)}
                  className={
                    "rounded-md border px-3 py-3 text-sm transition " +
                    (grade === item
                      ? "border-text-primary bg-text-primary text-text-inverse"
                      : "border-border hover:border-border-strong")
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </Step>
        ) : null}

        {step === 3 ? (
          <Step title="Last board score" subtitle="We use this to calibrate explanation level. You can skip it.">
            <div className="mb-3 inline-flex rounded-full border border-border p-1">
              {(["%", "GPA"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setScoreType(item)}
                  className={
                    "rounded-full px-4 py-1.5 text-xs font-mono-ui transition " +
                    (scoreType === item ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                  }
                >
                  {item}
                </button>
              ))}
            </div>
            <Field label={scoreType === "%" ? "Score (0-100)" : "GPA (0-4.0)"}>
              <Input
                type="number"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                placeholder={scoreType === "%" ? "82" : "3.4"}
              />
            </Field>
          </Step>
        ) : null}

        {step === 4 ? (
          <Step title="Pick your subjects" subtitle="Select all that apply.">
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((subject) => {
                const active = subjects.includes(subject);
                return (
                  <button
                    type="button"
                    key={subject}
                    onClick={() =>
                      setSubjects((prev) =>
                        active ? prev.filter((value) => value !== subject) : [...prev, subject],
                      )
                    }
                    className={
                      "rounded-full border px-4 py-1.5 text-sm transition " +
                      (active
                        ? "border-text-primary bg-text-primary text-text-inverse"
                        : "border-border hover:border-border-strong")
                    }
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </Step>
        ) : null}

        {step === 5 ? (
          <Step title="Goals & language" subtitle="This makes the AI feel personal from the first answer.">
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-mono-ui uppercase text-text-muted">Target grade</p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_GRADES.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setTargetGrade(item)}
                      className={
                        "h-10 w-12 rounded-md border text-sm transition " +
                        (targetGrade === item
                          ? "border-text-primary bg-text-primary text-text-inverse"
                          : "border-border hover:border-border-strong")
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-mono-ui uppercase text-text-muted">Default response language</p>
                <div className="inline-flex rounded-full border border-border p-1">
                  {(["EN", "RN"] as const).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setLanguagePref(item)}
                      className={
                        "rounded-full px-5 py-1.5 text-xs font-mono-ui transition " +
                        (languagePref === item
                          ? "bg-text-primary text-text-inverse"
                          : "text-text-secondary")
                      }
                    >
                      {item === "EN" ? "English" : "Roman Nepali"}
                    </button>
                  ))}
                </div>
                <p className="mt-3 rounded-md border border-border bg-bg-secondary p-3 text-xs text-text-secondary">
                  <span className="font-mono-ui text-text-muted">Roman Nepali example: </span>
                  &quot;Newton ko teesro law explain gardinus na&quot;.
                </p>
              </div>
            </div>
          </Step>
        ) : null}

        {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}

        <div className="mt-auto flex items-center justify-between pt-10">
          <Button variant="ghost" type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
            ← Back
          </Button>
          {step < total ? (
            <Button type="button" onClick={() => setStep((value) => Math.min(total, value + 1))}>
              Next →
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={loading}>
              {loading ? "Saving..." : "Start learning →"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in">
      <p className="text-xs font-mono-ui uppercase text-text-muted">Onboarding</p>
      <h1 className="mt-2 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
