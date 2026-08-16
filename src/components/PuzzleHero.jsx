import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AREAS } from "@/lib/appData";
import { User } from "lucide-react";

// Genera el path de una pieza de puzle con pestañas (t=saliente) y muescas (n=hueco).
// spec: 4 chars "top,right,bottom,left" → t / n / f (plano)
function piecePath(x, y, w, h, spec, r = 10, b = 13) {
  const mx = x + w / 2;
  const my = y + h / 2;
  const T = spec[0], R = spec[1], B = spec[2], L = spec[3];
  const sweep = (c) => (c === "t" ? 1 : 0);
  const bump = (c, x1, y1, x2, y2) =>
    c === "f" ? ` L ${x1} ${y1} L ${x2} ${y2}` : ` L ${x1} ${y1} A ${b} ${b} 0 0 ${sweep(c)} ${x2} ${y2}`;

  let d = `M ${x + r} ${y}`;
  d += bump(T, mx - b, y, mx + b, y);
  d += ` L ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w} ${y + r}`;
  d += bump(R, x + w, my - b, x + w, my + b);
  d += ` L ${x + w} ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`;
  d += bump(B, mx + b, y + h, mx - b, y + h);
  d += ` L ${x + r} ${y + h} A ${r} ${r} 0 0 1 ${x} ${y + h - r}`;
  d += bump(L, x, my + b, x, my - b);
  d += ` L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  return d;
}

const ACCENT = "#6C9EFF";

// Descripciones cortas de cada área de la vida
const AREA_BLURB = {
  subsistencia: "Comer bien, producir y compartir comida.",
  vivienda: "Acceder a un hogar digno y asequible.",
  trabajo: "Trabajo cooperativo y autogestionado.",
  cuidados: "Redes de apoyo mutuo y cuidados.",
  educacion: "Aprender y enseñar entre nosotras.",
  salud: "Salud comunitaria y prevención.",
  ocio: "Ocio compartido y cultura libre.",
  comunidad: "Vínculo, barrio y tejido social.",
};

const AREA_KEYS = Object.keys(AREAS);

const CELL = 90;
const OX = 65;
const OY = 65;

// Layout del tablero 3×3 (la central es el usuario). Cada pieza = un área.
const LAYOUT = [
  { r: 0, c: 0, spec: "fttf", scatter: [-38, -38], rot: -14 },
  { r: 0, c: 1, spec: "fttn", scatter: [0, -48], rot: 12 },
  { r: 0, c: 2, spec: "fftn", scatter: [38, -38], rot: -10 },
  { r: 1, c: 0, spec: "nttf", scatter: [-48, 0], rot: 16 },
  { r: 1, c: 2, spec: "nftn", scatter: [48, 0], rot: -16 },
  { r: 2, c: 0, spec: "ntff", scatter: [-38, 38], rot: 10 },
  { r: 2, c: 1, spec: "ntfn", scatter: [0, 48], rot: -12 },
  { r: 2, c: 2, spec: "nffn", scatter: [38, 38], rot: 14 },
];

const PIECES = LAYOUT.map((cell, i) => {
  const key = AREA_KEYS[i];
  return { ...cell, key, color: AREAS[key].color };
});

const CENTER = { r: 1, c: 1, spec: "nttn", color: ACCENT, key: "tu", label: "Tú", blurb: "El punto de partida. Todo proyecto empieza contigo." };

function Cell({ piece, isCenter = false, delay, floatDelay, onHover }) {
  const x = OX + piece.c * CELL;
  const y = OY + piece.r * CELL;
  const d = piecePath(x, y, CELL, CELL, piece.spec);
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const scatter = isCenter ? [0, 0] : piece.scatter;
  const rot = isCenter ? 0 : piece.rot;

  return (
    <motion.g
      initial={{ opacity: 0, x: scatter[0], y: scatter[1], scale: 0.7, rotate: rot }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      transition={{ delay, type: "spring", stiffness: 140, damping: 13 }}
      style={{ transformOrigin: `${cx}px ${cy}px`, cursor: "pointer" }}
      onHoverStart={() => onHover({ cx, cy, ...piece, isCenter })}
      onHoverEnd={() => onHover(null)}
    >
      <motion.g
        animate={{ y: [0, isCenter ? -3 : -5, 0] }}
        transition={{ duration: 3.6 + (floatDelay % 4), repeat: Infinity, ease: "easeInOut", delay: 1 + floatDelay }}
      >
        <motion.path
          d={d}
          fill={isCenter ? `${piece.color}33` : `${piece.color}12`}
          stroke={piece.color}
          strokeWidth={isCenter ? 2.2 : 1.6}
          whileHover={{
            fill: isCenter ? `${piece.color}66` : `${piece.color}30`,
            strokeWidth: isCenter ? 3 : 2.6,
            filter: `drop-shadow(0 0 10px ${piece.color}AA)`,
          }}
          style={isCenter ? { filter: `drop-shadow(0 0 16px ${ACCENT}88)` } : undefined}
        />
      </motion.g>
    </motion.g>
  );
}

export default function PuzzleHero() {
  const [hovered, setHovered] = useState(null);

  // Posición del tooltip en % del contenedor (viewBox 400×400)
  const left = hovered ? (hovered.cx / 400) * 100 : 0;
  const top = hovered ? (hovered.cy / 400) * 100 : 0;
  const placeBelow = hovered && hovered.r === 0;
  const Icon = hovered && !hovered.isCenter ? AREAS[hovered.key]?.Icon : User;
  const label = hovered ? (hovered.isCenter ? CENTER.label : AREAS[hovered.key].label) : "";
  const blurb = hovered ? (hovered.isCenter ? CENTER.blurb : AREA_BLURB[hovered.key]) : "";
  const color = hovered ? hovered.color : ACCENT;

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* halo ambiental */}
      <motion.div
        className="absolute inset-[8%] rounded-full"
        style={{ background: `radial-gradient(circle, ${ACCENT}26, transparent 68%)` }}
        animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.92, 1.06, 0.92] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 400 400" className="relative w-full h-full overflow-visible">
        {/* resplandor del núcleo */}
        <motion.circle
          cx={200} cy={200} r={50}
          fill={ACCENT}
          animate={{ opacity: [0.12, 0.28, 0.12], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "200px 200px" }}
        />

        {/* piezas que encajan */}
        {PIECES.map((p, i) => (
          <Cell key={i} piece={p} delay={0.15 + i * 0.09} floatDelay={i * 0.4} onHover={setHovered} />
        ))}
        <Cell piece={CENTER} isCenter delay={0.95} floatDelay={0.5} onHover={setHovered} />

        {/* núcleo pulsante */}
        <motion.circle
          cx={200} cy={200} r={5}
          fill={ACCENT}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </svg>

      {/* Tooltip flotante con info del área */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: placeBelow ? 6 : -6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placeBelow ? 6 : -6, scale: 0.92 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: `translate(-50%, ${placeBelow ? "24%" : "-118%"})`,
              borderColor: `${color}55`,
            }}
            className="pointer-events-none absolute z-10 w-44 sm:w-52 rounded-xl bg-card border shadow-xl px-3.5 py-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-7 h-7 grid place-items-center rounded-lg piece-cut"
                style={{ background: `${color}1A`, color }}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="font-heading text-sm font-semibold" style={{ color }}>
                {label}
              </span>
              {hovered.isCenter && (
                <span className="ml-auto text-[0.6rem] uppercase tracking-wide text-muted-foreground">usuario</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{blurb}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}