"use client";

import { UserLevel } from "@/lib/types";

interface LevelSelectorProps {
  level: UserLevel;
  onLevelChange: (level: UserLevel) => void;
}

const levels: { value: UserLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function LevelSelector({ level, onLevelChange }: LevelSelectorProps) {
  return (
    <div className="flex items-center space-x-1">
      {levels.map((l) => (
        <button
          key={l.value}
          onClick={() => onLevelChange(l.value)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            level === l.value
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
