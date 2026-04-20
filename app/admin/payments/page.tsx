import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { requireAdminUser } from "@/lib/auth";
import { listAdminPaymentSubmissions } from "@/lib/data/billing";
import { formatDate } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  await requireAdminUser();
  const submissions = await listAdminPaymentSubmissions();
  const pending = submissions.filter((submission) => submission.status === "submitted");

  return (
    <AdminShell
      title="Payment Review"
      subtitle="Approve or reject student payment proofs before credits are granted."
    >
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Pending review" value={pending.length} />
          <SummaryCard
            label="Approved"
            value={submissions.filter((submission) => submission.status === "approved").length}
          />
          <SummaryCard
            label="Rejected"
            value={submissions.filter((submission) => submission.status === "rejected").length}
          />
        </div>

        {submissions.length ? (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/admin/payments/${submission.id}`}
                className="block rounded-2xl border border-border bg-bg-primary p-5 transition hover:border-border-strong hover:bg-bg-secondary"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{submission.studentName}</p>
                      <Badge variant={submission.status === "submitted" ? "warning" : submission.status === "approved" ? "success" : "danger"}>
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                      {submission.planName} · {submission.planCredits} credits · {submission.currency} {submission.amount}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Reference: {submission.reference} · Submitted {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="text-sm text-text-secondary">Open →</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-text-secondary">
            No payment submissions yet.
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-primary p-5">
      <p className="text-[11px] font-mono-ui uppercase text-text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}
