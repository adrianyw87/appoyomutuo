import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Textarea que crece en altura al escribir (sin scroll horizontal). */
export default function AutoTextarea({
  value,
  onChange,
  className,
  minRows = 3,
  maxRows = 16,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const padding =
      (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    const maxH = lineHeight * maxRows + padding;
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = `${Math.max(next, lineHeight * minRows + padding)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={minRows}
      className={cn(
        "w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm",
        "focus:outline-none focus:ring-2 focus:ring-accent/30",
        "resize-none overflow-x-hidden break-words whitespace-pre-wrap",
        className
      )}
      {...props}
    />
  );
}
