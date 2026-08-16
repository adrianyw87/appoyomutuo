import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import PuzzleCard from "@/components/PuzzleCard";
import Reveal from "@/components/Reveal";
import { AREAS, areaMeta, contributionMeta } from "@/lib/appData";
import { cn } from "@/lib/utils";

export default function Ideas() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState("subsistencia");

  useEffect(() => {
    base44.entities.Template.list("-created_date", 100)
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    Object.keys(AREAS).forEach((k) => (map[k] = []));
    templates.forEach((t) => {
      if (map[t.area]) map[t.area].push(t);
    });
    return map;
  }, [templates]);

  const current = grouped[activeArea] || [];
  const area = areaMeta(activeArea);
  const AreaIcon = area.Icon;

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft px-3 py-1 rounded-full mb-4">
          <Lightbulb className="w-3.5 h-3.5" /> Plantillas que ya han funcionado
        </span>
        <Reveal>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Ideas para arrancar</h1>
          <p className="text-muted-foreground max-w-xl">
            Modelos reales que comunidades han puesto en marcha. Elige una pieza y
            conviértela en un proyecto en tu contexto.
          </p>
        </Reveal>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-wrap gap-2">
          {Object.entries(AREAS).map(([key, val]) => {
            const Icon = val.Icon;
            return (
              <button
                key={key}
                onClick={() => setActiveArea(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border transition-colors",
                  activeArea === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                <Icon className="w-4 h-4" />
                {val.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse piece-cut" />
            ))}
          </div>
        ) : current.length === 0 ? (
          <div className="bg-secondary/40 border border-dashed border-border piece-cut p-10 text-center text-muted-foreground">
            Pronto habrá plantillas en esta área.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {current.map((t, i) => {
              const contrib = contributionMeta(t.contribution_type);
              const ContribIcon = contrib.Icon;
              const tplArea = areaMeta(t.area);
              const TplIcon = tplArea.Icon;
              const variant = i % 3 === 0 ? "interlock-right" : i % 3 === 1 ? "interlock-left" : "thread-top";
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  whileHover={{ y: -3 }}
                >
                  <PuzzleCard accent="#1C2859" variant={variant}>
                    <div className="p-5 flex flex-col h-full">
                      <div className="w-9 h-9 grid place-items-center rounded-md bg-accent-soft text-accent mb-3">
                        <TplIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-heading font-semibold text-lg mb-2">{t.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 flex-1">{t.description}</p>
                      {t.what_needed && (
                        <p className="text-xs text-muted-foreground border-t border-dashed border-border pt-3 mb-3">
                          <span className="font-medium text-foreground">Hace falta:</span> {t.what_needed}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ContribIcon className="w-3.5 h-3.5" />
                          {contrib.label}
                        </span>
                        <Link
                          to={`/crear?plantilla=${encodeURIComponent(t.name)}&area=${t.area}&aporte=${t.contribution_type}`}
                          className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 group"
                        >
                          Usar esta <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </PuzzleCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}