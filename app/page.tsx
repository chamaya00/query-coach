"use client";

import { useState, useEffect, useCallback } from "react";
import SQLEditor from "@/components/SQLEditor";
import TableBrowser from "@/components/TableBrowser";
import FeedbackPanel from "@/components/FeedbackPanel";
import SkillTree, { SkillProgressBar } from "@/components/SkillTree";
import { UserLevel, CoachResponse } from "@/lib/types";
import { useSkillProgress, BADGES } from "@/lib/skills";

const DEFAULT_SCHEMA = `-- E-commerce sample database
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  region TEXT,
  created_at DATE
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_date DATE,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2)
);

-- Sample data: Customers
INSERT INTO customers (id, name, email, region, created_at) VALUES
  (1, 'Alice Johnson', 'alice@email.com', 'West', '2023-01-15'),
  (2, 'Bob Smith', 'bob@email.com', 'East', '2023-02-20'),
  (3, 'Carol Williams', 'carol@email.com', 'West', '2023-03-10'),
  (4, 'David Brown', 'david@email.com', 'Central', '2023-04-05'),
  (5, 'Eve Davis', 'eve@email.com', 'East', '2023-05-12');

-- Sample data: Products
INSERT INTO products (id, name, category, price, stock_quantity) VALUES
  (1, 'Laptop Pro', 'Electronics', 1299.99, 50),
  (2, 'Wireless Mouse', 'Electronics', 29.99, 200),
  (3, 'Coffee Maker', 'Appliances', 89.99, 75),
  (4, 'Running Shoes', 'Sports', 119.99, 100),
  (5, 'Desk Lamp', 'Home', 45.99, 150),
  (6, 'Bluetooth Speaker', 'Electronics', 79.99, 80),
  (7, 'Yoga Mat', 'Sports', 35.99, 120);

-- Sample data: Orders
INSERT INTO orders (id, customer_id, order_date, status, total_amount) VALUES
  (1, 1, '2024-01-10', 'completed', 1329.98),
  (2, 2, '2024-01-12', 'completed', 119.99),
  (3, 1, '2024-01-15', 'completed', 125.98),
  (4, 3, '2024-01-18', 'pending', 89.99),
  (5, 4, '2024-01-20', 'completed', 1379.98),
  (6, 2, '2024-01-22', 'shipped', 79.99),
  (7, 5, '2024-01-25', 'completed', 155.98),
  (8, 1, '2024-02-01', 'pending', 29.99),
  (9, 3, '2024-02-05', 'completed', 1345.98),
  (10, 4, '2024-02-08', 'completed', 65.98),
  (11, 5, '2024-02-10', 'shipped', 89.99),
  (12, 2, '2024-02-12', 'completed', 1299.99),
  (13, 1, '2024-02-15', 'pending', 115.98),
  (14, 3, '2024-02-18', 'completed', 79.99),
  (15, 4, '2024-02-20', 'shipped', 149.98),
  (16, 5, '2024-02-22', 'completed', 45.99);

-- Sample data: Order Items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 1, 1299.99),
  (2, 1, 2, 1, 29.99),
  (3, 2, 4, 1, 119.99),
  (4, 3, 5, 1, 45.99),
  (5, 3, 6, 1, 79.99),
  (6, 4, 3, 1, 89.99),
  (7, 5, 1, 1, 1299.99),
  (8, 5, 6, 1, 79.99),
  (9, 6, 6, 1, 79.99),
  (10, 7, 4, 1, 119.99),
  (11, 7, 7, 1, 35.99),
  (12, 8, 2, 1, 29.99),
  (13, 9, 1, 1, 1299.99),
  (14, 9, 5, 1, 45.99),
  (15, 10, 2, 1, 29.99),
  (16, 10, 7, 1, 35.99),
  (17, 11, 3, 1, 89.99),
  (18, 12, 1, 1, 1299.99),
  (19, 13, 6, 1, 79.99),
  (20, 13, 7, 1, 35.99),
  (21, 14, 6, 1, 79.99),
  (22, 15, 4, 1, 119.99),
  (23, 15, 2, 1, 29.99),
  (24, 16, 5, 1, 45.99);`;

const DEFAULT_QUESTION = "Find the total amount spent by each customer";

type Difficulty = UserLevel;

// Ocean theme configuration
const theme = {
  main: "bg-gradient-to-b from-cyan-50 to-sky-50",
  header: "bg-white/80 backdrop-blur-sm border-b border-cyan-100",
  headerText: "text-slate-700",
  headerAccent: "text-cyan-600",
  card: "bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-cyan-100",
  cardHover: "hover:shadow-md hover:border-cyan-200 transition-all",
  primaryBtn: "bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white shadow-sm",
  secondaryBtn: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200",
  labelText: "text-slate-700",
  mutedText: "text-slate-500",
  cardBg: "bg-cyan-50/50 border-cyan-100",
  difficultyColors: {
    beginner: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    intermediate: "bg-sky-100 text-sky-700 hover:bg-sky-200",
    advanced: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  },
  badgeBg: "bg-cyan-100 text-cyan-700",
  toggleOn: "bg-gradient-to-r from-cyan-500 to-sky-500",
  toggleOff: "bg-slate-200",
  loadingBg: "bg-cyan-50",
  loadingText: "text-cyan-700",
  loadingSpinner: "text-cyan-600",
  hintBg: "bg-sky-50 border-sky-200",
  hintText: "text-sky-700",
  questionBg: "text-slate-800",
};

export default function Home() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [questionDifficulty, setQuestionDifficulty] = useState<Difficulty>("beginner");
  const [userQuery, setUserQuery] = useState("");
  const [response, setResponse] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [currentSkillIds, setCurrentSkillIds] = useState<string[]>([]);
  const [showSkillTree, setShowSkillTree] = useState(true);

  // Skill progress tracking
  const {
    progress,
    proficiency,
    badges,
    sessionStats,
    recordAnswer,
    isLoaded,
  } = useSkillProgress();

  const fetchHint = useCallback(async () => {
    if (!showHint || !question.trim()) {
      return;
    }

    setHintLoading(true);
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema,
          question,
          userLevel: questionDifficulty,
          questionId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.hintQuery) {
        setUserQuery(data.hintQuery);
      }
    } catch (err) {
      console.error("Failed to fetch hint:", err);
    } finally {
      setHintLoading(false);
    }
  }, [schema, question, questionDifficulty, showHint, questionId]);

  useEffect(() => {
    if (showHint) {
      fetchHint();
    }
  }, [showHint, question, questionDifficulty, fetchHint]);

  const handleToggleHint = (enabled: boolean) => {
    setShowHint(enabled);
    if (!enabled) {
      setUserQuery("");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema,
          question,
          userQuery,
          userLevel: questionDifficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get feedback");
      }

      setResponse(data);

      // Record the answer for skill progress tracking
      // Determine if answer was correct based on feedback content
      const feedbackLower = data.feedback?.toLowerCase() || "";
      const wasCorrect =
        feedbackLower.includes("correct") &&
        !feedbackLower.includes("incorrect") &&
        !feedbackLower.includes("not correct") &&
        !feedbackLower.includes("not quite");

      if (currentSkillIds.length > 0) {
        recordAnswer(currentSkillIds, wasCorrect, showHint);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestion = async (difficulty: Difficulty) => {
    setGeneratingQuestion(true);
    setError(null);
    setQuestionDifficulty(difficulty);
    setShowHint(false);
    setUserQuery("");

    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate question");
      }

      setQuestion(data.question);
      setQuestionId(data.questionId || null);
      setCurrentSkillIds(data.skillIds || []);
      setResponse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question");
    } finally {
      setGeneratingQuestion(false);
    }
  };

  return (
    <main className={`min-h-screen ${theme.main}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className={`mb-8 ${theme.header} -mx-4 px-4 py-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${theme.headerText}`}>
                Level Up{" "}
                <span className={theme.headerAccent}>SQL</span>
              </h1>
              <p className={`mt-2 ${theme.mutedText}`}>
                Get expert feedback on your queries from our AI SQL coaching agent
              </p>
            </div>
            {isLoaded && (
              <div className="flex items-center gap-4">
                {/* Proficiency Score */}
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">Proficiency</span>
                  <span className="text-2xl font-bold text-cyan-600">
                    {Math.round(proficiency)}%
                  </span>
                </div>
                {/* Session Stats */}
                {sessionStats.questionsAnswered > 0 && (
                  <div className="flex flex-col items-end text-sm">
                    <span className="text-slate-500">Session</span>
                    <span className="font-medium text-slate-700">
                      {sessionStats.correctCount}/{sessionStats.questionsAnswered}
                    </span>
                  </div>
                )}
                {/* Progress Bar */}
                <div className="w-32">
                  <SkillProgressBar progress={progress} />
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Skill Tree */}
          <div className="lg:col-span-1 space-y-4">
            {/* Skill Tree Toggle */}
            <button
              onClick={() => setShowSkillTree(!showSkillTree)}
              className={`w-full flex items-center justify-between px-4 py-3 ${theme.card} ${theme.cardHover}`}
            >
              <span className={`text-sm font-medium ${theme.labelText}`}>
                Skill Tree
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${showSkillTree ? "rotate-180" : ""} ${theme.mutedText}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSkillTree && isLoaded && (
              <SkillTree progress={progress} compact />
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className={`${theme.card} p-4`}>
                <h4 className={`text-sm font-medium ${theme.labelText} mb-2`}>Badges Earned</h4>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badgeId) => {
                    const badge = BADGES.find((b) => b.id === badgeId);
                    return (
                      <span
                        key={badgeId}
                        className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full"
                        title={badge?.description}
                      >
                        {badge?.name || badgeId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Center Column */}
          <div className="lg:col-span-1 space-y-6">
            <TableBrowser schema={schema} />

            <div className={`${theme.card} ${theme.cardHover} p-4`}>
              <div className="flex justify-between items-start mb-3">
                <label className={`block text-sm font-medium ${theme.labelText}`}>
                  Question to Answer
                </label>
                <span className={`text-xs px-2 py-1 rounded-full ${theme.badgeBg}`}>
                  {questionDifficulty}
                </span>
              </div>
              <div className={`relative mb-4 p-3 rounded-md border ${theme.cardBg}`}>
                {generatingQuestion && (
                  <div className={`absolute inset-0 flex items-center justify-center rounded-md ${theme.loadingBg}`}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80">
                      <svg className={`animate-spin h-4 w-4 ${theme.loadingSpinner}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className={`text-sm font-medium ${theme.loadingText}`}>
                        Generating question...
                      </span>
                    </div>
                  </div>
                )}
                <p className={`text-base leading-relaxed ${theme.questionBg}`}>
                  {question}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${theme.mutedText}`}>
                  Generate new question:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateQuestion("beginner")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.difficultyColors.beginner}`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("intermediate")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.difficultyColors.intermediate}`}
                  >
                    Intermediate
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("advanced")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.difficultyColors.advanced}`}
                  >
                    Advanced
                  </button>
                </div>
              </div>
            </div>

            <div className={`${theme.card} ${theme.cardHover} p-4`}>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${theme.labelText}`}>
                  Your SQL Query
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-sm ${theme.mutedText}`}>
                    Show Hint
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showHint}
                    onClick={() => handleToggleHint(!showHint)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showHint ? theme.toggleOn : theme.toggleOff
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showHint ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>
              {hintLoading && (
                <div className={`mb-3 flex items-center gap-2 px-4 py-2 rounded-md border ${theme.hintBg}`}>
                  <svg className={`animate-spin h-4 w-4 ${theme.loadingSpinner}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className={`text-sm font-medium ${theme.hintText}`}>
                    Generating hint...
                  </span>
                </div>
              )}
              <SQLEditor value={userQuery} onChange={setUserQuery} />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-4 w-full font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 ${theme.primaryBtn}`}
              >
                {loading ? "Getting Feedback..." : "Get Feedback"}
              </button>
            </div>
          </div>

          {/* Right Column - Feedback */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Question Skills */}
            {currentSkillIds.length > 0 && (
              <div className={`${theme.card} p-3`}>
                <span className={`text-xs ${theme.mutedText}`}>Skills being tested:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentSkillIds.map((skillId) => (
                    <span
                      key={skillId}
                      className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded"
                    >
                      {skillId.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <FeedbackPanel response={response} error={error} loading={loading} />
          </div>
        </div>

        {/* How It Works Section - Bottom */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-cyan-100 p-8">
            <div className="text-center mb-10">
              <h2 className={`text-2xl font-bold mb-2 ${theme.headerText}`}>
                How It Works
              </h2>
              <p className={`${theme.mutedText} max-w-2xl mx-auto`}>
                Level up your SQL expertise in four simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Explore Schema",
                  description: "Browse the database structure to understand tables, columns, and relationships",
                  icon: "🗄️",
                },
                {
                  step: "02",
                  title: "Get a Challenge",
                  description: "Generate a practice question at your skill level — beginner, intermediate, or advanced",
                  icon: "🎲",
                },
                {
                  step: "03",
                  title: "Write Your Query",
                  description: "Craft your SQL solution in the editor. Need help? Toggle hints for guidance",
                  icon: "✍️",
                },
                {
                  step: "04",
                  title: "Get Feedback",
                  description: "Receive instant, personalized feedback from our AI coach to improve your skills",
                  icon: "💡",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative p-6 rounded-xl transition-all bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 hover:border-cyan-200"
                >
                  <div className="text-3xl mb-4 opacity-90">
                    {item.icon}
                  </div>
                  <h3 className={`font-semibold mb-2 ${theme.headerText}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${theme.mutedText}`}>
                    {item.description}
                  </p>
                  <div className="absolute top-4 right-4 text-xs font-mono text-cyan-400/50">
                    {item.step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
