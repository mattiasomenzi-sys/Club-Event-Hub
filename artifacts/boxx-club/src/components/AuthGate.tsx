import React from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";

/**
 * Stato di accesso alle azioni riservate (Partecipa, Pre-tesseramento):
 * - "loading": Clerk o il profilo stanno ancora caricando
 * - "signed-out": serve il login
 * - "no-profile": loggato ma senza profilo compilato
 * - "ready": può procedere
 */
export function useProfileGate() {
  const { isSignedIn, isLoaded } = useUser();
  const profileQuery = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey(), enabled: isLoaded && !!isSignedIn, retry: false },
  });

  if (!isLoaded) return { status: "loading" as const };
  if (!isSignedIn) return { status: "signed-out" as const };
  if (profileQuery.isLoading) return { status: "loading" as const };
  if (profileQuery.data) return { status: "ready" as const, profile: profileQuery.data };
  return { status: "no-profile" as const };
}

/** L'utente loggato è admin? (chiede al server, che controlla l'email) */
export function useIsAdmin(): boolean {
  const { isSignedIn, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) { setIsAdmin(false); return; }
    let cancelled = false;
    fetch("/api/admin/whoami")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => { if (!cancelled) setIsAdmin(!!d.isAdmin); })
      .catch(() => { if (!cancelled) setIsAdmin(false); });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);
  return isAdmin;
}

/**
 * Voci di menu legate al login:
 * - sloggato: "ACCEDI"
 * - loggato admin: "PANNELLO ADMIN" + "PROFILO"
 * - loggato normale: "I MIEI EVENTI" + "PROFILO"
 */
export function AuthMenuLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const isAdmin = useIsAdmin();
  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <Link href="/sign-in" onClick={onNavigate} className={className}>
        ACCEDI
      </Link>
    );
  }
  return (
    <>
      {isAdmin ? (
        <Link href="/admin" onClick={onNavigate} className={className}>
          PANNELLO ADMIN
        </Link>
      ) : (
        <Link href="/i-miei-eventi" onClick={onNavigate} className={className}>
          I MIEI EVENTI
        </Link>
      )}
      <Link href="/profilo" onClick={onNavigate} className={className}>
        PROFILO
      </Link>
    </>
  );
}

/**
 * Link "gated": se l'utente non è loggato lo porta al login,
 * se non ha il profilo lo porta a completarlo, altrimenti apre l'URL esterno.
 */
export function GatedExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const gate = useProfileGate();
  const [, setLocation] = useLocation();

  const onClick = (e: React.MouseEvent) => {
    if (gate.status === "ready") return; // lascia aprire il link
    e.preventDefault();
    if (gate.status === "signed-out") setLocation("/sign-in");
    else if (gate.status === "no-profile") setLocation("/profilo");
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
