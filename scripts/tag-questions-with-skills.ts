#!/usr/bin/env npx tsx

/**
 * Skill Tagging Script
 *
 * Tags existing cached questions with skill IDs based on the SQL concepts they test.
 * Uses Claude Haiku for cost-effective batch tagging.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { CachedQuestion } from "../lib/types";
import { SKILL_TREE } from "../lib/skills/skill-definitions";

const DATA_FILE = path.join(process.cwd(), "data", "questions.json");
const BATCH_SIZE = 10; // Process questions in batches for efficiency

// Build skill reference for the prompt
const SKILL_REFERENCE = SKILL_TREE.map(
  (skill) => `- ${skill.id}: ${skill.name} - ${skill.description}`
).join("\n");

const SYSTEM_PROMPT = `You are an expert SQL educator who categorizes SQL practice questions by the skills they test.

Given a SQL question, identify which SQL skills from the skill tree are being tested. Each question typically tests 1-3 skills.

## Available Skills

${SKILL_REFERENCE}

## Guidelines

1. **Primary skill first**: List the main skill being tested first
2. **1-3 skills max**: Most questions test 1-2 skills; complex questions may test 3
3. **Be specific**: Choose the most specific applicable skill
4. **Consider the hint**: The hint SQL can help identify what skills are needed

## Skill Selection Rules

- Simple SELECT with WHERE → select_basics + where_filtering
- Queries with ORDER BY or LIMIT → include order_limit
- COUNT/SUM/AVG without GROUP BY → aggregations
- GROUP BY usage → groupby_having (even without HAVING)
- Single JOIN → basic_joins
- Multiple JOINs (3+ tables) → multi_joins
- Subquery in WHERE or SELECT → subqueries_scalar
- Subquery in FROM → subqueries_table
- CASE WHEN → case_statements
- Date filtering or functions → date_time
- NULL checks (IS NULL, COALESCE) → null_handling
- Window functions (ROW_NUMBER, etc.) → window_basics
- LAG/LEAD → window_analytics
- Self-join → self_joins
- WITH clause → ctes

## Response Format

Respond with ONLY a JSON array of skill IDs, nothing else.
Example: ["where_filtering", "basic_joins"]`;

function buildUserMessage(
  questions: { question: string; hint: string; id: string }[]
): string {
  const questionList = questions
    .map(
      (q, i) =>
        `Question ${i + 1} (ID: ${q.id}):
Question: ${q.question}
Hint SQL: ${q.hint}`
    )
    .join("\n\n---\n\n");

  return `Tag the following ${questions.length} SQL questions with their skill IDs.

${questionList}

Respond with a JSON object where keys are question IDs and values are arrays of skill IDs:
{
  "q_123": ["skill1", "skill2"],
  "q_456": ["skill1"]
}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadQuestions(): CachedQuestion[] {
  if (!existsSync(DATA_FILE)) {
    console.error("Questions file not found:", DATA_FILE);
    process.exit(1);
  }
  const content = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

function saveQuestions(questions: CachedQuestion[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2) + "\n");
}

async function tagBatch(
  client: Anthropic,
  questions: CachedQuestion[]
): Promise<Record<string, string[]>> {
  const questionsForTagging = questions.map((q) => ({
    id: q.id,
    question: q.question,
    hint: q.hint,
  }));

  const response = await client.messages.create({
    model: "claude-haiku-4-20250414",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(questionsForTagging) }],
  });

  if (response.content[0].type !== "text") {
    throw new Error("Unexpected response format");
  }

  const responseText = response.content[0].text.trim();

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = responseText;
  if (responseText.includes("```")) {
    const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonStr = match[1].trim();
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse response:", responseText);
    throw new Error("Invalid JSON response from Claude");
  }
}

// Validate skill IDs
const validSkillIds = new Set(SKILL_TREE.map((s) => s.id));

function validateSkillIds(skills: string[]): string[] {
  return skills.filter((id) => {
    if (!validSkillIds.has(id)) {
      console.warn(`  Warning: Invalid skill ID "${id}" removed`);
      return false;
    }
    return true;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const forceRetag = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  console.log("=== SQL Question Skill Tagger ===\n");

  if (dryRun) {
    console.log("DRY RUN MODE - No changes will be saved\n");
  }

  // Load questions
  const questions = loadQuestions();
  console.log(`Loaded ${questions.length} questions from cache\n`);

  // Filter questions that need tagging
  const questionsToTag = forceRetag
    ? questions
    : questions.filter((q) => !q.skillIds || q.skillIds.length === 0);

  if (questionsToTag.length === 0) {
    console.log("All questions are already tagged!");
    console.log("Use --force to retag all questions");
    return;
  }

  console.log(`Questions to tag: ${questionsToTag.length}`);
  if (!forceRetag) {
    console.log(
      `(${questions.length - questionsToTag.length} already tagged, use --force to retag)`
    );
  }
  console.log();

  // Create mapping from ID to question for updating
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Initialize Anthropic client
  const client = new Anthropic();

  // Process in batches
  const totalBatches = Math.ceil(questionsToTag.length / BATCH_SIZE);
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < questionsToTag.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = questionsToTag.slice(i, i + BATCH_SIZE);

    console.log(
      `Processing batch ${batchNum}/${totalBatches} (${batch.length} questions)...`
    );

    try {
      const tags = await tagBatch(client, batch);

      // Apply tags to questions
      for (const q of batch) {
        const skillIds = tags[q.id];
        if (skillIds && Array.isArray(skillIds)) {
          const validatedSkills = validateSkillIds(skillIds);
          const question = questionMap.get(q.id);
          if (question) {
            question.skillIds = validatedSkills;
            console.log(
              `  ${q.id}: [${validatedSkills.join(", ")}] - "${q.question.substring(0, 50)}..."`
            );
          }
        } else {
          console.warn(`  ${q.id}: No tags returned`);
          errors++;
        }
      }

      processed += batch.length;

      // Save after each batch (unless dry run)
      if (!dryRun) {
        saveQuestions(questions);
      }

      // Rate limiting delay between batches
      if (i + BATCH_SIZE < questionsToTag.length) {
        await sleep(500);
      }
    } catch (error) {
      console.error(`  Batch ${batchNum} failed:`, error);
      errors += batch.length;

      // Continue with next batch after error
      await sleep(1000);
    }
  }

  console.log("\n=== Tagging Complete ===");
  console.log(`Successfully tagged: ${processed - errors}`);
  console.log(`Errors: ${errors}`);

  if (dryRun) {
    console.log("\nDRY RUN - No changes were saved");
  } else {
    // Final stats
    const taggedCount = questions.filter(
      (q) => q.skillIds && q.skillIds.length > 0
    ).length;
    console.log(`\nTotal tagged questions: ${taggedCount}/${questions.length}`);

    // Skill distribution
    const skillCounts: Record<string, number> = {};
    for (const q of questions) {
      if (q.skillIds) {
        for (const skillId of q.skillIds) {
          skillCounts[skillId] = (skillCounts[skillId] || 0) + 1;
        }
      }
    }

    console.log("\nSkill distribution:");
    const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
    for (const [skillId, count] of sortedSkills) {
      const skill = SKILL_TREE.find((s) => s.id === skillId);
      console.log(`  ${skillId}: ${count} questions (${skill?.name})`);
    }
  }
}

main().catch(console.error);
