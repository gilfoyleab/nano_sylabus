import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const invoiceSchema = z.object({
  planId: z.string().uuid(),
  paymentMethod: z.enum(["esewa", "khalti", "bank_transfer"]),
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

    const payload = invoiceSchema.parse(await request.json());

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", payload.planId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        plan_id: payload.planId,
        status: "pending_payment",
        amount: plan.price,
        currency: plan.currency,
        payment_method: payload.paymentMethod,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: invoiceError?.message || "Failed to create invoice." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: invoice.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice." },
      { status: 500 },
    );
  }
}
