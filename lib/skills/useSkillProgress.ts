"use client";

/**
 * Skill Progress Hook
 *
 * React hook for managing skill progress with localStorage persistence.
 * For anonymous users, progress is stored in localStorage (session-only).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { SkillProgress, SessionSkillState } from "../types/skills";
import {
  createInitialProgress,
  calculateProficiency,
  updateProgressAfterAnswer,
  applySkillDecay,
  checkNewBadges,
  isInterviewPrepUnlocked,
  generateSessionSummary,
} from "./proficiency";

const STORAGE_KEY = "sql-tutor-skill-progress";

interface UseSkillProgressReturn {
  // Progress state
  progress: Record<string, SkillProgress>;
  proficiency: number;
  badges: string[];
  interviewPrepUnlocked: boolean;

  // Session state
  sessionStats: {
    questionsAnswered: number;
    correctCount: number;
    skillDeltas: Record<string, number>;
    sessionStartedAt: string | null;
  };

  // Actions
  recordAnswer: (
    skillIds: string[],
    wasCorrect: boolean,
    usedHint: boolean
  ) => void;
  startSession: () => void;
  endSession: () => ReturnType<typeof generateSessionSummary> | null;
  resetProgress: () => void;

  // Status
  isLoaded: boolean;
}

/**
 * Load progress from localStorage.
 */
function loadProgress(): {
  progress: Record<string, SkillProgress>;
  badges: string[];
  lastSessionAt: string | null;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      progress: parsed.progress || {},
      badges: parsed.badges || [],
      lastSessionAt: parsed.lastSessionAt || null,
    };
  } catch (e) {
    console.error("Failed to load skill progress:", e);
    return null;
  }
}

/**
 * Save progress to localStorage.
 */
function saveProgress(
  progress: Record<string, SkillProgress>,
  badges: string[],
  lastSessionAt: string | null
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        progress,
        badges,
        lastSessionAt,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("Failed to save skill progress:", e);
  }
}

/**
 * Hook for managing skill progress.
 */
export function useSkillProgress(): UseSkillProgressReturn {
  // Core state
  const [progress, setProgress] = useState<Record<string, SkillProgress>>(
    createInitialProgress()
  );
  const [badges, setBadges] = useState<string[]>([]);
  const [lastSessionAt, setLastSessionAt] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Session state
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [sessionQuestionsAnswered, setSessionQuestionsAnswered] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionSkillDeltas, setSessionSkillDeltas] = useState<
    Record<string, number>
  >({});
  const [preSessionProgress, setPreSessionProgress] = useState<Record<
    string,
    SkillProgress
  > | null>(null);
  const [preSessionProficiency, setPreSessionProficiency] = useState<number>(0);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadProgress();
    if (stored) {
      // Apply skill decay based on time since last practice
      const decayedProgress = applySkillDecay(stored.progress);
      setProgress(decayedProgress);
      setBadges(stored.badges);
      setLastSessionAt(stored.lastSessionAt);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when progress changes
  useEffect(() => {
    if (isLoaded) {
      saveProgress(progress, badges, lastSessionAt);
    }
  }, [progress, badges, lastSessionAt, isLoaded]);

  // Calculate derived values
  const proficiency = useMemo(
    () => calculateProficiency(progress),
    [progress]
  );

  const interviewPrepUnlocked = useMemo(
    () => isInterviewPrepUnlocked(proficiency),
    [proficiency]
  );

  // Actions
  const recordAnswer = useCallback(
    (skillIds: string[], wasCorrect: boolean, usedHint: boolean) => {
      setProgress((prev) => {
        const { newProgress, deltas } = updateProgressAfterAnswer(
          prev,
          skillIds,
          wasCorrect,
          usedHint
        );

        // Update session deltas
        setSessionSkillDeltas((prevDeltas) => {
          const updated = { ...prevDeltas };
          for (const [skillId, delta] of Object.entries(deltas)) {
            updated[skillId] = (updated[skillId] || 0) + delta;
          }
          return updated;
        });

        return newProgress;
      });

      // Update session counters
      setSessionQuestionsAnswered((prev) => prev + 1);
      if (wasCorrect) {
        setSessionCorrectCount((prev) => prev + 1);
      }

      // Check for new badges
      const newProficiency = calculateProficiency(progress);
      const newBadges = checkNewBadges(newProficiency, badges);
      if (newBadges.length > 0) {
        setBadges((prev) => [...prev, ...newBadges]);
      }
    },
    [progress, badges]
  );

  const startSession = useCallback(() => {
    const now = new Date().toISOString();
    setSessionStartedAt(now);
    setSessionQuestionsAnswered(0);
    setSessionCorrectCount(0);
    setSessionSkillDeltas({});
    setPreSessionProgress({ ...progress });
    setPreSessionProficiency(proficiency);
  }, [progress, proficiency]);

  const endSession = useCallback(() => {
    if (!sessionStartedAt || !preSessionProgress) {
      return null;
    }

    const summary = generateSessionSummary(
      sessionSkillDeltas,
      preSessionProgress,
      progress,
      sessionQuestionsAnswered,
      sessionCorrectCount,
      preSessionProficiency,
      proficiency,
      badges
    );

    // Update last session timestamp
    setLastSessionAt(new Date().toISOString());

    // Reset session state
    setSessionStartedAt(null);
    setPreSessionProgress(null);
    setPreSessionProficiency(0);
    // Keep session stats for display, they'll reset on next startSession

    return summary;
  }, [
    sessionStartedAt,
    preSessionProgress,
    sessionSkillDeltas,
    progress,
    sessionQuestionsAnswered,
    sessionCorrectCount,
    preSessionProficiency,
    proficiency,
    badges,
  ]);

  const resetProgress = useCallback(() => {
    const initial = createInitialProgress();
    setProgress(initial);
    setBadges([]);
    setLastSessionAt(null);
    setSessionStartedAt(null);
    setSessionQuestionsAnswered(0);
    setSessionCorrectCount(0);
    setSessionSkillDeltas({});
    setPreSessionProgress(null);
    setPreSessionProficiency(0);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    // Progress state
    progress,
    proficiency,
    badges,
    interviewPrepUnlocked,

    // Session state
    sessionStats: {
      questionsAnswered: sessionQuestionsAnswered,
      correctCount: sessionCorrectCount,
      skillDeltas: sessionSkillDeltas,
      sessionStartedAt,
    },

    // Actions
    recordAnswer,
    startSession,
    endSession,
    resetProgress,

    // Status
    isLoaded,
  };
}

export default useSkillProgress;
