/**
 * Local autosave for admin wizard forms. Drafts live in localStorage so an
 * accidentally closed popup can be resumed at the exact step it was left on.
 */
export type AdminDraft<T> = {
  data: T;
  step: number;
  savedAt: number;
};

const PREFIX = "admin:draft:";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function draftKey(scope: string, id: string | null) {
  return `${PREFIX}${scope}:${id ?? "new"}`;
}

export function readDraft<T>(key: string): AdminDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminDraft<T>;
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) return null;
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDraft<T>(key: string, data: T, step: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ data, step, savedAt: Date.now() } satisfies AdminDraft<T>),
    );
  } catch {
    /* quota or private mode — drafting is best-effort */
  }
}

export function clearDraft(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function formatDraftTime(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}
