import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import Reveal from "@/components/Reveal";
import PuzzleCard from "@/components/PuzzleCard";
import UserAvatar from "@/components/UserAvatar";
import { AREAS } from "@/lib/appData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Camera, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY = {
  full_name: "",
  bio: "",
  avatar_url: "",
  neighborhood: "",
  areas_interest: [],
  skills: "",
  what_i_offer: "",
  what_i_seek: "",
};

export default function Profile() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    base44.entities.Profile
      .filter({ created_by_id: user.id })
      .then((items) => {
        if (items.length) {
          const p = items[0];
          setProfile(p);
          setForm({
            full_name: p.full_name || "",
            bio: p.bio || "",
            avatar_url: p.avatar_url || "",
            neighborhood: p.neighborhood || "",
            areas_interest: p.areas_interest || [],
            skills: p.skills || "",
            what_i_offer: p.what_i_offer || "",
            what_i_seek: p.what_i_seek || "",
          });
        } else {
          setForm((f) => ({ ...f, full_name: user.full_name || "" }));
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoadingAuth, user]);

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, avatar_url: file_url }));
    } finally {
      setUploading(false);
    }
  }

  function toggleArea(key) {
    setForm((f) => {
      const has = f.areas_interest.includes(key);
      return {
        ...f,
        areas_interest: has
          ? f.areas_interest.filter((k) => k !== key)
          : [...f.areas_interest, key],
      };
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (profile) {
        const updated = await base44.entities.Profile.update(profile.id, form);
        setProfile(updated);
      } else {
        const created = await base44.entities.Profile.create(form);
        setProfile(created);
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoadingAuth || loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-20 text-center">
          <p className="text-muted-foreground mb-4">Necesitas entrar para ver tu perfil.</p>
          <Button onClick={() => base44.auth.loginWithProvider("google", window.location.href)}>
            <LogIn className="w-4 h-4 mr-2" /> Entrar con Google
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <Reveal>
          <h1 className="font-heading text-3xl font-bold mb-2">Mi perfil</h1>
          <p className="text-muted-foreground mb-8">
            Así te verá quien quiera saber más sobre ti antes de unirse a una iniciativa contigo.
          </p>
        </Reveal>

        <PuzzleCard status="idea" hover={false}>
          <form onSubmit={handleSave} className="space-y-8 p-6 sm:p-8 bg-card">
          {/* Avatar + nombre */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <UserAvatar profile={{ ...form, full_name: form.full_name || user?.full_name }} name={form.full_name} size="xl" />
              <label className="absolute -bottom-1 -right-1 w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow-lg">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1">
              <Label htmlFor="full_name">Nombre visible</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Tu nombre"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Cuénta quién eres, qué te mueve, en qué crees..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Barrio / Zona</Label>
            <Input
              id="neighborhood"
              value={form.neighborhood}
              onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              placeholder="¿Dónde sueles moverte?"
            />
          </div>

          <div className="space-y-3">
            <Label>Áreas que te interesan</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(AREAS).map(([key, val]) => {
                const Icon = val.Icon;
                const active = form.areas_interest.includes(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleArea(key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {val.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Qué sabes hacer</Label>
            <Textarea
              id="skills"
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              placeholder="Oficios, conocimientos, herramientas que dominas..."
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="what_i_offer">Qué puedo aportar</Label>
              <Textarea
                id="what_i_offer"
                value={form.what_i_offer}
                onChange={(e) => setForm((f) => ({ ...f, what_i_offer: e.target.value }))}
                placeholder="Tiempo, espacio, dinero, conocimiento..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="what_i_seek">Qué busco</Label>
              <Textarea
                id="what_i_seek"
                value={form.what_i_seek}
                onChange={(e) => setForm((f) => ({ ...f, what_i_seek: e.target.value }))}
                placeholder="Qué tipo de proyectos te interesan..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="ui-cta piece-cut">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar perfil
            </Button>
          </div>
          </form>
        </PuzzleCard>
      </section>
    </Layout>
  );
}