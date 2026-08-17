import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";

type MyParticipation = {
  id: number;
  eventId: number;
  inviteType: string | null;
  occurrenceDate: string | null;
  createdAt: string;
  eventTitle: string;
  eventDate: string;
  eventImageUrl: string | null;
};

function getImageSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/objects/") ? `/api/storage${url}` : url;
}

export default function IMieiEventi() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [list, setList] = useState<MyParticipation[] | null>(null);
  const [error, setError] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function cancelParticipation(p: MyParticipation) {
    if (!window.confirm(`Vuoi annullare la tua iscrizione a "${p.eventTitle}"?`)) return;
    setCancellingId(p.id);
    try {
      const res = await fetch(`/api/participations/${p.id}`, { method: "DELETE" });
      if (res.ok) {
        setList((prev) => (prev ? prev.filter((x) => x.id !== p.id) : prev));
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "Errore, riprova.");
      }
    } catch {
      window.alert("Errore di rete, riprova.");
    }
    setCancellingId(null);
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) setLocation("/sign-in");
  }, [isLoaded, isSignedIn, setLocation]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/participations/mine")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setList)
      .catch(() => setError(true));
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[12px] tracking-[0.3em] uppercase text-white/30 hover:text-white transition-colors">
          ← Home
        </Link>
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.15em] mt-6 mb-2 text-[#FF1493]">
          I miei eventi
        </h1>
        <p className="text-white/40 text-sm mb-10">Gli eventi a cui ti sei iscritto/a.</p>

        {error ? (
          <p className="text-[#FF006E] text-sm tracking-widest uppercase">Errore di caricamento. Riprova.</p>
        ) : list === null ? (
          <p className="text-white/30 text-sm tracking-[0.35em] uppercase">Caricamento...</p>
        ) : list.length === 0 ? (
          <div className="border border-white/10 p-8 text-center">
            <p className="text-white/50 mb-4">Non ti sei ancora iscritto/a a nessun evento.</p>
            <Link href="/" className="inline-block bg-[#FF006E] text-white text-sm font-black tracking-[0.3em] uppercase py-3 px-8 hover:bg-white hover:text-black transition-colors">
              Scopri gli eventi →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {[...list]
              .sort((a, b) => (b.occurrenceDate ?? b.eventDate).localeCompare(a.occurrenceDate ?? a.eventDate))
              .map((p) => {
                const img = getImageSrc(p.eventImageUrl);
                const displayDate = p.occurrenceDate ?? p.eventDate;
                const past = displayDate < new Date().toISOString().slice(0, 10);
                return (
                  <Link
                    key={p.id}
                    href={`/eventi/${p.eventId}${p.occurrenceDate ? `?d=${p.occurrenceDate}` : ""}`}
                    className={`border border-white/10 hover:border-[#FF006E]/60 transition-colors flex gap-4 p-4 ${past ? "opacity-80" : ""}`}
                  >
                    {img && (
                      <img src={img} alt={p.eventTitle} className="w-20 h-20 object-cover border border-white/10 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold uppercase tracking-wide truncate">{p.eventTitle}</p>
                      <p className="text-white/40 text-sm mt-1">
                        {new Date(displayDate + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <div className="flex gap-3 mt-2 text-[11px] tracking-[0.2em] uppercase">
                        {past ? (
                          <span className="text-white/30">Passato</span>
                        ) : (
                          <span className="text-green-400">In programma</span>
                        )}
                        {p.inviteType && (
                          <span className="text-[#FF1493]">Invito: {p.inviteType}</span>
                        )}
                      </div>
                      {!past && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelParticipation(p);
                          }}
                          disabled={cancellingId === p.id}
                          className="mt-3 text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-[#FF006E] border-b border-transparent hover:border-[#FF006E]/50 transition-colors pb-0.5 disabled:opacity-50"
                        >
                          {cancellingId === p.id ? "Annullamento..." : "Annulla iscrizione"}
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
