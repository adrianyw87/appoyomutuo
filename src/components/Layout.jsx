import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Puzzle, Radar, Lightbulb, Plus, Home as HomeIcon, Sparkles, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import ConstellationBg from "@/components/ConstellationBg";
import UserMenu from "@/components/UserMenu";

const NAV = [
  { to: "/", label: "Inicio", icon: HomeIcon },
  { to: "/radar", label: "Radar", icon: Radar },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/principios", label: "Principios", icon: Sparkles },
  { to: "/area", label: "Mi Espacio", icon: Briefcase },
  { to: "/crear", label: "Lanzar idea", icon: Plus, accent: true },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="relative isolate min-h-screen flex flex-col bg-background overflow-hidden">
      <ConstellationBg />
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-primary text-primary-foreground border-b border-primary-foreground/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center">
          <div className="justify-self-start">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 12 }}
              className="w-8 h-8 grid place-items-center bg-accent text-accent-foreground piece-cut"
            >
              <Puzzle className="w-4 h-4" />
            </motion.div>
            <span className="font-heading font-semibold text-lg tracking-tight">
              Appoyo<span className="text-accent">Mutuo</span>
            </span>
          </Link>
        </div>

          <nav className="justify-self-center hidden md:flex items-center gap-1 whitespace-nowrap">
              {NAV.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-primary-foreground"
                        : "text-primary-foreground/70 hover:text-primary-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 transition-transform", active ? "scale-110" : "group-hover:scale-110")} />
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full bg-accent"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {!active && (
                      <span className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full bg-primary-foreground/40 origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    )}
                  </Link>
                );
              })}
            </nav>
          <div className="justify-self-end">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* nav móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground border-t border-primary-foreground/10">
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-medium transition-colors",
                  active ? "text-accent-soft" : "text-primary-foreground/60"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 pt-16 pb-24 md:pb-0">{children}</main>

      <footer className="border-t border-border bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 grid place-items-center bg-accent text-accent-foreground piece-cut">
                <Puzzle className="w-3 h-3" />
              </div>
              <span className="font-heading font-semibold">Appoyo Mutuo</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Una plataforma para proyectos que fortalecen la autonomía colectiva,
              el apoyo mutuo y la vida digna.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Principios</p>
            <p className="text-sm text-muted-foreground">
              No se permiten proyectos que promuevan violencia, discriminación o explotación.
              Appoyo Mutuo no ofrece servicios: hace visibles posibilidades colectivas reales.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">La plataforma no crea proyectos.</p>
            <p className="text-sm text-muted-foreground italic mb-4">
              Hace que la gente se atreva a crearlos.
            </p>
            <Link to="/privacidad" className="text-sm text-primary hover:underline">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}