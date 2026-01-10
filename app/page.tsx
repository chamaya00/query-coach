"use client";

import { useState } from "react";
import SQLEditor from "@/components/SQLEditor";
import SchemaViewer from "@/components/SchemaViewer";
import FeedbackPanel from "@/components/FeedbackPanel";
import LevelSelector from "@/components/LevelSelector";
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

-- Sample data included (5 customers, 7 products, 8 orders)`;

const DEFAULT_QUESTION = "Find the total amount spent by each customer";

const DEFAULT_QUERY = `SELECT customers.name, SUM(orders.total_amount)
FROM customers, orders
GROUP BY customers.name`;

export default function Home() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [userQuery, setUserQuery] = useState(DEFAULT_QUERY);
  const [userLevel, setUserLevel] = useState<UserLevel>("beginner");
  const [response, setResponse] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          userLevel,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get feedback");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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
            <SchemaViewer schema={schema} onSchemaChange={setSchema} />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question to Answer
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What are you trying to query?"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your SQL Query
                </label>
                <LevelSelector level={userLevel} onLevelChange={setUserLevel} />
              </div>
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
