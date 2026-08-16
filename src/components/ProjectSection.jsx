import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import { cn } from "@/lib/utils";

export default function ProjectSection({ title, subtitle, to = "/radar", linkLabel = "Ver todas", projects = [], loading, emptyText }) {
  const [page, setPage] = useState(0);
  const [perView, setPerView] = useState(3);

  // detecta tarjetas visibles según ancho
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // agrupa proyectos en páginas de `perView` tarjetas
  const pages = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < projects.length; i += perView) {
      out.push(projects.slice(i, i + perView));
    }
    return out.length ? out : [[]];
  }, [projects, perView]);

  const pageCount = pages.length;

  useEffect(() => {
    if (page > pageCount - 1) setPage(0);
  }, [pageCount, page]);

  if (!loading && projects.length === 0) return null;
  const showArrows = projects.length > perView;
  const offset = pageCount > 0 ? (page * 100) / pageCount : 0;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-10">
        <Reveal>
          <div className="flex justify-center mb-3">
            <span className="h-px w-10 bg-accent/50" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-[1.1] text-balance">
            {title}
          </h2>
          {subtitle && <p className="text-muted-foreground text-base mt-2 max-w-xl mx-auto text-balance">{subtitle}</p>}
          <Link to={to} className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1 mt-3">
            {linkLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 bg-muted animate-pulse piece-cut" />
          ))}
        </div>
      ) : (
        <>
          {/* marco con overflow oculto: las páginas no activas se recortan y no se cuelan */}
          <div className="overflow-hidden px-2 sm:px-4 py-10">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${pageCount * 100}%`, transform: `translateX(-${offset}%)` }}
            >
              {pages.map((group, gi) => (
                <div
                  key={gi}
                  className="w-full"
                  style={{ width: `${100 / pageCount}%` }}
                >
                  <div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}
                  >
                    {group.map((p, i) => (
                      <ProjectCard key={p.id} project={p} index={gi * perView + i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showArrows && (
            <div className="flex flex-col items-center gap-4 -mt-2">
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Anterior"
                  className={cn(
                    "w-9 h-9 grid place-items-center rounded-md border transition-colors",
                    page > 0 ? "border-border hover:border-primary/40 hover:bg-accent-soft text-primary" : "border-border text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page === pageCount - 1}
                  aria-label="Siguiente"
                  className={cn(
                    "w-9 h-9 grid place-items-center rounded-md border transition-colors",
                    page < pageCount - 1 ? "border-border hover:border-primary/40 hover:bg-accent-soft text-primary" : "border-border text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {pageCount > 1 && (
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      aria-label={`Página ${i + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === page ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/40"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}