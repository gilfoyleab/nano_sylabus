import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPaymentDetailClient } from "@/components/admin-payment-detail-client";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminUser } from "@/lib/auth";
import { getAdminPaymentSubmissionDetail } from "@/lib/data/billing";

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  await requireAdminUser();
  const { submissionId } = await params;
  const submission = await getAdminPaymentSubmissionDetail(submissionId);

  if (!submission) {
    notFound();
  }

  return (
    <AdminShell
      title={
        <Link href="/admin/payments" className="text-text-secondary hover:text-text-primary">
          ← Payment Review
        </Link>
      }
      subtitle="Review the submitted proof and decide whether credits should be granted."
    >
      <AdminPaymentDetailClient submission={submission} />
    </AdminShell>
  );
}
