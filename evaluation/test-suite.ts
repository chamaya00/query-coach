import { TestCase } from "@/lib/types";

export const testSuite: TestCase[] = [
  {
    id: "cartesian-001",
    name: "Cartesian product from comma join",
    schema: `
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount DECIMAL);
      INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
      INSERT INTO orders VALUES (1, 1, 100), (2, 1, 200), (3, 2, 150);
    `,
    question: "Find total amount per user",
    userQuery: "SELECT name, SUM(amount) FROM users, orders GROUP BY name",
    expectedResult: "Alice | 300\nBob | 150",
    knownIssues: ["cartesian product", "missing join condition"],
    userLevel: "beginner",
    mustMention: ["join", "connect"],
    mustNotMention: ["query plan", "index", "optimization"],
  },
  {
    id: "where-having-001",
    name: "WHERE vs HAVING confusion",
    schema: `
      CREATE TABLE products (id INTEGER, category TEXT, price DECIMAL);
      INSERT INTO products VALUES (1, 'A', 60), (2, 'A', 40), (3, 'B', 30), (4, 'B', 20);
    `,
    question: "Find categories with average price over 40",
    userQuery: "SELECT category, AVG(price) FROM products WHERE AVG(price) > 40 GROUP BY category",
    expectedResult: "A | 50",
    knownIssues: ["where vs having", "aggregate in where"],
    userLevel: "beginner",
    mustMention: ["having", "aggregate", "group"],
    mustNotMention: ["index", "performance"],
  },
  {
    id: "null-handling-001",
    name: "NULL comparison issue",
    schema: `
      CREATE TABLE employees (id INTEGER, name TEXT, manager_id INTEGER);
      INSERT INTO employees VALUES (1, 'Alice', 5), (2, 'Bob', 3), (3, 'Carol', NULL);
    `,
    question: "Find employees not managed by manager #5",
    userQuery: "SELECT name FROM employees WHERE manager_id != 5",
    expectedResult: "Bob\nCarol",
    knownIssues: ["null handling", "null comparison"],
    userLevel: "intermediate",
    mustMention: ["null", "is null"],
    mustNotMention: [],
  },
  {
    id: "correct-001",
    name: "Correct query - should praise",
    schema: `
      CREATE TABLE sales (id INTEGER, rep TEXT, amount DECIMAL);
      INSERT INTO sales VALUES (1, 'Alice', 100), (2, 'Alice', 200), (3, 'Bob', 150);
    `,
    question: "Find total sales per rep",
    userQuery: "SELECT rep, SUM(amount) as total FROM sales GROUP BY rep",
    expectedResult: "Alice | 300\nBob | 150",
    knownIssues: [],
    userLevel: "beginner",
    mustMention: ["correct"],
    mustNotMention: ["incorrect", "wrong", "error", "issue"],
  },
];
