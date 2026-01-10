import { testSuite } from "./test-suite";
import { fullEvaluation } from "./evaluator";
import { getQueryFeedback } from "@/lib/orchestrator";
import { generateCompletion } from "@/lib/anthropic";

async function runSimpleBaseline(testCase: any): Promise<string> {
  const simplePrompt = `You are a SQL tutor. Review this query and provide feedback.

Schema:
${testCase.schema}

Question: ${testCase.question}

User's query:
${testCase.userQuery}

Provide helpful feedback.`;

  return generateCompletion("You are a helpful SQL tutor.", simplePrompt);
}

async function main() {
  console.log("Running QueryCoach Evaluation\n");
  console.log("=".repeat(60));

  const results = [];

  for (const testCase of testSuite) {
    console.log(`\nTest: ${testCase.name} (${testCase.id})`);
    console.log("-".repeat(40));

    // Run QueryCoach agent
    console.log("Running QueryCoach agent...");
    const coachResponse = await getQueryFeedback({
      schema: testCase.schema,
      question: testCase.question,
      userQuery: testCase.userQuery,
      expectedResult: testCase.expectedResult,
      userLevel: testCase.userLevel,
    });

    // Run simple baseline
    console.log("Running simple baseline...");
    const simpleResponse = await runSimpleBaseline(testCase);

    // Evaluate both
    console.log("Evaluating responses...");
    const coachScore = await fullEvaluation(testCase, coachResponse.feedback);
    const simpleScore = await fullEvaluation(testCase, simpleResponse);

    results.push({
      testId: testCase.id,
      testName: testCase.name,
      coach: coachScore,
      simple: simpleScore,
    });

    // Print comparison
    console.log("\n  QueryCoach Agent:");
    console.log(`    Structure: ${(coachScore.hasStructure * 100).toFixed(0)}%`);
    console.log(`    Required mentions: ${(coachScore.mentionsRequired * 100).toFixed(0)}%`);
    console.log(`    Accuracy: ${coachScore.accuracy}/5`);
    console.log(`    Clarity: ${coachScore.clarity}/5`);

    console.log("\n  Simple Baseline:");
    console.log(`    Structure: ${(simpleScore.hasStructure * 100).toFixed(0)}%`);
    console.log(`    Required mentions: ${(simpleScore.mentionsRequired * 100).toFixed(0)}%`);
    console.log(`    Accuracy: ${simpleScore.accuracy}/5`);
    console.log(`    Clarity: ${simpleScore.clarity}/5`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY\n");

  const avgCoach = {
    accuracy: avg(results.map((r) => r.coach.accuracy ?? 0)),
    clarity: avg(results.map((r) => r.coach.clarity ?? 0)),
    structure: avg(results.map((r) => r.coach.hasStructure)),
    mentions: avg(results.map((r) => r.coach.mentionsRequired)),
  };

  const avgSimple = {
    accuracy: avg(results.map((r) => r.simple.accuracy ?? 0)),
    clarity: avg(results.map((r) => r.simple.clarity ?? 0)),
    structure: avg(results.map((r) => r.simple.hasStructure)),
    mentions: avg(results.map((r) => r.simple.mentionsRequired)),
  };

  console.log("QueryCoach Agent (avg):");
  console.log(`  Accuracy: ${avgCoach.accuracy.toFixed(2)}/5`);
  console.log(`  Clarity: ${avgCoach.clarity.toFixed(2)}/5`);
  console.log(`  Structure: ${(avgCoach.structure * 100).toFixed(0)}%`);
  console.log(`  Required mentions: ${(avgCoach.mentions * 100).toFixed(0)}%`);

  console.log("\nSimple Baseline (avg):");
  console.log(`  Accuracy: ${avgSimple.accuracy.toFixed(2)}/5`);
  console.log(`  Clarity: ${avgSimple.clarity.toFixed(2)}/5`);
  console.log(`  Structure: ${(avgSimple.structure * 100).toFixed(0)}%`);
  console.log(`  Required mentions: ${(avgSimple.mentions * 100).toFixed(0)}%`);

  console.log("\nEvaluation complete!");
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

main().catch(console.error);
