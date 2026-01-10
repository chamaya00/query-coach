import { NextRequest, NextResponse } from "next/server";
import { generateQuestion } from "@/lib/question-generator";
import { UserLevel, CachedQuestion } from "@/lib/types";
import questionsCache from "@/data/questions.json";

const cachedQuestions = questionsCache as CachedQuestion[];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema, difficulty } = body;

    // Validate required fields
    if (!schema) {
      return NextResponse.json(
        { error: "Missing required field: schema" },
        { status: 400 }
      );
    }

    // Validate difficulty level
    const validLevels: UserLevel[] = ["beginner", "intermediate", "advanced"];
    const level: UserLevel = validLevels.includes(difficulty)
      ? difficulty
      : "beginner";

    // Try to get question from cache first
    const candidates = cachedQuestions.filter((q) => q.difficulty === level);

    if (candidates.length > 0) {
      // Return random cached question
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      return NextResponse.json({
        question: selected.question,
        questionId: selected.id,
        difficulty: selected.difficulty,
        fromCache: true,
      });
    }

    // Fallback to on-demand generation if cache is empty
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "No cached questions available and API key not configured" },
        { status: 500 }
      );
    }

    const response = await generateQuestion({
      schema,
      difficulty: level,
    });

    return NextResponse.json({
      ...response,
      questionId: null,
      fromCache: false,
    });
  } catch (error) {
    console.error("Question generation API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate question: ${errorMessage}` },
      { status: 500 }
    );
  }
}
