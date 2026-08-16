import React from "react";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/appData";

const TONE_CLASSES = {
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent-soft text-accent",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

export default function StatusBadge({ status, className }) {
  const meta = statusMeta(status);
  const Icon = meta.Icon;
  const pulse = meta.tone === "accent";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[meta.tone],
        className
      )}
    >
      <span className="relative inline-flex">
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-current opacity-60 animate-ping" />
        )}
        <Icon className="w-3 h-3 relative" />
      </span>
      {meta.label}
    </span>
  );
}