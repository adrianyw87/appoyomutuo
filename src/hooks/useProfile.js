import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Cache en memoria: userId -> Profile | null
const cache = new Map();

export function useProfile(createdById) {
  const [profile, setProfile] = useState(() =>
    createdById ? cache.get(createdById) ?? null : null
  );

  useEffect(() => {
    if (!createdById) return;
    if (cache.has(createdById)) {
      setProfile(cache.get(createdById));
      return;
    }
    let cancelled = false;
    base44.entities.Profile
      .filter({ created_by_id: createdById })
      .then((items) => {
        const p = items[0] || null;
        cache.set(createdById, p);
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [createdById]);

  return profile;
}