"use client";

import { CoachResponse } from "@/lib/types";

interface FeedbackPanelProps {
  response: CoachResponse | null;
  error: string | null;
  loading: boolean;
}

export default function FeedbackPanel({ response, error, loading }: FeedbackPanelProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Analyzing your query...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h3 className="text-red-800 dark:text-red-400 font-medium">Error</h3>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg
            className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            Write a query and click &quot;Get Feedback&quot; to receive coaching
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full overflow-auto">
      {/* Query Result */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Query Result
        </h3>
        <div
          className={`p-3 rounded-md font-mono text-sm ${
            response.queryResult.success
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
          }`}
        >
          <pre className="whitespace-pre-wrap">
            {response.queryResult.success
              ? response.queryResult.data
              : `ERROR: ${response.queryResult.error}`}
          </pre>
        </div>
        {response.queryResult.rowCount !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {response.queryResult.rowCount} row(s) returned in {response.executionTimeMs}ms
          </p>
        )}
      </div>

      {/* Coach Feedback */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Coach Feedback
        </h3>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {response.feedback}
          </div>
        </div>
      </div>
    </div>
  );
}
