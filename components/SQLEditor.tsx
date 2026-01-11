"use client";

import Editor from "@monaco-editor/react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function LoadingIndicator() {
  return (
    <div className="h-[200px] flex items-center justify-center bg-slate-800 rounded-md">
      <div className="flex items-center gap-3">
        <svg
          className="animate-spin h-5 w-5 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm text-cyan-300 font-medium">
          Loading editor...
        </span>
      </div>
    </div>
  );
}

export default function SQLEditor({ value, onChange }: SQLEditorProps) {
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      <Editor
        height="200px"
        defaultLanguage="sql"
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-dark"
        loading={<LoadingIndicator />}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
