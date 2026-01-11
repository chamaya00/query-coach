import { generateCompletion } from "./anthropic";

const FINGERPRINT_SYSTEM_PROMPT = `You generate concise fingerprints for SQL practice questions.

A fingerprint captures the core pattern: {entities}-{operations}-{conditions}

Examples:
- "Find all products in the Sports category" → products-category-equals
- "How many customers are in each region?" → customers-region-group-count
- "Find the top 5 products by price" → products-price-order-limit
- "Find customers who have never placed an order" → customers-orders-not-exists
- "Find the average order value for each customer region" → customers-orders-region-avg-group
- "Show the total quantity sold for each product category" → products-orders-category-sum-group
- "Find products ordered by customers from all regions" → products-customers-regions-all-join

Rules:
- Use lowercase, hyphens only
- 3-6 segments max
- Focus on: table(s), key column(s), operation type
- Be consistent: similar questions should yield similar fingerprints
- Output ONLY the fingerprint, nothing else`;

export async function generateFingerprint(question: string): Promise<string> {
  const userMessage = `Generate fingerprint for: "${question}"`;

  const fingerprint = await generateCompletion(
    FINGERPRINT_SYSTEM_PROMPT,
    userMessage,
    50
  );

  return fingerprint.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}
