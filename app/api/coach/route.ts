import { NextRequest, NextResponse } from "next/server";
import { getQueryFeedback } from "@/lib/orchestrator";
import { UserLevel } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema, question, userQuery, expectedResult, userLevel } = body;

    // Validate required fields
    if (!schema || !question || !userQuery) {
      return NextResponse.json(
        { error: "Missing required fields: schema, question, userQuery" },
        { status: 400 }
      );
    }

    // Validate user level
    const validLevels: UserLevel[] = ["beginner", "intermediate", "advanced"];
    const level: UserLevel = validLevels.includes(userLevel)
      ? userLevel
      : "beginner";

    const response = await getQueryFeedback({
      schema,
      question,
      userQuery,
      expectedResult,
      userLevel: level,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Coach API error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
