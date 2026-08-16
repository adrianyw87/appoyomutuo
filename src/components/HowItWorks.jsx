import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lightbulb, Users, Rocket } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Lightbulb,
    title: "Lanzas una idea",
    desc: "Defines qué necesidad cotidiana cubre, qué hace falta para que exista y con qué se aporta (dinero, tiempo, espacio o conocimiento). Nada se promete todavía — solo se hace visible.",
    chip: "Sin compromiso",
  },
  {
    n: "02",
    icon: Users,
    title: "La gente se suma",
    desc: "Cada persona es una pieza que encaja. Ves cuánta gente hace falta y cuánta ya se ha unido. Te sumas solo si las condiciones te cuadran.",
    chip: "Masa crítica visible",
  },
  {
    n: "03",
    icon: Rocket,
    title: "Se activa",
    desc: "Cuando se alcanzan las condiciones acordadas, el proyecto cobra vida — ni antes ni a ciegas. Si no llega, no pasa nada: la idea queda abierta para más adelante.",
    chip: "Solo si se da",
    active: true,
  },
];

const spring = { type: "spring", stiffness: 220, damping: 18, mass: 0.8 };

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-90px" });

  return (
    <div ref={ref} className="relative">
      {/* Hilo conector horizontal a la altura de los nodos (escritorio) */}
      <svg
        className="hidden md:block absolute top-10 left-0 w-full h-2 -z-0 pointer-events-none overflow-visible"
        viewBox="0 0 1000 8"
        preserveAspectRatio="none"
      >
        <line
          x1="160" y1="4" x2="840" y2="4"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <motion.line
          x1="160" y1="4" x2="840" y2="4"
          stroke="hsl(var(--accent))"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>

      <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const scatter = [
            { x: -28, y: -14, r: -6 },
            { x: 0, y: -22, r: 5 },
            { x: 28, y: -14, r: -5 },
          ][i];

          return (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: scatter.x, y: scatter.y, rotate: scatter.r, scale: 0.9 }}
              animate={inView ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 } : {}}
              transition={{ ...spring, delay: 0.15 * i }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Medallón-nodo con número */}
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={inView ? { scale: 1, rotate: 0 } : {}}
                transition={{ ...spring, delay: 0.25 + i * 0.18 }}
                className={`relative w-20 h-20 grid place-items-center piece-cut mb-6 ${
                  step.active
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border border-border shadow-sm"
                }`}
              >
                <Icon className="w-8 h-8" />
                <span
                  className={`absolute -bottom-2 -right-2 min-w-7 h-7 px-1.5 grid place-items-center rounded-full font-heading text-xs font-bold piece-cut ${
                    step.active
                      ? "bg-accent text-accent-foreground"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  {step.n}
                </span>
                {step.active && (
                  <span className="absolute inset-0 piece-cut bg-accent/20 node-pulse" />
                )}
              </motion.div>

              {/* Título + descripción */}
              <h3 className="font-heading text-2xl font-bold leading-tight mb-2">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xs mb-4">
                {step.desc}
              </p>

              <span
                className={`inline-flex items-center gap-1.5 text-[0.72rem] font-medium px-3 py-1 rounded-full ${
                  step.active
                    ? "bg-accent text-accent-foreground"
                    : "bg-accent-soft text-accent"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${step.active ? "bg-accent-foreground" : "bg-accent"}`} />
                {step.chip}
              </span>

              {/* conector vertical (móvil) */}
              {i < STEPS.length - 1 && (
                <div className="md:hidden mt-6 mb-1">
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={inView ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.3 }}
                    className="block w-px h-8 border-l-2 border-dashed border-border origin-top"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}