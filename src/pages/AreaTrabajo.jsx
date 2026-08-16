import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Loader2, FolderOpen, Users, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import WorkspaceProjectCard from "@/components/WorkspaceProjectCard";
import ProjectWorkspaceDialog from "@/components/ProjectWorkspaceDialog";
import ProjectEditDialog from "@/components/ProjectEditDialog";
import { cn } from "@/lib/utils";

export default function AreaTrabajo() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("creados");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Project.list("-created_date", 100),
      base44.entities.Membership.filter({ created_by_id: user.id }),
    ])
      .then(([ps, ms]) => {
        setProjects(ps);
        setMemberships(ms);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const joinedIds = new Set(memberships.map((m) => m.project_id));
  const created = projects.filter((p) => p.created_by_id === user?.id);
  const participating = projects.filter((p) => joinedIds.has(p.id));
  const list = view === "creados" ? created : participating;

  function openProject(p) {
    setSelected(p);
    setOpen(true);
  }

  function startEdit(p) {
    setEditing(p);
    setEditOpen(true);
  }

  function handleSaved(updated) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  function handleDeleted(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
    setEditOpen(false);
    setSelected(null);
    setOpen(false);
  }

  function handleEditFromWorkspace(p) {
    setOpen(false);
    startEdit(p);
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-1.5 text-accent">
            <Briefcase className="w-5 h-5" />
            <span className="text-sm font-medium">Mi Espacio</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Tu espacio de organización</h1>
              <p className="text-muted-foreground">
                Coordina los proyectos que creas o en los que participas: tareas, anuncios y chat del grupo.
              </p>
            </div>
            <Link
              to="/crear"
              className="ui-cta group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium piece-cut shrink-0"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Lanzar una idea
            </Link>
          </div>
        </motion.div>

        {/* Conmutador de listas */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted mb-6">
          <SegBtn active={view === "creados"} onClick={() => setView("creados")} icon={FolderOpen} label="Creados por mí" count={created.length} />
          <SegBtn active={view === "participo"} onClick={() => setView("participo")} icon={Users} label="Participo en" count={participating.length} />
        </div>

        {loading ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <EmptyState
            text={view === "creados" ? "Aún no has lanzado ningún proyecto." : "Aún no te has sumado a ningún proyecto."}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p, i) => (
              <WorkspaceProjectCard
                key={p.id}
                project={p}
                index={i}
                onOpen={() => openProject(p)}
                onEdit={p.created_by_id === user?.id ? () => startEdit(p) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectWorkspaceDialog
        project={selected}
        open={open}
        onOpenChange={setOpen}
        onEdit={handleEditFromWorkspace}
        onDeleted={handleDeleted}
      />
      {editing && (
        <ProjectEditDialog
          project={editing}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </Layout>
  );
}

function SegBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
        active ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={cn("text-xs", active ? "text-accent" : "text-muted-foreground/70")}>{count}</span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <p className="text-sm">{text}</p>
    </div>
  );
}