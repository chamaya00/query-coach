#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { generateQuestion } from "../lib/question-generator";
import { generateHintQuery } from "../lib/orchestrator";
import { CachedQuestion, UserLevel } from "../lib/types";

// Default schema (same as in app/page.tsx)
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

const DIFFICULTIES: UserLevel[] = ["beginner", "intermediate", "advanced"];
const DATA_FILE = path.join(process.cwd(), "data", "questions.json");

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExistingQuestions(): CachedQuestion[] {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  const content = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

function saveQuestions(questions: CachedQuestion[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2) + "\n");
}

async function generateQuestionWithHints(
  difficulty: UserLevel
): Promise<CachedQuestion> {
  // Generate the question
  const questionResponse = await generateQuestion({
    schema: DEFAULT_SCHEMA,
    difficulty,
  });

  // Small delay between API calls to avoid rate limiting
  await sleep(500);

  // Generate a single hint at the same difficulty level as the question
  const hintResponse = await generateHintQuery({
    schema: DEFAULT_SCHEMA,
    question: questionResponse.question,
    userLevel: difficulty,
  });

  return {
    id: generateId(),
    difficulty,
    question: questionResponse.question,
    hint: hintResponse.hintQuery,
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let countPerDifficulty = 10;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) {
      countPerDifficulty = parseInt(args[i + 1], 10);
      if (isNaN(countPerDifficulty) || countPerDifficulty < 1) {
        console.error("Invalid count value. Using default of 10.");
        countPerDifficulty = 10;
      }
    }
  }

  console.log(`\nGenerating ${countPerDifficulty} questions per difficulty level`);
  console.log(`Total questions to generate: ${countPerDifficulty * 3}`);
  console.log(`Each question will have 1 hint at its difficulty level\n`);

  // Load existing questions
  const existingQuestions = loadExistingQuestions();
  console.log(`Existing questions in cache: ${existingQuestions.length}\n`);

  const newQuestions: CachedQuestion[] = [];
  let totalGenerated = 0;
  const totalToGenerate = countPerDifficulty * DIFFICULTIES.length;

  for (const difficulty of DIFFICULTIES) {
    console.log(`\n--- Generating ${difficulty} questions ---`);

    for (let i = 0; i < countPerDifficulty; i++) {
      totalGenerated++;
      const progress = `[${totalGenerated}/${totalToGenerate}]`;

      try {
        console.log(`${progress} Generating ${difficulty} question ${i + 1}/${countPerDifficulty}...`);

        const cached = await generateQuestionWithHints(difficulty);
        newQuestions.push(cached);

        console.log(`${progress} Done: "${cached.question.substring(0, 60)}..."`);

        // Save after each question in case of interruption
        saveQuestions([...existingQuestions, ...newQuestions]);
      } catch (error) {
        console.error(`${progress} Error generating question:`, error);
        // Continue with next question
      }
    }
  }

  console.log(`\n--- Generation Complete ---`);
  console.log(`New questions generated: ${newQuestions.length}`);
  console.log(`Total questions in cache: ${existingQuestions.length + newQuestions.length}`);

  // Summary by difficulty
  const allQuestions = [...existingQuestions, ...newQuestions];
  for (const difficulty of DIFFICULTIES) {
    const count = allQuestions.filter((q) => q.difficulty === difficulty).length;
    console.log(`  ${difficulty}: ${count} questions`);
  }
}

main().catch(console.error);
