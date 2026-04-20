import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/MarketingNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppNav, useRequireAuth } from "@/components/AppNav";
import { Button } from "@/components/ui-ns/Button";

export const Route = createFileRoute("/app/explore")({
  head: () => ({ meta: [{ title: "Explore · Nano Syllabus" }] }),
  component: ComingSoon,
});

function ComingSoon() {
  const [user] = useRequireAuth();
  if (!user) return null;
  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      <aside className="hidden w-[280px] flex-col border-r border-border md:flex">
        <div className="px-4 py-4"><Logo /></div>
        <div className="flex-1 overflow-y-auto"><AppNav user={user} /></div>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h1 className="font-display text-2xl">Explore by Subject</h1>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center p-10 text-center">
          <div>
            <p className="font-mono-ui text-xs uppercase text-text-muted">Coming next</p>
            <h2 className="mt-2 font-display text-4xl">Subject Explorer</h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">
              Browse all your subjects in one place — filter by board, grade and category.
            </p>
            <Link to="/app/chat" className="mt-6 inline-block">
              <Button variant="outline">← Back to Chat</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
