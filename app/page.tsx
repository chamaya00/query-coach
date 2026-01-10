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
  }, [schema, question, questionDifficulty, showHint]);

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
      setResponse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question");
    } finally {
      setGeneratingQuestion(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            QueryCoach
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your AI SQL tutor - get personalized feedback on your queries
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <TableBrowser schema={schema} />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question to Answer
                </label>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {questionDifficulty}
                </span>
              </div>
              <div className="relative mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                {generatingQuestion && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/50 rounded-md">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                      <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-200">Generating question...</span>
                    </div>
                  </div>
                )}
                <p className="text-gray-900 dark:text-white text-base leading-relaxed">
                  {question}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Generate new question:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateQuestion("beginner")}
                    disabled={generatingQuestion}
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                             bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300
                             hover:bg-green-200 dark:hover:bg-green-800
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("intermediate")}
                    disabled={generatingQuestion}
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                             bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300
                             hover:bg-yellow-200 dark:hover:bg-yellow-800
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Intermediate
                  </button>
                  <button
                    onClick={() => handleGenerateQuestion("advanced")}
                    disabled={generatingQuestion}
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                             bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300
                             hover:bg-red-200 dark:hover:bg-red-800
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Advanced
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your SQL Query
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Show Hint
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showHint}
                    onClick={() => handleToggleHint(!showHint)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showHint ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
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
                <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/50 rounded-md border border-purple-200 dark:border-purple-700">
                  <svg className="animate-spin h-4 w-4 text-purple-600 dark:text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-200">Generating hint...</span>
                </div>
              )}
              <SQLEditor value={userQuery} onChange={setUserQuery} />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-medium py-2 px-4 rounded-md
                         transition-colors duration-200"
              >
                {loading ? "Getting Feedback..." : "Get Feedback"}
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
