import { ReactNode } from "react";
import { Logo } from "@/components/marketing-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
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
