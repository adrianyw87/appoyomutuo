/** Email de la cuenta administradora (UI). El permiso real está en Supabase (`profiles.is_admin`). */
export const ADMIN_EMAIL = "appoyomutuo@gmail.com";

export const MODERATION = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export function isAdminUser(user) {
  if (!user) return false;
  if (user.is_admin) return true;
  return String(user.email || "").trim().toLowerCase() === ADMIN_EMAIL;
}

export function moderationStatus(project) {
  return project?.moderation_status || MODERATION.APPROVED;
}

export function isPublicProject(project) {
  return moderationStatus(project) === MODERATION.APPROVED;
}

export function formatEsDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
