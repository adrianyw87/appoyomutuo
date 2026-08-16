import projectsSeed from "./data/projects.json";
import profilesSeed from "./data/profiles.json";
import membershipsSeed from "./data/memberships.json";
import templatesSeed from "./data/templates.json";
import tasksSeed from "./data/tasks.json";
import announcementsSeed from "./data/announcements.json";
import messagesSeed from "./data/messages.json";
import userSeed from "./data/user.json";

const STORAGE_KEY = "appoyomutuo_mock_db_v4";
const TOKEN_KEY = "base44_access_token";
const MOCK_TOKEN = "mock-local-token";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedDb() {
  return {
    Project: clone(projectsSeed),
    Profile: clone(profilesSeed),
    Membership: clone(membershipsSeed),
    Template: clone(templatesSeed),
    Task: clone(tasksSeed),
    Announcement: clone(announcementsSeed),
    Message: clone(messagesSeed),
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  const db = seedDb();
  persistDb(db);
  return db;
}

function persistDb(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore quota */
  }
}

let db = typeof window !== "undefined" ? loadDb() : seedDb();

export function getMockUser() {
  return clone(userSeed);
}

export function hasMockSession() {
  return localStorage.getItem(TOKEN_KEY) === MOCK_TOKEN;
}

export function startMockSession() {
  localStorage.setItem(TOKEN_KEY, MOCK_TOKEN);
}

export function endMockSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("token");
}

export function resetMockDb() {
  db = seedDb();
  persistDb(db);
  return db;
}

export function getCollection(name) {
  if (!db[name]) db[name] = [];
  return db[name];
}

export function saveCollection(name, items) {
  db[name] = items;
  persistDb(db);
}

export function currentActor() {
  if (!hasMockSession()) return null;
  return getMockUser();
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
