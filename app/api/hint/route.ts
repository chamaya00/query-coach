import { NextRequest, NextResponse } from "next/server";
import { generateHintQuery } from "@/lib/orchestrator";
import { UserLevel, CachedQuestion } from "@/lib/types";
import questionsCache from "@/data/questions.json";

const cachedQuestions = questionsCache as CachedQuestion[];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema, question, userLevel, questionId } = body;

    // Validate user level
    const validLevels: UserLevel[] = ["beginner", "intermediate", "advanced"];
    const level: UserLevel = validLevels.includes(userLevel)
      ? userLevel
      : "beginner";

    // Try to get hint from cache if questionId is provided
    if (questionId) {
      const cached = cachedQuestions.find((q) => q.id === questionId);
      if (cached && cached.hints[level]) {
        return NextResponse.json({
          hintQuery: cached.hints[level],
          fromCache: true,
        });
      }
    }

    // Fallback to on-demand generation
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "No cached hint available and API key not configured" },
        { status: 500 }
      );
    }

    // Validate required fields for on-demand generation
    if (!schema || !question) {
      return NextResponse.json(
        { error: "Missing required fields: schema, question" },
        { status: 400 }
      );
    }

    const response = await generateHintQuery({
      schema,
      question,
      userLevel: level,
    });

    return NextResponse.json({
      ...response,
      fromCache: false,
    });
  } catch (error) {
    console.error("Hint API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate hint: ${errorMessage}` },
      { status: 500 }
    );
  }
}
