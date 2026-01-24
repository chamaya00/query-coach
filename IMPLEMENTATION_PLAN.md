# SQL Tutor Implementation Plan

## Vision

Transform Query Coach from a reactive practice tool into a **fully agentic SQL tutor** that guides users from any starting level to passing product data science technical interviews.

---

## Table of Contents

1. [User Journey](#user-journey)
2. [Skill Tree System](#skill-tree-system)
3. [Session Flow](#session-flow)
4. [LLM Cost Optimization](#llm-cost-optimization)
5. [Monetization](#monetization)
6. [Implementation Phases](#implementation-phases)

---

## User Journey

### Core Loop

```
SESSION START
├── 3 Warm-Up Questions
│   ├── Quick, mixed difficulty from known skills
│   ├── Gets user into flow state
│   └── AI observes: rusty? sharp? what's slipping?
│
├── ADAPTIVE PRACTICE
│   ├── AI picks each question based on:
│   │   ├── Warm-up performance (what needs work today?)
│   │   ├── Skill tree state (reds > yellows > grays > greens)
│   │   ├── Concept mixing (combine 2 skills when ready)
│   │   └── Momentum (on a streak? push harder)
│   │
│   └── Continue until:
│       ├── User quits
│       └── Logged-out user hits session cap (10 questions)
│
└── SESSION END
    ├── Update skill tree colors
    ├── Update overall proficiency score
    ├── Show session summary
    └── Check interview prep unlock (70% proficiency)
```

### Key Principles

- **No long-term planning**: AI decides everything for current session only
- **Non-linear progression**: Skills introduced based on mastery + prerequisites, not fixed order
- **Adaptive difficulty**: AI adjusts based on real-time performance
- **Session-based**: Each session is self-contained with warm-up calibration

---

## Skill Tree System

### Interview-Ready Skill Tree

```
FOUNDATIONAL
├── SELECT, WHERE, ORDER BY, LIMIT
├── Aggregations (COUNT, SUM, AVG, MIN, MAX)
├── GROUP BY + HAVING
└── Basic JOINs (INNER, LEFT)

INTERMEDIATE
├── Multi-table JOINs
├── Subqueries (scalar, table, correlated)
├── CASE statements
├── Date/time manipulation
└── NULL handling patterns

ADVANCED
├── Window functions (ROW_NUMBER, RANK, LAG, LEAD)
├── Running totals / Moving averages
├── Self-joins
├── CTEs (Common Table Expressions)
└── Query optimization basics

INTERVIEW PATTERNS (Premium)
├── Retention / Cohort analysis
├── Funnel analysis
├── Month-over-month growth
├── Active users (DAU/MAU)
├── Attribution queries
└── A/B test result analysis
```

### Skill Mastery Colors

| Color  | Meaning              | Score Range | UI Display |
|--------|----------------------|-------------|------------|
| Gray   | Never attempted      | null        | ○          |
| Red    | Needs improvement    | 0-39%       | ◉          |
| Yellow | Needs reinforcement  | 40-69%      | ◐          |
| Green  | Mastered             | 70-100%     | ●          |

### Score Movement Rules

```typescript
const SCORE_RULES = {
  correctAnswer: +15,      // Capped at 100
  wrongAnswer: -20,        // Floored at 0
  hintUsed: +5,            // Reduced credit for hint-assisted correct
  timeDecayPerWeek: -2,    // Skills fade without practice
};
```

### Question Selection Priority

1. **Red skills** - Fix weaknesses first
2. **Yellow skills** - Reinforce shaky knowledge
3. **Gray skills** - Introduce new concepts (if prerequisites met)
4. **Green skills** - Occasional review to prevent decay

### Concept Mixing

When multiple skills reach yellow+, AI generates questions combining them:
- Example: "GROUP BY" (yellow) + "LEFT JOIN" (yellow) → combined question
- Accelerates mastery by testing integration

### Proficiency Score

```typescript
// Weighted average of all skill scores
const calculateProficiency = (skills: SkillScores): number => {
  const weights = {
    foundational: 1.0,
    intermediate: 1.5,
    advanced: 2.0,
    interviewPatterns: 2.5,
  };

  // Calculate weighted average across all skills
  // Returns 0-100 percentage
};
```

### Milestones & Badges

| Score | Unlock |
|-------|--------|
| 30%   | "SQL Apprentice" badge |
| 50%   | "Query Builder" badge |
| 70%   | Interview Prep Mode unlocked |
| 85%   | "Interview Ready" badge |
| 95%   | "SQL Expert" badge |

---

## Session Flow

### Warm-Up Calibration (3 Questions)

```typescript
interface WarmUpStrategy {
  question1: {
    difficulty: 'easy',
    source: 'green_skill',      // Confidence builder
    purpose: 'flow_state',
  },
  question2: {
    difficulty: 'medium',
    source: 'yellow_skill',     // Check retention
    purpose: 'calibration',
  },
  question3: {
    difficulty: 'medium_hard',
    source: 'red_or_gray_skill', // Probe edges
    purpose: 'identify_focus',
  },
}
```

### Warm-Up Observations (Fed to Session AI)

```typescript
interface WarmUpObservations {
  greenSkillStruggle: boolean;   // Usually green but failed → needs review
  redSkillSuccess: boolean;      // Usually red but passed → accelerate
  responseSpeed: 'slow' | 'normal' | 'fast';
  overallReadiness: 'rusty' | 'sharp' | 'mixed';
  suggestedFocus: SkillId[];
}
```

### Adaptive Practice Logic

```typescript
interface SessionDecision {
  nextQuestion: {
    skillIds: SkillId[];        // 1-2 skills to test
    difficulty: Difficulty;
    questionId: string;         // From cache or generate
  };

  reasoning: {
    basedOn: 'warmup' | 'streak' | 'struggle' | 'exploration';
    skillTreeState: 'focusing_red' | 'reinforcing_yellow' | 'introducing_gray';
    momentumAdjustment: 'push_harder' | 'consolidate' | 'maintain';
  };
}
```

### Session End Summary

```typescript
interface SessionSummary {
  questionsAttempted: number;
  correctCount: number;
  skillsImproved: SkillId[];
  skillsDeclined: SkillId[];
  proficiencyDelta: number;     // e.g., +3%
  newBadgesEarned: string[];
  interviewPrepUnlocked: boolean;
  suggestedNextFocus: string;   // "Keep working on window functions"
}
```

---

## LLM Cost Optimization

### MVP Cost Strategy

#### 1. Aggressive Question Caching

**Pre-generate questions covering all concept combinations:**

```typescript
interface QuestionCache {
  // Key: sorted concept IDs joined by "+"
  // e.g., "groupby+leftjoin" or "aggregations" (single)
  [conceptCombo: string]: {
    questions: CachedQuestion[];
    lastGenerated: Date;
  };
}

// Target coverage:
// - 20 single concepts × 10 questions = 200 questions
// - 190 two-concept combos × 5 questions = 950 questions
// - High-value three-concept combos × 3 questions = ~500 questions
// Total: ~1,650 new questions + existing 2,400 = 4,000+ questions
```

**Question serving logic:**

```typescript
async function getQuestion(
  requiredConcepts: SkillId[],
  userId: string,
  seenQuestionIds: string[]
): Promise<Question> {
  const comboKey = requiredConcepts.sort().join('+');
  const cached = await questionCache.get(comboKey);

  // Find unseen question from cache
  const unseen = cached?.questions.filter(q => !seenQuestionIds.includes(q.id));

  if (unseen?.length > 0) {
    return pickRandom(unseen); // Zero LLM cost
  }

  // Cache miss: generate new question and save for others
  const newQuestion = await generateQuestion(requiredConcepts);
  await questionCache.append(comboKey, newQuestion);
  return newQuestion;
}
```

**Cost:** ~$5-10 one-time to pre-generate. Eliminates 95%+ of question generation costs.

#### 2. Hint Caching Per Question

```typescript
interface CachedQuestion {
  id: string;
  conceptIds: SkillId[];
  difficulty: Difficulty;
  question: string;
  hint: string;              // Pre-generated with question
  expectedResultHash: string; // For correctness checking
  generatedAt: Date;
}
```

Every cached question includes its hint. Zero LLM cost for hints on cached questions.

#### 3. Tiered Model Selection

```typescript
type ModelTier = 'haiku' | 'sonnet';

function selectModel(task: TaskType, context: TaskContext): ModelTier {
  switch (task) {
    case 'question_generation':
      return 'haiku';  // Creative but simple

    case 'hint_generation':
      return 'haiku';  // Straightforward

    case 'feedback_simple_correct':
      return 'haiku';  // "Great job!" responses

    case 'feedback_detailed':
      return 'sonnet'; // Wrong answers need quality coaching

    case 'concept_explanation':
      return 'sonnet'; // Teaching needs nuance

    case 'warmup_analysis':
      return 'haiku';  // Pattern detection

    default:
      return 'sonnet';
  }
}
```

**Routing logic for feedback:**

```typescript
async function getFeedback(submission: Submission): Promise<Feedback> {
  const isCorrect = await checkCorrectness(submission); // Local check

  if (isCorrect && submission.complexity === 'simple') {
    // Use Haiku for simple correct answers
    return generateFeedback(submission, 'haiku');
  }

  // Use Sonnet for wrong answers or complex queries
  return generateFeedback(submission, 'sonnet');
}
```

**Savings:** 60-70% on non-critical paths.

#### 4. Enable Anthropic Prompt Caching

```typescript
// Cache system prompts across requests
const CACHED_SYSTEM_PROMPTS = {
  queryCoach: await loadAndCachePrompt('agents/querycoach/'),
  questionGen: await loadAndCachePrompt('agents/questiongen/'),
  hintGenerator: await loadAndCachePrompt('agents/hintgenerator/'),
};

// 90% discount on cached prompt tokens
```

#### 5. Tag Existing Questions by Concept

**One-time migration task:**

```typescript
// Current questions lack concept tagging
interface LegacyQuestion {
  id: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  hint: string;
}

// New structure with concept tags
interface TaggedQuestion {
  id: string;
  conceptIds: SkillId[];      // e.g., ['groupby', 'having']
  difficulty: Difficulty;
  question: string;
  hint: string;
  fingerprint: string;
}

// Use LLM to batch-tag existing 2,400 questions
// Then organize into concept-combo buckets
```

### Cost Projections (MVP)

| Users | Daily Submissions | Monthly Cost |
|-------|-------------------|--------------|
| 100   | 2,500             | ~$100-150    |
| 500   | 12,500            | ~$400-600    |
| 1,000 | 25,000            | ~$800-1,200  |

With full optimization vs. naive approach: **70-80% savings**.

---

## Monetization

### Tier Structure

| Feature | Free | Pro ($15/mo) | Interview ($30/mo) |
|---------|------|--------------|-------------------|
| Daily questions | 10 | Unlimited | Unlimited |
| Skill tree tracking | Session only | Persistent | Persistent |
| AI feedback quality | Basic | Detailed | Detailed |
| Hints per day | 3 | Unlimited | Unlimited |
| Ads | Yes | No | No |
| Progress history | No | Yes | Yes |
| Interview prep mode | No | No | Yes |
| Multiple schemas | No | No | Yes |
| Mock interviews | No | No | 5/month |
| Timed practice | No | No | Yes |

### Free Tier Limits

```typescript
const FREE_TIER_LIMITS = {
  questionsPerDay: 10,
  hintsPerDay: 3,
  feedbackDepth: 'basic',      // Truncated coaching
  skillTracking: 'session',    // Not persisted
  progressHistory: false,
  showAds: true,
};
```

### Ad Placement Strategy

```
┌─────────────────────────────────────────────────────────┐
│ [Skill Tree]    [Question Area]           [Ad Sidebar] │
│                                           ┌──────────┐ │
│  ● SELECT       Question text...          │  300x250 │ │
│  ○ JOINs                                  │   Ad     │ │
│                 [Monaco Editor]           └──────────┘ │
│                                                        │
│                 [Run] [Hint]                           │
│────────────────────────────────────────────────────────│
│ [Banner Ad - 728x90]                                   │
└────────────────────────────────────────────────────────┘
```

**Target advertisers:** Coding bootcamps, tech job boards, database tools, cloud training.

**Ad network recommendation:** Carbon Ads (developer-focused, tasteful).

### Upsell Triggers

```typescript
const UPSELL_TRIGGERS = {
  hitDailyLimit: {
    message: "You've used all 10 questions today. Upgrade for unlimited practice.",
    targetTier: 'pro',
  },
  wantProgress: {
    message: "Sign up to save your skill tree progress.",
    targetTier: 'pro',
  },
  reachProficiency70: {
    message: "You're interview ready! Unlock mock interviews and real company schemas.",
    targetTier: 'interview',
  },
  requestDetailedFeedback: {
    message: "Get detailed coaching on every answer with Pro.",
    targetTier: 'pro',
  },
};
```

### Interview Tier Premium Features

**Additional schemas (beyond e-commerce):**

1. **Social Media** (Meta/TikTok style)
   - users, posts, comments, likes, follows, stories

2. **Fintech** (Stripe/Square style)
   - accounts, transactions, merchants, disputes

3. **SaaS Metrics** (Amplitude style)
   - users, events, sessions, subscriptions

**Mock interview mode:**
- 15-20 minute timed scenarios
- Ambiguous questions requiring clarification
- Follow-up questions ("now modify to show...")
- Post-interview scoring and feedback

---

## Implementation Phases

### Phase 1: Skill Tree Foundation

**Goal:** Implement the skill tree data model and concept tagging system.

**Tasks:**

1. **Define skill tree schema**
   ```typescript
   // File: src/types/skills.ts

   type SkillTier = 'foundational' | 'intermediate' | 'advanced' | 'interview';

   interface Skill {
     id: string;
     name: string;
     tier: SkillTier;
     prerequisites: string[];  // Skill IDs that must be yellow+ first
     description: string;
   }

   interface SkillProgress {
     odId: string;
     score: number | null;     // null = gray (never attempted)
     attempts: number;
     lastPracticed: Date | null;
   }

   // Define all skills
   const SKILL_TREE: Skill[] = [
     // Foundational
     { id: 'select_where', name: 'SELECT & WHERE', tier: 'foundational', prerequisites: [], ... },
     { id: 'aggregations', name: 'Aggregations', tier: 'foundational', prerequisites: [], ... },
     { id: 'groupby_having', name: 'GROUP BY & HAVING', tier: 'foundational', prerequisites: ['aggregations'], ... },
     { id: 'basic_joins', name: 'Basic JOINs', tier: 'foundational', prerequisites: ['select_where'], ... },

     // Intermediate
     { id: 'multi_joins', name: 'Multi-table JOINs', tier: 'intermediate', prerequisites: ['basic_joins'], ... },
     { id: 'subqueries', name: 'Subqueries', tier: 'intermediate', prerequisites: ['select_where', 'aggregations'], ... },
     // ... etc
   ];
   ```

2. **Tag existing 2,400 questions by concept**
   - Create batch tagging script using Haiku
   - Map each question to 1-3 skill IDs
   - Store in new `conceptIds` field
   - Reorganize cache by concept combo keys

3. **Create skill tree UI component**
   ```typescript
   // File: src/components/SkillTree.tsx

   interface SkillTreeProps {
     skills: Skill[];
     progress: Record<string, SkillProgress>;
     onSkillClick?: (skillId: string) => void;
   }

   // Display skills organized by tier
   // Color-code by mastery level (gray/red/yellow/green)
   // Show prerequisites connections
   ```

4. **Implement proficiency score calculation**
   ```typescript
   // File: src/lib/proficiency.ts

   function calculateProficiency(progress: Record<string, SkillProgress>): number;
   function getSkillColor(score: number | null): 'gray' | 'red' | 'yellow' | 'green';
   function updateSkillScore(current: number, wasCorrect: boolean, usedHint: boolean): number;
   ```

5. **Add skill progress to session state**
   - Track skill deltas during session
   - Apply updates at session end
   - Store in localStorage for logged-out users (session only)

**Deliverables:**
- [ ] Skill tree type definitions
- [ ] All skills defined with prerequisites
- [ ] Question tagging migration complete
- [ ] Skill tree UI component
- [ ] Proficiency calculation utilities
- [ ] Session-based progress tracking

---

### Phase 2: Warm-Up & Adaptive Session

**Goal:** Implement the 3-question warm-up and adaptive question selection.

**Tasks:**

1. **Create warm-up flow**
   ```typescript
   // File: src/lib/warmup.ts

   interface WarmUpResult {
     questions: Question[];
     observations: WarmUpObservations;
   }

   async function generateWarmUp(progress: Record<string, SkillProgress>): Promise<WarmUpResult> {
     // Q1: Easy from a green skill (confidence)
     // Q2: Medium from a yellow skill (calibration)
     // Q3: Medium-hard from red/gray skill (probe)
   }

   function analyzeWarmUp(responses: WarmUpResponse[]): WarmUpObservations {
     // Detect: green struggles, red successes, speed patterns
     // Output focus recommendations
   }
   ```

2. **Implement adaptive question selection**
   ```typescript
   // File: src/lib/sessionManager.ts

   interface SessionState {
     warmUpComplete: boolean;
     warmUpObservations: WarmUpObservations;
     questionsAnswered: number;
     currentStreak: number;
     skillsToFocus: string[];
   }

   async function selectNextQuestion(
     state: SessionState,
     progress: Record<string, SkillProgress>
   ): Promise<Question> {
     // Priority: red > yellow > gray > green
     // Consider: warmup observations, current streak, concept mixing
     // Pull from cache, generate if needed
   }
   ```

3. **Add momentum detection**
   ```typescript
   // File: src/lib/momentum.ts

   function detectMomentum(recentResponses: Response[]): 'struggling' | 'steady' | 'crushing';
   function adjustDifficulty(current: Difficulty, momentum: Momentum): Difficulty;
   ```

4. **Create concept mixing logic**
   ```typescript
   // File: src/lib/conceptMixing.ts

   function shouldMixConcepts(progress: Record<string, SkillProgress>): boolean;
   function selectConceptsToMix(progress: Record<string, SkillProgress>): [string, string];
   ```

5. **Build session UI flow**
   - Warm-up phase indicator (1/3, 2/3, 3/3)
   - Transition to practice phase
   - Real-time skill tree updates
   - Session stats sidebar

6. **Session end summary**
   ```typescript
   // File: src/components/SessionSummary.tsx

   interface SessionSummaryProps {
     questionsAttempted: number;
     correctCount: number;
     skillDeltas: Record<string, number>;
     proficiencyDelta: number;
     badgesEarned: string[];
   }
   ```

**Deliverables:**
- [ ] Warm-up generation and analysis
- [ ] Adaptive question selection algorithm
- [ ] Momentum detection
- [ ] Concept mixing logic
- [ ] Session UI with warm-up flow
- [ ] Session summary component

---

### Phase 3: LLM Cost Optimization

**Goal:** Implement caching and model tiering to reduce costs.

**Tasks:**

1. **Reorganize question cache by concept**
   ```typescript
   // File: src/lib/questionCache.ts

   interface ConceptQuestionCache {
     get(conceptCombo: string): Promise<CachedQuestion[]>;
     append(conceptCombo: string, question: CachedQuestion): Promise<void>;
     getUnseenForUser(conceptCombo: string, seenIds: string[]): Promise<CachedQuestion | null>;
   }

   // Migrate from flat list to concept-keyed structure
   // data/questions.json → data/questions/{conceptCombo}.json
   ```

2. **Pre-generate questions to fill gaps**
   ```typescript
   // File: scripts/pregenerateQuestions.ts

   // Generate questions for all single concepts (10 each)
   // Generate questions for high-value concept pairs (5 each)
   // Target: 4,000+ total questions
   ```

3. **Implement model tiering**
   ```typescript
   // File: src/lib/llm.ts

   type ModelTier = 'haiku' | 'sonnet';

   function selectModel(task: string, context: object): ModelTier;

   async function callLLM(
     prompt: string,
     tier: ModelTier,
     options?: LLMOptions
   ): Promise<string>;
   ```

4. **Add correctness pre-check**
   ```typescript
   // File: src/lib/correctness.ts

   // Check if query result matches expected before calling LLM
   // Route simple correct answers to Haiku
   async function checkCorrectness(
     userResult: QueryResult,
     expectedResultHash: string
   ): Promise<boolean>;
   ```

5. **Enable Anthropic prompt caching**
   - Cache system prompts for each agent
   - Reuse cached prompts across requests

6. **Add question generation fallback**
   ```typescript
   // When cache miss: generate, save, and serve
   async function getOrGenerateQuestion(
     conceptCombo: string,
     seenIds: string[]
   ): Promise<Question> {
     const cached = await cache.getUnseenForUser(conceptCombo, seenIds);
     if (cached) return cached;

     const generated = await generateQuestion(conceptCombo);
     await cache.append(conceptCombo, generated);
     return generated;
   }
   ```

**Deliverables:**
- [ ] Concept-keyed question cache
- [ ] Question pre-generation script
- [ ] Model tiering implementation
- [ ] Correctness pre-check
- [ ] Prompt caching enabled
- [ ] Generate-and-cache fallback

---

### Phase 4: User Accounts & Persistence

**Goal:** Add authentication and persistent progress tracking.

**Tasks:**

1. **Add authentication**
   ```typescript
   // Options: NextAuth.js, Clerk, or simple email/password
   // Minimum: email + password, Google OAuth

   interface User {
     id: string;
     email: string;
     createdAt: Date;
     tier: 'free' | 'pro' | 'interview';
   }
   ```

2. **Create user progress storage**
   ```typescript
   // File: src/lib/userProgress.ts

   interface UserProgress {
     odId: string visibleSkills: Record<string, SkillProgress>;
     proficiencyScore: number;
     totalQuestionsAnswered: number;
     seenQuestionIds: string[];
     badges: string[];
     interviewPrepUnlocked: boolean;
     lastSessionAt: Date;
   }

   // Storage: PostgreSQL, Supabase, or PlanetScale
   ```

3. **Implement progress sync**
   ```typescript
   // Sync session progress to database at session end
   async function syncProgress(
     odId: string visibleState: SessionState,
     deltas: SkillDeltas
   ): Promise<void>;
   ```

4. **Add session limits for free tier**
   ```typescript
   // File: src/middleware/rateLimits.ts

   const FREE_LIMITS = {
     questionsPerDay: 10,
     hintsPerDay: 3,
   };

   async function checkLimits(userId: string | null): Promise<LimitStatus>;
   ```

5. **Implement skill decay**
   ```typescript
   // Run daily or on session start
   function applySkillDecay(progress: Record<string, SkillProgress>): Record<string, SkillProgress> {
     // -2 points per week inactive per skill
   }
   ```

**Deliverables:**
- [ ] Authentication system
- [ ] User progress database schema
- [ ] Progress sync on session end
- [ ] Free tier rate limiting
- [ ] Skill decay implementation

---

### Phase 5: Monetization Infrastructure

**Goal:** Implement ads, subscriptions, and upsell flows.

**Tasks:**

1. **Add ad placements**
   ```typescript
   // File: src/components/AdUnit.tsx

   // Integrate Carbon Ads or AdSense
   // Placements: sidebar (300x250), footer (728x90)
   // Only show for free tier users
   ```

2. **Implement Stripe subscriptions**
   ```typescript
   // File: src/lib/stripe.ts

   // Products: Pro ($15/mo), Interview ($30/mo)
   // Support monthly and annual billing
   // Webhook handlers for subscription events
   ```

3. **Create upsell components**
   ```typescript
   // File: src/components/Upsell.tsx

   // Trigger points:
   // - Daily limit reached
   // - Hint limit reached
   // - 70% proficiency (interview prep unlock)
   // - Request detailed feedback
   ```

4. **Add tier-based feature flags**
   ```typescript
   // File: src/lib/features.ts

   function canAccessFeature(user: User, feature: string): boolean;

   const TIER_FEATURES = {
     free: ['basic_practice', 'basic_feedback', 'session_progress'],
     pro: ['unlimited_practice', 'detailed_feedback', 'persistent_progress', 'no_ads'],
     interview: ['...pro', 'interview_prep', 'mock_interviews', 'multiple_schemas'],
   };
   ```

5. **Implement upgrade flow**
   ```typescript
   // File: src/components/UpgradeModal.tsx

   // Show pricing comparison
   // Stripe Checkout integration
   // Success/cancel handling
   ```

**Deliverables:**
- [ ] Ad integration (Carbon Ads)
- [ ] Stripe subscription setup
- [ ] Upsell trigger components
- [ ] Feature flag system
- [ ] Upgrade modal and flow

---

### Phase 6: Interview Prep Mode (Premium)

**Goal:** Build the premium interview preparation features.

**Tasks:**

1. **Create additional schemas**
   ```sql
   -- Social Media Schema
   CREATE TABLE users (id, username, created_at, ...);
   CREATE TABLE posts (id, user_id, content, created_at, ...);
   CREATE TABLE likes (user_id, post_id, created_at);
   CREATE TABLE follows (follower_id, following_id, created_at);

   -- Fintech Schema
   CREATE TABLE accounts (id, user_id, type, balance, ...);
   CREATE TABLE transactions (id, account_id, amount, type, ...);
   CREATE TABLE merchants (id, name, category, ...);

   -- SaaS Schema
   CREATE TABLE users (id, email, plan, created_at, ...);
   CREATE TABLE events (id, user_id, event_type, properties, ...);
   CREATE TABLE subscriptions (id, user_id, plan, status, ...);
   ```

2. **Add schema switcher UI**
   ```typescript
   // File: src/components/SchemaSwitcher.tsx

   // Allow interview tier users to switch schemas
   // Load appropriate sample data
   // Update question generation context
   ```

3. **Implement interview pattern questions**
   ```typescript
   // File: data/interviewPatterns.ts

   // Curated questions for each pattern:
   // - Retention/Cohort analysis
   // - Funnel analysis
   // - MoM growth
   // - DAU/MAU
   // - Attribution
   // - A/B test analysis
   ```

4. **Build mock interview mode**
   ```typescript
   // File: src/components/MockInterview.tsx

   interface MockInterview {
     timeLimit: number;        // 15-20 minutes
     questions: Question[];    // 3-4 questions with follow-ups
     schema: Schema;
     scoring: InterviewScore;
   }

   // Timer UI
   // Question progression
   // Follow-up question generation
   // Final scoring and feedback
   ```

5. **Create interview scoring rubric**
   ```typescript
   // File: src/lib/interviewScoring.ts

   interface InterviewScore {
     correctness: number;      // Did queries work?
     efficiency: number;       // Were queries optimal?
     communication: number;    // Did they clarify requirements?
     edgeCases: number;        // Did they handle NULLs, etc?
     overall: number;
     feedback: string;
   }
   ```

**Deliverables:**
- [ ] 3 additional schemas with sample data
- [ ] Schema switcher UI
- [ ] Interview pattern question bank
- [ ] Mock interview mode
- [ ] Interview scoring system

---

## Data Models Summary

```typescript
// Core Types

interface Skill {
  id: string;
  name: string;
  tier: 'foundational' | 'intermediate' | 'advanced' | 'interview';
  prerequisites: string[];
  description: string;
}

interface SkillProgress {
  skillId: string;
  score: number | null;        // null = never attempted
  attempts: number;
  lastPracticed: Date | null;
}

interface CachedQuestion {
  id: string;
  conceptIds: string[];        // Skill IDs this tests
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  hint: string;
  expectedResultHash: string;
  generatedAt: Date;
}

interface User {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'interview';
  createdAt: Date;
}

interface UserProgress {
  odId: string visibleskills: Record<string, SkillProgress>;
  proficiencyScore: number;
  totalQuestions: number;
  seenQuestionIds: string[];
  badges: string[];
  lastSessionAt: Date;
}

interface SessionState {
  odId: string | null;
  warmUpComplete: boolean;
  warmUpObservations: WarmUpObservations;
  questionsAnswered: number;
  correctCount: number;
  currentStreak: number;
  skillDeltas: Record<string, number>;
}

interface WarmUpObservations {
  greenSkillStruggle: boolean;
  redSkillSuccess: boolean;
  responseSpeed: 'slow' | 'normal' | 'fast';
  overallReadiness: 'rusty' | 'sharp' | 'mixed';
  suggestedFocus: string[];
}
```

---

## Success Metrics

### Phase 1-2 (Learning Experience)
- Session completion rate > 70%
- Questions per session average > 8
- Return user rate > 40%

### Phase 3 (Cost)
- LLM cost per user per month < $0.50
- Cache hit rate > 80%

### Phase 4-5 (Monetization)
- Free to Pro conversion > 5%
- Pro to Interview conversion > 20%
- Monthly churn < 10%

### Phase 6 (Interview Prep)
- Mock interview completion rate > 80%
- User-reported interview success rate > 60%

---

## Timeline Estimate

| Phase | Scope | Complexity |
|-------|-------|------------|
| Phase 1 | Skill Tree Foundation | Medium |
| Phase 2 | Warm-Up & Adaptive Session | High |
| Phase 3 | LLM Cost Optimization | Medium |
| Phase 4 | User Accounts & Persistence | Medium |
| Phase 5 | Monetization Infrastructure | Medium |
| Phase 6 | Interview Prep Mode | High |

---

## Open Questions

1. **Database choice:** PostgreSQL vs. Supabase vs. PlanetScale?
2. **Auth provider:** NextAuth vs. Clerk vs. custom?
3. **Ad network:** Carbon Ads vs. direct sales vs. AdSense?
4. **Skill decay:** Apply on login or background job?
5. **Question deduplication:** How to prevent near-duplicate questions in cache?
