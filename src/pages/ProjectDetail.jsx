import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, MapPin, Check, Sparkles, Loader2, Pencil, Crown, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import PuzzleCard from "@/components/PuzzleCard";
import PersonHover from "@/components/PersonHover";
import UserAvatar from "@/components/UserAvatar";
import ProjectEditDialog from "@/components/ProjectEditDialog";
import { areaMeta, contributionMeta } from "@/lib/appData";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [creator, setCreator] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(false);

  async function loadData() {
    const p = await base44.entities.Project.get(id);
    setProject(p);

    const mems = await base44.entities.Membership.filter({ project_id: id });
    setMemberships(mems);

    // creador
    const userIds = new Set();
    if (p.created_by_id) userIds.add(p.created_by_id);
    mems.forEach((m) => userIds.add(m.created_by_id));

    const profilesMap = {};
    await Promise.all(
      [...userIds].map(async (uid) => {
        const items = await base44.entities.Profile.filter({ created_by_id: uid });
        if (items.length) profilesMap[uid] = items[0];
      })
    );
    setMemberProfiles(profilesMap);
    setCreator(p.created_by_id ? profilesMap[p.created_by_id] : null);
  }

  useEffect(() => {
    loadData()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleJoin() {
    if (!isAuthenticated) {
      base44.auth.loginWithProvider("google", window.location.pathname);
      return;
    }
    if (hasJoined) return;
    setJoining(true);
    try {
      await base44.entities.Membership.create({ project_id: project.id });
      // people_joined se sincroniza en Supabase vía trigger; en mock lo actualizamos
      try {
        const updated = await base44.entities.Project.update(project.id, {
          people_joined: (project.people_joined || 0) + 1,
        });
        setProject(updated);
      } catch {
        const refreshed = await base44.entities.Project.get(project.id);
        setProject(refreshed);
      }
      const mems = await base44.entities.Membership.filter({ project_id: project.id });
      setMemberships(mems);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
          <div className="h-8 w-48 bg-muted animate-pulse mb-4" />
          <div className="h-48 bg-muted animate-pulse piece-cut" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 text-center">
          <p className="text-muted-foreground mb-4">Esta pieza ya no está.</p>
          <Link to="/radar" className="text-accent font-medium hover:underline">Volver al radar</Link>
        </div>
      </Layout>
    );
  }

  const area = areaMeta(project.area);
  const contrib = contributionMeta(project.contribution_type);
  const AreaIcon = area.Icon;
  const ContribIcon = contrib.Icon;
  const needed = project.people_needed || 0;
  const joined = project.people_joined || 0;
  const remaining = Math.max(0, needed - joined);
  const progress = needed > 0 ? Math.min(100, Math.round((joined / needed) * 100)) : 0;
  const hasJoined = memberships.some((m) => m.created_by_id === user?.id);
  const isOwner = !!user && project.created_by_id === user.id;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <Link to="/radar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <PuzzleCard accent={area.color} status={project.status} active={project.status === "funcionando"} hover={false}>
            <div className="p-8">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <StatusBadge status={project.status} />
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-medium bg-primary/10 text-primary border border-primary/20">
                      <Crown className="w-3 h-3" /> Eres quien creó este proyecto
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <AreaIcon className="w-3.5 h-3.5" />
                    {area.label}
                  </span>
                </div>
              </div>

              <h1 className="font-heading text-3xl font-bold mb-3 text-balance">{project.title}</h1>
              <p className="text-muted-foreground leading-relaxed mb-6">{project.description}</p>

              {/* Creador */}
              {project.created_by_id && (
                <div className="mb-6 p-3 rounded-md bg-secondary/40">
                  <p className="text-xs text-muted-foreground mb-1.5">Lanzado por</p>
                  <PersonHover
                    userId={project.created_by_id}
                    profile={creator}
                    size="sm"
                    preview={false}
                    className="inline-flex items-center gap-2.5 min-w-0"
                  >
                    <UserAvatar profile={creator} name={creator?.full_name} size="sm" />
                    <span className="text-sm font-medium group-hover:text-accent transition-colors truncate">
                      {creator?.full_name || "Una persona del ecosistema"}
                    </span>
                  </PersonHover>
                </div>
              )}

              {/* progreso de piezas */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4" /> {joined} de {needed} piezas
                  </span>
                  {remaining > 0 ? (
                    <span className="text-accent font-medium">faltan {remaining}</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">masa crítica alcanzada</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Piezas unidas */}
              {memberships.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-accent" />
                    {memberships.length} {memberships.length === 1 ? "persona se ha sumado" : "personas se han sumado"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {memberships.map((m) => {
                      const mp = memberProfiles[m.created_by_id];
                      return (
                        <PersonHover
                          key={m.id}
                          userId={m.created_by_id}
                          profile={mp}
                          preview={false}
                          size="xs"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary transition-colors max-w-[180px]"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Ubicación" value={project.location || "Sin especificar"} />
                <InfoRow icon={<ContribIcon className="w-4 h-4" />} label="Aporte" value={contrib.label} />
              </div>

              <div className="space-y-4 border-t border-dashed border-border pt-5">
                <Field label="Qué hace falta para existir" value={project.what_needed} />
                <Field label="Condiciones para activarse" value={project.conditions} />
                <Field label="Qué pasará si se activa" value={project.what_happens} />
                {project.info_pdf_url && (
                  <div>
                    <p className="text-sm font-medium mb-1">Documento informativo</p>
                    <a
                      href={project.info_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      Descargar PDF
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-nowrap gap-2 overflow-x-auto">
                {isOwner && (
                  <button
                    onClick={() => setEditing(true)}
                    className="ui-cta group inline-flex items-center gap-1.5 border border-primary text-primary px-3.5 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" /> Editar
                  </button>
                )}
                {hasJoined ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-md text-sm font-medium piece-cut whitespace-nowrap shrink-0">
                    <Check className="w-3.5 h-3.5" /> Ya eres pieza
                  </span>
                ) : remaining === 0 ? (
                  <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3.5 py-2 rounded-md text-sm font-medium piece-cut whitespace-nowrap shrink-0">
                    Proyecto completo
                  </span>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="ui-cta group inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-2 rounded-md text-sm font-medium disabled:opacity-50 piece-cut whitespace-nowrap shrink-0"
                  >
                    {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />}
                    {isAuthenticated ? "Sumarme" : "Entrar para sumarme"}
                  </button>
                )}
                <Link
                  to={`/radar?area=${project.area}`}
                  className="ui-cta group inline-flex items-center gap-1.5 border border-primary text-primary px-3.5 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" /> Ver Similares
                </Link>
                <Link
                  to="/crear"
                  className="ui-cta group inline-flex items-center gap-1.5 border border-primary text-primary px-3.5 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Lanzar algo parecido
                </Link>
              </div>
            </div>
          </PuzzleCard>
        </motion.div>

        {isOwner && (
          <ProjectEditDialog
            project={project}
            open={editing}
            onOpenChange={setEditing}
            onSaved={(updated) => setProject(updated)}
            onDeleted={() => navigate("/")}
          />
        )}
      </div>
    </Layout>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}