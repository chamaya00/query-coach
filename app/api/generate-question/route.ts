import { NextRequest, NextResponse } from "next/server";
import { generateQuestion } from "@/lib/question-generator";
import { UserLevel } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Check for API key before processing
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error: ANTHROPIC_API_KEY is not set" },
        { status: 500 }
      );
    }

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

    const response = await generateQuestion({
      schema,
      difficulty: level,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Question generation API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate question: ${errorMessage}` },
      { status: 500 }
    );
  }
}
