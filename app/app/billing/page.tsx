import { AppShell } from "@/components/app-shell";
import { BillingPageClient } from "@/components/billing-page-client";
import { requireOnboardedUser } from "@/lib/auth";
import { getStudentBillingOverview } from "@/lib/data/billing";

export default async function BillingPage() {
  const { user } = await requireOnboardedUser();
  const overview = await getStudentBillingOverview(user.id);

  return (
    <AppShell user={user} title="Billing">
      <BillingPageClient overview={overview} />
    </AppShell>
  );
}
