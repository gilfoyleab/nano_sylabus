"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [{ href: "/admin/payments", label: "Payments", icon: "💸" }];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <aside className="hidden w-[260px] border-r border-border bg-bg-primary md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <p className="font-display text-2xl">Nano Ops</p>
          <p className="mt-1 text-xs text-text-muted">Finance-first admin surface</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                pathname.startsWith(item.href)
                  ? "bg-bg-tertiary text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
              )}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-4">
          <Link href="/app/chat" className="text-sm text-text-secondary hover:text-text-primary">
            ← Back to student app
          </Link>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 md:px-8">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="danger">Admin</Badge>
              <div className="font-display text-3xl">{title}</div>
            </div>
            {subtitle ? <p className="mt-2 text-sm text-text-secondary">{subtitle}</p> : null}
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
