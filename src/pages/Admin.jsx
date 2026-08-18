import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Loader2,
  Check,
  X,
  Search,
  Users,
  FolderKanban,
  Clock,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import { AREAS, areaMeta } from "@/lib/appData";
import {
  formatEsDate,
  isAdminUser,
  isPublicProject,
  moderationStatus,
  MODERATION,
} from "@/lib/moderation";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TABS = [
  { id: "pending", label: "Por revisar", icon: Clock },
  { id: "projects", label: "Proyectos", icon: FolderKanban },
  { id: "users", label: "Personas", icon: Users },
];

export default function Admin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState("pending");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const [projectQuery, setProjectQuery] = useState("");
  const [projectFrom, setProjectFrom] = useState("");
  const [projectTo, setProjectTo] = useState("");
  const [projectArea, setProjectArea] = useState("todas");
  const [projectMod, setProjectMod] = useState("todas");

  const [userQuery, setUserQuery] = useState("");
  const [userFrom, setUserFrom] = useState("");
  const [userTo, setUserTo] = useState("");

  async function load() {
    setError("");
    try {
      const ps = await base44.entities.Project.list("-created_date", 500);
      setProjects(ps);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los proyectos.");
    }
    try {
      const us = await base44.admin.listUsers();
      setUsers(us);
    } catch (err) {
      setError(
        (prev) =>
          prev ||
          err?.message ||
          "No se pudo cargar el listado de personas. ¿Has ejecutado el SQL de moderación en Supabase?"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdminUser(user)) return;
    load();
  }, [user]);

  const pending = useMemo(
    () => projects.filter((p) => moderationStatus(p) === MODERATION.PENDING),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = projectQuery.trim().toLowerCase();
      if (q) {
        const hay = `${p.title || ""} ${p.neighborhood || ""} ${p.location || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (projectArea !== "todas" && p.area !== projectArea) return false;
      if (projectMod !== "todas" && moderationStatus(p) !== projectMod) return false;
      const created = p.created_date || p.created_at;
      if (projectFrom && created && created.slice(0, 10) < projectFrom) return false;
      if (projectTo && created && created.slice(0, 10) > projectTo) return false;
      return true;
    });
  }, [projects, projectQuery, projectFrom, projectTo, projectArea, projectMod]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userQuery.trim().toLowerCase();
      if (q) {
        const hay = `${u.full_name || ""} ${u.email || ""} ${u.neighborhood || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const created = u.created_at;
      if (userFrom && created && String(created).slice(0, 10) < userFrom) return false;
      if (userTo && created && String(created).slice(0, 10) > userTo) return false;
      return true;
    });
  }, [users, userQuery, userFrom, userTo]);

  async function setModeration(project, status, note = "") {
    setBusyId(project.id);
    try {
      const updated = await base44.entities.Project.update(project.id, {
        moderation_status: status,
        moderation_note: note,
      });
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, ...updated } : p)));
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el proyecto.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;
    await setModeration(rejecting, MODERATION.REJECTED, rejectNote.trim());
    setRejecting(null);
    setRejectNote("");
  }

  if (isLoadingAuth) {
    return (
      <Layout>
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-1.5 text-accent">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Administración</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Cuidar la plataforma</h1>
          <p className="text-muted-foreground max-w-2xl mb-8">
            Revisa las ideas antes de que salgan al radar, y consulta quién forma parte
            de Appoyo Mutuo.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Por revisar" value={pending.length} />
          <StatCard label="Publicados" value={projects.filter(isPublicProject).length} />
          <StatCard label="Personas" value={users.length} />
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted mb-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const count = t.id === "pending" ? pending.length : t.id === "users" ? users.length : projects.length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  tab === t.id ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className={cn("text-xs", tab === t.id ? "text-accent" : "text-muted-foreground/70")}>{count}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : tab === "pending" ? (
          pending.length === 0 ? (
            <Empty text="No hay ideas esperando revisión." />
          ) : (
            <ProjectTable
              projects={pending}
              users={users}
              busyId={busyId}
              onApprove={(p) => setModeration(p, MODERATION.APPROVED)}
              onReject={(p) => {
                setRejectNote("");
                setRejecting(p);
              }}
            />
          )
        ) : tab === "projects" ? (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <SearchRow
                value={projectQuery}
                onChange={setProjectQuery}
                placeholder="Buscar por título o barrio…"
              />
              <div className="flex flex-wrap gap-2">
                <DateInput label="Desde" value={projectFrom} onChange={setProjectFrom} />
                <DateInput label="Hasta" value={projectTo} onChange={setProjectTo} />
                <select
                  value={projectArea}
                  onChange={(e) => setProjectArea(e.target.value)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  <option value="todas">Todas las áreas</option>
                  {Object.entries(AREAS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <select
                  value={projectMod}
                  onChange={(e) => setProjectMod(e.target.value)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm"
                >
                  <option value="todas">Cualquier estado</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Publicado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
            </div>
            {filteredProjects.length === 0 ? (
              <Empty text="Ningún proyecto coincide con los filtros." />
            ) : (
              <ProjectTable
                projects={filteredProjects}
                users={users}
                busyId={busyId}
                onApprove={(p) => setModeration(p, MODERATION.APPROVED)}
                onReject={(p) => {
                  setRejectNote("");
                  setRejecting(p);
                }}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <SearchRow
                value={userQuery}
                onChange={setUserQuery}
                placeholder="Buscar por nombre o email…"
              />
              <div className="flex flex-wrap gap-2">
                <DateInput label="Inscrito desde" value={userFrom} onChange={setUserFrom} />
                <DateInput label="Hasta" value={userTo} onChange={setUserTo} />
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <Empty text="Ninguna persona coincide con los filtros." />
            ) : (
              <div className="overflow-x-auto rounded-md border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Barrio</th>
                      <th className="px-4 py-3 font-medium">Alta</th>
                      <th className="px-4 py-3 font-medium">Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3">
                          <Link to={`/usuarios/${u.id}`} className="font-medium hover:text-accent">
                            {u.full_name || "Sin nombre"}
                          </Link>
                          {u.is_admin && (
                            <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-accent">admin</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.neighborhood || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatEsDate(u.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatEsDate(u.last_sign_in_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No publicar esta idea</DialogTitle>
            <DialogDescription>
              {rejecting?.title} no saldrá en el radar. Quien la lanzó podrá verla en su espacio.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Motivo (opcional, solo lo veis vosotras de momento)"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRejecting(null)}
              className="px-4 py-2 rounded-md text-sm border border-border"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmReject}
              className="px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground"
            >
              Rechazar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-heading text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SearchRow({ value, onChange, placeholder }) {
  return (
    <label className="relative block">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-md border border-border bg-background text-sm"
      />
    </label>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground"
      />
    </label>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-muted-foreground py-12 text-center">{text}</p>;
}

function ModBadge({ project }) {
  const status = moderationStatus(project);
  const map = {
    pending: "Pendiente",
    approved: "Publicado",
    rejected: "Rechazado",
  };
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-medium",
        status === "pending" && "bg-amber-100 text-amber-800",
        status === "approved" && "bg-emerald-100 text-emerald-800",
        status === "rejected" && "bg-rose-100 text-rose-800"
      )}
    >
      {map[status] || status}
    </span>
  );
}

function ProjectTable({ projects, users, busyId, onApprove, onReject }) {
  const byId = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-3 font-medium">Proyecto</th>
            <th className="px-4 py-3 font-medium">Área</th>
            <th className="px-4 py-3 font-medium">Quién</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const author = byId[p.created_by_id || p.created_by];
            const area = areaMeta(p.area);
            const status = moderationStatus(p);
            const busy = busyId === p.id;
            return (
              <tr key={p.id} className="border-b border-border/70 last:border-0 align-top">
                <td className="px-4 py-3">
                  <Link to={`/proyectos/${p.id}`} className="font-medium hover:text-accent line-clamp-2">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.neighborhood || p.location || "—"}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{area.label}</td>
                <td className="px-4 py-3">
                  {author ? (
                    <Link to={`/usuarios/${author.id}`} className="hover:text-accent">
                      {author.full_name || author.email}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatEsDate(p.created_date || p.created_at)}</td>
                <td className="px-4 py-3">
                  <ModBadge project={p} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {status !== MODERATION.APPROVED && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Aprobar
                      </button>
                    )}
                    {status !== MODERATION.REJECTED && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onReject(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:border-destructive/40 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" /> Rechazar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
