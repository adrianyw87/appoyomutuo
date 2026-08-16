import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { Sparkles, ArrowRight, Puzzle, HeartHandshake, Zap, Eye, Users, Ban } from "lucide-react";
import Layout from "@/components/Layout";
import Reveal from "@/components/Reveal";
import PrincipleCard from "@/components/PrincipleCard";

const PRINCIPLES = [
  {
    title: "Apoyo mutuo, no caridad",
    Icon: HeartHandshake,
    color: "#1C2859",
    description:
      "La gente se organiza entre iguales para cubrir necesidades reales de la vida cotidiana, sin depender de grandes empresas ni esperar a que alguien haga algo por ella.",
    quote: "No se trata de que te ayuden. Se trata de que nos ayudemos.",
  },
  {
    title: "Masa crítica, no promesas vacías",
    Icon: Zap,
    color: "#5A78D4",
    description:
      "Un proyecto no existe hasta que las piezas necesarias se encuentran. Nadie se compromete a algo imposible: el compromiso surge cuando se dan las condiciones para que funcione.",
    quote: "El proyecto no existe hasta existir. Y eso se ve claro desde el primer momento.",
  },
  {
    title: "Piezas que encajan",
    Icon: Puzzle,
    color: "#9A7BD0",
    description:
      "Cada persona, recurso, espacio o conocimiento es una pieza. Aisladas parecen poco; encajadas, pueden más. La plataforma hace visible cómo encajan.",
    quote: "Somos piezas que unidas pueden más.",
  },
  {
    title: "Hace visibles posibilidades, no ofrece servicios",
    Icon: Eye,
    color: "#3E5BBA",
    description:
      "Appoyo Mutuo no crea proyectos ni vende servicios. Hace visibles posibilidades colectivas reales y ayuda a que la gente se atreva a crearlas.",
    quote: "La plataforma no crea proyectos. Hace que la gente se atreva a crearlos.",
  },
  {
    title: "Autonomía colectiva y vida digna",
    Icon: Users,
    color: "#6B6FBF",
    description:
      "Fortalecemos la autonomía colectiva frente a la conformidad impuesta por la falta de alternativas. Proyectos que hacen más digna la vida en común.",
    quote: "La gente no es conformista. Simplemente no tiene alternativas prácticas.",
  },
  {
    title: "Sin violencia, discriminación ni explotación",
    Icon: Ban,
    color: "#2A6F8E",
    description:
      "No se permiten proyectos que promuevan violencia, discriminación o explotación. Appoyo Mutuo hace visibles posibilidades colectivas reales, nunca daño.",
    quote: "Solo lo que suma vida en común.",
  },
];

export default function Principios() {
  const progressRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: progressRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28 });

  return (
    <Layout>
      {/* Barra de progreso fluida */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-50"
      />

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft px-3 py-1 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Lo que nos mueve
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-balance mb-6">
            Principios que encajan
            <span className="block text-accent">para que algo exista.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            No es una plataforma cualquiera. Estos son los principios que sostienen
            cada proyecto y que deciden qué tiene cabida aquí y qué no.
          </p>
        </motion.div>
      </section>

      {/* Hilera de principios fluida */}
      <div ref={progressRef} className="relative">
        {/* hilo vertical de progreso (desktop) */}
        <div className="hidden md:block fixed left-6 top-1/2 -translate-y-1/2 z-30 h-40 w-px bg-border">
          <motion.div
            style={{ scaleY: progress }}
            className="absolute top-0 left-0 right-0 bottom-0 w-px bg-accent origin-top"
          />
        </div>

        {PRINCIPLES.map((p, i) => (
          <PrincipleCard key={i} principle={p} index={i} />
        ))}
      </div>

      {/* Cierre */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Reveal>
          <p className="font-heading text-2xl sm:text-3xl font-medium leading-snug text-balance mb-6">
            Estos principios no son decorativos.
            <span className="block text-muted-foreground">Son el filtro de lo que permite existir.</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/radar"
              className="ui-cta group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md font-medium piece-cut"
            >
              Ver qué podría existir aquí
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/crear"
              className="ui-cta group inline-flex items-center gap-2 border border-primary text-primary px-5 py-3 rounded-md font-medium hover:bg-primary hover:text-primary-foreground"
            >
              Lanzar una idea
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}