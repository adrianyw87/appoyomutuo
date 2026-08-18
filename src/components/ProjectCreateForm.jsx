import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, ImagePlus, FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PuzzleCard from "@/components/PuzzleCard";
import AutoTextarea from "@/components/AutoTextarea";
import { Image } from "@/components/ui/image";
import { AREAS, CONTRIBUTIONS, areaMeta } from "@/lib/appData";
import { cn } from "@/lib/utils";
import { resolveProjectCoords } from "@/lib/geocode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Dos pasos: identidad + cómo se hace realidad (sin “quién manda”). */
const STEPS = [
  {
    key: "basics",
    title: "Tu idea",
    hint: "Cuenta qué queréis hacer juntas y dónde.",
  },
  {
    key: "collective",
    title: "Cómo se hace realidad",
    hint: "Qué necesitáis de la gente del barrio y qué ganáis juntas si sale adelante.",
  },
];

export default function ProjectCreateForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "subsistencia",
    neighborhood: "",
    address: "",
    contribution_type: "tiempo",
    people_needed: 5,
    image_url: "",
    info_pdf_url: "",
    what_needed: "",
    conditions: "",
    what_happens: "",
    mutual_benefit: "",
  });

  useEffect(() => {
    const tpl = params.get("plantilla");
    const area = params.get("area");
    const aporte = params.get("aporte");
    setForm((f) => ({
      ...f,
      title: tpl || f.title,
      area: area || f.area,
      contribution_type: aporte || f.contribution_type,
    }));
  }, [params]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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

  async function handleSubmit() {
    setSaving(true);
    try {
      const description = [
        form.description,
        form.mutual_benefit && `Qué ganamos juntas: ${form.mutual_benefit}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      const location = [form.address, form.neighborhood].filter(Boolean).join(", ");
      const coords = await resolveProjectCoords(
        (name, payload) => base44.functions.invoke(name, payload),
        { neighborhood: form.neighborhood, address: form.address }
      );

      await base44.entities.Project.create({
        title: form.title,
        description,
        area: form.area,
        location,
        neighborhood: form.neighborhood,
        address: form.address,
        lat: coords.lat,
        lng: coords.lng,
        contribution_type: form.contribution_type,
        status: "idea",
        people_needed: Number(form.people_needed) || 1,
        people_joined: 0,
        image_url: form.image_url,
        info_pdf_url: form.info_pdf_url,
        what_needed: form.what_needed,
        conditions: form.conditions,
        what_happens: form.what_happens,
        template_name: params.get("plantilla") || "",
      });
      setReviewOpen(true);
    } finally {
      setSaving(false);
    }
  }

  const isLast = step === STEPS.length - 1;
  const canNext =
    step === 0
      ? form.title.trim() && form.description.trim() && form.neighborhood.trim()
      : true;
  const accent = areaMeta(form.area).color;

  return (
    <>
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all flex-1",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PuzzleCard accent={accent} status="idea" hover={false}>
          <div className="p-6 sm:p-8 bg-card">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-1">{STEPS[0].title}</h2>
                  <p className="text-sm text-muted-foreground mb-5">{STEPS[0].hint}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Foto del proyecto</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Una imagen ayuda a que otras personas se imaginen el proyecto (opcional).
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-md overflow-hidden border border-dashed border-border grid place-items-center bg-muted/40 shrink-0">
                      {form.image_url ? (
                        <Image src={form.image_url} fittingType="fill" className="w-full h-full" />
                      ) : (
                        <ImagePlus className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Subiendo…
                        </>
                      ) : form.image_url ? (
                        "Cambiar foto"
                      ) : (
                        "Subir foto"
                      )}
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

                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre del proyecto</label>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ej. Grupo de consumo de Carabanchel"
                    className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ¿Qué necesidad cotidiana queréis cubrir juntas?
                  </label>
                  <AutoTextarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    minRows={3}
                    placeholder="Ej. Comer sano sin depender solo de supermercados, cuidar a mayores del bloque, tener un espacio donde reparar bicis…"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Área de la vida</label>
                    <select
                      value={form.area}
                      onChange={(e) => set("area", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {Object.entries(AREAS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Barrio / zona <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={form.neighborhood}
                      onChange={(e) => set("neighborhood", e.target.value)}
                      placeholder="Ej. Carabanchel, Madrid"
                      className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Dirección (opcional)</label>
                  <input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Calle y número, si ya tenéis un sitio concreto"
                    className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Con calle y barrio situamos un pin en el mapa. Si solo pones el barrio, el pin
                    queda cerca del centro de esa zona.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Qué aportáis sobre todo</label>
                    <select
                      value={form.contribution_type}
                      onChange={(e) => set("contribution_type", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {Object.entries(CONTRIBUTIONS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      ¿Cuántas personas hacéis falta?
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.people_needed}
                      onChange={(e) => set("people_needed", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    PDF informativo (opcional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Un documento que explique el proyecto y por qué merece la pena sumarse (máx.
                    unos MB).
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
                    {uploadingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Subiendo PDF…
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        {form.info_pdf_url ? "Cambiar PDF" : "Subir PDF"}
                      </>
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
                    <a
                      href={form.info_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-2 text-xs text-primary hover:underline truncate"
                    >
                      Ver PDF subido
                    </a>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-1">{STEPS[1].title}</h2>
                  <p className="text-sm text-muted-foreground mb-5">{STEPS[1].hint}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ¿Qué hace falta para que exista de verdad?
                  </label>
                  <AutoTextarea
                    value={form.what_needed}
                    onChange={(e) => set("what_needed", e.target.value)}
                    minRows={3}
                    placeholder="Personas con ganas, un local, herramientas, turnos fijos, un poco de dinero inicial…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Condiciones mínimas para activarlo
                  </label>
                  <AutoTextarea
                    value={form.conditions}
                    onChange={(e) => set("conditions", e.target.value)}
                    minRows={2}
                    placeholder="Ej. Al menos 8 personas comprometidas y un espacio cedido dos tardes a la semana"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Si se activa, ¿qué cambia en el día a día?
                  </label>
                  <AutoTextarea
                    value={form.what_happens}
                    onChange={(e) => set("what_happens", e.target.value)}
                    minRows={2}
                    placeholder="Ej. Cestas semanales a precio justo, turnos de cuidados entre vecinos, taller abierto los sábados…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ¿Qué gana quien se suma? (beneficio mutuo)
                  </label>
                  <AutoTextarea
                    value={form.mutual_benefit}
                    onChange={(e) => set("mutual_benefit", e.target.value)}
                    minRows={2}
                    placeholder="No es un servicio: contad qué recibís y qué aportáis juntas (comida, compañía, aprendizaje, autonomía…)"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Paso {step + 1} de {STEPS.length}
                </span>
              )}

              {isLast ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="ui-cta group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium disabled:opacity-50 piece-cut"
                >
                  <Check className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{saving ? "Lanzando…" : "Lanzar la idea"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => canNext && setStep((s) => s + 1)}
                  disabled={!canNext}
                  className="ui-cta group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium disabled:opacity-40 piece-cut"
                >
                  <span>Siguiente</span>{" "}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>
        </PuzzleCard>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Appoyo Mutuo no admite proyectos que promuevan violencia, discriminación o explotación.
      </p>

      <Dialog open={reviewOpen} onOpenChange={(open) => !open && navigate("/area")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tu idea será analizada</DialogTitle>
            <DialogDescription>
              Recibirás una respuesta en breve. Hasta entonces no aparece en el radar:
              así cuidamos que lo publicado encaje con los principios de la plataforma.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => navigate("/area")}
              className="ui-cta inline-flex items-center justify-center bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-medium"
            >
              Entendido
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
