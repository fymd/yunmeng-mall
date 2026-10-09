/**
 * In-process pub/sub for chat SSE.
 * Suitable for single-node deploy; multi-instance needs Redis later.
 */

export type ChatEvent = {
  type: "message" | "read" | "ping";
  sessionId?: string;
  message?: {
    id: string;
    sessionId: string;
    role: string;
    content: string;
    contact: string;
    read: boolean;
    createdAt: string;
  };
};

type Listener = (ev: ChatEvent) => void;

const sessionListeners = new Map<string, Set<Listener>>();
const adminListeners = new Set<Listener>();

export function subscribeSession(sessionId: string, fn: Listener): () => void {
  let set = sessionListeners.get(sessionId);
  if (!set) {
    set = new Set();
    sessionListeners.set(sessionId, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) sessionListeners.delete(sessionId);
  };
}

export function subscribeAdmin(fn: Listener): () => void {
  adminListeners.add(fn);
  return () => adminListeners.delete(fn);
}

export function publishChat(ev: ChatEvent) {
  if (ev.sessionId) {
    const set = sessionListeners.get(ev.sessionId);
    if (set) for (const fn of set) fn(ev);
  }
  for (const fn of adminListeners) fn(ev);
}
