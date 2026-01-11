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
type UITheme = "classic" | "minimal" | "elegant" | "ocean" | "modern" | "playful";

// Theme configurations
const themes = {
  classic: {
    name: "Classic",
    description: "Clean & Professional",
    main: "bg-gray-50",
    header: "bg-white border-b border-gray-200",
    headerText: "text-gray-900",
    headerAccent: "text-blue-600",
    card: "bg-white rounded-lg shadow",
    cardHover: "hover:shadow-md transition-shadow",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 text-white",
    secondaryBtn: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    accent: "blue",
    labelText: "text-gray-700",
    mutedText: "text-gray-600",
    cardBg: "bg-gray-50 border-gray-200",
    difficultyColors: {
      beginner: "bg-green-100 text-green-700 hover:bg-green-200",
      intermediate: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
      advanced: "bg-red-100 text-red-700 hover:bg-red-200",
    },
    badgeBg: "bg-blue-100 text-blue-700",
    toggleOn: "bg-blue-600",
    toggleOff: "bg-gray-300",
    loadingBg: "bg-blue-50",
    loadingText: "text-blue-700",
    loadingSpinner: "text-blue-600",
    hintBg: "bg-purple-100 border-purple-200",
    hintText: "text-purple-700",
    questionBg: "text-gray-900",
  },
  minimal: {
    name: "Minimal",
    description: "Light & Airy",
    main: "bg-white",
    header: "bg-white border-b border-gray-100",
    headerText: "text-gray-800",
    headerAccent: "text-gray-800 font-light",
    card: "bg-gray-50/50 rounded-xl border border-gray-100",
    cardHover: "hover:border-gray-200 transition-colors",
    primaryBtn: "bg-gray-900 hover:bg-gray-800 text-white",
    secondaryBtn: "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200",
    accent: "gray",
    labelText: "text-gray-600",
    mutedText: "text-gray-500",
    cardBg: "bg-white border-gray-100",
    difficultyColors: {
      beginner: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200",
      intermediate: "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200",
      advanced: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
    },
    badgeBg: "bg-gray-100 text-gray-600",
    toggleOn: "bg-gray-900",
    toggleOff: "bg-gray-200",
    loadingBg: "bg-gray-50",
    loadingText: "text-gray-600",
    loadingSpinner: "text-gray-500",
    hintBg: "bg-violet-50 border-violet-100",
    hintText: "text-violet-600",
    questionBg: "text-gray-800",
  },
  elegant: {
    name: "Elegant",
    description: "Refined & Sophisticated",
    main: "bg-stone-50",
    header: "bg-white border-b border-stone-200",
    headerText: "text-stone-800 font-serif",
    headerAccent: "text-amber-700 font-serif italic",
    card: "bg-white rounded-lg shadow-sm border border-stone-100",
    cardHover: "hover:shadow transition-shadow",
    primaryBtn: "bg-amber-700 hover:bg-amber-800 text-white",
    secondaryBtn: "bg-stone-100 text-stone-700 hover:bg-stone-200",
    accent: "amber",
    labelText: "text-stone-700 font-medium",
    mutedText: "text-stone-500",
    cardBg: "bg-stone-50 border-stone-200",
    difficultyColors: {
      beginner: "bg-teal-50 text-teal-700 hover:bg-teal-100",
      intermediate: "bg-amber-50 text-amber-700 hover:bg-amber-100",
      advanced: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    },
    badgeBg: "bg-amber-100 text-amber-800",
    toggleOn: "bg-amber-700",
    toggleOff: "bg-stone-300",
    loadingBg: "bg-amber-50",
    loadingText: "text-amber-800",
    loadingSpinner: "text-amber-700",
    hintBg: "bg-violet-50 border-violet-200",
    hintText: "text-violet-800",
    questionBg: "text-stone-800",
  },
  ocean: {
    name: "Ocean",
    description: "Calm & Refreshing",
    main: "bg-gradient-to-b from-cyan-50 to-sky-50",
    header: "bg-white/80 backdrop-blur-sm border-b border-cyan-100",
    headerText: "text-slate-700",
    headerAccent: "text-cyan-600",
    card: "bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-cyan-100",
    cardHover: "hover:shadow-md hover:border-cyan-200 transition-all",
    primaryBtn: "bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white shadow-sm",
    secondaryBtn: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200",
    accent: "cyan",
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
    labelText: "text-white/80",
    mutedText: "text-white/60",
    cardBg: "bg-white/5 border-white/10",
    difficultyColors: {
      beginner: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30",
      intermediate: "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30",
      advanced: "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30",
    },
    badgeBg: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    toggleOn: "bg-gradient-to-r from-purple-500 to-pink-500",
    toggleOff: "bg-white/20",
    loadingBg: "bg-purple-900/50",
    loadingText: "text-purple-200",
    loadingSpinner: "text-purple-300",
    hintBg: "bg-purple-500/20 border-purple-500/30",
    hintText: "text-purple-200",
    questionBg: "text-white",
  },
  playful: {
    name: "Playful",
    description: "Fun & Friendly",
    main: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    header: "bg-white/80 backdrop-blur-sm border-b-4 border-orange-400",
    headerText: "text-gray-800",
    headerAccent: "text-orange-500",
    card: "bg-white rounded-3xl shadow-xl border-2 border-orange-200",
    cardHover: "hover:scale-[1.01] transition-transform hover:border-orange-400",
    primaryBtn: "bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white rounded-full font-bold shadow-lg",
    secondaryBtn: "bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full",
    accent: "orange",
    labelText: "text-gray-700",
    mutedText: "text-gray-600",
    cardBg: "bg-orange-50 border-orange-200",
    difficultyColors: {
      beginner: "bg-green-200 text-green-700 hover:bg-green-300 rounded-full font-bold",
      intermediate: "bg-yellow-200 text-yellow-700 hover:bg-yellow-300 rounded-full font-bold",
      advanced: "bg-red-200 text-red-700 hover:bg-red-300 rounded-full font-bold",
    },
    badgeBg: "bg-orange-200 text-orange-700 font-bold",
    toggleOn: "bg-gradient-to-r from-orange-400 to-rose-400",
    toggleOff: "bg-gray-300",
    loadingBg: "bg-orange-100/90",
    loadingText: "text-orange-700",
    loadingSpinner: "text-orange-600",
    hintBg: "bg-purple-100 border-purple-200",
    hintText: "text-purple-700",
    questionBg: "text-gray-900",
  },
};

const themeOrder: UITheme[] = ["classic", "minimal", "elegant", "ocean", "modern", "playful"];

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

  const getActiveButtonStyle = (themeKey: UITheme) => {
    switch (themeKey) {
      case "classic":
        return "bg-blue-600 text-white";
      case "minimal":
        return "bg-gray-900 text-white";
      case "elegant":
        return "bg-amber-700 text-white";
      case "ocean":
        return "bg-gradient-to-r from-cyan-500 to-sky-500 text-white";
      case "modern":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "playful":
        return "bg-gradient-to-r from-orange-400 to-rose-400 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  return (
    <main className={`min-h-screen ${theme.main}`}>
      {/* Theme Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`${theme.card} p-2 flex items-center gap-2`}>
          <span className={`text-xs font-medium ${theme.mutedText}`}>
            Theme:
          </span>
          <div className="flex gap-1 flex-wrap max-w-xs">
            {themeOrder.map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => setUITheme(themeKey)}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  uiTheme === themeKey
                    ? getActiveButtonStyle(themeKey)
                    : `${theme.mutedText} hover:opacity-80`
                }`}
                style={uiTheme !== themeKey ? { background: 'transparent' } : {}}
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
              <h1 className={`text-3xl font-bold ${theme.headerText} ${uiTheme === "elegant" ? "font-serif" : ""}`}>
                {uiTheme === "modern" ? (
                  <span className={theme.headerAccent}>Level Up SQL</span>
                ) : (
                  <>
                    Level Up{" "}
                    <span className={theme.headerAccent}>SQL</span>
                  </>
                )}
              </h1>
              <p className={`mt-2 ${theme.mutedText} ${uiTheme === "elegant" ? "font-serif" : ""}`}>
                Get expert feedback on your queries from our AI SQL coaching agent
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
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
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${uiTheme === "modern" ? "bg-purple-500/30" : "bg-white/80"}`}>
                      <svg className={`animate-spin h-4 w-4 ${theme.loadingSpinner}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className={`text-sm font-medium ${theme.loadingText}`}>
                        {uiTheme === "playful" ? "Cooking up a question..." : "Generating question..."}
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
                  {uiTheme === "playful" ? "Try a new challenge:" : "Generate new question:"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateQuestion("beginner")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.difficultyColors.beginner}`}
                  >
                    {uiTheme === "playful" ? "🌱 Beginner" : "Beginner"}
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("intermediate")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.difficultyColors.intermediate}`}
                  >
                    {uiTheme === "playful" ? "🌿 Intermediate" : "Intermediate"}
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("advanced")}
                    disabled={generatingQuestion}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.difficultyColors.advanced}`}
                  >
                    {uiTheme === "playful" ? "🌳 Advanced" : "Advanced"}
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
                    {uiTheme === "playful" ? "Need a hint? 💡" : "Show Hint"}
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

        {/* How It Works Section - Bottom */}
        <section className={`mt-16 ${uiTheme === "modern" ? "" : "border-t border-gray-200 pt-12"}`}>
          <div className={`${
            uiTheme === "modern"
              ? "bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8"
              : uiTheme === "playful"
              ? "bg-white rounded-3xl shadow-xl border-2 border-orange-200 p-8"
              : uiTheme === "elegant"
              ? "bg-white rounded-xl shadow-sm border border-stone-100 p-8"
              : uiTheme === "ocean"
              ? "bg-white/80 backdrop-blur-sm rounded-2xl border border-cyan-100 p-8"
              : uiTheme === "minimal"
              ? "bg-gray-50/50 rounded-2xl border border-gray-100 p-8"
              : "bg-white rounded-2xl shadow-lg p-8"
          }`}>
            <div className="text-center mb-10">
              <h2 className={`text-2xl font-bold mb-2 ${theme.headerText} ${uiTheme === "elegant" ? "font-serif" : ""}`}>
                {uiTheme === "modern" ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    How It Works
                  </span>
                ) : uiTheme === "playful" ? (
                  <>🎯 How It Works</>
                ) : (
                  "How It Works"
                )}
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
                  className={`relative p-6 rounded-xl transition-all ${
                    uiTheme === "modern"
                      ? "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                      : uiTheme === "playful"
                      ? "bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-orange-100 hover:border-orange-300 hover:scale-105"
                      : uiTheme === "elegant"
                      ? "bg-stone-50 border border-stone-100 hover:shadow-md"
                      : uiTheme === "ocean"
                      ? "bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 hover:border-cyan-200"
                      : uiTheme === "minimal"
                      ? "bg-white border border-gray-100 hover:border-gray-200"
                      : "bg-gray-50 border border-gray-100 hover:shadow-md hover:border-gray-200"
                  }`}
                >
                  <div className={`text-3xl mb-4 ${uiTheme === "playful" ? "" : "opacity-90"}`}>
                    {uiTheme === "minimal" || uiTheme === "elegant" ? (
                      <span className={`text-sm font-bold ${uiTheme === "elegant" ? "text-amber-700" : "text-gray-400"}`}>
                        {item.step}
                      </span>
                    ) : (
                      item.icon
                    )}
                  </div>
                  <h3 className={`font-semibold mb-2 ${
                    uiTheme === "modern"
                      ? "text-white"
                      : uiTheme === "elegant"
                      ? "text-stone-800 font-serif"
                      : theme.headerText
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${theme.mutedText}`}>
                    {item.description}
                  </p>
                  {(uiTheme === "modern" || uiTheme === "ocean") && (
                    <div className={`absolute top-4 right-4 text-xs font-mono ${
                      uiTheme === "modern" ? "text-purple-400/50" : "text-cyan-400/50"
                    }`}>
                      {item.step}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
