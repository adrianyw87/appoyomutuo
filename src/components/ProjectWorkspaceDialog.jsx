import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin, ExternalLink, FileText, Users, Image as ImageIcon, Home, Trash2, Pencil, Loader2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { areaMeta, contributionMeta } from "@/lib/appData";
import StatusBadge from "@/components/StatusBadge";
import PersonHover from "@/components/PersonHover";
import UserAvatar from "@/components/UserAvatar";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import TaskBoard from "@/components/workspace/TaskBoard";
import AnnouncementBoard from "@/components/workspace/AnnouncementBoard";
import ProjectChat from "@/components/workspace/ProjectChat";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

function ProjectFicha({ project, isOwner, onEdit, onDeleted }) {
  const area = areaMeta(project.area);
  const contrib = contributionMeta(project.contribution_type);
  const AreaIcon = area.Icon;
  const ContribIcon = contrib.Icon;
  const needed = project.people_needed || 0;
  const joined = project.people_joined || 0;
  const remaining = Math.max(0, needed - joined);
  const progress = needed > 0 ? Math.min(100, Math.round((joined / needed) * 100)) : 0;

  const [creator, setCreator] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (project.created_by_id) {
          const profiles = await base44.entities.Profile.filter({
            created_by_id: project.created_by_id,
          });
          if (!cancelled) setCreator(profiles[0] || null);
        }
        const mems = await base44.entities.Membership.filter({
          project_id: project.id,
        });
        if (cancelled) return;
        setMemberships(mems);
        const ids = [...new Set(mems.map((m) => m.created_by_id).filter(Boolean))];
        const entries = await Promise.all(
          ids.map(async (uid) => {
            const items = await base44.entities.Profile.filter({ created_by_id: uid });
            return [uid, items[0] || null];
          })
        );
        if (!cancelled) setMemberProfiles(Object.fromEntries(entries));
      } catch (err) {
        console.error("Ficha load failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, project.created_by_id]);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await base44.entities.Project.delete(project.id);
      onDeleted?.(project.id);
    } catch (err) {
      console.error(err);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 pb-2">
      {project.image_url && (
        <div className="w-full max-h-48 rounded-md overflow-hidden border border-border bg-muted">
          <Image
            src={project.image_url}
            fittingType="fill"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <AreaIcon className="w-3.5 h-3.5" style={{ color: area.color }} />
            {area.label}
          </span>
        </div>
        {project.template_name && (
          <span className="text-xs text-muted-foreground">
            Plantilla: {project.template_name}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">¿Qué necesidad cubre?</p>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {project.description || "Sin descripción"}
        </p>
      </div>

      {project.created_by_id && (
        <div className="p-3 rounded-md bg-secondary/40">
          <p className="text-xs text-muted-foreground mb-1.5">Lanzado por</p>
          <PersonHover
            userId={project.created_by_id}
            profile={creator}
            size="sm"
            preview={false}
            className="inline-flex items-center gap-2.5 min-w-0"
          >
            <UserAvatar profile={creator} name={creator?.full_name} size="sm" />
            <span className="text-sm font-medium truncate">
              {creator?.full_name || "Una persona del ecosistema"}
            </span>
          </PersonHover>
        </div>
      )}

      <div>
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
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {memberships.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {memberships.length}{" "}
            {memberships.length === 1 ? "persona se ha sumado" : "personas se han sumado"}
          </p>
          <div className="flex flex-wrap gap-2">
            {memberships.map((m) => (
              <PersonHover
                key={m.id}
                userId={m.created_by_id}
                profile={memberProfiles[m.created_by_id]}
                preview={false}
                size="xs"
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary transition-colors max-w-[180px]"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Barrio / zona</p>
            <p className="font-medium">{project.neighborhood || "Sin especificar"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Home className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Dirección</p>
            <p className="font-medium">{project.address || "No indicada"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ContribIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Tipo de aporte</p>
            <p className="font-medium">{contrib.label}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Ubicación (resumen)</p>
            <p className="font-medium">{project.location || "—"}</p>
          </div>
        </div>
      </div>

      {(project.lat != null && project.lng != null) && (
        <p className="text-xs text-muted-foreground">
          Coordenadas: {Number(project.lat).toFixed(5)}, {Number(project.lng).toFixed(5)}
        </p>
      )}

      <div className="space-y-4 border-t border-dashed border-border pt-4">
        <Field label="Qué hace falta para existir" value={project.what_needed} />
        <Field label="Condiciones para activarse" value={project.conditions} />
        <Field label="Qué pasará si se activa" value={project.what_happens} />
        {project.info_pdf_url ? (
          <div>
            <p className="text-sm font-medium mb-1">Documento informativo</p>
            <a
              href={project.info_pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <FileText className="w-4 h-4" />
              Descargar PDF
            </a>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Sin PDF informativo
          </p>
        )}
        {!project.image_url && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Sin foto de proyecto
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Link
          to={`/proyectos/${project.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Abrir ficha pública
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {isOwner && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(project)}
                className="border-primary text-primary"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              {confirmDelete ? "Confirmar" : "Eliminar proyecto"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectWorkspaceDialog({ project, open, onOpenChange, onEdit, onDeleted }) {
  const { user } = useAuth();
  const isOwner = !!user && !!project && project.created_by_id === user.id;
  const area = project ? areaMeta(project.area) : null;
  const AreaIcon = area?.Icon;

  function handleDeleted(id) {
    onOpenChange(false);
    onDeleted?.(id);
  }

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[min(92vh,840px)] overflow-hidden flex flex-col gap-0 px-8 sm:px-10">
        <DialogHeader className="shrink-0 pb-3 pr-6">
          <DialogTitle className="pr-6">{project.title}</DialogTitle>
          <div
            className="flex items-center gap-1.5 text-sm"
            style={{ color: area.color }}
          >
            <AreaIcon className="w-3.5 h-3.5" />
            {area.label}
          </div>
        </DialogHeader>

        <Tabs defaultValue="ficha" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="shrink-0 w-full justify-start overflow-x-auto h-auto p-1 bg-primary text-primary-foreground rounded-lg">
            <TabsTrigger
              value="ficha"
              className="text-primary-foreground/75 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow"
            >
              Ficha
            </TabsTrigger>
            <TabsTrigger
              value="tareas"
              className="text-primary-foreground/75 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow"
            >
              Tareas
            </TabsTrigger>
            <TabsTrigger
              value="anuncios"
              className="text-primary-foreground/75 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow"
            >
              Anuncios
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="text-primary-foreground/75 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow"
            >
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ficha" className="flex-1 min-h-0 overflow-y-auto mt-3 data-[state=inactive]:hidden">
            <div className="pr-6">
              <ProjectFicha
                project={project}
                isOwner={isOwner}
                onEdit={onEdit}
                onDeleted={handleDeleted}
              />
            </div>
          </TabsContent>

          <TabsContent value="tareas" className="flex-1 min-h-0 overflow-y-auto mt-3 data-[state=inactive]:hidden">
            <div className="pr-6">
              <TaskBoard projectId={project.id} />
            </div>
          </TabsContent>

          <TabsContent value="anuncios" className="flex-1 min-h-0 overflow-y-auto mt-3 data-[state=inactive]:hidden">
            <div className="pr-6">
              <AnnouncementBoard projectId={project.id} />
            </div>
          </TabsContent>

          <TabsContent
            value="chat"
            className="flex-1 min-h-0 overflow-hidden mt-3 data-[state=inactive]:hidden flex flex-col pr-6"
          >
            <ProjectChat projectId={project.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
