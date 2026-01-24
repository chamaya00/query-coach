#!/usr/bin/env npx tsx

/**
 * Heuristic-based Skill Tagging Script
 *
 * Tags existing cached questions with skill IDs based on pattern matching.
 * Does not require LLM API calls - uses rule-based analysis of question text and hint SQL.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { CachedQuestion } from "../lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "questions.json");

/**
 * Pattern-based skill detection rules.
 * Each rule has patterns to match in the question text and/or hint SQL.
 */
interface SkillPattern {
  skillId: string;
  questionPatterns: RegExp[];
  hintPatterns: RegExp[];
  excludePatterns?: RegExp[]; // If these match, don't assign this skill
}

const SKILL_PATTERNS: SkillPattern[] = [
  // Foundational Skills
  {
    skillId: "select_basics",
    questionPatterns: [
      /^(find|show|list|get|retrieve|display|select)\s+(all|the|each)?\s*(products?|customers?|orders?|items?)/i,
      /what\s+(are|is)\s+the\s+/i,
    ],
    hintPatterns: [/^SELECT\s+/i],
  },
  {
    skillId: "where_filtering",
    questionPatterns: [
      /\bwhere\b/i,
      /\bwith\s+(a|price|category|status|region|quantity)/i,
      /\bin\s+the\s+\w+\s+(category|region|status)/i,
      /\bless\s+than\b/i,
      /\bgreater\s+than\b/i,
      /\bmore\s+than\b/i,
      /\bbetween\b/i,
      /\bequal\s+to\b/i,
      /\bfrom\s+(the\s+)?(west|east|central)/i,
      /\bstatus\s+(is|=|equals?)\s+/i,
      /\bpriced?\s+(under|over|above|below)/i,
      /\bcategory\s+(is|=|equals?)\s+/i,
    ],
    hintPatterns: [/WHERE\s+\w+/i],
    excludePatterns: [/GROUP BY/i, /HAVING/i],
  },
  {
    skillId: "order_limit",
    questionPatterns: [
      /\b(top|first|last|highest|lowest|most|least)\s+\d*/i,
      /\bsort(ed)?\s+(by|in)/i,
      /\border(ed)?\s+(by|in)/i,
      /\brank(ed|ing)?\b/i,
      /\bascending|descending\b/i,
    ],
    hintPatterns: [/ORDER\s+BY/i, /LIMIT\s+\d+/i],
  },
  {
    skillId: "aggregations",
    questionPatterns: [
      /\b(total|sum|count|average|avg|maximum|minimum|max|min)\b/i,
      /\bhow\s+many\b/i,
      /\bnumber\s+of\b/i,
    ],
    hintPatterns: [
      /\bSUM\s*\(/i,
      /\bCOUNT\s*\(/i,
      /\bAVG\s*\(/i,
      /\bMAX\s*\(/i,
      /\bMIN\s*\(/i,
    ],
    excludePatterns: [/GROUP BY/i],
  },
  {
    skillId: "groupby_having",
    questionPatterns: [
      /\bper\s+(customer|product|category|region|order|month|day)/i,
      /\bfor\s+each\s+(customer|product|category|region|order)/i,
      /\bby\s+(customer|product|category|region)/i,
      /\bgrouped?\s+by\b/i,
      /\bhaving\s+(more|less|at\s+least)/i,
    ],
    hintPatterns: [/GROUP\s+BY/i, /HAVING\s+/i],
  },
  {
    skillId: "basic_joins",
    questionPatterns: [
      /\bwith\s+their\s+(orders?|customers?|products?|items?)/i,
      /\band\s+their\s+(orders?|customers?|products?)/i,
      /\bincluding\s+(customer|product|order)/i,
      /\bjoin(ed|ing)?\b/i,
      /customer.+order|order.+customer/i,
      /product.+order|order.+product/i,
    ],
    hintPatterns: [/\bJOIN\s+\w+\s+ON/i, /\bLEFT\s+JOIN/i, /\bINNER\s+JOIN/i],
    excludePatterns: [/JOIN\s+\w+\s+\w+\s+ON[\s\S]*JOIN/i], // Multiple joins
  },

  // Intermediate Skills
  {
    skillId: "multi_joins",
    questionPatterns: [
      /customers?.+orders?.+products?/i,
      /products?.+order_items?.+orders?/i,
      /\ball\s+three\b/i,
      /multiple\s+tables/i,
    ],
    hintPatterns: [/JOIN\s+\w+\s+\w+\s+ON[\s\S]*JOIN/i], // Multiple JOIN keywords
  },
  {
    skillId: "subqueries_scalar",
    questionPatterns: [
      /\babove\s+(the\s+)?average\b/i,
      /\bbelow\s+(the\s+)?average\b/i,
      /\bmore\s+than\s+(the\s+)?(average|mean)\b/i,
      /\bcompare[d]?\s+to\s+(the\s+)?average\b/i,
      /\bhigher\s+than\s+(the\s+)?average\b/i,
    ],
    hintPatterns: [
      /WHERE\s+\w+\s*[<>=]+\s*\(\s*SELECT/i,
      /SELECT\s*\(\s*SELECT/i,
    ],
    excludePatterns: [/\bFROM\s*\(\s*SELECT/i],
  },
  {
    skillId: "subqueries_table",
    questionPatterns: [
      /\bderived\b/i,
      /\bsubset\b/i,
      /\bfrom\s+the\s+results?\s+of\b/i,
    ],
    hintPatterns: [/\bFROM\s*\(\s*SELECT/i, /\bIN\s*\(\s*SELECT/i],
  },
  {
    skillId: "case_statements",
    questionPatterns: [
      /\bcategorize\b/i,
      /\bclassify\b/i,
      /\blabel\b/i,
      /\bif\s+.+\s+then\b/i,
      /\bbased\s+on\s+(the\s+)?(value|price|amount|quantity)/i,
      /\bcategory\s+(like|such\s+as)\s+["']/i,
    ],
    hintPatterns: [/\bCASE\s+WHEN\b/i],
  },
  {
    skillId: "date_time",
    questionPatterns: [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      /\b(2023|2024|2025|2026)\b/i,
      /\blast\s+(month|week|year|day)/i,
      /\bthis\s+(month|week|year)/i,
      /\bin\s+(the\s+)?(month|year)\s+of\b/i,
      /\bdate\s+(range|between|from|to)\b/i,
      /\bmonthly\b/i,
      /\bdaily\b/i,
      /\byearly\b/i,
      /\bquarter\b/i,
    ],
    hintPatterns: [
      /\bstrftime\b/i,
      /\bDATE\s*\(/i,
      /\bYEAR\s*\(/i,
      /\bMONTH\s*\(/i,
      /\b(order_date|created_at)\s*(LIKE|BETWEEN|>=|<=|>|<)/i,
    ],
  },
  {
    skillId: "null_handling",
    questionPatterns: [
      /\bnull\b/i,
      /\bmissing\b/i,
      /\bwithout\s+(a|an|any)\s+/i,
      /\bno\s+(email|phone|address|order)/i,
      /\bnever\s+(ordered|purchased)/i,
      /\bhasn't|haven't|hasn't\b/i,
    ],
    hintPatterns: [
      /\bIS\s+NULL\b/i,
      /\bIS\s+NOT\s+NULL\b/i,
      /\bCOALESCE\s*\(/i,
      /\bNULLIF\s*\(/i,
      /\bIFNULL\s*\(/i,
    ],
  },
  {
    skillId: "string_functions",
    questionPatterns: [
      /\bstarts?\s+with\b/i,
      /\bends?\s+with\b/i,
      /\bcontains?\b/i,
      /\bname\s+(starting|ending|containing)\b/i,
      /\bupper\s*case|lower\s*case\b/i,
      /\bconcatenate\b/i,
    ],
    hintPatterns: [
      /\bLIKE\s+['"][%_]/i,
      /\bUPPER\s*\(/i,
      /\bLOWER\s*\(/i,
      /\bSUBSTR\s*\(/i,
      /\bTRIM\s*\(/i,
      /\bCONCAT\s*\(/i,
      /\|\|/,
    ],
  },

  // Advanced Skills
  {
    skillId: "window_basics",
    questionPatterns: [
      /\brank(ed|ing)?\b/i,
      /\brow\s+number\b/i,
      /\b(1st|2nd|3rd|first|second|third)\s+(highest|lowest|largest|smallest)/i,
      /\bdense\s+rank\b/i,
      /\bntile\b/i,
    ],
    hintPatterns: [
      /\bROW_NUMBER\s*\(\s*\)\s*OVER\b/i,
      /\bRANK\s*\(\s*\)\s*OVER\b/i,
      /\bDENSE_RANK\s*\(\s*\)\s*OVER\b/i,
      /\bOVER\s*\(\s*(PARTITION|ORDER)\b/i,
    ],
  },
  {
    skillId: "window_analytics",
    questionPatterns: [
      /\bprevious\s+(order|value|amount|row)/i,
      /\bnext\s+(order|value|amount|row)/i,
      /\bcompare[d]?\s+to\s+(previous|last|prior)/i,
      /\blag\b/i,
      /\blead\b/i,
      /\bfirst\s+value\b/i,
      /\blast\s+value\b/i,
    ],
    hintPatterns: [/\bLAG\s*\(/i, /\bLEAD\s*\(/i, /\bFIRST_VALUE\s*\(/i, /\bLAST_VALUE\s*\(/i],
  },
  {
    skillId: "running_totals",
    questionPatterns: [
      /\brunning\s+(total|sum|average|count)/i,
      /\bcumulative\b/i,
      /\bmoving\s+(average|sum)/i,
      /\byear.to.date\b/i,
      /\baccumulated\b/i,
    ],
    hintPatterns: [
      /\bSUM\s*\([^)]+\)\s*OVER\s*\(/i,
      /\bAVG\s*\([^)]+\)\s*OVER\s*\(/i,
      /ROWS\s+(BETWEEN|UNBOUNDED)/i,
    ],
  },
  {
    skillId: "self_joins",
    questionPatterns: [
      /\bcompare\s+(customers?|products?|orders?)\s+to\s+(themselves|each\s+other)/i,
      /\bsame\s+(table|customer|product)/i,
      /\bhierarchy\b/i,
      /\bmanager\b/i,
      /\breport(s|ing)?\s+to\b/i,
      /\bparent\b/i,
    ],
    hintPatterns: [
      /FROM\s+(\w+)\s+\w+\s+JOIN\s+\1\s/i, // Same table name in FROM and JOIN
    ],
  },
  {
    skillId: "correlated_subqueries",
    questionPatterns: [
      /\bfor\s+each\s+row\b/i,
      /\bexists\b/i,
      /\bnot\s+exists\b/i,
    ],
    hintPatterns: [
      /\bWHERE\s+EXISTS\s*\(/i,
      /\bWHERE\s+NOT\s+EXISTS\s*\(/i,
      /SELECT[\s\S]+WHERE[\s\S]+SELECT[\s\S]+WHERE[\s\S]+\w+\.\w+\s*=/i,
    ],
  },
  {
    skillId: "ctes",
    questionPatterns: [
      /\busing\s+a\s+cte\b/i,
      /\bcommon\s+table\s+expression\b/i,
      /\bwith\s+clause\b/i,
    ],
    hintPatterns: [/\bWITH\s+\w+\s+AS\s*\(/i],
  },
  {
    skillId: "set_operations",
    questionPatterns: [
      /\bunion\b/i,
      /\bintersect\b/i,
      /\bexcept\b/i,
      /\bcombine\s+(the\s+)?results?\b/i,
      /\bboth\s+.+\s+and\s+.+\s+but\s+not\b/i,
    ],
    hintPatterns: [/\bUNION(\s+ALL)?\b/i, /\bINTERSECT\b/i, /\bEXCEPT\b/i],
  },
];

/**
 * Analyze a question and hint to determine skill IDs.
 */
function tagQuestion(question: string, hint: string): string[] {
  const skills: Set<string> = new Set();

  // Always add select_basics for any valid SQL question
  skills.add("select_basics");

  for (const pattern of SKILL_PATTERNS) {
    // Check exclusion patterns first
    if (pattern.excludePatterns) {
      const excluded = pattern.excludePatterns.some(
        (p) => p.test(question) || p.test(hint)
      );
      if (excluded) continue;
    }

    // Check question patterns
    const questionMatch = pattern.questionPatterns.some((p) =>
      p.test(question)
    );

    // Check hint patterns
    const hintMatch = pattern.hintPatterns.some((p) => p.test(hint));

    // Add skill if either question or hint matches
    if (questionMatch || hintMatch) {
      skills.add(pattern.skillId);
    }
  }

  // Post-processing rules

  // If we have groupby_having, we likely also have aggregations
  if (skills.has("groupby_having") && !skills.has("aggregations")) {
    skills.add("aggregations");
  }

  // If we have multi_joins, we should have basic_joins too
  if (skills.has("multi_joins")) {
    skills.add("basic_joins");
  }

  // If we have window_analytics or running_totals, include window_basics
  if (
    (skills.has("window_analytics") || skills.has("running_totals")) &&
    !skills.has("window_basics")
  ) {
    skills.add("window_basics");
  }

  // If we have subqueries_table, include subqueries_scalar
  if (skills.has("subqueries_table") && !skills.has("subqueries_scalar")) {
    skills.add("subqueries_scalar");
  }

  // If we only have select_basics, check if where is needed
  if (skills.size === 1 && hint.toLowerCase().includes("where")) {
    skills.add("where_filtering");
  }

  return Array.from(skills);
}

/**
 * Map difficulty to expected skill complexity.
 */
function adjustSkillsForDifficulty(
  skills: string[],
  difficulty: string
): string[] {
  const foundational = [
    "select_basics",
    "where_filtering",
    "order_limit",
    "aggregations",
    "groupby_having",
    "basic_joins",
  ];
  const intermediate = [
    "multi_joins",
    "subqueries_scalar",
    "subqueries_table",
    "case_statements",
    "date_time",
    "null_handling",
    "string_functions",
  ];
  const advanced = [
    "window_basics",
    "window_analytics",
    "running_totals",
    "self_joins",
    "correlated_subqueries",
    "ctes",
    "set_operations",
  ];

  // Prioritize skills based on difficulty
  if (difficulty === "beginner") {
    // Keep only foundational skills for beginner
    return skills.filter((s) => foundational.includes(s));
  } else if (difficulty === "intermediate") {
    // Keep foundational and intermediate
    return skills.filter(
      (s) => foundational.includes(s) || intermediate.includes(s)
    );
  }
  // Advanced: keep all
  return skills;
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

async function main() {
  const args = process.argv.slice(2);
  const forceRetag = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  const verbose = args.includes("--verbose");

  console.log("=== Heuristic SQL Question Skill Tagger ===\n");

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

  // Tag each question
  let processed = 0;
  for (const q of questionsToTag) {
    const detectedSkills = tagQuestion(q.question, q.hint);
    const adjustedSkills = adjustSkillsForDifficulty(
      detectedSkills,
      q.difficulty
    );

    // Ensure at least select_basics
    if (adjustedSkills.length === 0) {
      adjustedSkills.push("select_basics");
    }

    q.skillIds = adjustedSkills;
    processed++;

    if (verbose) {
      console.log(
        `[${processed}/${questionsToTag.length}] ${q.id} (${q.difficulty})`
      );
      console.log(`  Q: "${q.question.substring(0, 60)}..."`);
      console.log(`  Skills: [${adjustedSkills.join(", ")}]`);
    }
  }

  console.log(`\nTagged ${processed} questions\n`);

  if (!dryRun) {
    saveQuestions(questions);
    console.log("Changes saved to questions.json\n");
  }

  // Final stats
  const taggedCount = questions.filter(
    (q) => q.skillIds && q.skillIds.length > 0
  ).length;
  console.log(`Total tagged questions: ${taggedCount}/${questions.length}`);

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
    console.log(`  ${skillId}: ${count} questions`);
  }

  // Distribution by difficulty
  console.log("\nDistribution by difficulty:");
  for (const diff of ["beginner", "intermediate", "advanced"]) {
    const diffQuestions = questions.filter((q) => q.difficulty === diff);
    const diffSkillCounts: Record<string, number> = {};
    for (const q of diffQuestions) {
      if (q.skillIds) {
        for (const skillId of q.skillIds) {
          diffSkillCounts[skillId] = (diffSkillCounts[skillId] || 0) + 1;
        }
      }
    }
    console.log(`  ${diff} (${diffQuestions.length} questions):`);
    const topSkills = Object.entries(diffSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [skillId, count] of topSkills) {
      console.log(`    ${skillId}: ${count}`);
    }
  }
}

main().catch(console.error);
