#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { generateFingerprint } from "../lib/fingerprint-generator";
import { CachedQuestion } from "../lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "questions.json");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadQuestions(): CachedQuestion[] {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  const content = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

function saveQuestions(questions: CachedQuestion[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2) + "\n");
}

async function main() {
  console.log("Backfilling fingerprints for existing questions...\n");

  const questions = loadQuestions();
  const questionsWithoutFingerprint = questions.filter((q) => !q.fingerprint);

  console.log(`Total questions: ${questions.length}`);
  console.log(`Questions needing fingerprints: ${questionsWithoutFingerprint.length}\n`);

  if (questionsWithoutFingerprint.length === 0) {
    console.log("All questions already have fingerprints. Nothing to do.");
    return;
  }

  let processed = 0;
  const total = questionsWithoutFingerprint.length;

  for (const question of questions) {
    if (question.fingerprint) {
      continue;
    }

    processed++;
    const progress = `[${processed}/${total}]`;

    try {
      console.log(`${progress} Generating fingerprint for: "${question.question.substring(0, 50)}..."`);

      const fingerprint = await generateFingerprint(question.question);
      question.fingerprint = fingerprint;

      console.log(`${progress} Fingerprint: ${fingerprint}`);

      // Save after each update in case of interruption
      saveQuestions(questions);

      // Small delay to avoid rate limiting
      await sleep(300);
    } catch (error) {
      console.error(`${progress} Error generating fingerprint:`, error);
      // Continue with next question
    }
  }

  console.log("\n--- Backfill Complete ---");
  console.log(`Processed: ${processed} questions`);

  // Summary
  const withFingerprint = questions.filter((q) => q.fingerprint).length;
  console.log(`Questions with fingerprints: ${withFingerprint}/${questions.length}`);
}

main().catch(console.error);
