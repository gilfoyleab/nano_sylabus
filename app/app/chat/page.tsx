import { AppShell } from "@/components/app-shell";
import { ChatPageClient } from "@/components/chat-page-client";
import { requireOnboardedUser } from "@/lib/auth";
import { getChatSessionDetail, listChatSessions } from "@/lib/data/chat";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { user, profile } = await requireOnboardedUser();
  const params = await searchParams;
  const sessionResult = await listChatSessions(user.id, {
    limit: 12,
    offset: 0,
  });
  const activeSession = params.session
    ? await getChatSessionDetail(params.session, user.id)
    : null;

  return (
    <AppShell user={user} title="Chat">
      <ChatPageClient
        user={user}
        defaultLanguage={profile!.languagePref}
        initialSessions={sessionResult.sessions}
        initialHasMore={sessionResult.hasMore}
        initialSession={activeSession}
      />
    </AppShell>
  );
}
