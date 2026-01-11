import { readFileSync, existsSync } from "fs";
import path from "path";
import { generateCompletion } from "./anthropic";
import { CachedQuestion, UserLevel } from "./types";

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

const MAX_FINGERPRINTS = 100;

function loadFingerprintsForDifficulty(difficulty: UserLevel): string[] {
  const dataFile = path.join(process.cwd(), "data", "questions.json");

  if (!existsSync(dataFile)) {
    return [];
  }

  try {
    const content = readFileSync(dataFile, "utf-8");
    const questions: CachedQuestion[] = JSON.parse(content);

    // Filter by same difficulty, get fingerprints, take most recent up to MAX
    const fingerprints = questions
      .filter((q) => q.difficulty === difficulty && q.fingerprint)
      .sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )
      .slice(0, MAX_FINGERPRINTS)
      .map((q) => q.fingerprint!);

    return fingerprints;
  } catch {
    return [];
  }
}

function buildFingerprintSection(fingerprints: string[]): string {
  if (fingerprints.length === 0) {
    return "";
  }

  return `
<avoid-duplicates>
Generate a question DIFFERENT from these existing patterns:
${fingerprints.join(", ")}

Vary the entities, operations, and conditions to create a unique question.
</avoid-duplicates>`;
}

function buildSystemPrompt(difficulty: UserLevel): string {
  const agent = loadAgentFile("AGENT.md");
  const rules = loadAgentFile("RULES.md");
  const skills = loadAgentFile("SKILLS.md");
  const examples = loadExamples(difficulty);
  const fingerprints = loadFingerprintsForDifficulty(difficulty);
  const fingerprintSection = buildFingerprintSection(fingerprints);

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
${fingerprintSection}
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
