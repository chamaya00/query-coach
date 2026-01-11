"use client";

import { useState, useEffect, useCallback } from "react";
import SQLEditor from "@/components/SQLEditor";
import TableBrowser from "@/components/TableBrowser";
import FeedbackPanel from "@/components/FeedbackPanel";
import { UserLevel, CoachResponse } from "@/lib/types";

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
type UITheme = "classic" | "modern" | "playful";

// Theme configurations
const themes = {
  classic: {
    name: "Classic",
    description: "Clean & Professional",
    main: "bg-gray-50 dark:bg-gray-900",
    header: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",
    headerText: "text-gray-900 dark:text-white",
    headerAccent: "text-blue-600 dark:text-blue-400",
    card: "bg-white dark:bg-gray-800 rounded-lg shadow",
    cardHover: "hover:shadow-md transition-shadow",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 text-white",
    secondaryBtn: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
    accent: "blue",
    instructionsBg: "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800",
    instructionsText: "text-blue-800 dark:text-blue-200",
  },
  modern: {
    name: "Modern",
    description: "Bold & Vibrant",
    main: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    header: "bg-black/40 backdrop-blur-xl border-b border-white/10",
    headerText: "text-white",
    headerAccent: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400",
    card: "bg-white/10 backdrop-blur-md rounded-2xl border border-white/20",
    cardHover: "hover:bg-white/15 transition-all hover:border-white/30",
    primaryBtn: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25",
    secondaryBtn: "bg-white/10 text-white hover:bg-white/20 border border-white/20",
    accent: "purple",
    instructionsBg: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30",
    instructionsText: "text-purple-100",
  },
  playful: {
    name: "Playful",
    description: "Fun & Friendly",
    main: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950 dark:via-orange-950 dark:to-rose-950",
    header: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b-4 border-orange-400",
    headerText: "text-gray-800 dark:text-white",
    headerAccent: "text-orange-500 dark:text-orange-400",
    card: "bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-orange-200 dark:border-orange-800",
    cardHover: "hover:scale-[1.02] transition-transform hover:border-orange-400 dark:hover:border-orange-600",
    primaryBtn: "bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white rounded-full font-bold shadow-lg",
    secondaryBtn: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full",
    accent: "orange",
    instructionsBg: "bg-gradient-to-r from-orange-100 to-rose-100 dark:from-orange-900/50 dark:to-rose-900/50 border-2 border-dashed border-orange-300 dark:border-orange-700",
    instructionsText: "text-orange-800 dark:text-orange-200",
  },
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
  const [uiTheme, setUITheme] = useState<UITheme>("classic");

  const theme = themes[uiTheme];

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

  // Fetch hint on initial load and when dependencies change
  useEffect(() => {
    if (showHint) {
      fetchHint();
    }
  }, [showHint, question, questionDifficulty, fetchHint]);

  // Handle toggle change
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
      setResponse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question");
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const getDifficultyColors = () => {
    if (uiTheme === "modern") {
      return {
        beginner: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30",
        intermediate: "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30",
        advanced: "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30",
      };
    } else if (uiTheme === "playful") {
      return {
        beginner: "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-700 rounded-full font-bold",
        intermediate: "bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-300 dark:hover:bg-yellow-700 rounded-full font-bold",
        advanced: "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 hover:bg-red-300 dark:hover:bg-red-700 rounded-full font-bold",
      };
    }
    return {
      beginner: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800",
      intermediate: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800",
      advanced: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800",
    };
  };

  const difficultyColors = getDifficultyColors();

  return (
    <main className={`min-h-screen ${theme.main}`}>
      {/* Theme Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`${theme.card} p-2 flex items-center gap-2`}>
          <span className={`text-xs font-medium ${uiTheme === "modern" ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
            Theme:
          </span>
          <div className="flex gap-1">
            {(Object.keys(themes) as UITheme[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => setUITheme(themeKey)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  uiTheme === themeKey
                    ? themeKey === "classic"
                      ? "bg-blue-600 text-white"
                      : themeKey === "modern"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gradient-to-r from-orange-400 to-rose-400 text-white"
                    : uiTheme === "modern"
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {themes[themeKey].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className={`mb-8 ${theme.header} -mx-4 px-4 py-6 ${uiTheme === "playful" ? "-mt-8 pt-8" : ""}`}>
          <div className="flex items-center gap-3">
            {uiTheme === "playful" && (
              <span className="text-4xl">🚀</span>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${theme.headerText}`}>
                {uiTheme === "modern" ? (
                  <span className={theme.headerAccent}>Level Up SQL</span>
                ) : (
                  <>
                    Level Up{" "}
                    <span className={theme.headerAccent}>SQL</span>
                  </>
                )}
              </h1>
              <p className={`mt-2 ${uiTheme === "modern" ? "text-white/60" : "text-gray-600 dark:text-gray-400"}`}>
                Your AI SQL coach - get personalized feedback on your queries
              </p>
            </div>
          </div>
        </header>

        {/* Instructions Banner */}
        <div className={`mb-8 p-4 rounded-xl ${theme.instructionsBg}`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${uiTheme === "playful" ? "text-3xl" : "text-2xl"}`}>
              {uiTheme === "modern" ? "⚡" : uiTheme === "playful" ? "🎯" : "📚"}
            </div>
            <div className={theme.instructionsText}>
              <h2 className="font-semibold text-lg mb-2">
                {uiTheme === "playful" ? "Ready to become an SQL pro?" : "How it works"}
              </h2>
              <p className="text-sm leading-relaxed">
                Level up your SQL expertise by solving practice questions and getting advice from our AI SQL coaching agent.
                {" "}
                {uiTheme === "playful" ? (
                  <>Pick a difficulty, write your query, and let our friendly coach guide you to mastery! 🌟</>
                ) : (
                  <>Choose a difficulty level, write your SQL query to solve the challenge, and receive instant, personalized feedback to improve your skills.</>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span>1.</span> Browse the database schema
                </span>
                <span className="flex items-center gap-1">
                  <span>2.</span> Generate or read the question
                </span>
                <span className="flex items-center gap-1">
                  <span>3.</span> Write your SQL solution
                </span>
                <span className="flex items-center gap-1">
                  <span>4.</span> Get AI-powered feedback
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <TableBrowser schema={schema} />

            <div className={`${theme.card} ${theme.cardHover} p-4`}>
              <div className="flex justify-between items-start mb-3">
                <label className={`block text-sm font-medium ${uiTheme === "modern" ? "text-white/80" : "text-gray-700 dark:text-gray-300"}`}>
                  Question to Answer
                </label>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  uiTheme === "modern"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : uiTheme === "playful"
                    ? "bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200 font-bold"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                }`}>
                  {questionDifficulty}
                </span>
              </div>
              <div className={`relative mb-4 p-3 rounded-md border ${
                uiTheme === "modern"
                  ? "bg-white/5 border-white/10"
                  : uiTheme === "playful"
                  ? "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              }`}>
                {generatingQuestion && (
                  <div className={`absolute inset-0 flex items-center justify-center rounded-md ${
                    uiTheme === "modern"
                      ? "bg-purple-900/50"
                      : uiTheme === "playful"
                      ? "bg-orange-100/90 dark:bg-orange-900/90"
                      : "bg-blue-50 dark:bg-blue-900/50"
                  }`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      uiTheme === "modern"
                        ? "bg-purple-500/30"
                        : uiTheme === "playful"
                        ? "bg-orange-200 dark:bg-orange-800"
                        : "bg-blue-100 dark:bg-blue-800"
                    }`}>
                      <svg className={`animate-spin h-4 w-4 ${
                        uiTheme === "modern" ? "text-purple-300" : uiTheme === "playful" ? "text-orange-600" : "text-blue-600 dark:text-blue-300"
                      }`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className={`text-sm font-medium ${
                        uiTheme === "modern" ? "text-purple-200" : uiTheme === "playful" ? "text-orange-700 dark:text-orange-200" : "text-blue-700 dark:text-blue-200"
                      }`}>
                        {uiTheme === "playful" ? "Cooking up a question..." : "Generating question..."}
                      </span>
                    </div>
                  </div>
                )}
                <p className={`text-base leading-relaxed ${uiTheme === "modern" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {question}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${uiTheme === "modern" ? "text-white/60" : "text-gray-600 dark:text-gray-400"}`}>
                  {uiTheme === "playful" ? "Try a new challenge:" : "Generate new question:"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateQuestion("beginner")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${difficultyColors.beginner}`}
                  >
                    {uiTheme === "playful" ? "🌱 Beginner" : "Beginner"}
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("intermediate")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${difficultyColors.intermediate}`}
                  >
                    {uiTheme === "playful" ? "🌿 Intermediate" : "Intermediate"}
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("advanced")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${difficultyColors.advanced}`}
                  >
                    {uiTheme === "playful" ? "🌳 Advanced" : "Advanced"}
                  </button>
                </div>
              </div>
            </div>

            <div className={`${theme.card} ${theme.cardHover} p-4`}>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${uiTheme === "modern" ? "text-white/80" : "text-gray-700 dark:text-gray-300"}`}>
                  Your SQL Query
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-sm ${uiTheme === "modern" ? "text-white/60" : "text-gray-600 dark:text-gray-400"}`}>
                    {uiTheme === "playful" ? "Need a hint? 💡" : "Show Hint"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showHint}
                    onClick={() => handleToggleHint(!showHint)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showHint
                        ? uiTheme === "modern"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : uiTheme === "playful"
                          ? "bg-gradient-to-r from-orange-400 to-rose-400"
                          : "bg-blue-600"
                        : uiTheme === "modern"
                        ? "bg-white/20"
                        : "bg-gray-300 dark:bg-gray-600"
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
                <div className={`mb-3 flex items-center gap-2 px-4 py-2 rounded-md border ${
                  uiTheme === "modern"
                    ? "bg-purple-500/20 border-purple-500/30"
                    : uiTheme === "playful"
                    ? "bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700"
                    : "bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700"
                }`}>
                  <svg className={`animate-spin h-4 w-4 ${uiTheme === "modern" ? "text-purple-300" : "text-purple-600 dark:text-purple-300"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className={`text-sm font-medium ${uiTheme === "modern" ? "text-purple-200" : "text-purple-700 dark:text-purple-200"}`}>
                    {uiTheme === "playful" ? "Getting you a helpful hint..." : "Generating hint..."}
                  </span>
                </div>
              )}
              <SQLEditor value={userQuery} onChange={setUserQuery} />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-4 w-full font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 ${theme.primaryBtn}`}
              >
                {loading
                  ? uiTheme === "playful" ? "Getting your feedback..." : "Getting Feedback..."
                  : uiTheme === "playful" ? "Check My Answer! 🎉" : "Get Feedback"
                }
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <FeedbackPanel response={response} error={error} loading={loading} />
          </div>
        </div>
      </div>
    </main>
  );
}
