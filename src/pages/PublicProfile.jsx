import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Loader2, Puzzle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import UserAvatar from "@/components/UserAvatar";
import ProjectCard from "@/components/ProjectCard";
import { areaMeta } from "@/lib/appData";

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [created, setCreated] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profiles = await base44.entities.Profile.filter({ created_by_id: userId });
        if (cancelled) return;
        if (!profiles.length) {
          setNotFound(true);
        } else {
          setProfile(profiles[0]);
        }
        const createdProjects = await base44.entities.Project.filter({ created_by_id: userId });
        if (cancelled) return;
        setCreated(createdProjects);

        const memberships = await base44.entities.Membership.filter({ created_by_id: userId });
        const ids = memberships.map((m) => m.project_id).filter(Boolean);
        if (ids.length) {
          const joinedProjects = await Promise.all(
            ids.map((pid) => base44.entities.Project.get(pid).catch(() => null))
          );
          if (!cancelled) setJoined(joinedProjects.filter(Boolean));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <Link to="/radar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        {notFound || !profile ? (
          <div className="bg-secondary/40 border border-dashed border-border piece-cut p-10 text-center text-muted-foreground">
            Esta persona aún no ha completado su perfil.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Cabecera */}
            <div className="flex items-start gap-5 mb-6">
              <UserAvatar profile={profile} size="xl" />
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold">{profile.full_name}</h1>
                {profile.neighborhood && (
                  <p className="inline-flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.neighborhood}
                  </p>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-foreground/90 leading-relaxed mb-6 whitespace-pre-line">{profile.bio}</p>
            )}

            {profile.areas_interest?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Le interesa</p>
                <div className="flex flex-wrap gap-2">
                  {profile.areas_interest.map((k) => {
                    const a = areaMeta(k);
                    const Icon = a.Icon;
                    return (
                      <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-accent-soft text-accent">
                        <Icon className="w-3.5 h-3.5" /> {a.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {profile.skills && <InfoBlock title="Qué sabe hacer" value={profile.skills} />}
              {profile.what_i_offer && <InfoBlock title="Qué puede aportar" value={profile.what_i_offer} />}
              {profile.what_i_seek && <InfoBlock title="Qué busca" value={profile.what_i_seek} />}
            </div>

            {/* Proyectos creados */}
            {created.length > 0 && (
              <section className="mb-10">
                <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-accent" /> Piezas que ha lanzado
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {created.map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Proyectos a los que se ha sumado */}
            {joined.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-semibold mb-4">Se ha sumado a</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {joined.map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

function InfoBlock({ title, value }) {
  return (
    <div className="bg-secondary/30 border border-border rounded-md p-4">
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-sm whitespace-pre-line">{value}</p>
    </div>
  );
}