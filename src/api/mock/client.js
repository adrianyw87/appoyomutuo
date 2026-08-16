import {
  currentActor,
  endMockSession,
  getCollection,
  getMockUser,
  hasMockSession,
  newId,
  saveCollection,
  startMockSession,
} from "./store";

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

class MockError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "Base44Error";
    this.status = status;
  }
}

function matchesQuery(item, query = {}) {
  return Object.entries(query).every(([key, value]) => item[key] === value);
}

function sortItems(items, sort) {
  if (!sort) return [...items];
  const desc = String(sort).startsWith("-");
  const field = desc ? String(sort).slice(1) : String(sort);
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av > bv) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
}

function createEntityApi(name) {
  const listeners = new Set();

  const emit = (event) => {
    listeners.forEach((fn) => {
      try {
        fn(event);
      } catch {
        /* ignore listener errors */
      }
    });
  };

  return {
    async list(sort, limit) {
      await delay();
      const items = sortItems(getCollection(name), sort);
      return limit ? items.slice(0, limit) : items;
    },

    async filter(query = {}, sort, limit) {
      await delay();
      const filtered = getCollection(name).filter((item) => matchesQuery(item, query));
      const items = sortItems(filtered, sort);
      return limit ? items.slice(0, limit) : items;
    },

    async get(id) {
      await delay();
      const item = getCollection(name).find((row) => row.id === id);
      if (!item) throw new MockError(`${name} not found`, 404);
      return { ...item };
    },

    async create(data) {
      await delay();
      const actor = currentActor();
      const item = {
        ...data,
        id: data.id || newId(name.toLowerCase()),
        created_date: data.created_date || new Date().toISOString(),
        created_by_id: data.created_by_id || actor?.id || null,
        created_by: data.created_by || actor?.email || null,
      };
      const items = getCollection(name);
      items.unshift(item);
      saveCollection(name, items);
      emit({ type: "create", data: item });
      return { ...item };
    },

    async update(id, data) {
      await delay();
      const items = getCollection(name);
      const index = items.findIndex((row) => row.id === id);
      if (index < 0) throw new MockError(`${name} not found`, 404);
      const updated = {
        ...items[index],
        ...data,
        id,
        updated_date: new Date().toISOString(),
      };
      items[index] = updated;
      saveCollection(name, items);
      emit({ type: "update", data: updated });
      return { ...updated };
    },

    async delete(id) {
      await delay();
      const items = getCollection(name);
      const next = items.filter((row) => row.id !== id);
      if (next.length === items.length) throw new MockError(`${name} not found`, 404);
      saveCollection(name, next);
      emit({ type: "delete", data: { id } });
      return { id };
    },

    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

const NEIGHBORHOOD_COORDS = {
  lavapiés: { lat: 40.4096, lng: -3.7008 },
  lavapies: { lat: 40.4096, lng: -3.7008 },
  malasaña: { lat: 40.4255, lng: -3.7072 },
  malasana: { lat: 40.4255, lng: -3.7072 },
  vallecas: { lat: 40.388, lng: -3.65 },
  chamberí: { lat: 40.434, lng: -3.703 },
  chamberi: { lat: 40.434, lng: -3.703 },
  usera: { lat: 40.387, lng: -3.71 },
  latina: { lat: 40.402, lng: -3.74 },
};

function geocode({ neighborhood, address } = {}) {
  const key = String(neighborhood || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  const hit = NEIGHBORHOOD_COORDS[key] || NEIGHBORHOOD_COORDS[neighborhood?.toLowerCase?.()] || {
    lat: 40.4168,
    lng: -3.7038,
  };
  return {
    data: {
      lat: hit.lat + (Math.random() - 0.5) * 0.004,
      lng: hit.lng + (Math.random() - 0.5) * 0.004,
      label: [address, neighborhood].filter(Boolean).join(", ") || "Madrid",
    },
  };
}

export function createMockClient() {
  if (typeof console !== "undefined") {
    console.info("[mock] Base44 local mock activo — datos en src/api/mock/data/");
  }

  return {
    entities: {
      Project: createEntityApi("Project"),
      Profile: createEntityApi("Profile"),
      Membership: createEntityApi("Membership"),
      Template: createEntityApi("Template"),
      Task: createEntityApi("Task"),
      Announcement: createEntityApi("Announcement"),
      Message: createEntityApi("Message"),
      User: createEntityApi("User"),
    },
    auth: {
      async me() {
        await delay(40);
        if (!hasMockSession()) {
          throw new MockError("Not authenticated", 401);
        }
        return getMockUser();
      },
      isAuthenticated() {
        return hasMockSession();
      },
      loginWithProvider(_provider, returnTo = "/") {
        startMockSession();
        window.location.href = returnTo || "/";
      },
      async loginViaEmailPassword(_email, _password) {
        startMockSession();
        return { access_token: "mock-local-token" };
      },
      async register() {
        startMockSession();
        return { ok: true, confirmed: true, access_token: "mock-local-token" };
      },
      async verifyOtp() {
        startMockSession();
        return { access_token: "mock-local-token" };
      },
      async resendOtp() {
        return { ok: true };
      },
      async resetPasswordRequest() {
        return { ok: true };
      },
      async resetPassword() {
        return { ok: true };
      },
      setToken() {
        startMockSession();
      },
      logout(returnTo) {
        endMockSession();
        if (returnTo) window.location.href = returnTo;
      },
      redirectToLogin(returnTo = "/") {
        startMockSession();
        window.location.href = returnTo;
      },
    },
    integrations: {
      Core: {
        async UploadFile({ file, folder: _folder }) {
          await delay(120);
          const url = file ? URL.createObjectURL(file) : "";
          return { file_url: url };
        },
      },
    },
    functions: {
      async invoke(name, payload) {
        await delay(100);
        if (name === "geocodeLocation") return geocode(payload);
        return { data: null };
      },
    },
  };
}
