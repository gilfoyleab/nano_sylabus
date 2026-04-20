import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paymentSubmissionSchema = z.object({
  invoiceId: z.string().uuid(),
  reference: z.string().min(3).max(120),
  payerName: z.string().max(120).optional().nullable(),
  screenshotUrl: z.string().url().max(500).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = paymentSubmissionSchema.parse(await request.json());

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("id", payload.invoiceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "This invoice is already paid." }, { status: 400 });
    }

    if (invoice.status === "rejected" || invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "This invoice is closed. Create a new invoice to retry payment." },
        { status: 400 },
      );
    }

    const { data: existingSubmission } = await supabase
      .from("payment_submissions")
      .select("id, status")
      .eq("invoice_id", payload.invoiceId)
      .maybeSingle();

    if (existingSubmission && existingSubmission.status !== "submitted") {
      return NextResponse.json(
        { error: "This payment submission is already finalized." },
        { status: 400 },
      );
    }

    const proofMeta = {
      payerName: payload.payerName || undefined,
      screenshotUrl: payload.screenshotUrl || undefined,
      note: payload.note || undefined,
    };

    const query = supabase.from("payment_submissions");
    const submissionResult = existingSubmission
      ? await query
          .update({
            reference: payload.reference,
            proof_meta: proofMeta,
            status: "submitted",
          })
          .eq("id", existingSubmission.id)
      : await query.insert({
          invoice_id: payload.invoiceId,
          user_id: user.id,
          reference: payload.reference,
          proof_meta: proofMeta,
          status: "submitted",
        });

    if (submissionResult.error) {
      return NextResponse.json({ error: submissionResult.error.message }, { status: 500 });
    }

    const { error: invoiceUpdateError } = await supabase
      .from("invoices")
      .update({ status: "payment_submitted" })
      .eq("id", payload.invoiceId)
      .eq("user_id", user.id);

    if (invoiceUpdateError) {
      return NextResponse.json({ error: invoiceUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit payment." },
      { status: 500 },
    );
  }
}
