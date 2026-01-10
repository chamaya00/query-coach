"use client";

import { useState, useMemo } from "react";

interface TableBrowserProps {
  schema: string;
  defaultExpanded?: boolean;
}

interface TableInfo {
  name: string;
  columns: { name: string; type: string }[];
  data: Record<string, string | number | null>[];
}

function parseSchema(schema: string): TableInfo[] {
  const tables: TableInfo[] = [];

  // Parse CREATE TABLE statements
  const createTableRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = createTableRegex.exec(schema)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];

    // Parse columns
    const columns: { name: string; type: string }[] = [];
    const columnLines = columnsStr.split(",");

    for (const line of columnLines) {
      const trimmed = line.trim();
      // Skip empty lines and constraint definitions
      if (!trimmed || trimmed.startsWith("FOREIGN") || trimmed.startsWith("PRIMARY") || trimmed.startsWith("UNIQUE")) {
        continue;
      }

      // Match column name and type
      const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\([^)]+\))?)/);
      if (colMatch) {
        columns.push({
          name: colMatch[1],
          type: colMatch[2],
        });
      }
    }

    tables.push({ name: tableName, columns, data: [] });
  }

  // Parse INSERT statements for sample data
  const insertRegex = /INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;

  while ((match = insertRegex.exec(schema)) !== null) {
    const tableName = match[1];
    const columnNames = match[2].split(",").map((c) => c.trim());
    const valuesStr = match[3];

    const table = tables.find((t) => t.name === tableName);
    if (!table) continue;

    // Parse multiple value tuples
    const tupleRegex = /\(([^)]+)\)/g;
    let tupleMatch;

    while ((tupleMatch = tupleRegex.exec(valuesStr)) !== null) {
      const values = parseValueTuple(tupleMatch[1]);
      const row: Record<string, string | number | null> = {};

      columnNames.forEach((col, idx) => {
        row[col] = values[idx] ?? null;
      });

      table.data.push(row);
    }
  }

  return tables;
}

function parseValueTuple(tuple: string): (string | number | null)[] {
  const values: (string | number | null)[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < tuple.length; i++) {
    const char = tuple[i];

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar) {
      inString = false;
      values.push(current);
      current = "";
      // Skip to next comma
      while (i < tuple.length && tuple[i] !== ",") i++;
    } else if (!inString && char === ",") {
      const trimmed = current.trim();
      if (trimmed === "NULL") {
        values.push(null);
      } else if (trimmed !== "") {
        const num = parseFloat(trimmed);
        values.push(isNaN(num) ? trimmed : num);
      }
      current = "";
    } else if (inString || char !== " ") {
      current += char;
    } else if (!inString && current.length > 0) {
      current += char;
    }
  }

  // Handle last value
  if (current.trim()) {
    const trimmed = current.trim();
    if (trimmed === "NULL") {
      values.push(null);
    } else {
      const num = parseFloat(trimmed);
      values.push(isNaN(num) ? trimmed : num);
    }
  }

  return values;
}

export default function TableBrowser({ schema, defaultExpanded = false }: TableBrowserProps) {
  const tables = useMemo(() => parseSchema(schema), [schema]);
  const [selectedTable, setSelectedTable] = useState<string | null>(
    tables.length > 0 ? tables[0].name : null
  );
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const currentTable = tables.find((t) => t.name === selectedTable);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
      >
        <span>Database Tables ({tables.length})</span>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <>
          {/* Table tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${
                    selectedTable === table.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
              >
                {table.name}
              </button>
            ))}
          </div>

          {/* Table details */}
          {currentTable && (
            <div className="space-y-4">
              {/* Columns */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Columns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentTable.columns.map((col) => (
                    <span
                      key={col.name}
                      className="inline-flex items-center px-2 py-1 text-xs font-mono
                               bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      <span className="font-medium">{col.name}</span>
                      <span className="ml-1 text-gray-400 dark:text-gray-500">
                        {col.type}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample data */}
              {currentTable.data.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Sample Data ({currentTable.data.length} rows)
                  </h4>
                  <div className="overflow-auto max-h-64 border border-gray-200 dark:border-gray-700 rounded-md">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          {currentTable.columns.map((col) => (
                            <th
                              key={col.name}
                              className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                            >
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentTable.data.map((row, idx) => (
                          <tr
                            key={idx}
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                          >
                            {currentTable.columns.map((col) => (
                              <td
                                key={col.name}
                                className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                              >
                                {row[col.name] === null ? (
                                  <span className="text-gray-400 italic">NULL</span>
                                ) : (
                                  String(row[col.name])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tables.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No tables found in schema.
            </p>
          )}
        </>
      )}
    </div>
  );
}
