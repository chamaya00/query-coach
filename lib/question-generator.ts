import { readFileSync } from "fs";
import path from "path";
import { generateCompletion } from "./anthropic";
import { UserLevel } from "./types";

function loadAgentFile(filename: string): string {
  const filePath = path.join(process.cwd(), "agents", "questiongen", filename);
  return readFileSync(filePath, "utf-8");
}

function loadExamples(level: string): string {
  const filePath = path.join(
    process.cwd(),
    "agents",
    "questiongen",
    "examples",
    `${level}.md`
  );
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function buildSystemPrompt(difficulty: UserLevel): string {
  const agent = loadAgentFile("AGENT.md");
  const rules = loadAgentFile("RULES.md");
  const skills = loadAgentFile("SKILLS.md");
  const examples = loadExamples(difficulty);

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

function buildUserMessage(schema: string, difficulty: UserLevel): string {
  return `
<schema>
${schema}
</schema>

<difficulty>${difficulty}</difficulty>

Generate a single SQL practice question appropriate for this difficulty level.
`.trim();
}

export interface QuestionGenRequest {
  schema: string;
  difficulty: UserLevel;
}

export interface QuestionGenResponse {
  question: string;
  difficulty: UserLevel;
}

export async function generateQuestion(
  request: QuestionGenRequest
): Promise<QuestionGenResponse> {
  const systemPrompt = buildSystemPrompt(request.difficulty);
  const userMessage = buildUserMessage(request.schema, request.difficulty);

  const question = await generateCompletion(systemPrompt, userMessage, 200);

  return {
    question: question.trim(),
    difficulty: request.difficulty,
  };
}
