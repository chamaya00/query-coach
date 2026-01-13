"use client";

import Editor from "@monaco-editor/react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SQLEditor({ value, onChange }: SQLEditorProps) {
  return (
    <div className="rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <span className="text-xs text-gray-400 font-mono ml-2">SQL Editor</span>
      </div>
      <Editor
        height="200px"
        defaultLanguage="sql"
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
