/**
 * Skill Tree System for SQL Tutor
 *
 * This module defines the data models for tracking user progress
 * through SQL concepts from beginner to interview-ready.
 */

// Skill tier levels - progresses from foundational to interview patterns
export type SkillTier =
  | "foundational"
  | "intermediate"
  | "advanced"
  | "interview";

// Skill mastery colors based on score ranges
export type SkillColor = "gray" | "red" | "yellow" | "green";

/**
 * Represents a single SQL skill/concept that can be mastered.
 */
export interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  prerequisites: string[]; // Skill IDs that must be yellow+ first
  description: string;
}

/**
 * Tracks user progress on a single skill.
 */
export interface SkillProgress {
  skillId: string;
  score: number | null; // null = gray (never attempted), 0-100
  attempts: number;
  lastPracticed: string | null; // ISO timestamp
}

/**
 * User's overall progress across all skills.
 */
export interface UserSkillProgress {
  skills: Record<string, SkillProgress>;
  proficiencyScore: number; // Weighted average 0-100
  totalQuestionsAnswered: number;
  badges: string[];
  lastSessionAt: string | null;
}

/**
 * Session-level skill tracking (persisted to localStorage for anonymous users).
 */
export interface SessionSkillState {
  skills: Record<string, SkillProgress>;
  sessionStartedAt: string;
  questionsAnswered: number;
  correctCount: number;
  skillDeltas: Record<string, number>; // Accumulated changes this session
}

/**
 * Score movement rules for skill progression.
 */
export const SCORE_RULES = {
  correctAnswer: 15, // Capped at 100
  wrongAnswer: -20, // Floored at 0
  hintUsed: 5, // Reduced credit for hint-assisted correct
  timeDecayPerWeek: -2, // Skills fade without practice
} as const;

/**
 * Score thresholds for skill mastery colors.
 */
export const SKILL_COLOR_THRESHOLDS = {
  red: { min: 0, max: 39 },
  yellow: { min: 40, max: 69 },
  green: { min: 70, max: 100 },
} as const;

/**
 * Tier weights for proficiency calculation.
 */
export const TIER_WEIGHTS: Record<SkillTier, number> = {
  foundational: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
  interview: 2.5,
};

/**
 * Badge definitions and unlock thresholds.
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  threshold: number; // Proficiency score to unlock
}

export const BADGES: Badge[] = [
  {
    id: "sql_apprentice",
    name: "SQL Apprentice",
    description: "Reached 30% proficiency",
    threshold: 30,
  },
  {
    id: "query_builder",
    name: "Query Builder",
    description: "Reached 50% proficiency",
    threshold: 50,
  },
  {
    id: "interview_ready",
    name: "Interview Ready",
    description: "Reached 70% proficiency - Interview Prep Mode unlocked!",
    threshold: 70,
  },
  {
    id: "sql_expert",
    name: "SQL Expert",
    description: "Reached 85% proficiency",
    threshold: 85,
  },
  {
    id: "sql_master",
    name: "SQL Master",
    description: "Reached 95% proficiency",
    threshold: 95,
  },
];

/**
 * Session summary shown at end of practice.
 */
export interface SessionSummary {
  questionsAttempted: number;
  correctCount: number;
  skillsImproved: string[]; // Skill IDs
  skillsDeclined: string[]; // Skill IDs
  proficiencyDelta: number; // e.g., +3%
  newBadgesEarned: string[];
  interviewPrepUnlocked: boolean;
  suggestedNextFocus: string; // Natural language suggestion
}
