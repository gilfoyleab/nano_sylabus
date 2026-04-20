import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, ensureStarterCreditsForUser, getCreditBalanceForUser } =
  vi.hoisted(() => ({
    createSupabaseServerClient: vi.fn(),
    ensureStarterCreditsForUser: vi.fn(),
    getCreditBalanceForUser: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/data/billing", () => ({
  ensureStarterCreditsForUser,
  getCreditBalanceForUser,
}));

import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    const profileChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({
        data: {
          user_id: "user-1",
          full_name: "Student",
          college: "Campus",
          grade: "11",
          board_score: null,
          subjects: ["Physics"],
          target_grade: "A",
          language_pref: "EN",
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
      })),
    };
    profileChain.select.mockReturnValue(profileChain);
    profileChain.eq.mockReturnValue(profileChain);

    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: {
              id: "user-1",
              email: "student@example.com",
            },
          },
        })),
      },
      from: vi.fn((table: string) => {
        if (table === "student_profiles") return profileChain;
        throw new Error(`Unexpected table access: ${table}`);
      }),
    });

    ensureStarterCreditsForUser.mockResolvedValue(0);
    getCreditBalanceForUser.mockResolvedValue(0);
  });

  it("blocks chat when the user has no credits left", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: null,
          language: "EN",
          messages: [{ role: "user", content: "Explain photosynthesis" }],
        }),
      }),
    );

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: "No credits left. Buy a plan to continue chatting.",
    });
  });
});
