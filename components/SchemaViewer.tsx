"use client";

import { useState } from "react";

interface SchemaViewerProps {
  schema: string;
  onSchemaChange: (schema: string) => void;
}

export default function SchemaViewer({ schema, onSchemaChange }: SchemaViewerProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Database Schema
        </label>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={schema}
          onChange={(e) => onSchemaChange(e.target.value)}
          className="w-full h-64 px-3 py-2 font-mono text-sm
                   border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : (
        <pre className="w-full h-64 overflow-auto px-3 py-2 font-mono text-sm
                      bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200
                      border border-gray-200 dark:border-gray-700 rounded-md">
          {schema}
        </pre>
      )}
    </div>
  );
}
