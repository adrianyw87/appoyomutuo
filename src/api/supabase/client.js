import { getSupabase } from "./browser";
import { ADMIN_EMAIL } from "@/lib/moderation";

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

/** Map DB row → shape expected by the existing UI (created_by_id, created_date). */
function fromDb(row, { profile = false } = {}) {
  if (!row) return row;
  const out = { ...row };
  if (profile) {
    out.created_by_id = row.id;
    out.created_date = row.created_at;
  } else {
    if (row.created_by != null) out.created_by_id = row.created_by;
    if (row.created_at != null) out.created_date = row.created_at;
    if (row.updated_at != null) out.updated_date = row.updated_at;
  }
  return out;
}

function toDb(data = {}, { profile = false } = {}) {
  const out = { ...data };
  delete out.created_by_id;
  delete out.created_by;
  delete out.created_date;
  delete out.updated_date;
  delete out.id;
  if (profile) {
    // id set separately
  }
  return out;
}

function parseSort(sort) {
  if (!sort) return { column: "created_at", ascending: false };
  const desc = String(sort).startsWith("-");
  let field = desc ? String(sort).slice(1) : String(sort);
  if (field === "created_date") field = "created_at";
  if (field === "updated_date") field = "updated_at";
  return { column: field, ascending: !desc };
}

function mapQuery(query = {}, { profile = false } = {}) {
  const out = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === "created_by_id") {
      out[profile ? "id" : "created_by"] = value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function mapUser(user) {
  if (!user) return null;
  const email = user.email || "";
  return {
    id: user.id,
    email,
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0] ||
      "",
    role: "user",
    is_admin: String(email).toLowerCase() === ADMIN_EMAIL,
  };
}

async function enrichUser(user) {
  const mapped = mapUser(user);
  if (!mapped) return null;
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("profiles")
      .select("is_admin, full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.full_name) mapped.full_name = data.full_name;
    if (data?.is_admin) mapped.is_admin = true;
  } catch {
    /* ignore */
  }
  return mapped;
}

const TABLE = {
  Project: { table: "projects", profile: false },
  Profile: { table: "profiles", profile: true },
  Membership: { table: "memberships", profile: false },
  Template: { table: "templates", profile: false },
  Task: { table: "tasks", profile: false },
  Announcement: { table: "announcements", profile: false },
  Message: { table: "messages", profile: false },
};

function createEntityApi(entityName) {
  const meta = TABLE[entityName];
  if (!meta) throw new Error(`Unknown entity ${entityName}`);

  return {
    async list(sort, limit) {
      const sb = getSupabase();
      const { column, ascending } = parseSort(sort);
      let q = sb.from(meta.table).select("*").order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new AppError(error.message, 400);
      return (data || []).map((row) => fromDb(row, meta));
    },

    async filter(query = {}, sort, limit) {
      const sb = getSupabase();
      const mapped = mapQuery(query, meta);
      const { column, ascending } = parseSort(sort);
      let q = sb.from(meta.table).select("*");
      for (const [key, value] of Object.entries(mapped)) {
        q = q.eq(key, value);
      }
      q = q.order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new AppError(error.message, 400);
      return (data || []).map((row) => fromDb(row, meta));
    },

    async get(id) {
      const sb = getSupabase();
      const { data, error } = await sb.from(meta.table).select("*").eq("id", id).maybeSingle();
      if (error) throw new AppError(error.message, 400);
      if (!data) throw new AppError(`${entityName} not found`, 404);
      return fromDb(data, meta);
    },

    async create(data) {
      const sb = getSupabase();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new AppError("Not authenticated", 401);

      const payload = toDb(data, meta);
      if (meta.profile) {
        payload.id = user.id;
        if (!payload.full_name) {
          payload.full_name =
            user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
        }
      } else if (entityName !== "Template") {
        payload.created_by = user.id;
      }

      const { data: row, error } = await sb
        .from(meta.table)
        .insert(payload)
        .select("*")
        .single();
      if (error) throw new AppError(error.message, 400);
      return fromDb(row, meta);
    },

    async update(id, data) {
      const sb = getSupabase();
      const payload = toDb(data, meta);
      const { data: row, error } = await sb
        .from(meta.table)
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new AppError(error.message, 400);
      return fromDb(row, meta);
    },

    async delete(id) {
      const sb = getSupabase();
      const { error } = await sb.from(meta.table).delete().eq("id", id);
      if (error) throw new AppError(error.message, 400);
      return { id };
    },

    subscribe(callback) {
      if (entityKey !== "Message") {
        return () => {};
      }
      const sb = getSupabase();
            const channel = sb
        .channel(`messages-${Math.random().toString(36).slice(2, 9)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          (payload) => {
            try {
              const type =
                payload.eventType === "INSERT"
                  ? "create"
                  : payload.eventType === "UPDATE"
                    ? "update"
                    : payload.eventType === "DELETE"
                      ? "delete"
                      : payload.eventType;
              const raw =
                payload.new && Object.keys(payload.new).length
                  ? payload.new
                  : payload.old || null;
              if (!raw) return;
              callback({ type, data: fromDb(raw, meta) });
            } catch (err) {
              console.error("Message realtime error:", err);
            }
          }
        )
        .subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    },
  };
}

function storeReturnTo(returnTo) {
  try {
    if (returnTo) sessionStorage.setItem("am_return_to", returnTo);
  } catch {
    /* ignore */
  }
}

export function createSupabaseAppClient() {
  if (typeof console !== "undefined") {
    console.info("[supabase] cliente Appoyo Mutuo activo");
  }

  const entities = Object.fromEntries(
    Object.keys(TABLE).map((key) => [key, createEntityApi(key)])
  );

  return {
    entities: {
      ...entities,
      User: {
        async list() {
          return [];
        },
        async filter() {
          return [];
        },
        async get() {
          throw new AppError("Not supported", 400);
        },
        async create() {
          throw new AppError("Not supported", 400);
        },
        async update() {
          throw new AppError("Not supported", 400);
        },
        async delete() {
          throw new AppError("Not supported", 400);
        },
        subscribe() {
          return () => {};
        },
      },
    },
    auth: {
      async me() {
        const sb = getSupabase();
        const {
          data: { user },
          error,
        } = await sb.auth.getUser();
        if (error || !user) throw new AppError("Not authenticated", 401);
        return enrichUser(user);
      },
      isAuthenticated() {
        // sync hint only; real check is async via me()/session
        return false;
      },
      async getSession() {
        const sb = getSupabase();
        const { data } = await sb.auth.getSession();
        return data.session;
      },
      onAuthStateChange(callback) {
        const sb = getSupabase();
        const {
          data: { subscription },
        } = sb.auth.onAuthStateChange((_event, session) => {
          if (!session?.user) {
            callback(null, session);
            return;
          }
          enrichUser(session.user).then((next) => callback(next, session));
        });
        return () => subscription.unsubscribe();
      },
      loginWithProvider(provider, returnTo = "/") {
        storeReturnTo(returnTo);
        const sb = getSupabase();
        const redirectTo = `${window.location.origin}/auth/callback`;
        sb.auth.signInWithOAuth({
          provider: provider === "google" ? "google" : provider,
          options: { redirectTo },
        });
      },
      async loginViaEmailPassword(email, password) {
        const sb = getSupabase();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new AppError(error.message, 401);
        return { access_token: data.session?.access_token };
      },
      async register({ email, password }) {
        const sb = getSupabase();
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw new AppError(error.message, 400);
        // If email confirmations disabled, session exists
        if (data.session) return { access_token: data.session.access_token, confirmed: true };
        return { confirmed: false };
      },
      async verifyOtp({ email, otpCode }) {
        const sb = getSupabase();
        const { data, error } = await sb.auth.verifyOtp({
          email,
          token: otpCode,
          type: "signup",
        });
        if (error) throw new AppError(error.message, 400);
        return { access_token: data.session?.access_token };
      },
      async resendOtp(email) {
        const sb = getSupabase();
        const { error } = await sb.auth.resend({ type: "signup", email });
        if (error) throw new AppError(error.message, 400);
        return { ok: true };
      },
      async resetPasswordRequest(email) {
        const sb = getSupabase();
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new AppError(error.message, 400);
        return { ok: true };
      },
      async resetPassword({ newPassword }) {
        const sb = getSupabase();
        const { error } = await sb.auth.updateUser({ password: newPassword });
        if (error) throw new AppError(error.message, 400);
        return { ok: true };
      },
      setToken() {
        /* supabase manages session */
      },
      async logout(returnTo) {
        const sb = getSupabase();
        await sb.auth.signOut();
        if (returnTo) window.location.href = typeof returnTo === "string" ? returnTo : "/";
      },
      redirectToLogin(returnTo = "/") {
        const path = `/login?returnTo=${encodeURIComponent(returnTo)}`;
        window.location.href = path;
      },
    },
    integrations: {
      Core: {
        async UploadFile({ file, folder }) {
          if (!file) return { file_url: "" };
          const sb = getSupabase();
          const {
            data: { user },
          } = await sb.auth.getUser();
          if (!user) throw new AppError("Not authenticated", 401);
          const ext = (file.name?.split(".").pop() || "bin").toLowerCase();
          const isPdf =
            file.type === "application/pdf" || ext === "pdf" || folder === "docs";
          const bucket = isPdf
            ? "project-docs"
            : folder === "avatars"
              ? "avatars"
              : "project-images";
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error } = await sb.storage.from(bucket).upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
          if (error) throw new AppError(error.message, 400);
          const { data } = sb.storage.from(bucket).getPublicUrl(path);
          return { file_url: data.publicUrl };
        },
      },
    },
    admin: {
      async listUsers() {
        const sb = getSupabase();
        const { data, error } = await sb.rpc("admin_list_users");
        if (error) throw new AppError(error.message, 400);
        return data || [];
      },
    },
    functions: {
      async invoke(name, payload) {
        if (name !== "geocodeLocation") return { data: null };
        const sb = getSupabase();
        const { data, error } = await sb.functions.invoke("geocode-location", {
          body: payload,
        });
        if (error) throw new AppError(error.message, 400);
        // Edge returns { lat, lng } — wrap like previous Base44 shape
        return { data: data?.lat != null ? data : data?.data || data };
      },
    },
  };
}
