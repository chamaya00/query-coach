"use client";

import Editor from "@monaco-editor/react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SQLEditor({ value, onChange }: SQLEditorProps) {
  return (
    <div className="border border-cyan-200 rounded-xl overflow-hidden shadow-sm">
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
        }}
      />
    </div>
  );
}
