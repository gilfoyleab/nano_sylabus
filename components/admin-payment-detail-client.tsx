"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminPaymentSubmissionDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function AdminPaymentDetailClient({
  submission,
}: {
  submission: AdminPaymentSubmissionDetail;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function runAction(action: "approve" | "reject") {
    setLoadingAction(action);
    setError("");

    const response = await fetch(`/api/admin/payments/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setLoadingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || `Failed to ${action} payment.`);
      return;
    }

    router.refresh();
  }

  const isFinalized = submission.status !== "submitted";

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-bg-primary p-6">
          <p className="text-[11px] font-mono-ui uppercase text-text-muted">Payment proof</p>
          <div className="mt-5 space-y-4">
            <DetailRow label="Student" value={submission.studentName} />
            <DetailRow label="Reference" value={submission.reference} />
            <DetailRow label="Payer name" value={submission.payerName || "Not provided"} />
            <DetailRow label="Screenshot URL" value={submission.screenshotUrl || "Not provided"} />
            <DetailRow label="Note" value={submission.note || "No note"} />
            <DetailRow label="Submitted" value={formatDate(submission.submittedAt)} />
            {submission.reviewedAt ? (
              <DetailRow label="Reviewed" value={formatDate(submission.reviewedAt)} />
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-bg-secondary p-6">
          <p className="text-[11px] font-mono-ui uppercase text-text-muted">Invoice summary</p>
          <div className="mt-5 space-y-4">
            <DetailRow label="Plan" value={submission.planName} />
            <DetailRow label="Credits" value={`${submission.planCredits}`} />
            <DetailRow label="Amount" value={`${submission.currency} ${submission.amount}`} />
            <DetailRow label="Invoice status" value={submission.invoiceStatus} />
            <DetailRow label="Submission status" value={submission.status} />
          </div>

          {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => void runAction("approve")}
              disabled={isFinalized || loadingAction !== null}
            >
              {loadingAction === "approve" ? "Approving..." : "Approve and grant credits"}
            </Button>
            <Button
              variant="danger"
              onClick={() => void runAction("reject")}
              disabled={isFinalized || loadingAction !== null}
            >
              {loadingAction === "reject" ? "Rejecting..." : "Reject payment"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
      <p className="text-[10px] font-mono-ui uppercase text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-text-primary break-all">{value}</p>
    </div>
  );
}
