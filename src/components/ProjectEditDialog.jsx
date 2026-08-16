import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoTextarea from "@/components/AutoTextarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { Loader2, ImagePlus, FileText, Trash2 } from "lucide-react";
import { AREAS, STATUSES, CONTRIBUTIONS } from "@/lib/appData";
import { resolveProjectCoords } from "@/lib/geocode";

export default function ProjectEditDialog({ project, open, onOpenChange, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: project.title || "",
    description: project.description || "",
    area: project.area || "subsistencia",
    contribution_type: project.contribution_type || "tiempo",
    status: project.status || "idea",
    people_needed: project.people_needed ?? 5,
    location: project.location || "",
    neighborhood: project.neighborhood || "",
    what_needed: project.what_needed || "",
    conditions: project.conditions || "",
    what_happens: project.what_happens || "",
    image_url: project.image_url || "",
    info_pdf_url: project.info_pdf_url || "",
    address: project.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhoto(file) {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("image_url", file_url);
    } finally {
      setUploading(false);
    }
  }

  async function handlePdf(file) {
    if (!file) return;
    setUploadingPdf(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({
        file,
        folder: "docs",
      });
      set("info_pdf_url", file_url);
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        people_needed: Number(form.people_needed) || 0,
        location: [form.address, form.neighborhood].filter(Boolean).join(", ") || form.location,
      };
      if (form.neighborhood !== project.neighborhood || form.address !== (project.address || "")) {
        const coords = await resolveProjectCoords(
          (name, body) => base44.functions.invoke(name, body),
          { neighborhood: form.neighborhood, address: form.address }
        );
        payload.lat = coords.lat;
        payload.lng = coords.lng;
      }
      const updated = await base44.entities.Project.update(project.id, payload);
      onSaved(updated);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await base44.entities.Project.delete(project.id);
      onOpenChange(false);
      onDeleted?.(project.id);
    } catch (err) {
      console.error(err);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar proyecto</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-md overflow-hidden border border-dashed grid place-items-center bg-muted/40">
                {form.image_url ? (
                  <Image src={form.image_url} fittingType="fill" className="w-full h-full" />
                ) : (
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer text-sm font-medium text-accent hover:underline">
                {uploading ? "Subiendo…" : form.image_url ? "Cambiar foto" : "Subir foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>¿Qué necesidad cubre?</Label>
            <AutoTextarea
              minRows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Área</Label>
              <Select value={form.area} onValueChange={(v) => set("area", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AREAS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo de aporte</Label>
              <Select value={form.contribution_type} onValueChange={(v) => set("contribution_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRIBUTIONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUSES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Personas necesarias</Label>
              <Input type="number" min={1} value={form.people_needed} onChange={(e) => set("people_needed", e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Barrio / zona</Label>
              <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Calle, número…" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>PDF informativo</Label>
            <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline w-fit">
              {uploadingPdf ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</>
              ) : (
                <><FileText className="w-4 h-4" />{form.info_pdf_url ? "Cambiar PDF" : "Subir PDF"}</>
              )}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handlePdf(e.target.files?.[0])}
                disabled={uploadingPdf}
              />
            </label>
            {form.info_pdf_url && (
              <a href={form.info_pdf_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">
                Ver PDF
              </a>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Qué hace falta para existir</Label>
            <AutoTextarea minRows={2} value={form.what_needed} onChange={(e) => set("what_needed", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Condiciones para activarse</Label>
            <AutoTextarea minRows={2} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Qué pasará si se activa</Label>
            <AutoTextarea minRows={2} value={form.what_happens} onChange={(e) => set("what_happens", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border">
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              {confirmDelete ? "Confirmar" : "Eliminar proyecto"}
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                onOpenChange(false);
              }}
              disabled={saving || deleting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting} className="ui-cta">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
