// Constantes compartidas de Appoyo Mutuo — iconos flat (lucide-react)
import {
  Carrot, Home, Hammer, HeartHandshake, BookOpen, Leaf, Palette, Users,
  Coins, Clock, MapPin, Lightbulb, Sprout, Search, Zap, CheckCircle2, Puzzle,
} from "lucide-react";

export const AREAS = {
  subsistencia: { label: "Alimentación", Icon: Carrot, color: "#3C9D5B" },
  vivienda: { label: "Vivienda", Icon: Home, color: "#C43A4A" },
  trabajo: { label: "Trabajo", Icon: Hammer, color: "#E57A2E" },
  cuidados: { label: "Cuidados", Icon: HeartHandshake, color: "#C04A93" },
  educacion: { label: "Educación", Icon: BookOpen, color: "#7453C8" },
  salud: { label: "Salud", Icon: Leaf, color: "#2D9AA8" },
  ocio: { label: "Ocio", Icon: Palette, color: "#D9B326" },
  comunidad: { label: "Comunidad", Icon: Users, color: "#5B6478" },
};

export const STATUSES = {
  idea: { label: "Idea lanzada", Icon: Sprout, tone: "muted" },
  buscando: { label: "Buscando gente", Icon: Search, tone: "accent" },
  activandose: { label: "A punto de activarse", Icon: Zap, tone: "accent" },
  funcionando: { label: "Ya funcionando", Icon: CheckCircle2, tone: "green" },
  necesita_piezas: { label: "Necesita más piezas", Icon: Puzzle, tone: "amber" },
};

export const CONTRIBUTIONS = {
  dinero: { label: "Dinero", Icon: Coins },
  tiempo: { label: "Tiempo", Icon: Clock },
  espacio: { label: "Espacio", Icon: MapPin },
  conocimiento: { label: "Conocimiento", Icon: Lightbulb },
};

export function areaMeta(key) {
  return AREAS[key] || { label: key, Icon: Puzzle, color: "#9A9A9A" };
}
export function statusMeta(key) {
  return STATUSES[key] || { label: key, Icon: Puzzle, tone: "muted" };
}
export function contributionMeta(key) {
  return CONTRIBUTIONS[key] || { label: key, Icon: Puzzle };
}