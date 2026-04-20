import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RevisionModeClient } from "@/components/revision-mode-client";
import { requireOnboardedUser } from "@/lib/auth";
import { listRevisionNotes } from "@/lib/data/notes";

export default async function RevisionPage() {
  const { user } = await requireOnboardedUser();
  const notes = await listRevisionNotes(user.id);

  return (
    <AppShell
      user={user}
      title={
        <Link href="/app/notes" className="text-text-secondary hover:text-text-primary">
          ← My Notes
        </Link>
      }
    >
      <RevisionModeClient notes={notes} />
    </AppShell>
  );
}
