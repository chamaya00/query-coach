import { getQueryFeedback } from "./lib/orchestrator";
import { readFileSync } from "fs";

const schema = readFileSync("./sample-data/ecommerce.sql", "utf-8");

async function test() {
  const result = await getQueryFeedback({
    schema,
    question: "Find customers who have spent more than $500 total",
    userQuery: `
      SELECT name, SUM(total_amount)
      FROM customers, orders
      GROUP BY name
      HAVING SUM(total_amount) > 500
    `,
    userLevel: "beginner",
  });

  console.log("Query Result:");
  console.log(result.queryResult.data);
  console.log("\nCoach Feedback:");
  console.log(result.feedback);
}

test();
