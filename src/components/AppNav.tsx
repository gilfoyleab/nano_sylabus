import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser, logout, type MockUser } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

const NAV = [
  { to: "/app/chat", label: "Chats", icon: "💬" },
  { to: "/app/explore", label: "Explore", icon: "🧭" },
  { to: "/app/notes", label: "My Notes", icon: "📌" },
  { to: "/app/settings", label: "Settings", icon: "⚙︎" },
] as const;

export function AppNav({ user }: { user: MockUser | null }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const onLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const lowCredits = (user?.credits ?? 0) < 10;
  const pct = user ? Math.min(100, ((user.creditsTotal - user.credits) / user.creditsTotal) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-col gap-0.5 px-2">
        {NAV.map((n) => {
          const active = loc.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition " +
                (active
                  ? "bg-bg-tertiary text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary")
              }
            >
              <span className="w-4 text-center">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {user && (
        <div className="m-3 rounded-lg border border-border bg-bg-secondary p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono-ui text-text-muted">Credits</span>
            <span className={"font-mono-ui font-medium " + (lowCredits ? "text-destructive animate-pulse-soft" : "text-text-primary")}>
              🪙 {user.credits} / {user.creditsTotal}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-tertiary">
            <div className={"h-full " + (lowCredits ? "bg-destructive" : "bg-text-primary")} style={{ width: `${pct}%` }} />
          </div>
          {lowCredits && (
            <p className="mt-2 text-[11px] text-destructive">⚠️ Low credits — <Link to="/" className="underline">upgrade</Link></p>
          )}
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary font-mono-ui text-xs">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name ?? "Guest"}</div>
            <div className="truncate text-[11px] text-text-muted">{user?.email}</div>
          </div>
          <button onClick={onLogout} title="Log out" className="text-xs text-text-muted hover:text-text-primary">↪</button>
        </div>
      </div>
    </div>
  );
}

export function useRequireAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MockUser | null>(null);
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) navigate({ to: "/login" });
    else if (!u.onboarded) navigate({ to: "/onboarding" });
    else setUser(u);
  }, [navigate]);
  return [user, setUser] as const;
}
