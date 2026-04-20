import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { canSpendCredits, CHAT_MESSAGE_CREDIT_COST, computeNextBalance } from "@/lib/billing";
import {
  buildGroundingPrompt,
  retrieveKnowledgeChunks,
  type RetrievalResult,
} from "@/lib/ai/retrieval";
import { ensureStarterCreditsForUser, getCreditBalanceForUser } from "@/lib/data/billing";
import { getOpenAIEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deriveSessionTitle } from "@/lib/utils";

const requestSchema = z.object({
  sessionId: z.string().uuid().nullable().optional(),
  language: z.enum(["EN", "RN"]).default("EN"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

function buildSystemPrompt({
  fullName,
  college,
  grade,
  boardScore,
  subjects,
  targetGrade,
  language,
  groundingContext,
}: {
  fullName: string;
  college: string;
  grade: string;
  boardScore: string | null;
  subjects: string[];
  targetGrade: string;
  language: "EN" | "RN";
  groundingContext: string;
}) {
  const languageInstruction =
    language === "RN"
      ? "Respond in clear Roman Nepali. Keep the explanation natural and student-friendly."
      : "Respond in clear English. Keep the explanation student-friendly and structured.";

  return `
You are Nano Syllabus, an AI study companion for Nepali students.

Student context:
- Name: ${fullName || "Student"}
- Institution: ${college || "Unknown"}
- Grade / Year: ${grade || "Unknown"}
- Previous score: ${boardScore || "Unknown"}
- Subjects: ${subjects.join(", ") || "Unknown"}
- Target grade: ${targetGrade || "Unknown"}

Guidelines:
- Adjust difficulty to the student's level.
- Be accurate, structured, and concise.
- Prefer exam-helpful explanations over generic theory dumps.
- If needed, break answers into steps.
- ${languageInstruction}
- If syllabus grounding is provided, prioritize it and do not invent citations.

Grounding context:
${groundingContext || "No syllabus context was retrieved for this question."}
`.trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = requestSchema.parse(await request.json());
    const latestUserMessage = [...parsed.messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage?.content.trim()) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    const { data: profileRow } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profileRow) {
      return NextResponse.json({ error: "Onboarding required." }, { status: 400 });
    }

    const currentBalance = await ensureStarterCreditsForUser(user.id);
    if (!canSpendCredits(currentBalance)) {
      return NextResponse.json(
        { error: "No credits left. Buy a plan to continue chatting." },
        { status: 402 },
      );
    }

    const profile = {
      userId: profileRow.user_id,
      fullName: profileRow.full_name ?? "",
      college: profileRow.college ?? "",
      grade: profileRow.grade ?? "",
      boardScore: profileRow.board_score ?? null,
      subjects: profileRow.subjects ?? [],
      targetGrade: profileRow.target_grade ?? "",
      languagePref: profileRow.language_pref ?? "EN",
      role: profileRow.role ?? "student",
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
    } as const;

    let sessionId = parsed.sessionId ?? null;

    if (sessionId) {
      const { data: sessionRow } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sessionRow) {
        return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
      }
    } else {
      const { data: insertedSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: deriveSessionTitle(latestUserMessage.content),
        })
        .select("id")
        .single();

      if (sessionError || !insertedSession) {
        return NextResponse.json({ error: "Failed to create chat session." }, { status: 500 });
      }

      sessionId = insertedSession.id;
    }

    const finalSessionId = sessionId as string;

    const { error: userMessageError } = await supabase.from("chat_messages").insert({
      session_id: finalSessionId,
      role: "user",
      content: latestUserMessage.content,
      language: parsed.language,
    });

    if (userMessageError) {
      return NextResponse.json({ error: "Failed to save the user message." }, { status: 500 });
    }

    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", finalSessionId);

    let retrieval: RetrievalResult = {
      chunks: [],
      citations: [],
      grounded: false,
    };

    try {
      retrieval = await retrieveKnowledgeChunks(latestUserMessage.content, profile);
    } catch {
      retrieval = {
        chunks: [],
        citations: [],
        grounded: false,
      };
    }

    const { apiKey, model } = getOpenAIEnv();
    const openai = createOpenAI({ apiKey });

    const result = streamText({
      model: openai(model),
      messages: parsed.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      system: buildSystemPrompt({
        fullName: profile.fullName,
        college: profile.college,
        grade: profile.grade,
        boardScore: profile.boardScore,
        subjects: profile.subjects,
        targetGrade: profile.targetGrade,
        language: parsed.language,
        groundingContext: buildGroundingPrompt(retrieval.chunks),
      }),
      onFinish: async ({ text }) => {
        const { data: assistantMessage, error: assistantError } = await supabase
          .from("chat_messages")
          .insert({
            session_id: finalSessionId,
            role: "assistant",
            content: text,
            language: parsed.language,
            grounded: retrieval.grounded,
            citations: retrieval.citations,
          })
          .select("id")
          .single();

        if (assistantError || !assistantMessage) {
          return;
        }

        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", finalSessionId);

        const latestBalance = await getCreditBalanceForUser(user.id);
        const nextBalance = computeNextBalance(latestBalance, -CHAT_MESSAGE_CREDIT_COST);

        const { error: chargeError } = await supabase.from("credits_ledger").insert({
          user_id: user.id,
          type: "usage",
          amount: -CHAT_MESSAGE_CREDIT_COST,
          balance_after: Math.max(nextBalance, 0),
          reference_type: "chat_message",
          reference_id: assistantMessage.id,
          description: "Credit used for successful assistant response",
        });

        if (chargeError && chargeError.code !== "23505") {
          console.error("Failed to record credit usage", chargeError);
        }
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "x-session-id": finalSessionId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error while processing chat.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
