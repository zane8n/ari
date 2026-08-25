import type { ExperienceState } from "./types";

const SCHEMA_VERSION = 1;
const DEBOUNCE_MS = 150;

function storageKey(inviteId: string): string {
  return `birthday:v1:${inviteId}`;
}

export function loadDraft(inviteId: string): ExperienceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(inviteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExperienceState;
    if (parsed.schemaVersion !== SCHEMA_VERSION || parsed.inviteId !== inviteId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(state: ExperienceState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(state.inviteId), JSON.stringify(state));
  } catch {
    // Private browsing / quota — draft persistence is best-effort, never required.
  }
}

/** Debounces writes during rapid input, but always flushes synchronously before the tab can die. */
export class DraftPersister {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private latest: ExperienceState | null = null;
  private readonly boundFlush = (): void => this.flush();

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.boundFlush);
      window.addEventListener("pagehide", this.boundFlush);
    }
  }

  schedule(state: ExperienceState): void {
    this.latest = state;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(this.boundFlush, DEBOUNCE_MS);
  }

  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.latest) writeDraft(this.latest);
  }

  dispose(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.boundFlush);
      window.removeEventListener("pagehide", this.boundFlush);
    }
  }
}
