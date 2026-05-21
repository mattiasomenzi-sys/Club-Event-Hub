import { useEffect } from "react";
import { useLocation } from "wouter";

const SESSION_KEY = "boxx_session_id";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function stripBase(pathname: string): string {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  if (base && pathname.startsWith(base)) return pathname.slice(base.length) || "/";
  return pathname;
}

function isAdminPath(pathname: string): boolean {
  const rel = stripBase(pathname);
  return rel === "/admin" || rel.startsWith("/admin/");
}

export function useTracker() {
  const [location] = useLocation();

  useEffect(() => {
    if (isAdminPath(window.location.pathname)) return;
    const relPath = stripBase(window.location.pathname) + window.location.search;

    const payload = {
      path: relPath,
      referrer: document.referrer || null,
      language: navigator.language || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      screen: `${window.screen.width}x${window.screen.height}`,
      sessionId: getSessionId(),
    };

    const url = `${import.meta.env.BASE_URL}api/track`.replace(/\/+/g, "/").replace(":/", "://");
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
    } catch { /* fall through */ }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* ignore */ });
  }, [location]);
}
