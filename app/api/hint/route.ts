import { NextRequest, NextResponse } from "next/server";
import { generateHintQuery } from "@/lib/orchestrator";
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
    const { schema, question, userLevel } = body;

    // Validate required fields
    if (!schema || !question) {
      return NextResponse.json(
        { error: "Missing required fields: schema, question" },
        { status: 400 }
      );
    }

    // Validate user level
    const validLevels: UserLevel[] = ["beginner", "intermediate", "advanced"];
    const level: UserLevel = validLevels.includes(userLevel)
      ? userLevel
      : "beginner";

    const response = await generateHintQuery({
      schema,
      question,
      userLevel: level,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Hint API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate hint: ${errorMessage}` },
      { status: 500 }
    );
  }
}
