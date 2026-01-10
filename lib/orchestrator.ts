import { readFileSync } from "fs";
import path from "path";
import { generateCompletion } from "./anthropic";
import { executeSQL } from "./sql-executor";
import { CoachRequest, CoachResponse, HintRequest, HintResponse } from "./types";

function loadAgentFile(filename: string): string {
  const filePath = path.join(process.cwd(), "agents", "querycoach", filename);
  return readFileSync(filePath, "utf-8");
}

function loadExamples(level: string): string {
  const filePath = path.join(
    process.cwd(),
    "agents",
    "querycoach",
    "examples",
    `${level}.md`
  );
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function buildSystemPrompt(userLevel: string): string {
  const agent = loadAgentFile("AGENT.md");
  const rules = loadAgentFile("RULES.md");
  const skills = loadAgentFile("SKILLS.md");
  const examples = loadExamples(userLevel);

  return `
${agent}

<rules>
${rules}
</rules>

<skills>
${skills}
</skills>

<examples>
${examples}
</examples>
`.trim();
}

function buildUserMessage(
  request: CoachRequest,
  queryResult: { success: boolean; data?: string; error?: string }
): string {
  const resultText = queryResult.success
    ? queryResult.data
    : `ERROR: ${queryResult.error}`;

  let message = `
<schema>
${request.schema}
</schema>

<question>${request.question}</question>

<user_query>
${request.userQuery}
</user_query>

<query_result>
${resultText}
</query_result>

<user_level>${request.userLevel}</user_level>
`;

  if (request.expectedResult) {
    message += `
<expected_result>
${request.expectedResult}
</expected_result>
`;
  }

  message += "\nPlease review this query and provide feedback.";

  return message.trim();
}

export async function getQueryFeedback(
  request: CoachRequest
): Promise<CoachResponse> {
  const startTime = Date.now();

  // Execute the user's query
  const queryResult = await executeSQL(request.userQuery, request.schema);

  // Build prompts
  const systemPrompt = buildSystemPrompt(request.userLevel);
  const userMessage = buildUserMessage(request, queryResult);

  // Get feedback from Claude
  const feedback = await generateCompletion(systemPrompt, userMessage);

  return {
    feedback,
    queryResult,
    executionTimeMs: Date.now() - startTime,
  };
}

function loadHintAgentFile(): string {
  const filePath = path.join(process.cwd(), "agents", "hintgenerator", "AGENT.md");
  return readFileSync(filePath, "utf-8");
}

function buildHintUserMessage(request: HintRequest): string {
  return `
<schema>
${request.schema}
</schema>

<question>${request.question}</question>

<user_level>${request.userLevel}</user_level>

Generate a hint SQL query for this question.
`.trim();
}

export async function generateHintQuery(
  request: HintRequest
): Promise<HintResponse> {
  const systemPrompt = loadHintAgentFile();
  const userMessage = buildHintUserMessage(request);

  // Get hint from Claude
  const hintQuery = await generateCompletion(systemPrompt, userMessage, 500);

  // Clean up the response - remove markdown code blocks if present
  const cleanedHint = hintQuery
    .replace(/^```sql\n?/i, "")
    .replace(/^```\n?/, "")
    .replace(/\n?```$/g, "")
    .trim();

  return {
    hintQuery: cleanedHint,
  };
}
