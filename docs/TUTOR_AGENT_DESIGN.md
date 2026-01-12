# Tutor Agent Design Document

> **Purpose**: This document captures the design for evolving Query Coach from reactive LLM-powered features into a genuine learning agent. It serves as a starting point for implementation.

## Table of Contents
1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Agent Sophistication Levels](#agent-sophistication-levels)
3. [The Tutor Agent Concept](#the-tutor-agent-concept)
4. [Data Structures](#data-structures)
5. [Curriculum Graph](#curriculum-graph)
6. [Agent Definition](#agent-definition)
7. [Orchestration Code](#orchestration-code)
8. [Reasoning Examples](#reasoning-examples)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Current Architecture Analysis

### What We Have

The current Query Coach uses three specialized agents:

| Agent | Purpose | Location |
|-------|---------|----------|
| **QuestionGen** | Generates SQL practice questions | `agents/questiongen/` |
| **QueryCoach** | Reviews user queries, provides feedback | `agents/querycoach/` |
| **HintGenerator** | Creates "almost correct" SQL as hints | `agents/hintgenerator/` |

Each agent follows a modular structure:
- `AGENT.md` — Core role and instructions
- `RULES.md` — Behavioral constraints
- `SKILLS.md` — Capability descriptions
- `examples/` — Few-shot learning examples by difficulty

### Architecture Pattern

```
System prompt = AGENT + RULES + SKILLS + Examples
User message = Schema + Question + Query + Result + Level
→ Single LLM call
→ Parse response
```

This is the **"prompt template" pattern** — the workhorse of 90%+ of production LLM applications.

### What's Missing for True Agency

| Capability | Current State | Agentic Pattern |
|------------|---------------|-----------------|
| **Tool use** | Agents receive data, don't request it | Agent decides what tools to call |
| **Memory** | Stateless per request | Persistent student model |
| **Self-correction** | None | Validate outputs, retry if wrong |
| **Planning** | None | Decompose goals into sub-goals |
| **Multi-agent coordination** | Independent agents | Agents communicate and delegate |

---

## Agent Sophistication Levels

### Level 0: Prompt Templates (Current)
- Pre-structured prompts with variable substitution
- Single LLM call, deterministic flow
- Human orchestrates, LLM generates

### Level 1: Tool-Using Agents
- LLM can invoke functions/tools
- Still single-turn, but LLM chooses which tools
- Example: LLM decides whether to run SQL, look up docs, or ask clarifying question

### Level 2: Iterative Agents
- Multi-turn reasoning loops
- Agent acts → observes → reasons → acts again
- Example: Agent writes SQL, runs it, sees error, fixes it, runs again

### Level 3: Planning Agents ← **Target for Tutor Agent**
- Explicit goal decomposition
- Creates a plan, executes steps, revises plan based on outcomes
- Example: "Teach this user SQL" becomes: assess level → generate question → evaluate answer → adjust difficulty → repeat

### Level 4: Multi-Agent Systems
- Multiple specialized agents collaborating
- Tutor asks QueryCoach for assessment, QuestionGen for content, etc.
- Agents negotiate and coordinate

### Level 5: Autonomous Agents
- Long-running, goal-directed behavior
- Self-improvement, learning from experience
- Current research frontier

---

## The Tutor Agent Concept

### Core Idea

Transform from **reactive** (user asks → system responds) to **goal-directed** (agent pursues student proficiency).

```
Current Flow:
  User → "Give me a question" → QuestionGen → Question
  User → "Check my answer" → QueryCoach → Feedback
  (User decides what to do next)

Agentic Flow:
  TutorAgent observes → reasons → decides → acts
  ↓
  "User got JOINs wrong 3 times. Should I:
   - Give an easier JOIN question?
   - Explain JOINs conceptually first?
   - Backtrack to table relationships?
   - Try a different JOIN type?"
  ↓
  Agent decides, then invokes appropriate sub-agent
```

### Mental Models a Tutor Maintains

| Mental Model | What It Tracks | Example |
|--------------|----------------|---------|
| **Student Model** | What does this learner know? | "Understands WHERE, struggles with GROUP BY" |
| **Curriculum Model** | What concepts exist and how do they relate? | "JOINs require understanding foreign keys first" |
| **Pedagogical Model** | How do we teach effectively? | "After 2 failures, scaffold; after 3, teach directly" |
| **Session State** | What's happening right now? | "Testing aggregation, user seems frustrated" |

### What Makes It Agentic

1. **Goals** that persist across interactions
2. **Models** of the world (student, curriculum)
3. **Autonomy** to decide actions
4. **Adaptation** based on observations

---

## Data Structures

### Core Types

```typescript
// lib/tutor-types.ts

export interface ConceptMastery {
  concept: string;
  exposures: number;
  successes: number;
  lastAttempt: Date | null;
  masteryLevel: number;  // 0.0 to 1.0
  commonMistakes: string[];
  needsReinforcement: boolean;
}

export interface StudentModel {
  userId: string;
  concepts: Record<string, ConceptMastery>;
  overallLevel: 'beginner' | 'intermediate' | 'advanced';
  learningVelocity: number;  // How fast they're progressing
  sessionCount: number;
  totalQuestionsAttempted: number;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];  // concept IDs that must be learned first
  relatedConcepts: string[];  // concepts that combine well
}

export interface SessionState {
  currentConcept: string | null;
  questionsThisSession: number;
  recentAttempts: Array<{
    concept: string;
    success: boolean;
    errorType?: string;
  }>;
  mode: 'testing' | 'teaching' | 'reinforcing' | 'connecting';
  consecutiveFailures: number;
}

export interface TutorAction {
  type: 'ask_question' | 'teach_concept' | 'give_hint' |
        'celebrate_mastery' | 'suggest_break' | 'address_mistake' |
        'reinforce_connection';
  concept: string;
  difficulty?: string;
  constraints?: string[];
  message?: string;
}
```

---

## Curriculum Graph

### SQL Concept Hierarchy

```typescript
// lib/curriculum.ts

export const SQL_CURRICULUM: Concept[] = [
  // === BEGINNER ===
  {
    id: 'select_basic',
    name: 'Basic SELECT',
    description: 'Selecting columns from a single table',
    difficulty: 'beginner',
    prerequisites: [],
    relatedConcepts: ['where_basic']
  },
  {
    id: 'where_basic',
    name: 'WHERE Clauses',
    description: 'Filtering rows with simple conditions',
    difficulty: 'beginner',
    prerequisites: ['select_basic'],
    relatedConcepts: ['where_compound']
  },
  {
    id: 'order_limit',
    name: 'ORDER BY and LIMIT',
    description: 'Sorting and limiting results',
    difficulty: 'beginner',
    prerequisites: ['select_basic'],
    relatedConcepts: ['aggregation_basic']
  },
  {
    id: 'aggregation_basic',
    name: 'Basic Aggregation',
    description: 'COUNT, SUM, AVG on full tables',
    difficulty: 'beginner',
    prerequisites: ['select_basic'],
    relatedConcepts: ['group_by']
  },

  // === INTERMEDIATE ===
  {
    id: 'where_compound',
    name: 'Compound WHERE',
    description: 'AND, OR, IN, BETWEEN conditions',
    difficulty: 'intermediate',
    prerequisites: ['where_basic'],
    relatedConcepts: ['join_inner']
  },
  {
    id: 'group_by',
    name: 'GROUP BY',
    description: 'Grouping rows for aggregation',
    difficulty: 'intermediate',
    prerequisites: ['aggregation_basic'],
    relatedConcepts: ['having']
  },
  {
    id: 'having',
    name: 'HAVING Clauses',
    description: 'Filtering groups after aggregation',
    difficulty: 'intermediate',
    prerequisites: ['group_by'],
    relatedConcepts: ['subquery_where']
  },
  {
    id: 'join_inner',
    name: 'INNER JOIN',
    description: 'Combining rows from two tables',
    difficulty: 'intermediate',
    prerequisites: ['where_basic'],
    relatedConcepts: ['join_left', 'join_multiple']
  },
  {
    id: 'join_left',
    name: 'LEFT JOIN',
    description: 'Including unmatched rows',
    difficulty: 'intermediate',
    prerequisites: ['join_inner'],
    relatedConcepts: ['negation_queries']
  },

  // === ADVANCED ===
  {
    id: 'join_multiple',
    name: 'Multiple JOINs',
    description: 'Joining 3+ tables',
    difficulty: 'advanced',
    prerequisites: ['join_inner'],
    relatedConcepts: ['subquery_where']
  },
  {
    id: 'subquery_where',
    name: 'Subqueries in WHERE',
    description: 'Nested queries for filtering',
    difficulty: 'advanced',
    prerequisites: ['where_compound', 'aggregation_basic'],
    relatedConcepts: ['subquery_correlated']
  },
  {
    id: 'negation_queries',
    name: 'Negation Queries',
    description: "Finding rows that DON'T match",
    difficulty: 'advanced',
    prerequisites: ['join_left', 'subquery_where'],
    relatedConcepts: []
  },
  {
    id: 'subquery_correlated',
    name: 'Correlated Subqueries',
    description: 'Subqueries referencing outer query',
    difficulty: 'advanced',
    prerequisites: ['subquery_where'],
    relatedConcepts: []
  }
];

// Helper: Get concepts student is ready to learn
export function getReadyConcepts(student: StudentModel): Concept[] {
  return SQL_CURRICULUM.filter(concept => {
    const mastery = student.concepts[concept.id];
    const notMastered = !mastery || mastery.masteryLevel < 0.8;
    const prerequisitesMet = concept.prerequisites.every(prereq => {
      const prereqMastery = student.concepts[prereq];
      return prereqMastery && prereqMastery.masteryLevel >= 0.7;
    });
    return notMastered && prerequisitesMet;
  });
}
```

### Visual Concept Map

```
select_basic (beginner)
    ├── where_basic (beginner)
    │       └── where_compound (intermediate)
    │               └── subquery_where (advanced)
    │                       └── subquery_correlated (advanced)
    │
    ├── order_limit (beginner)
    │
    └── aggregation_basic (beginner)
            └── group_by (intermediate)
                    └── having (intermediate)

join_inner (intermediate) ← requires where_basic
    ├── join_left (intermediate)
    │       └── negation_queries (advanced) ← also requires subquery_where
    │
    └── join_multiple (advanced)
```

---

## Agent Definition

Create this file at `agents/tutor/AGENT.md`:

```markdown
# TutorAgent

You are TutorAgent, an expert SQL teacher. Your goal is to guide a student
toward SQL proficiency through adaptive, personalized instruction.

## Your Role

You observe the student's current state, reason about the best pedagogical
approach, and decide what action to take next. You are not just answering
questions—you are actively teaching, with a plan.

## Context You Receive

Each turn, you receive:
- `<student_model>`: The student's mastery levels across SQL concepts
- `<curriculum>`: Available concepts and their prerequisites
- `<session_state>`: What's happened this session (recent attempts, current mode)
- `<last_interaction>`: The student's most recent attempt (if any)

## Your Decision Process

You must THINK before acting. Use this structure:

<reasoning>
**Observation**: What just happened? How did the student perform?

**Student State**: What does their model tell me? Strengths? Weaknesses? Patterns?

**Pedagogical Assessment**:
- Are they ready for new material, or struggling with current?
- Are they frustrated (consecutive failures) or confident?
- Is there a pattern in their mistakes I should address?

**Options Considered**:
1. [Option] - [Why it might be good] - [Why it might not be]
2. [Option] - [Why it might be good] - [Why it might not be]

**Decision**: [What I'll do and why]
</reasoning>

Then output your action as structured JSON.

## Available Actions

### ask_question
Test the student on a concept. Use when they're ready to be challenged.
```json
{
  "type": "ask_question",
  "concept": "join_inner",
  "constraints": ["use customers and orders tables", "keep it simple"]
}
```

### teach_concept
Explain a concept directly. Use when struggling or encountering something new.
```json
{
  "type": "teach_concept",
  "concept": "join_left",
  "message": "Your explanation here, tailored to their level..."
}
```

### reinforce_connection
Show how concepts work together. Use when they've mastered components.
```json
{
  "type": "reinforce_connection",
  "concepts": ["group_by", "having"],
  "message": "Now let's see how these combine..."
}
```

### address_mistake
Directly address a pattern of errors you've noticed.
```json
{
  "type": "address_mistake",
  "concept": "join_inner",
  "mistake_pattern": "confusing join types",
  "message": "I've noticed you're mixing up JOIN types. Let me clarify..."
}
```

### celebrate_progress
Acknowledge mastery. Important for motivation.
```json
{
  "type": "celebrate_progress",
  "concept": "group_by",
  "message": "You've got GROUP BY down solid! Ready for a new challenge?"
}
```

## Pedagogical Principles

1. **Mastery before advancement**: Don't introduce new concepts until
   prerequisites are solid (>0.7 mastery)

2. **Struggle is okay, frustration is not**: 1-2 failures are learning
   opportunities. 3+ consecutive failures means switch to teaching mode.

3. **Spaced reinforcement**: Concepts with masteryLevel 0.7-0.85 that
   haven't been tested recently should be revisited.

4. **Connect the dots**: When multiple concepts are mastered, create
   opportunities to combine them.

5. **Name the pattern**: If you see recurring mistakes, address them
   explicitly rather than hoping repetition helps.

6. **Match their energy**: Confident students can handle harder jumps.
   Struggling students need smaller steps.
```

---

## Orchestration Code

### Tutor Orchestrator

```typescript
// lib/tutor-orchestrator.ts

import { StudentModel, SessionState, TutorAction } from './tutor-types';
import { SQL_CURRICULUM, getReadyConcepts } from './curriculum';
import { generateCompletion } from './anthropic';
import { readFileSync } from 'fs';
import path from 'path';

function loadTutorAgent(): string {
  return readFileSync(
    path.join(process.cwd(), 'agents', 'tutor', 'AGENT.md'),
    'utf-8'
  );
}

function buildTutorContext(
  student: StudentModel,
  session: SessionState,
  lastAttempt?: { question: string; query: string; correct: boolean; feedback: string }
): string {

  const readyConcepts = getReadyConcepts(student);
  const strugglingConcepts = Object.entries(student.concepts)
    .filter(([_, m]) => m.exposures > 2 && m.masteryLevel < 0.5)
    .map(([id]) => id);

  const recentPerformance = session.recentAttempts.slice(-5);
  const recentSuccessRate = recentPerformance.length > 0
    ? recentPerformance.filter(a => a.success).length / recentPerformance.length
    : null;

  let context = `
<student_model>
Overall Level: ${student.overallLevel}
Sessions Completed: ${student.sessionCount}
Total Questions Attempted: ${student.totalQuestionsAttempted}

Concept Mastery:
${Object.entries(student.concepts)
  .map(([id, m]) =>
    `- ${id}: ${(m.masteryLevel * 100).toFixed(0)}% ` +
    `(${m.exposures} attempts, ${m.successes} correct)` +
    `${m.commonMistakes.length > 0 ? ` [Mistakes: ${m.commonMistakes.join(', ')}]` : ''}`
  ).join('\n')}

Struggling with: ${strugglingConcepts.join(', ') || 'none'}
</student_model>

<curriculum>
Concepts ready to learn (prerequisites met, not yet mastered):
${readyConcepts.map(c => `- ${c.id}: ${c.name} (${c.difficulty})`).join('\n')}
</curriculum>

<session_state>
Current mode: ${session.mode}
Questions this session: ${session.questionsThisSession}
Consecutive failures: ${session.consecutiveFailures}
Recent success rate: ${recentSuccessRate !== null ? `${(recentSuccessRate * 100).toFixed(0)}%` : 'N/A'}
</session_state>
`;

  if (lastAttempt) {
    context += `
<last_interaction>
Question: ${lastAttempt.question}
Student's query: ${lastAttempt.query}
Result: ${lastAttempt.correct ? 'CORRECT' : 'INCORRECT'}
Feedback given: ${lastAttempt.feedback}
</last_interaction>
`;
  } else {
    context += `
<last_interaction>
Session start. No previous attempts yet.
</last_interaction>
`;
  }

  context += `\nReason through what the student needs and decide your next action.`;
  return context;
}

export async function getTutorDecision(
  student: StudentModel,
  session: SessionState,
  lastAttempt?: { question: string; query: string; correct: boolean; feedback: string }
): Promise<{ reasoning: string; action: TutorAction }> {

  const systemPrompt = loadTutorAgent();
  const userMessage = buildTutorContext(student, session, lastAttempt);

  const response = await generateCompletion(systemPrompt, userMessage, 2000);

  // Parse reasoning
  const reasoningMatch = response.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';

  // Parse JSON action
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    || response.match(/\{[\s\S]*"type"[\s\S]*\}/);

  let action: TutorAction;
  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    action = JSON.parse(jsonStr);
  } else {
    // Fallback
    const readyConcepts = getReadyConcepts(student);
    action = {
      type: 'ask_question',
      concept: readyConcepts[0]?.id || 'select_basic'
    };
  }

  return { reasoning, action };
}
```

### Session Manager

```typescript
// lib/tutor-session.ts

import { getTutorDecision } from './tutor-orchestrator';
import { getQueryFeedback } from './orchestrator';
import { generateQuestion } from './question-generator';
import { StudentModel, SessionState, TutorAction } from './tutor-types';

export class TutorSession {
  private student: StudentModel;
  private session: SessionState;
  private schema: string;

  constructor(student: StudentModel, schema: string) {
    this.student = student;
    this.schema = schema;
    this.session = {
      currentConcept: null,
      questionsThisSession: 0,
      recentAttempts: [],
      mode: 'testing',
      consecutiveFailures: 0
    };
  }

  async getNextTutorMove(
    lastAttempt?: { question: string; query: string; correct: boolean; feedback: string }
  ): Promise<{ reasoning: string; action: TutorAction; content: string }> {

    // Update session state from last attempt
    if (lastAttempt) {
      this.session.recentAttempts.push({
        concept: this.session.currentConcept!,
        success: lastAttempt.correct
      });

      this.session.consecutiveFailures = lastAttempt.correct
        ? 0
        : this.session.consecutiveFailures + 1;

      // Update student model
      this.updateStudentModel(lastAttempt.correct);
    }

    // Get tutor's decision
    const { reasoning, action } = await getTutorDecision(
      this.student,
      this.session,
      lastAttempt
    );

    // Execute the action
    const content = await this.executeAction(action);

    return { reasoning, action, content };
  }

  private updateStudentModel(correct: boolean): void {
    const concept = this.session.currentConcept;
    if (!concept) return;

    if (!this.student.concepts[concept]) {
      this.student.concepts[concept] = {
        concept,
        exposures: 0,
        successes: 0,
        lastAttempt: null,
        masteryLevel: 0,
        commonMistakes: [],
        needsReinforcement: false
      };
    }

    const mastery = this.student.concepts[concept];
    mastery.exposures++;
    if (correct) mastery.successes++;
    mastery.lastAttempt = new Date();

    // Simple mastery calculation (could be more sophisticated)
    mastery.masteryLevel = mastery.successes / mastery.exposures;
  }

  private async executeAction(action: TutorAction): Promise<string> {
    switch (action.type) {
      case 'ask_question':
        this.session.currentConcept = action.concept;
        this.session.questionsThisSession++;
        this.session.mode = 'testing';

        const question = await generateQuestion({
          schema: this.schema,
          difficulty: this.student.overallLevel,
          // conceptFocus: action.concept,  // Would need to extend generateQuestion
          // constraints: action.constraints
        });
        return question;

      case 'teach_concept':
      case 'celebrate_progress':
      case 'address_mistake':
      case 'reinforce_connection':
        this.session.mode = 'teaching';
        return action.message || `Let's work on ${action.concept}...`;

      default:
        return 'Let\'s continue practicing.';
    }
  }
}
```

---

## Reasoning Examples

### Example A: Student Struggling with JOINs

```markdown
<reasoning>
**Observation**: Student got another JOIN question wrong. They wrote
`SELECT * FROM customers, orders WHERE customers.id = orders.customer_id`
instead of explicit JOIN syntax. 3rd consecutive failure on join_inner.

**Student State**:
- join_inner mastery: 35% (5 attempts, 2 correct)
- Prerequisites solid: select_basic 95%, where_basic 88%
- Common mistakes: "implicit join syntax", "missing ON clause"
- consecutiveFailures: 3

**Pedagogical Assessment**:
- They understand combining tables but haven't internalized syntax
- 3 consecutive failures = frustration threshold
- Pattern: using old comma-join syntax
- Testing more won't help; need direct instruction

**Options Considered**:
1. Ask another JOIN question - No, frustrated, repeating same mistake
2. Give hint and retry - No, hints haven't helped; gap is fundamental
3. Teach JOIN syntax directly - Yes, address root cause
4. Move to different concept - No, JOINs blocking curriculum

**Decision**: Switch to teaching mode. Explain modern JOIN syntax vs
comma syntax, show pattern, then ONE simple practice question on syntax.
</reasoning>

{
  "type": "teach_concept",
  "concept": "join_inner",
  "message": "I notice you're using the older comma-join style..."
}
```

### Example B: Student Ready for Advancement

```markdown
<reasoning>
**Observation**: Student correctly answered a GROUP BY question with
tricky HAVING clause. 4th consecutive success on group_by.

**Student State**:
- group_by: 82% - just crossed mastery threshold
- having: 78% - solid
- join_inner: 75% - adequate
- consecutiveFailures: 0, recent success rate: 100%

**Pedagogical Assessment**:
- Student confident, on a roll
- GROUP BY + HAVING now mastered
- Opens up: subquery_where, or connect GROUP BY + JOIN
- Ready for challenge

**Options Considered**:
1. Continue GROUP BY - No, mastered, would bore them
2. Introduce subqueries - Big jump, maybe later
3. Connect GROUP BY + JOIN - Yes, builds momentum, connects concepts
4. Review older concepts - Not needed

**Decision**: Celebrate GROUP BY mastery, then combine JOIN with
GROUP BY to reinforce both and show real-world applicability.
</reasoning>

{
  "type": "celebrate_progress",
  "concept": "group_by",
  "message": "You've really nailed GROUP BY and HAVING..."
}
```

### Example C: Session Start, Returning Student

```markdown
<reasoning>
**Observation**: New session. Student returning after previous sessions.

**Student State**:
- 5 sessions, 47 questions attempted
- Strong: select_basic (95%), where_basic (90%), aggregation_basic (85%)
- Moderate: group_by (68%), join_inner (71%)
- Weak: join_left (40%, 3 attempts), having (52%)
- join_left last tested 5 days ago

**Pedagogical Assessment**:
- join_left undertested, stale - spaced repetition says revisit
- group_by close to mastery - could push over
- Session start = set positive tone, don't start with failure risk

**Options Considered**:
1. New material - No, warm up first
2. Start with join_left (weak) - Risky, could discourage
3. Start with group_by (almost mastered) - Yes, build confidence
4. Review basics - Unnecessary

**Decision**: Warm start with group_by. Success = mastery celebration.
Then tackle join_left with scaffolding.
</reasoning>

{
  "type": "ask_question",
  "concept": "group_by",
  "constraints": ["intermediate difficulty", "include HAVING"]
}
```

---

## Implementation Roadmap

### Phase 1: Foundation
- [ ] Create `lib/tutor-types.ts` with data structures
- [ ] Create `lib/curriculum.ts` with concept graph
- [ ] Create `agents/tutor/AGENT.md` with agent definition
- [ ] Add student model persistence (localStorage or database)

### Phase 2: Core Loop
- [ ] Create `lib/tutor-orchestrator.ts`
- [ ] Create `lib/tutor-session.ts`
- [ ] Add API route `app/api/tutor/route.ts`
- [ ] Extend `generateQuestion` to accept concept constraints

### Phase 3: UI Integration
- [ ] Create tutor mode toggle in UI
- [ ] Display tutor reasoning (optional, for transparency)
- [ ] Show student progress/mastery dashboard
- [ ] Add session history view

### Phase 4: Refinement
- [ ] Improve mastery calculation (weighted recency, difficulty)
- [ ] Add mistake pattern detection
- [ ] Implement spaced repetition algorithm
- [ ] Add "explain your teaching" mode for debugging

### Phase 5: Enhancement
- [ ] Multi-concept questions (connections)
- [ ] Adaptive difficulty within concepts
- [ ] Learning velocity detection
- [ ] Session goal planning at start

---

## Key Design Decisions to Make

1. **Persistence**: Where to store student model? (localStorage, database, API)

2. **Mastery algorithm**: Simple ratio vs. weighted recency vs. spaced repetition

3. **Reasoning visibility**: Show tutor reasoning to student? (transparency vs. clutter)

4. **Fallback behavior**: What if LLM returns malformed action?

5. **Concept granularity**: Current 14 concepts enough? Too many? Too few?

6. **Session length**: How many questions per session? Time-based or count-based?

---

## References

- Current agent implementations: `agents/questiongen/`, `agents/querycoach/`, `agents/hintgenerator/`
- Orchestration pattern: `lib/orchestrator.ts`
- Question generation: `lib/question-generator.ts`
