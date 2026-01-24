/**
 * Skill Tree System
 *
 * Re-exports all skill-related types, definitions, and utilities.
 */

// Type definitions
export * from "../types/skills";

// Skill definitions
export {
  SKILL_TREE,
  getSkillById,
  getSkillsByTier,
  getEntrySkills,
  getDependentSkills,
  arePrerequisitesMet,
  getAllSkillIds,
  validateSkillTree,
} from "./skill-definitions";

// Proficiency utilities
export {
  getSkillColor,
  updateSkillScore,
  calculateProficiency,
  applySkillDecay,
  checkNewBadges,
  isInterviewPrepUnlocked,
  generateSessionSummary,
  initializeSkillProgress,
  createInitialProgress,
  updateProgressAfterAnswer,
  getSkillsNeedingAttention,
  getUnlockedGraySkills,
} from "./proficiency";

// React hook
export { useSkillProgress, default as useSkillProgressHook } from "./useSkillProgress";
