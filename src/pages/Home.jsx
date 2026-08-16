import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Radar as RadarIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import PuzzleHero from "@/components/PuzzleHero";
import HowItWorks from "@/components/HowItWorks";
import Reveal from "@/components/Reveal";
import ProjectSection from "@/components/ProjectSection";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Project.list("-created_date", 30)
      .then((data) => setProjects(data))
      .finally(() => setLoading(false));
  }, []);

  const recent = projects.slice(0, 6);
  const running = useMemo(
    () => projects.filter((p) => p.status === "funcionando").slice(0, 6),
    [projects]
  );
  const near = useMemo(() => {
    return [...projects]
      .filter((p) => p.status !== "funcionando" && p.status !== "idea" && (p.people_needed || 0) > 0)
      .map((p) => ({ p, ratio: (p.people_joined || 0) / (p.people_needed || 1) }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 6)
      .map((x) => x.p);
  }, [projects]);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-balance mb-6">
              La mayoría de cosas no existen
              <span className="block text-muted-foreground">porque la gente que las quiere</span>
              <span className="block text-accent">no se encuentra.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8 text-balance">
              Personas organizándose para cubrir necesidades cotidianas sin depender
              de grandes empresas. Somos piezas que unidas pueden más.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/radar"
                className="ui-cta group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md font-medium piece-cut"
              >
                <RadarIcon className="w-4 h-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                Ver qué podría existir aquí
              </Link>
              <Link
                to="/crear"
                className="ui-cta group inline-flex items-center gap-2 border border-primary text-primary px-5 py-3 rounded-md font-medium hover:bg-primary hover:text-primary-foreground"
              >
                Lanzar una idea
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <PuzzleHero />
          </motion.div>
        </div>
      </section>

      {/* PRINCIPIO */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-heading text-2xl sm:text-3xl font-medium leading-snug text-balance"
          >
            “La gente no es conformista.
            <span className="block text-primary-foreground/60">Simplemente no tiene alternativas prácticas.”</span>
          </motion.blockquote>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <h2 className="font-heading text-2xl font-semibold mb-2">No me comprometo a algo imposible.</h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            Me comprometo si se dan las condiciones. El proyecto no existe hasta
            alcanzar masa crítica — y eso se ve claro desde el primer momento.
          </p>
        </Reveal>
        <HowItWorks />
      </section>

      {/* A PUNTO DE ACTIVARSE */}
      <ProjectSection
        title="A punto de activarse"
        subtitle="Están a una pieza de cobrar vida. Tal vez la que falta seas tú."
        linkLabel="Ver en el radar"
        projects={near}
        loading={loading}
      />

      {/* YA FUNCIONANDO */}
      <ProjectSection
        title="Ya funcionando"
        subtitle="Proyectos que alcanzaron su masa crítica y hoy son reales."
        linkLabel="Ver en el radar"
        projects={running}
        loading={loading}
      />

      {/* POSIBILIDADES RECIENTES */}
      <ProjectSection
        title="Posibilidades en movimiento"
        subtitle="Esto no está terminado. Está ocurriendo."
        projects={recent}
        loading={loading}
      />

      {/* CTA FINAL */}
      <section className="w-full">
        <Reveal>
          <div className="relative overflow-hidden bg-primary text-primary-foreground px-6 sm:px-10 py-14 sm:py-20 text-center">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
            <p className="relative font-heading text-2xl sm:text-3xl font-semibold leading-snug text-balance mb-3">
              ¿Qué necesita existir en tu barrio?
            </p>
            <p className="relative text-primary-foreground/70 max-w-md mx-auto mb-7 text-balance">
              No tienes que hacerlo sola. Lanza la idea y deja que las piezas se encuentren.
            </p>
            <Link
              to="/crear"
              className="ui-cta group relative inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-medium"
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