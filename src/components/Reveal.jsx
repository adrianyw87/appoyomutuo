import { motion } from "framer-motion";

/**
 * Reveal: envuelve cualquier contenido y lo anima (fade + slide-up)
 * la primera vez que entra en el viewport. Reutilizable para headings,
 * bloques y elementos de grid con stagger (delay).
 */
const EASE = [0.22, 1, 0.36, 1];

export default function Reveal({ children, delay = 0, y = 18, className, as = "div" }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}