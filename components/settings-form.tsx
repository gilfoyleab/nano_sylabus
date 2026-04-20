"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AppUser, StudentProfile } from "@/lib/types";

export function SettingsForm({
  user,
  profile,
}: {
  user: AppUser;
  profile: StudentProfile;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [college, setCollege] = useState(profile.college);
  const [grade, setGrade] = useState(profile.grade);
  const [boardScore, setBoardScore] = useState(profile.boardScore ?? "");
  const [targetGrade, setTargetGrade] = useState(profile.targetGrade);
  const [languagePref, setLanguagePref] = useState<"EN" | "RN">(profile.languagePref);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveProfile() {
    setSaving(true);
    setStatus("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("student_profiles").upsert({
      user_id: user.id,
      full_name: fullName,
      college,
      grade,
      board_score: boardScore || null,
      subjects: profile.subjects,
      target_grade: targetGrade,
      language_pref: languagePref,
    });

    setSaving(false);
    setStatus(error ? error.message : "Saved.");
  }

  async function exportAccount() {
    setExporting(true);
    setStatus("");
    const response = await fetch("/api/account/export", { cache: "no-store" });
    setExporting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error || "Failed to export account.");
      return;
    }

    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nano-syllabus-export-${user.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Account export downloaded.");
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "This will permanently delete your account, chats, notes, billing history, and saved data. Continue?",
    );
    if (!confirmed) return;

    setDeleting(true);
    setStatus("");
    const response = await fetch("/api/account", {
      method: "DELETE",
    });
    setDeleting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error || "Failed to delete account.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/signup");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="rounded-lg border border-border bg-bg-primary">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-display text-xl">Profile & preferences</h2>
        </div>
        <div className="space-y-4 p-5">
          <Field label="Full name">
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={user.email} disabled />
          </Field>
          <Field label="College / institution">
            <Input value={college} onChange={(event) => setCollege(event.target.value)} />
          </Field>
          <Field label="Grade / year">
            <Input value={grade} onChange={(event) => setGrade(event.target.value)} />
          </Field>
          <Field label="Board score">
            <Input value={boardScore} onChange={(event) => setBoardScore(event.target.value)} />
          </Field>
          <Field label="Target grade">
            <Input value={targetGrade} onChange={(event) => setTargetGrade(event.target.value)} />
          </Field>
          <div>
            <p className="mb-2 text-xs font-mono-ui uppercase text-text-muted">Default language</p>
            <div className="inline-flex rounded-full border border-border p-1">
              {(["EN", "RN"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setLanguagePref(item)}
                  className={
                    "rounded-full px-5 py-1.5 text-xs font-mono-ui transition " +
                    (languagePref === item ? "bg-text-primary text-text-inverse" : "text-text-secondary")
                  }
                >
                  {item === "EN" ? "English" : "Roman Nepali"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-mono-ui uppercase text-text-muted">Subjects</p>
            <p className="rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary">
              {profile.subjects.join(", ") || "No subjects saved yet."}
            </p>
          </div>
          {status ? <p className="text-sm text-text-secondary">{status}</p> : null}
        </div>
        <div className="flex justify-end border-t border-border bg-bg-secondary px-5 py-3">
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-primary">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-display text-xl">Account</h2>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-md border border-border bg-bg-secondary p-4">
            <p className="text-sm font-medium">Export your data</p>
            <p className="mt-1 text-sm text-text-secondary">
              Download your profile, chats, notes, billing records, and credit history as JSON.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => void exportAccount()} disabled={exporting}>
              {exporting ? "Preparing export..." : "Download export"}
            </Button>
          </div>

          <div className="rounded-md border border-destructive/40 bg-[color:var(--note-red)] p-4">
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="mt-1 text-sm text-text-secondary">
              This permanently removes your auth account and cascades your saved study data.
            </p>
            <Button className="mt-4" variant="danger" onClick={() => void deleteAccount()} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete account"}
            </Button>
          </div>

          {status ? <p className="text-sm text-text-secondary">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}
