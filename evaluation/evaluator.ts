import { TestCase, EvalScore } from "@/lib/types";
import { generateCompletion } from "@/lib/anthropic";

export function evaluateBasicMetrics(
  testCase: TestCase,
  response: string
): Partial<EvalScore> {
  const lowerResponse = response.toLowerCase();

  // Check required mentions
  const mentionsRequired =
    testCase.mustMention.length === 0
      ? 1
      : testCase.mustMention.filter((kw) =>
          lowerResponse.includes(kw.toLowerCase())
        ).length / testCase.mustMention.length;

  // Check avoided terms
  const avoidsProblems = testCase.mustNotMention.every(
    (kw) => !lowerResponse.includes(kw.toLowerCase())
  )
    ? 1
    : 0;

  // Check structure
  const sections = [
    "assessment",
    "what's working",
    "level up",
  ];
  const hasStructure =
    sections.filter((s) => lowerResponse.includes(s)).length / sections.length;

  return { mentionsRequired, avoidsProblems, hasStructure };
}

export async function evaluateWithLLM(
  testCase: TestCase,
  response: string
): Promise<Partial<EvalScore>> {
  const judgePrompt = `You are evaluating SQL tutoring feedback quality.

The student (${testCase.userLevel} level) wrote this query:
${testCase.userQuery}

They were trying to answer: ${testCase.question}

The known issues are: ${testCase.knownIssues.join(", ") || "None - query is correct"}

The tutor responded:
---
${response}
---

Rate each dimension 1-5 (1=poor, 5=excellent):

1. Accuracy: Does it correctly identify all issues (or correctly identify no issues if query is correct)?
2. Clarity: Is the explanation easy to understand?
3. Level Match: Is the response appropriate for a ${testCase.userLevel}?
4. Encouragement: Does it acknowledge what's done right?
5. Actionability: Would the student know how to fix/improve their query?

Respond ONLY with JSON, no other text:
{"accuracy": N, "clarity": N, "levelMatch": N, "encouragement": N, "actionability": N}`;

  try {
    const result = await generateCompletion(
      "You are an evaluation assistant. Respond only with valid JSON.",
      judgePrompt,
      200
    );

    // Parse JSON (handle potential markdown wrapping)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("LLM evaluation failed:", error);
  }

  return {};
}

export async function fullEvaluation(
  testCase: TestCase,
  response: string
): Promise<EvalScore> {
  const basicMetrics = evaluateBasicMetrics(testCase, response);
  const llmMetrics = await evaluateWithLLM(testCase, response);

  return {
    mentionsRequired: basicMetrics.mentionsRequired ?? 0,
    avoidsProblems: basicMetrics.avoidsProblems ?? 0,
    hasStructure: basicMetrics.hasStructure ?? 0,
    accuracy: llmMetrics.accuracy,
    clarity: llmMetrics.clarity,
    levelMatch: llmMetrics.levelMatch,
    encouragement: llmMetrics.encouragement,
    actionability: llmMetrics.actionability,
  };
}
