import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, DividerOr } from "./login";
import { Button } from "@/components/ui-ns/Button";
import { Field, Input } from "@/components/ui-ns/Field";
import { createMockUser, setCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up · Nano Syllabus" }] }),
  component: SignupPage,
});

type Step = "form" | "otp";

function pwdStrength(pwd: string): { score: 0 | 1 | 2 | 3; label: string } {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd) && /[^\w\s]/.test(pwd)) s++;
  return { score: s as 0 | 1 | 2 | 3, label: ["Too short", "Weak", "Medium", "Strong"][s] };
}

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState("");
  const strength = pwdStrength(pwd);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email.includes("@")) return setError("Fill in name and a valid email.");
    if (pwd.length < 8) return setError("Password must be at least 8 characters.");
    if (pwd !== pwd2) return setError("Passwords don't match.");
    setError("");
    setStep("otp");
  };

  if (step === "otp") return <OtpStep email={email} onVerified={() => {
    const u = createMockUser(name, email);
    setCurrentUser(u);
    navigate({ to: "/onboarding" });
  }} />;

  return (
    <AuthShell title="Create your account" subtitle="20 free credits, no card needed.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pratiksha Rai" />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.np" />
        </Field>
        <Field label="Password">
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={
                  "h-1 flex-1 rounded-full " +
                  (i < strength.score
                    ? strength.score === 1
                      ? "bg-destructive"
                      : strength.score === 2
                      ? "bg-warning"
                      : "bg-success"
                    : "bg-bg-tertiary")
                }
              />
            ))}
          </div>
          <span className="mt-1 block text-[11px] font-mono-ui text-text-muted">{strength.label}</span>
        </Field>
        <Field label="Confirm password" error={error || undefined}>
          <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} invalid={!!error} placeholder="••••••••" />
        </Field>
        <Button type="submit" className="w-full">Create account</Button>
      </form>

      <DividerOr />

      <Button variant="outline" className="w-full" onClick={submit as never}>
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-text-primary underline underline-offset-4">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

function OtpStep({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onInput = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) {
      const el = document.getElementById("otp-" + (i + 1));
      el?.focus();
    }
  };

  const verify = () => {
    if (digits.some((d) => !d)) return setError("Enter all 6 digits.");
    onVerified();
  };

  return (
    <AuthShell title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`}>
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            id={"otp-" + i}
            value={d}
            onChange={(e) => onInput(i, e.target.value)}
            inputMode="numeric"
            maxLength={1}
            className="h-14 w-full rounded-md border border-border bg-bg-primary text-center font-mono-ui text-xl focus:border-border-strong focus:outline-none"
          />
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      <div className="mt-5 flex items-center justify-between text-xs text-text-muted">
        <button
          disabled={countdown > 0}
          onClick={() => setCountdown(60)}
          className="font-mono-ui hover:text-text-primary disabled:opacity-50"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
        </button>
        <span className="font-mono-ui">demo code: any digits</span>
      </div>
      <Button className="mt-6 w-full" onClick={verify}>Verify & continue</Button>
    </AuthShell>
  );
}
