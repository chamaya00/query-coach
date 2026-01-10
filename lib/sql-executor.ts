import initSqlJs, { Database } from "sql.js";
import { QueryResult } from "./types";

let SQL: any = null;

async function getSQL() {
  if (!SQL) {
    SQL = await initSqlJs({
      // Load WASM from CDN in browser, or bundled in Node
      locateFile: (file: string) =>
        `https://sql.js.org/dist/${file}`,
    });
  }
  return SQL;
}

export async function executeSQL(
  query: string,
  schema: string
): Promise<QueryResult> {
  let db: Database | null = null;

  try {
    const SQL = await getSQL();
    db = new SQL.Database();

    if (!db) {
      return { success: false, error: "Failed to initialize database" };
    }

    // Set up schema and sample data
    db.run(schema);

    // Execute user query with basic protection
    const trimmedQuery = query.trim();

    // Block obviously dangerous operations (defense in depth)
    const dangerous = /^\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE)/i;
    if (dangerous.test(trimmedQuery) && !schema.includes(trimmedQuery)) {
      return {
        success: false,
        error: "Only SELECT queries are allowed for practice",
      };
    }

    const results = db.exec(trimmedQuery);

    if (results.length === 0) {
      return { success: true, data: "(no results)", rowCount: 0 };
    }

    // Format as readable table
    const { columns, values } = results[0];
    const header = columns.join(" | ");
    const separator = columns.map(() => "---").join(" | ");
    const rows = values.map((row: any[]) =>
      row.map(v => v === null ? "NULL" : String(v)).join(" | ")
    ).join("\n");

    return {
      success: true,
      data: `${header}\n${separator}\n${rows}`,
      rowCount: values.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query execution failed",
    };
  } finally {
    db?.close();
  }
}
