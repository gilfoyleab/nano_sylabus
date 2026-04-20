import { NextResponse } from "next/server";
import { listSubscriptionPlans } from "@/lib/data/billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await listSubscriptionPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plans." },
      { status: 500 },
    );
  }
}
