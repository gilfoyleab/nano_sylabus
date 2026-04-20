import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/MarketingNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui-ns/Button";
import { Field, Input } from "@/components/ui-ns/Field";
import { createMockUser, getCurrentUser, setCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Nano Syllabus" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) navigate({ to: u.onboarded ? "/app/chat" : "/onboarding" });
  }, [navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 4) {
      setError("Enter a valid email and password (4+ chars).");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const u = createMockUser(email.split("@")[0], email);
      u.onboarded = true;
      setCurrentUser(u);
      navigate({ to: "/app/chat" });
    }, 600);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to keep studying.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.np" />
        </Field>
        <Field label="Password" error={error || undefined}>
          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={!!error}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono-ui text-text-muted hover:text-text-primary"
            >
              {showPwd ? "HIDE" : "SHOW"}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </Button>
      </form>

      <DividerOr />

      <Button variant="outline" className="w-full" onClick={onSubmit as never}>
        <GoogleIcon /> Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-text-primary underline underline-offset-4">
          Sign up
        </Link>
      </p>

      {forgotOpen && <ForgotModal onClose={() => setForgotOpen(false)} />}
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <div className="absolute inset-0 bg-dotgrid opacity-40" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-5 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] rounded-xl border border-border bg-bg-primary p-8 shadow-sm animate-fade-in">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function DividerOr() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
      <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.351z"/>
      <path fill="currentColor" opacity=".7" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.596-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"/>
      <path fill="currentColor" opacity=".5" d="M6.404 13.9A6.01 6.01 0 0 1 6.09 12c0-.66.114-1.3.314-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"/>
      <path fill="currentColor" opacity=".3" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.34 2.59C7.19 7.737 9.395 5.977 12 5.977z"/>
    </svg>
  );
}

function ForgotModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-primary p-6 animate-slide-up">
        <h3 className="font-display text-2xl">Reset your password</h3>
        <p className="mt-1 text-sm text-text-secondary">
          {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send you a reset link."}
        </p>
        {!sent && (
          <div className="mt-4">
            <Input type="email" placeholder="you@school.edu.np" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!sent && <Button onClick={() => setSent(true)}>Send reset link</Button>}
        </div>
      </div>
    </div>
  );
}
