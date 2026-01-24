/**
 * Skill Tree Definitions
 *
 * All SQL skills organized by tier with prerequisites.
 * Skills must have yellow+ (40%+) on prerequisites before new skills unlock.
 */

import { Skill, SkillTier } from "../types/skills";

/**
 * Complete skill tree covering SQL concepts from basics to interview patterns.
 */
export const SKILL_TREE: Skill[] = [
  // ============================================
  // FOUNDATIONAL TIER
  // ============================================
  {
    id: "select_basics",
    name: "SELECT Basics",
    tier: "foundational",
    prerequisites: [],
    description:
      "Basic SELECT statements, column selection, and FROM clause usage",
  },
  {
    id: "where_filtering",
    name: "WHERE Filtering",
    tier: "foundational",
    prerequisites: ["select_basics"],
    description:
      "Filtering rows with WHERE clause, comparison operators, AND/OR logic",
  },
  {
    id: "order_limit",
    name: "ORDER BY & LIMIT",
    tier: "foundational",
    prerequisites: ["select_basics"],
    description: "Sorting results with ORDER BY and limiting output with LIMIT",
  },
  {
    id: "aggregations",
    name: "Aggregations",
    tier: "foundational",
    prerequisites: ["select_basics"],
    description:
      "Aggregate functions: COUNT, SUM, AVG, MIN, MAX for summarizing data",
  },
  {
    id: "groupby_having",
    name: "GROUP BY & HAVING",
    tier: "foundational",
    prerequisites: ["aggregations"],
    description:
      "Grouping rows with GROUP BY and filtering groups with HAVING",
  },
  {
    id: "basic_joins",
    name: "Basic JOINs",
    tier: "foundational",
    prerequisites: ["where_filtering"],
    description:
      "Combining tables with INNER JOIN and LEFT JOIN on single conditions",
  },

  // ============================================
  // INTERMEDIATE TIER
  // ============================================
  {
    id: "multi_joins",
    name: "Multi-table JOINs",
    tier: "intermediate",
    prerequisites: ["basic_joins", "groupby_having"],
    description: "Joining three or more tables with complex join conditions",
  },
  {
    id: "subqueries_scalar",
    name: "Scalar Subqueries",
    tier: "intermediate",
    prerequisites: ["where_filtering", "aggregations"],
    description:
      "Subqueries that return a single value, used in SELECT or WHERE",
  },
  {
    id: "subqueries_table",
    name: "Table Subqueries",
    tier: "intermediate",
    prerequisites: ["subqueries_scalar"],
    description: "Subqueries in FROM clause (derived tables) and IN clauses",
  },
  {
    id: "case_statements",
    name: "CASE Statements",
    tier: "intermediate",
    prerequisites: ["select_basics", "where_filtering"],
    description: "Conditional logic with CASE WHEN for data transformation",
  },
  {
    id: "date_time",
    name: "Date/Time Functions",
    tier: "intermediate",
    prerequisites: ["where_filtering"],
    description:
      "Date extraction, formatting, arithmetic, and filtering by date ranges",
  },
  {
    id: "null_handling",
    name: "NULL Handling",
    tier: "intermediate",
    prerequisites: ["where_filtering", "basic_joins"],
    description:
      "Working with NULL values: IS NULL, COALESCE, NULLIF, and NULL-safe comparisons",
  },
  {
    id: "string_functions",
    name: "String Functions",
    tier: "intermediate",
    prerequisites: ["select_basics"],
    description:
      "String manipulation: CONCAT, SUBSTR, TRIM, UPPER/LOWER, LIKE patterns",
  },

  // ============================================
  // ADVANCED TIER
  // ============================================
  {
    id: "window_basics",
    name: "Window Functions Basics",
    tier: "advanced",
    prerequisites: ["groupby_having", "order_limit"],
    description: "ROW_NUMBER, RANK, DENSE_RANK for numbering and ranking rows",
  },
  {
    id: "window_analytics",
    name: "Analytic Window Functions",
    tier: "advanced",
    prerequisites: ["window_basics"],
    description: "LAG, LEAD, FIRST_VALUE, LAST_VALUE for row comparisons",
  },
  {
    id: "running_totals",
    name: "Running Totals & Averages",
    tier: "advanced",
    prerequisites: ["window_basics", "aggregations"],
    description: "Cumulative sums, moving averages with window frames",
  },
  {
    id: "self_joins",
    name: "Self-Joins",
    tier: "advanced",
    prerequisites: ["multi_joins"],
    description: "Joining a table to itself for hierarchical or comparison queries",
  },
  {
    id: "correlated_subqueries",
    name: "Correlated Subqueries",
    tier: "advanced",
    prerequisites: ["subqueries_table"],
    description:
      "Subqueries that reference the outer query for row-by-row evaluation",
  },
  {
    id: "ctes",
    name: "CTEs (WITH Clause)",
    tier: "advanced",
    prerequisites: ["subqueries_table"],
    description:
      "Common Table Expressions for readable, modular query structure",
  },
  {
    id: "set_operations",
    name: "Set Operations",
    tier: "advanced",
    prerequisites: ["select_basics"],
    description: "UNION, INTERSECT, EXCEPT for combining result sets",
  },

  // ============================================
  // INTERVIEW PATTERNS TIER (Premium)
  // ============================================
  {
    id: "retention_analysis",
    name: "Retention Analysis",
    tier: "interview",
    prerequisites: ["window_analytics", "date_time", "self_joins"],
    description: "Calculating user retention rates and cohort-based retention",
  },
  {
    id: "cohort_analysis",
    name: "Cohort Analysis",
    tier: "interview",
    prerequisites: ["retention_analysis", "ctes"],
    description: "Grouping users by acquisition date and tracking behavior over time",
  },
  {
    id: "funnel_analysis",
    name: "Funnel Analysis",
    tier: "interview",
    prerequisites: ["window_basics", "case_statements", "ctes"],
    description: "Tracking conversion through multi-step user journeys",
  },
  {
    id: "mom_growth",
    name: "Month-over-Month Growth",
    tier: "interview",
    prerequisites: ["window_analytics", "date_time"],
    description: "Calculating period-over-period changes and growth rates",
  },
  {
    id: "dau_mau",
    name: "Active Users (DAU/MAU)",
    tier: "interview",
    prerequisites: ["date_time", "aggregations", "window_basics"],
    description: "Daily/monthly active user metrics and engagement ratios",
  },
  {
    id: "attribution",
    name: "Attribution Queries",
    tier: "interview",
    prerequisites: ["window_analytics", "ctes", "case_statements"],
    description: "First-touch, last-touch, and multi-touch attribution models",
  },
];

/**
 * Get skill by ID.
 */
export function getSkillById(skillId: string): Skill | undefined {
  return SKILL_TREE.find((skill) => skill.id === skillId);
}

/**
 * Get all skills in a specific tier.
 */
export function getSkillsByTier(tier: SkillTier): Skill[] {
  return SKILL_TREE.filter((skill) => skill.tier === tier);
}

/**
 * Get skills that have no prerequisites (entry points).
 */
export function getEntrySkills(): Skill[] {
  return SKILL_TREE.filter((skill) => skill.prerequisites.length === 0);
}

/**
 * Get skills that depend on a specific skill.
 */
export function getDependentSkills(skillId: string): Skill[] {
  return SKILL_TREE.filter((skill) => skill.prerequisites.includes(skillId));
}

/**
 * Check if a skill's prerequisites are met (all prereqs at yellow+ level).
 */
export function arePrerequisitesMet(
  skillId: string,
  progress: Record<string, { score: number | null }>
): boolean {
  const skill = getSkillById(skillId);
  if (!skill) return false;

  return skill.prerequisites.every((prereqId) => {
    const prereqProgress = progress[prereqId];
    return prereqProgress?.score !== null && prereqProgress.score >= 40;
  });
}

/**
 * Get all skill IDs as a set for validation.
 */
export function getAllSkillIds(): Set<string> {
  return new Set(SKILL_TREE.map((skill) => skill.id));
}

/**
 * Validate that all prerequisite references are valid skill IDs.
 */
export function validateSkillTree(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allIds = getAllSkillIds();

  for (const skill of SKILL_TREE) {
    for (const prereqId of skill.prerequisites) {
      if (!allIds.has(prereqId)) {
        errors.push(
          `Skill "${skill.id}" has invalid prerequisite "${prereqId}"`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Validate on module load in development
if (process.env.NODE_ENV === "development") {
  const validation = validateSkillTree();
  if (!validation.valid) {
    console.error("Skill tree validation failed:", validation.errors);
  }
}
