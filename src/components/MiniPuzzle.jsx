import React from "react";
import { Puzzle } from "lucide-react";

/**
 * Conteo de personas como mini-piezas de puzle (estilo logo).
 * Piezas rellenas = personas ya unidas; huecas = faltan.
 */
export default function MiniPuzzleCount({ joined = 0, needed = 0, accent, running = false, max = 6 }) {
  const remaining = Math.max(0, needed - joined);
  const shown = Math.min(needed, max);
  const complete = running || remaining === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: shown }).map((_, i) => {
          const filled = i < joined;
          return (
            <Puzzle
              key={i}
              className="w-4 h-4"
              style={
                filled
                  ? { color: accent, fill: `${accent}40` }
                  : { color: "hsl(var(--muted-foreground))", fill: "transparent", opacity: 0.35 }
              }
            />
          );
        })}
      </div>
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
        {joined}/{needed}
      </span>
      <span className="text-xs font-medium" style={{ color: complete ? "#059669" : accent }}>
        {complete ? "completo" : `faltan ${remaining}`}
      </span>
    </div>
  );
}