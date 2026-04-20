import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { NotesLibraryClient } from "@/components/notes-library-client";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth";
import { listRevisionNotes } from "@/lib/data/notes";

export default async function NotesPage() {
  const { user } = await requireOnboardedUser();
  const notes = await listRevisionNotes(user.id);

  return (
    <AppShell
      user={user}
      title={
        <span className="flex items-center gap-3">
          My Notes
          <span className="font-mono-ui text-xs text-text-muted">{notes.length} saved</span>
        </span>
      }
      actions={
        <Link href="/app/notes/revision">
          <Button size="sm">Start revision →</Button>
        </Link>
      }
    >
      <NotesLibraryClient notes={notes} />
    </AppShell>
  );
}
