import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Radar as RadarIcon, Map as MapIcon, LayoutGrid, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import MapView from "@/components/MapView";
import { AREAS } from "@/lib/appData";
import { cn } from "@/lib/utils";
import { isPublicProject } from "@/lib/moderation";

export default function Radar() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("lista");
  const [activeArea, setActiveArea] = useState(() => {
    const a = new URLSearchParams(window.location.search).get("area");
    return a || "todas";
  });

  useEffect(() => {
    base44.entities.Project.list("-created_date", 60)
      .then((data) => setProjects(data.filter(isPublicProject)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (activeArea === "todas" ? projects : projects.filter((p) => p.area === activeArea)),
    [projects, activeArea]
  );

  const unmapped = useMemo(
    () => filtered.filter((p) => p.lat == null || p.lng == null).length,
    [filtered]
  );

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft px-3 py-1 rounded-full mb-4">
            <RadarIcon className="w-3.5 h-3.5" /> Radar de posibilidades
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3 text-balance">
            Cosas que podrían existir si la gente se sincroniza.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            No es un listado de servicios. Es un mapa de energía colectiva: quién
            busca qué, cuántas piezas faltan, qué pasaría si se completan.
          </p>
        </motion.div>
      </section>

      {/* Filtros por área */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveArea("todas")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border transition-colors",
              activeArea === "todas"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            Todas
          </button>
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

      {/* Vista Lista / Mapa — estilo distinto a los filtros de área */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div
            role="tablist"
            aria-label="Vista del radar"
            className="inline-flex items-center p-1 rounded-full border border-border bg-muted/60 shadow-sm"
          >
            <button
              role="tab"
              aria-selected={view === "lista"}
              onClick={() => setView("lista")}
              className={cn(
                "inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all",
                view === "lista"
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" /> Lista
            </button>
            <button
              role="tab"
              aria-selected={view === "mapa"}
              onClick={() => setView("mapa")}
              className={cn(
                "inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all",
                view === "mapa"
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapIcon className="w-4 h-4" /> Mapa
            </button>
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-semibold text-center">
            {view === "mapa" ? "Mapa de piezas" : "Todas las piezas"}
            <span className="text-muted-foreground font-normal ml-2">
              ({view === "mapa" ? filtered.filter((p) => p.lat != null && p.lng != null).length : filtered.length})
            </span>
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {view === "lista" ? (
            <motion.div
              key="lista"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-52 bg-muted animate-pulse piece-cut" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-secondary/40 border border-dashed border-border piece-cut p-10 text-center text-muted-foreground">
                  {activeArea === "todas"
                    ? "Todavía no hay piezas lanzadas. "
                    : "No hay piezas en esta área todavía. "}
                  <Link to="/crear" className="text-accent font-medium hover:underline inline-flex items-center gap-1">
                    Lanza una <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="mapa"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="h-[60vh] sm:h-[68vh] bg-muted animate-pulse piece-cut" />
              ) : (
                <>
                  <MapView projects={filtered} />
                  {unmapped > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {unmapped} proyecto(s) sin coordenadas no aparecen en el mapa.
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </Layout>
  );
}