"use client";

import { useMemo } from "react";
import {
  Skill,
  SkillProgress,
  SkillColor,
  SkillTier,
  SKILL_COLOR_THRESHOLDS,
} from "@/lib/types/skills";
import { SKILL_TREE, getSkillsByTier } from "@/lib/skills/skill-definitions";

interface SkillTreeProps {
  progress: Record<string, SkillProgress>;
  onSkillClick?: (skillId: string) => void;
  compact?: boolean;
}

/**
 * Determine skill mastery color based on score.
 */
function getSkillColor(score: number | null): SkillColor {
  if (score === null) return "gray";
  if (score <= SKILL_COLOR_THRESHOLDS.red.max) return "red";
  if (score <= SKILL_COLOR_THRESHOLDS.yellow.max) return "yellow";
  return "green";
}

/**
 * Get display symbol for skill mastery.
 */
function getSkillSymbol(color: SkillColor): string {
  switch (color) {
    case "gray":
      return "○"; // Empty circle - never attempted
    case "red":
      return "◉"; // Filled circle with dot - needs improvement
    case "yellow":
      return "◐"; // Half circle - needs reinforcement
    case "green":
      return "●"; // Filled circle - mastered
  }
}

/**
 * Get CSS classes for skill color styling.
 */
function getSkillColorClasses(color: SkillColor): string {
  switch (color) {
    case "gray":
      return "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100";
    case "red":
      return "text-red-600 bg-red-50 border-red-200 hover:bg-red-100";
    case "yellow":
      return "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100";
    case "green":
      return "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100";
  }
}

/**
 * Get tier display name and color.
 */
function getTierInfo(tier: SkillTier): { name: string; color: string } {
  switch (tier) {
    case "foundational":
      return { name: "Foundational", color: "text-slate-600" };
    case "intermediate":
      return { name: "Intermediate", color: "text-sky-600" };
    case "advanced":
      return { name: "Advanced", color: "text-indigo-600" };
    case "interview":
      return { name: "Interview Patterns", color: "text-purple-600" };
  }
}

/**
 * Calculate overall progress for a tier.
 */
function calculateTierProgress(
  skills: Skill[],
  progress: Record<string, SkillProgress>
): { attempted: number; mastered: number; total: number } {
  const total = skills.length;
  let attempted = 0;
  let mastered = 0;

  for (const skill of skills) {
    const skillProgress = progress[skill.id];
    if (skillProgress?.score !== null && skillProgress?.score !== undefined) {
      attempted++;
      if (skillProgress.score >= 70) {
        mastered++;
      }
    }
  }

  return { attempted, mastered, total };
}

/**
 * Skill item component.
 */
function SkillItem({
  skill,
  progress,
  onClick,
  compact,
}: {
  skill: Skill;
  progress: SkillProgress | undefined;
  onClick?: (skillId: string) => void;
  compact: boolean;
}) {
  const score = progress?.score ?? null;
  const color = getSkillColor(score);
  const symbol = getSkillSymbol(color);
  const colorClasses = getSkillColorClasses(color);

  const scoreDisplay =
    score !== null ? `${Math.round(score)}%` : "Not started";

  return (
    <button
      onClick={() => onClick?.(skill.id)}
      disabled={!onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
        ${colorClasses}
        ${onClick ? "cursor-pointer" : "cursor-default"}
        ${compact ? "text-xs" : "text-sm"}
      `}
      title={`${skill.name}: ${skill.description}\nScore: ${scoreDisplay}`}
    >
      <span className="text-lg leading-none">{symbol}</span>
      <span className="font-medium truncate">{skill.name}</span>
      {!compact && score !== null && (
        <span className="ml-auto text-xs opacity-75">{Math.round(score)}%</span>
      )}
    </button>
  );
}

/**
 * Tier section component.
 */
function TierSection({
  tier,
  skills,
  progress,
  onSkillClick,
  compact,
}: {
  tier: SkillTier;
  skills: Skill[];
  progress: Record<string, SkillProgress>;
  onSkillClick?: (skillId: string) => void;
  compact: boolean;
}) {
  const tierInfo = getTierInfo(tier);
  const tierProgress = calculateTierProgress(skills, progress);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-semibold uppercase tracking-wide ${tierInfo.color}`}>
          {tierInfo.name}
        </h4>
        <span className="text-xs text-slate-500">
          {tierProgress.mastered}/{tierProgress.total} mastered
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
          style={{
            width: `${tierProgress.total > 0 ? (tierProgress.mastered / tierProgress.total) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Skills grid */}
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1"}`}>
        {skills.map((skill) => (
          <SkillItem
            key={skill.id}
            skill={skill}
            progress={progress[skill.id]}
            onClick={onSkillClick}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skill Tree Component
 *
 * Displays all SQL skills organized by tier with color-coded mastery levels.
 */
export default function SkillTree({
  progress,
  onSkillClick,
  compact = false,
}: SkillTreeProps) {
  const tiers: SkillTier[] = [
    "foundational",
    "intermediate",
    "advanced",
    "interview",
  ];

  const skillsByTier = useMemo(() => {
    const result: Record<SkillTier, Skill[]> = {
      foundational: [],
      intermediate: [],
      advanced: [],
      interview: [],
    };
    for (const tier of tiers) {
      result[tier] = getSkillsByTier(tier);
    }
    return result;
  }, []);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    let totalSkills = SKILL_TREE.length;
    let attemptedSkills = 0;
    let masteredSkills = 0;
    let totalScore = 0;
    let scoredCount = 0;

    for (const skill of SKILL_TREE) {
      const skillProgress = progress[skill.id];
      if (skillProgress?.score !== null && skillProgress?.score !== undefined) {
        attemptedSkills++;
        totalScore += skillProgress.score;
        scoredCount++;
        if (skillProgress.score >= 70) {
          masteredSkills++;
        }
      }
    }

    const averageScore = scoredCount > 0 ? totalScore / scoredCount : 0;

    return {
      totalSkills,
      attemptedSkills,
      masteredSkills,
      averageScore,
    };
  }, [progress]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-cyan-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Skill Tree</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="text-emerald-500">●</span>
            {overallStats.masteredSkills}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-amber-500">◐</span>
            {overallStats.attemptedSkills - overallStats.masteredSkills}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400">○</span>
            {overallStats.totalSkills - overallStats.attemptedSkills}
          </span>
        </div>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <span className="text-slate-400">○</span> Not started
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-500">◉</span> Needs work
          </span>
          <span className="flex items-center gap-1">
            <span className="text-amber-500">◐</span> Learning
          </span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-500">●</span> Mastered
          </span>
        </div>
      )}

      {/* Tiers */}
      <div className="space-y-5">
        {tiers.map((tier) => (
          <TierSection
            key={tier}
            tier={tier}
            skills={skillsByTier[tier]}
            progress={progress}
            onSkillClick={onSkillClick}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact Skill Progress Bar
 *
 * A minimal skill progress indicator for use in headers or sidebars.
 */
export function SkillProgressBar({
  progress,
}: {
  progress: Record<string, SkillProgress>;
}) {
  const stats = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    let needsWork = 0;
    let notStarted = 0;

    for (const skill of SKILL_TREE) {
      const p = progress[skill.id];
      if (p?.score === null || p?.score === undefined) {
        notStarted++;
      } else if (p.score >= 70) {
        mastered++;
      } else if (p.score >= 40) {
        learning++;
      } else {
        needsWork++;
      }
    }

    const total = SKILL_TREE.length;
    return {
      mastered: (mastered / total) * 100,
      learning: (learning / total) * 100,
      needsWork: (needsWork / total) * 100,
      notStarted: (notStarted / total) * 100,
    };
  }, [progress]);

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
      <div
        className="bg-emerald-500 transition-all duration-500"
        style={{ width: `${stats.mastered}%` }}
      />
      <div
        className="bg-amber-400 transition-all duration-500"
        style={{ width: `${stats.learning}%` }}
      />
      <div
        className="bg-red-400 transition-all duration-500"
        style={{ width: `${stats.needsWork}%` }}
      />
    </div>
  );
}
