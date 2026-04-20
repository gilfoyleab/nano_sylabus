import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { POST } from "@/app/api/notes/revision-log/route";

describe("POST /api/notes/revision-log", () => {
  beforeEach(() => {
    const noteChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({ data: { id: "note-1" } })),
    };
    noteChain.select.mockReturnValue(noteChain);
    noteChain.eq.mockReturnValue(noteChain);

    const insert = vi.fn(async () => ({ error: null }));

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
        })),
      },
      from: vi.fn((table: string) => {
        if (table === "revision_notes") return noteChain;
        if (table === "note_revision_logs") return { insert };
        throw new Error(`Unexpected table access: ${table}`);
      }),
    });
  });

  it("records a revision action for an owned note", async () => {
    const response = await POST(
      new Request("http://localhost/api/notes/revision-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: "33333333-3333-3333-3333-333333333333",
          action: "remember",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
