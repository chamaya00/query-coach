export type UserLevel = "beginner" | "intermediate" | "advanced";

export interface CoachRequest {
  schema: string;
  question: string;
  userQuery: string;
  expectedResult?: string;
  userLevel: UserLevel;
}

export interface CoachResponse {
  feedback: string;
  queryResult: QueryResult;
  executionTimeMs: number;
}

export interface QueryResult {
  success: boolean;
  data?: string;
  error?: string;
  rowCount?: number;
}

export interface HintRequest {
  schema: string;
  question: string;
  userLevel: UserLevel;
}

export interface HintResponse {
  hintQuery: string;
}

export interface TestCase {
  id: string;
  name: string;
  schema: string;
  question: string;
  userQuery: string;
  expectedResult: string;
  knownIssues: string[];
  userLevel: UserLevel;
  mustMention: string[];
  mustNotMention: string[];
}

export interface EvalScore {
  mentionsRequired: number;
  avoidsProblems: number;
  hasStructure: number;
  accuracy?: number;
  clarity?: number;
  levelMatch?: number;
  encouragement?: number;
  actionability?: number;
}

export interface CachedQuestion {
  id: string;
  difficulty: UserLevel;
  question: string;
  hint: string;
  generatedAt: string;
}
