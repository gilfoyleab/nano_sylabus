import { useEffect, useState } from "react";
import { Logo } from "./MarketingNav";
import { ThemeToggle } from "./ThemeToggle";
import { AppNav, useRequireAuth } from "./AppNav";
import { PendingInvoiceBanner } from "./PendingInvoiceBanner";
import type { MockUser } from "@/lib/auth";

interface Props {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode | ((user: MockUser) => React.ReactNode);
  contentClass?: string;
}

/**
 * Standard sidebar + header layout for /app pages.
 * Includes pending-invoice banner & redirects unauthenticated users.
 */
export function AppShell({ title, actions, children, contentClass = "" }: Props) {
  const [user] = useRequireAuth();
  const [open, setOpen] = useState(false);
  // Close mobile sidebar on resize-up
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      <aside
        className={
          "fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col border-r border-border bg-bg-primary transition-transform md:static md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
          <button className="md:hidden text-text-muted" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto"><AppNav user={user} /></div>
      </aside>

      {open && (
        <button aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-black/40 md:hidden" />
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <PendingInvoiceBanner />
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden text-text-muted" onClick={() => setOpen(true)}>☰</button>
            <div className="min-w-0 truncate font-display text-2xl">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </header>
        <div className={"flex-1 overflow-y-auto " + contentClass}>
          {typeof children === "function" ? children(user) : children}
        </div>
      </main>
    </div>
  );
}
