export type User = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

export const USER_KEY = "av_user";
export const SCORES_KEY = "av_scores";

// Pequeño store sobre localStorage para usarlo con useSyncExternalStore.
const listeners = new Set<() => void>();

export function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function emit() {
  listeners.forEach((cb) => cb());
}

/** Devuelve el JSON crudo de av_user (string estable entre lecturas) o null. */
export function readRawUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

/** Parsea el JSON crudo; cualquier valor corrupto cuenta como sin sesión. */
export function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (u && typeof u.name === "string") return { name: u.name };
  } catch {}
  return null;
}

export function writeUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
  emit();
}

export function appendScore(entry: Omit<SavedScore, "at">) {
  try {
    const parsed = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    const all: SavedScore[] = Array.isArray(parsed) ? parsed : [];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
