"use client";

import Editor from "@monaco-editor/react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SQLEditor({ value, onChange }: SQLEditorProps) {
  return (
    <>
      <style jsx global>{`
        .monaco-editor,
        .monaco-editor-background,
        .monaco-editor .inputarea.ime-input,
        .monaco-editor .margin,
        .monaco-editor .monaco-scrollable-element {
          background-color: #1e1e1e !important;
        }
      `}</style>
      <div className="border border-gray-600 rounded-md overflow-hidden bg-[#1e1e1e]">
        <Editor
          height="200px"
          defaultLanguage="sql"
          value={value}
          onChange={(val) => onChange(val || "")}
          theme="vs-dark"
          loading={<div className="h-[200px] bg-[#1e1e1e]" />}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden",
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            renderLineHighlight: "none",
          }}
        />
      </div>
    </>
  );
}
