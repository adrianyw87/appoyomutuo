import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de principio con animación fluida ligada al scroll:
 * la pieza-icono se desplaza en diagonal y gira, mientras el texto
 * entra y sale con suavidad a medida que recorre la pantalla.
 */
export default function PrincipleCard({ principle, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const side = index % 2 === 0; // true = pieza a la izquierda
  const pieceX = useTransform(scrollYProgress, [0, 1], [side ? -50 : 50, side ? 50 : -50]);
  const pieceY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-14, 14]);
  const textY = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -50]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.22, 0.78, 1], [0, 1, 1, 0]);
  const numberScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1, 0.7]);

  const Icon = principle.Icon;
  const color = principle.color;

  const Piece = (
    <motion.div
      style={{ x: pieceX, y: pieceY, rotate }}
      className="relative flex justify-center items-center"
    >
      <div
        className="relative w-36 h-36 sm:w-44 sm:h-44 grid place-items-center piece-cut shadow-2xl"
        style={{ background: `linear-gradient(140deg, ${color}, ${color}CC)` }}
      >
        <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-white" strokeWidth={1.6} />
        <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-card border-2 piece-cut grid place-items-center text-[0.7rem] font-bold font-heading" style={{ borderColor: color, color }}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </motion.div>
  );

  const Text = (
    <motion.div style={{ y: textY, opacity: textOpacity }} className="max-w-xl">
      <motion.span
        style={{ scale: numberScale }}
        className="block font-heading font-bold leading-none text-7xl sm:text-8xl mb-2 select-none"
      >
        <span style={{ color }}>{String(index + 1).padStart(2, "0")}</span>
      </motion.span>
      <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3 text-balance leading-tight">
        {principle.title}
      </h2>
      <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-5 text-balance">
        {principle.description}
      </p>
      <div className="relative pl-5 border-l-2" style={{ borderColor: color }}>
        <p className="italic text-foreground/80 text-sm sm:text-base text-balance">
          “{principle.quote}”
        </p>
      </div>
    </motion.div>
  );

  return (
    <section ref={ref} className="relative min-h-[58vh] flex items-center px-4 sm:px-6 py-8">
      <div
        className={cn(
          "max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-8 sm:gap-14 items-center",
          side ? "" : "md:[&>*:first-child]:order-2"
        )}
      >
        {Piece}
        {Text}
      </div>
    </section>
  );
}