/**
 * Proficiency Calculation Utilities
 *
 * Functions for calculating skill scores, proficiency, and session updates.
 */

import {
  SkillProgress,
  SkillColor,
  SessionSummary,
  SCORE_RULES,
  SKILL_COLOR_THRESHOLDS,
  TIER_WEIGHTS,
  BADGES,
} from "../types/skills";
import { SKILL_TREE, getSkillById } from "./skill-definitions";

/**
 * Get skill mastery color based on score.
 */
export function getSkillColor(score: number | null): SkillColor {
  if (score === null) return "gray";
  if (score <= SKILL_COLOR_THRESHOLDS.red.max) return "red";
  if (score <= SKILL_COLOR_THRESHOLDS.yellow.max) return "yellow";
  return "green";
}

/**
 * Update a skill score based on answer correctness.
 *
 * @param currentScore - Current skill score (null if never attempted)
 * @param wasCorrect - Whether the answer was correct
 * @param usedHint - Whether a hint was used
 * @returns New skill score (0-100)
 */
export function updateSkillScore(
  currentScore: number | null,
  wasCorrect: boolean,
  usedHint: boolean
): number {
  // Start at 50 for first attempt (neutral starting point)
  const baseScore = currentScore ?? 50;

  let delta: number;
  if (wasCorrect) {
    delta = usedHint ? SCORE_RULES.hintUsed : SCORE_RULES.correctAnswer;
  } else {
    delta = SCORE_RULES.wrongAnswer;
  }

  // Apply delta and clamp to 0-100
  return Math.max(0, Math.min(100, baseScore + delta));
}

/**
 * Calculate weighted proficiency score across all skills.
 *
 * @param progress - Map of skill ID to progress
 * @returns Proficiency score (0-100)
 */
export function calculateProficiency(
  progress: Record<string, SkillProgress>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const skill of SKILL_TREE) {
    const skillProgress = progress[skill.id];
    const weight = TIER_WEIGHTS[skill.tier];

    // Only include attempted skills in the calculation
    if (skillProgress?.score !== null && skillProgress?.score !== undefined) {
      weightedSum += skillProgress.score * weight;
      totalWeight += weight;
    }
  }

  // If no skills attempted, proficiency is 0
  if (totalWeight === 0) return 0;

  return weightedSum / totalWeight;
}

/**
 * Apply time decay to skill scores.
 * Skills fade without practice.
 *
 * @param progress - Current progress map
 * @param weeksSinceLastPractice - Map of skill ID to weeks since last practice
 * @returns Updated progress map with decayed scores
 */
export function applySkillDecay(
  progress: Record<string, SkillProgress>,
  now: Date = new Date()
): Record<string, SkillProgress> {
  const updated: Record<string, SkillProgress> = {};

  for (const [skillId, skillProgress] of Object.entries(progress)) {
    if (
      skillProgress.score === null ||
      skillProgress.lastPracticed === null
    ) {
      updated[skillId] = skillProgress;
      continue;
    }

    const lastPracticed = new Date(skillProgress.lastPracticed);
    const weeksSince = Math.floor(
      (now.getTime() - lastPracticed.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weeksSince > 0) {
      const decay = weeksSince * SCORE_RULES.timeDecayPerWeek;
      const newScore = Math.max(0, skillProgress.score + decay);

      updated[skillId] = {
        ...skillProgress,
        score: newScore,
      };
    } else {
      updated[skillId] = skillProgress;
    }
  }

  return updated;
}

/**
 * Check which badges have been earned based on proficiency.
 *
 * @param proficiency - Current proficiency score
 * @param existingBadges - Badges already earned
 * @returns Array of newly earned badge IDs
 */
export function checkNewBadges(
  proficiency: number,
  existingBadges: string[]
): string[] {
  const newBadges: string[] = [];

  for (const badge of BADGES) {
    if (proficiency >= badge.threshold && !existingBadges.includes(badge.id)) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

/**
 * Determine if interview prep mode should be unlocked.
 */
export function isInterviewPrepUnlocked(proficiency: number): boolean {
  return proficiency >= 70;
}

/**
 * Generate session summary.
 *
 * @param sessionSkillDeltas - Accumulated skill score changes during session
 * @param beforeProgress - Progress before session
 * @param afterProgress - Progress after session
 * @param questionsAttempted - Number of questions attempted
 * @param correctCount - Number of correct answers
 * @param beforeProficiency - Proficiency before session
 * @param afterProficiency - Proficiency after session
 * @param beforeBadges - Badges before session
 * @returns Session summary
 */
export function generateSessionSummary(
  sessionSkillDeltas: Record<string, number>,
  beforeProgress: Record<string, SkillProgress>,
  afterProgress: Record<string, SkillProgress>,
  questionsAttempted: number,
  correctCount: number,
  beforeProficiency: number,
  afterProficiency: number,
  beforeBadges: string[]
): SessionSummary {
  const skillsImproved: string[] = [];
  const skillsDeclined: string[] = [];

  for (const [skillId, delta] of Object.entries(sessionSkillDeltas)) {
    if (delta > 0) {
      skillsImproved.push(skillId);
    } else if (delta < 0) {
      skillsDeclined.push(skillId);
    }
  }

  const proficiencyDelta = afterProficiency - beforeProficiency;
  const newBadgesEarned = checkNewBadges(afterProficiency, beforeBadges);
  const interviewPrepUnlocked =
    !isInterviewPrepUnlocked(beforeProficiency) &&
    isInterviewPrepUnlocked(afterProficiency);

  // Generate focus suggestion
  let suggestedNextFocus = "";
  if (skillsDeclined.length > 0) {
    const declinedSkill = getSkillById(skillsDeclined[0]);
    suggestedNextFocus = `Focus on ${declinedSkill?.name || skillsDeclined[0]} to strengthen your understanding`;
  } else if (skillsImproved.length > 0) {
    const improvedSkill = getSkillById(skillsImproved[0]);
    suggestedNextFocus = `Great progress on ${improvedSkill?.name || skillsImproved[0]}! Keep practicing`;
  } else {
    suggestedNextFocus = "Keep practicing to improve your SQL skills";
  }

  return {
    questionsAttempted,
    correctCount,
    skillsImproved,
    skillsDeclined,
    proficiencyDelta,
    newBadgesEarned,
    interviewPrepUnlocked,
    suggestedNextFocus,
  };
}

/**
 * Initialize progress for a skill that hasn't been attempted.
 */
export function initializeSkillProgress(skillId: string): SkillProgress {
  return {
    skillId,
    score: null,
    attempts: 0,
    lastPracticed: null,
  };
}

/**
 * Create initial progress map with all skills initialized.
 */
export function createInitialProgress(): Record<string, SkillProgress> {
  const progress: Record<string, SkillProgress> = {};
  for (const skill of SKILL_TREE) {
    progress[skill.id] = initializeSkillProgress(skill.id);
  }
  return progress;
}

/**
 * Update progress after answering a question.
 *
 * @param progress - Current progress
 * @param skillIds - Skills tested by the question
 * @param wasCorrect - Whether the answer was correct
 * @param usedHint - Whether a hint was used
 * @returns Updated progress and delta map
 */
export function updateProgressAfterAnswer(
  progress: Record<string, SkillProgress>,
  skillIds: string[],
  wasCorrect: boolean,
  usedHint: boolean
): {
  newProgress: Record<string, SkillProgress>;
  deltas: Record<string, number>;
} {
  const newProgress = { ...progress };
  const deltas: Record<string, number> = {};
  const now = new Date().toISOString();

  for (const skillId of skillIds) {
    const currentProgress = newProgress[skillId] || initializeSkillProgress(skillId);
    const oldScore = currentProgress.score;
    const newScore = updateSkillScore(oldScore, wasCorrect, usedHint);

    newProgress[skillId] = {
      ...currentProgress,
      score: newScore,
      attempts: currentProgress.attempts + 1,
      lastPracticed: now,
    };

    // Calculate delta (handle null -> number transition)
    deltas[skillId] = newScore - (oldScore ?? 50);
  }

  return { newProgress, deltas };
}

/**
 * Get skills that need the most attention (red and yellow skills).
 */
export function getSkillsNeedingAttention(
  progress: Record<string, SkillProgress>,
  limit: number = 5
): string[] {
  const scoredSkills: Array<{ id: string; score: number }> = [];

  for (const skill of SKILL_TREE) {
    const p = progress[skill.id];
    if (p?.score !== null && p?.score !== undefined) {
      scoredSkills.push({ id: skill.id, score: p.score });
    }
  }

  // Sort by score ascending (lowest first)
  scoredSkills.sort((a, b) => a.score - b.score);

  // Return skills that are below green threshold
  return scoredSkills
    .filter((s) => s.score < SKILL_COLOR_THRESHOLDS.green.min)
    .slice(0, limit)
    .map((s) => s.id);
}

/**
 * Get unattempted skills that have prerequisites met.
 */
export function getUnlockedGraySkills(
  progress: Record<string, SkillProgress>
): string[] {
  const unlocked: string[] = [];

  for (const skill of SKILL_TREE) {
    const p = progress[skill.id];

    // Skip if already attempted
    if (p?.score !== null && p?.score !== undefined) continue;

    // Check if prerequisites are met (all prereqs at yellow+)
    const prereqsMet = skill.prerequisites.every((prereqId) => {
      const prereqProgress = progress[prereqId];
      return (
        prereqProgress?.score !== null &&
        prereqProgress?.score !== undefined &&
        prereqProgress.score >= SKILL_COLOR_THRESHOLDS.yellow.min
      );
    });

    // If no prerequisites, it's always unlocked
    if (skill.prerequisites.length === 0 || prereqsMet) {
      unlocked.push(skill.id);
    }
  }

  return unlocked;
}
