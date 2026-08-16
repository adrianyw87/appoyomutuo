import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { areaMeta, contributionMeta } from "@/lib/appData";
import StatusBadge from "@/components/StatusBadge";
import PuzzleCard from "@/components/PuzzleCard";
import MiniPuzzleCount from "@/components/MiniPuzzle";
import PersonHover from "@/components/PersonHover";
import { Image } from "@/components/ui/image";

export default function ProjectCard({ project, index = 0 }) {
  const area = areaMeta(project.area);
  const AreaIcon = area.Icon;
  const contrib = contributionMeta(project.contribution_type);
  const ContribIcon = contrib.Icon;
  const needed = project.people_needed || 0;
  const joined = project.people_joined || 0;
  const running = project.status === "funcionando";
  const accent = area.color;

  const dir = index % 2 === 0 ? -1 : 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, x: dir * 30, rotate: dir * 5, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 190, damping: 19, mass: 0.8, delay: Math.min(index * 0.08, 0.5) }}
      className="h-full"
    >
      <PuzzleCard accent={accent} status={project.status} active={running} className="h-full">
        <Link
          to={`/proyectos/${project.id}`}
          className="flex flex-col h-full"
          style={{ "--area": accent }}
        >
          {/* Cabecera visual */}
          <div className="relative h-44 overflow-hidden">
            {project.image_url ? (
              <Image src={project.image_url} fittingType="fill" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full relative"
                style={{ background: `linear-gradient(135deg, ${accent}26, ${accent}0A)` }}
              >
                <AreaIcon
                  className="absolute right-4 bottom-4 w-14 h-14"
                  style={{ color: accent, opacity: 0.4 }}
                />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <StatusBadge status={project.status} />
            </div>
            <span
              className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 backdrop-blur text-[0.7rem] font-medium"
              style={{ color: accent }}
            >
              <AreaIcon className="w-3 h-3" />
              {area.label}
            </span>
          </div>

          {/* Cuerpo */}
          <div className="flex-1 flex flex-col px-6 pt-[25px] pb-5">
            <h3 className="font-heading text-lg font-semibold leading-snug line-clamp-2 min-h-[3rem] mb-2 group-hover:text-[var(--area)] transition-colors">
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.6rem] mb-4">
              {project.description}
            </p>

            <div className="mt-auto space-y-3">
              <MiniPuzzleCount joined={joined} needed={needed} accent={accent} running={running} />

              {project.created_by_id && (
                <div className="flex items-center gap-1.5 text-xs min-w-0">
                  <span className="text-muted-foreground shrink-0">Creado por</span>
                  <PersonHover
                    userId={project.created_by_id}
                    size="xs"
                    preview={false}
                    className="inline-flex items-center gap-1.5 min-w-0 max-w-full"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-dashed border-border text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 shrink-0">
                  <ContribIcon className="w-3.5 h-3.5" style={{ color: accent }} />
                  {contrib.label}
                </span>
                {project.location && (
                  <span className="ml-auto inline-flex items-center gap-1 min-w-0 justify-end text-right">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </PuzzleCard>
    </motion.div>
  );
}