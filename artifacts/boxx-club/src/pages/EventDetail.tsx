import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useGetEvent } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
import TelegramIcon from "@/components/TelegramIcon";

interface PricingRow { label: string; price: string; fixed: boolean; consumazioni?: number }

function parsePricing(value: string | null | undefined): PricingRow[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as PricingRow[];
  } catch { /* plain text fallback */ }
  return null;
}

import boxxLogo from "@assets/boxx-logo.jpeg";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";
import RotatingBackground from "@/components/RotatingBackground";

const ITALIAN_DAYS: Record<string, string> = {
  Monday: "LUNEDÌ",
  Tuesday: "MARTEDÌ",
  Wednesday: "MERCOLEDÌ",
  Thursday: "GIOVEDÌ",
  Friday: "VENERDÌ",
  Saturday: "SABATO",
  Sunday: "DOMENICA",
};

const ITALIAN_MONTHS: Record<number, string> = {
  0: "GENNAIO", 1: "FEBBRAIO", 2: "MARZO", 3: "APRILE",
  4: "MAGGIO", 5: "GIUGNO", 6: "LUGLIO", 7: "AGOSTO",
  8: "SETTEMBRE", 9: "OTTOBRE", 10: "NOVEMBRE", 11: "DICEMBRE",
};

function parseEventDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatFullDate(dateStr: string) {
  const d = parseEventDate(dateStr);
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  return {
    weekday: ITALIAN_DAYS[dayName] ?? dayName.toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
    month: ITALIAN_MONTHS[d.getMonth()],
    year: d.getFullYear(),
  };
}

function getImageSrc(imageUrl: string | null): string {
  if (!imageUrl) return clubPhoto;
  if (imageUrl.startsWith("/objects/")) return `/api/storage${imageUrl}`;
  return imageUrl;
}

function HtmlEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = html;
    // Re-create script tags so the browser actually executes them
    const scripts = Array.from(container.querySelectorAll("script"));
    for (const oldScript of scripts) {
      const newScript = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.textContent) newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    }
  }, [html]);
  return <div ref={ref} className="tickettailor-embed" />;
}

function useEventUnlock(eventId: number, enabled: boolean) {
  const STORAGE_KEY = `boxx_event_unlocked_${eventId}`;
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!enabled) return true;
    try { return sessionStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  function unlock() {
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setUnlocked(true);
  }
  return { unlocked: !enabled || unlocked, unlock };
}

function UnlockForm({ eventId, onUnlock, title, message }: { eventId: number; onUnlock: () => void; title?: string; message?: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Password non corretta."); setLoading(false); return; }
      onUnlock();
    } catch { setError("Errore di connessione."); }
    setLoading(false);
  }

  return (
    <div className="border border-[#FF006E]/30 bg-[#FF006E]/5 p-6 md:p-8 flex flex-col gap-5 max-w-md">
      <div>
        <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-2">{title ?? "La prenotazione è riservata ai soci"}</p>
        <p className="text-sm text-white/70 leading-relaxed">
          {message ?? "Utilizzare il codice comunicato nell'invito."}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Codice"
          autoComplete="off"
          className="bg-white/5 border border-white/15 text-white text-sm px-4 py-3 outline-none focus:border-[#FF006E] transition-colors placeholder-white/30"
        />
        {error && <p className="text-[#FF006E] text-[12px] tracking-widest uppercase">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="bg-[#FF006E] text-white text-sm font-bold tracking-[0.3em] uppercase py-3 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-30 self-start"
        >
          {loading ? "..." : "SBLOCCA"}
        </button>
      </form>
    </div>
  );
}

function ParticipateForm({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-[#FF006E] transition-colors placeholder-white/20";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Errore. Riprova.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Errore di connessione.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="border border-[#FF006E]/30 px-6 py-5 self-start w-full lg:w-auto">
        <p className="text-[#FF006E] text-sm font-bold tracking-[0.3em] uppercase mb-1">Iscrizione ricevuta</p>
        <p className="text-white/50 text-sm">Ti contatteremo per i dettagli. Ci vediamo presto.</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-auto">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center bg-[#FF006E] text-white text-sm font-black tracking-[0.35em] uppercase py-5 px-10 hover:bg-white hover:text-black transition-colors duration-200 self-start w-full lg:w-auto"
        >
          PARTECIPA →
        </button>
      ) : (
        <div className="border border-white/10 p-6 flex flex-col gap-4 max-w-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase text-white/60">Mettiti in lista</p>
            <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white text-sm transition-colors">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[12px] tracking-[0.25em] uppercase text-white/30 block mb-1">Nome o Nick</label>
              <input
                className={inputClass}
                placeholder="Come ti chiami?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[12px] tracking-[0.25em] uppercase text-white/30 block mb-1">Telefono o Email</label>
              <input
                className={inputClass}
                placeholder="Per essere ricontattato/a"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-[#FF006E] text-[12px] tracking-widest uppercase">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim() || !contact.trim()}
              className="bg-[#FF006E] text-white text-sm font-black tracking-[0.35em] uppercase py-4 hover:bg-white hover:text-black transition-colors disabled:opacity-30"
            >
              {loading ? "..." : "INVIA →"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: event, isLoading, isError } = useGetEvent(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <p className="text-white/30 text-sm tracking-[0.35em] uppercase">Caricamento...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <p className="text-white/40 text-sm tracking-widest uppercase">Evento non trovato</p>
        <button onClick={() => navigate("/")}
          className="text-sm tracking-[0.3em] uppercase text-[#FF006E] hover:text-white transition-colors">
          ← Torna alla home
        </button>
      </div>
    );
  }

  const { weekday, day, month, year } = formatFullDate(event.date);
  const posterSrc = getImageSrc(event.imageUrl ?? null);
  const hasCustomPoster = !!event.imageUrl;
  const isProtected = event.isPasswordProtected ?? false;
  const { unlocked, unlock } = useEventUnlock(event.id, isProtected);
  const hasDetailsContent = !!(event.areaDescription || event.membershipInfo || event.memberQuotes || event.promo || event.memberNotes);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Background — rotates from gallery, dimmed */}
      <RotatingBackground
        fallback={clubPhoto}
        filter="saturate(1.1) brightness(0.3)"
      />
      <div className="fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(255,0,110,0.15) 0%, rgba(0,0,0,0) 70%)" }}
      />
      <div className="fixed inset-0 z-0 bg-black/50" />

      {/* Noise grain */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")', backgroundRepeat: "repeat" }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-12 pt-8 pb-0">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[12px] tracking-[0.3em] uppercase">Tutti gli eventi</span>
          </button>
          <img src={boxxLogo} alt="Boxx Club" className="w-8 h-8 object-cover border border-white/10" />
        </div>

        {/* Main body */}
        <div className="flex-1 flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto w-full">

          {/* MOBILE: poster shown first, full-width */}
          {/* DESKTOP: right column, sticky */}
          <div className="lg:order-2 lg:w-80 xl:w-96 flex-shrink-0 px-6 pt-6 pb-0 lg:px-8 lg:py-0">
            <div className="relative lg:sticky lg:top-8 lg:pt-8">
              <div className="relative w-full max-w-[260px] mx-auto lg:max-w-full">
                <div
                  className="relative overflow-hidden border border-white/10"
                  style={{ aspectRatio: "2/3" }}
                >
                  <img
                    src={posterSrc}
                    alt={`Locandina ${event.title}`}
                    className="w-full h-full object-cover"
                    style={hasCustomPoster ? {} : { filter: "saturate(1.3) hue-rotate(40deg) brightness(0.6)" }}
                  />
                  {!hasCustomPoster && (
                    <>
                      <div className="absolute inset-0"
                        style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(255,0,110,0.35) 0%, rgba(0,0,0,0.2) 70%)" }}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-5">
                        {event.category && (
                          <p className="text-[13px] tracking-[0.4em] uppercase text-[#FF006E] mb-2">{event.category}</p>
                        )}
                        <p className="text-2xl font-black uppercase leading-none tracking-tighter text-white mb-1"
                          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                          {event.title}
                        </p>
                        <p className="text-sm text-white/60 font-mono">{day} {month} {year}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="absolute -inset-4 -z-10 opacity-25"
                  style={{ background: "radial-gradient(ellipse, rgba(255,0,110,0.5) 0%, transparent 70%)" }}
                />
              </div>
            </div>
          </div>

          {/* LEFT — event info */}
          <div className="lg:order-1 flex-1 flex flex-col justify-between px-6 md:px-10 lg:px-16 pt-8 pb-0">
            <div>
              {event.category && (
                <p className="text-[12px] font-bold tracking-[0.5em] uppercase text-[#FF006E] mb-5">
                  {event.category}
                </p>
              )}

              {/* Date block */}
              <div className="mb-8 border-l-2 border-[#FF006E] pl-5">
                <p className="text-[13px] tracking-[0.4em] uppercase text-white/50 mb-1">{weekday}</p>
                <p className="text-5xl md:text-7xl font-black leading-none text-white tabular-nums">
                  {day}
                </p>
                <p className="text-lg md:text-2xl font-bold tracking-[0.25em] uppercase text-white/70 mt-1">
                  {month} {year}
                </p>
                <p className="text-2xl md:text-4xl font-black text-[#FF006E] mt-2 tabular-nums">
                  {event.time}
                </p>
              </div>

              {/* Title */}
              <h1 className="text-[clamp(2.2rem,7vw,5.5rem)] font-black uppercase leading-[0.9] tracking-tighter text-white mb-6"
                style={{ textShadow: "0 0 80px rgba(255,0,110,0.3)" }}>
                {event.title}
              </h1>

              {/* Description */}
              {event.description && (
                <p className="text-sm md:text-base text-white/80 max-w-lg leading-relaxed mb-6 font-light">
                  {event.description}
                </p>
              )}

              {/* Dresscode */}
              {event.dresscode && (
                <div className="inline-flex items-center gap-3 border border-white/10 px-4 py-2.5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF006E] flex-shrink-0" />
                  <span className="text-[13px] tracking-[0.25em] uppercase text-white/50">
                    {event.dresscode}
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-4 pb-10 lg:pb-16">
              {event.tickettailorEmbed ? (
                <div className="w-full">
                  <p className="text-[12px] tracking-[0.35em] uppercase text-white/30 mb-3">Acquista il biglietto</p>
                  {unlocked ? (
                    <HtmlEmbed html={event.tickettailorEmbed} />
                  ) : (
                    <UnlockForm eventId={event.id} onUnlock={unlock} />
                  )}
                </div>
              ) : (
                <>
                  <a
                    href={event.registrationUrl ?? "https://registrosociasx.it/registrazione?Locale=XP1"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center border border-white/20 text-white text-sm font-black tracking-[0.35em] uppercase py-5 px-10 hover:border-[#FF006E] hover:text-[#FF006E] transition-colors duration-200 self-start w-full lg:w-auto"
                  >
                    PRE-TESSERAMENTO →
                  </a>
                  <p className="text-[12px] tracking-[0.25em] uppercase text-white/25">
                    L'ingresso è riservato esclusivamente ai soci tesserati
                  </p>
                </>
              )}

              {/* Partecipa */}
              <ParticipateForm eventId={event.id} />
            </div>
          </div>
        </div>

        {/* Info sections — full width below two-column layout. Hidden entirely when event is locked (gate above the widget handles unlock). When no ticket widget exists but event is still protected, show the gate here instead. */}
        {hasDetailsContent && !unlocked && !event.tickettailorEmbed && (
          <div className="max-w-6xl mx-auto w-full px-6 md:px-16 pb-10">
            <div className="border-t border-white/10 pt-10">
              <UnlockForm eventId={event.id} onUnlock={unlock} />
            </div>
          </div>
        )}
        {hasDetailsContent && unlocked && (
          <div className="max-w-6xl mx-auto w-full px-6 md:px-16 pb-10">
            <div className="border-t border-white/10 pt-10">
            <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Area */}
              {event.areaDescription && (
                <div>
                  <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Aree</p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{event.areaDescription}</p>
                </div>
              )}

              {/* Tessera */}
              {event.membershipInfo && (
                <div>
                  <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Tesseramento</p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{event.membershipInfo}</p>
                </div>
              )}
            </div>

            {/* Quote soci */}
            {event.memberQuotes && (() => {
              const allRows = parsePricing(event.memberQuotes);
              const GENDERED_LABELS = ["coppie", "coppia", "singoli", "singole", "singolo", "singola"];
              const rows = allRows && event.isGenderless
                ? allRows.filter((r) => !GENDERED_LABELS.includes((r.label ?? "").trim().toLowerCase()))
                : allRows;
              if (rows && rows.length === 0) return null;
              return (
                <div>
                  <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Quote soci</p>
                  {rows ? (
                    <table className="w-full max-w-sm border-collapse">
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="text-sm text-white/85 font-medium py-2 pr-6">{row.label}</td>
                            <td className="text-sm text-white/75 py-2 pr-4">{row.price || "—"}</td>
                            {(row.consumazioni ?? 0) > 0 && (
                              <td className="text-sm text-[#FF006E]/80 py-2 whitespace-nowrap">
                                {row.consumazioni} cons.
                                {row.label === "Coppie" ? " a persona" : " incluse"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{event.memberQuotes}</p>
                  )}
                </div>
              );
            })()}

            {/* Promo */}
            {event.promo && (
              <div className="border border-[#FF006E]/20 bg-[#FF006E]/5 p-6">
                <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Promo</p>
                <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">{event.promo}</p>
              </div>
            )}

            {/* Note */}
            {event.memberNotes && (
              <div>
                <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Note</p>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{event.memberNotes}</p>
              </div>
            )}
            </div>
            </div>
          </div>
        )}

        {/* Footer strip */}
        <div className="border-t border-white/5 px-6 md:px-12 py-5 flex items-center justify-between">
          <p className="text-[13px] tracking-[0.35em] uppercase text-white/20">
            BOXX CLUB PRIVATO — LAGO DI GARDA
          </p>
          <div className="flex gap-4">
            <a href="https://t.me/boxx_clubb" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#FF006E] hover:text-white transition-colors text-[12px] font-bold tracking-[0.25em] uppercase">
              <TelegramIcon className="w-4 h-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
