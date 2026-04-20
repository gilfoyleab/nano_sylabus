import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteChatSession, renameChatSession } from "@/lib/data/chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const renameSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = renameSchema.parse(await request.json());
    const session = await renameChatSession(sessionId, user.id, payload.title);

    if (!session) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rename chat session." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteChatSession(sessionId, user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete chat session." },
      { status: 500 },
    );
  }
}
