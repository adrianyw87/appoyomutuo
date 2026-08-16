import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import UserAvatar from "@/components/UserAvatar";
import { useProfile } from "@/hooks/useProfile";

/**
 * Persona clicable + ventana flotante con vista previa de su perfil.
 * - userId: id del usuario (created_by_id)
 * - profile: perfil ya cargado (opcional, evita refetch)
 * - name: nombre de respaldo
 * - children: contenido del trigger (si no, usa avatar+nombre por defecto)
 */
export default function PersonHover({ userId, profile: preloaded, name, size = "sm", preview = true, className, children }) {
  const fetched = useProfile(userId);
  const profile = preloaded || fetched;
  const displayName = profile?.full_name || name || "Persona del ecosistema";

  const trigger = children || (
    <span className="inline-flex items-center gap-2 min-w-0">
      <UserAvatar profile={profile} name={displayName} size={size} />
      <span className="font-medium truncate group-hover:text-accent transition-colors">{displayName}</span>
    </span>
  );

  const link = (
    <Link to={`/usuarios/${userId}`} className={cn("group", className)}>
      {trigger}
    </Link>
  );

  if (!preview) return link;

  return (
    <HoverCard openDelay={150} closeDelay={120}>
      <HoverCardTrigger asChild>
        {link}
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-0 overflow-hidden">
        <div className="flex items-start gap-3 p-4 pb-3">
          <UserAvatar profile={profile} name={displayName} size="md" />
          <div className="min-w-0">
            <p className="font-heading font-semibold leading-tight truncate">{displayName}</p>
            {profile?.neighborhood && (
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" /> {profile.neighborhood}
              </p>
            )}
          </div>
        </div>
        {profile?.bio && (
          <p className="px-4 pb-3 text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>
        )}
        <div className="px-4 py-2.5 border-t border-border bg-secondary/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ver perfil</span>
          <ArrowUpRight className="w-4 h-4 text-accent" />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}