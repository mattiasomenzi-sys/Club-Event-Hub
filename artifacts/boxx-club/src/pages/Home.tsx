import React, { useState, useRef, useEffect } from "react";
import TelegramIcon from "@/components/TelegramIcon";
import { Link } from "wouter";
import { useListEvents } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";

import boxxLogo from "@assets/boxx-logo.jpeg";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";
import RotatingBackground from "@/components/RotatingBackground";
import { useEventPoster } from "@/hooks/useEventPoster";

const ITALIAN_DAYS: Record<string, string> = {
  Monday: "LUNEDI",
  Tuesday: "MARTEDI",
  Wednesday: "MERCOLEDI",
  Thursday: "GIOVEDI",
  Friday: "VENERDI",
  Saturday: "SABATO",
  Sunday: "DOMENICA",
};

const ITALIAN_MONTHS: Record<number, string> = {
  0: "GENNAIO",
  1: "FEBBRAIO",
  2: "MARZO",
  3: "APRILE",
  4: "MAGGIO",
  5: "GIUGNO",
  6: "LUGLIO",
  7: "AGOSTO",
  8: "SETTEMBRE",
  9: "OTTOBRE",
  10: "NOVEMBRE",
  11: "DICEMBRE",
};

function parseEventDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateStr: string): { day: string; date: string } {
  const d = parseEventDate(dateStr);
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  const day = ITALIAN_DAYS[dayName] ?? dayName.toUpperCase();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { day, date: `${dd}.${mm}.${yyyy}` };
}

function getMonthKey(dateStr: string): string {
  const d = parseEventDate(dateStr);
  return `${ITALIAN_MONTHS[d.getMonth()]}`;
}

function getMonthYear(dateStr: string): string {
  const d = parseEventDate(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

const PLACEHOLDER_EVENTS: Event[] = [
  {
    id: 1,
    title: "NEON NIGHTS",
    description: "La nostra serata signature. Luci basse, musica forte, dress code rigoroso. Nessun compromesso.",
    date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    time: "22:00",
    dresscode: "Dress code: fetish, latex, pelle",
    category: "SERATA",
    imageUrl: null,
    registrationUrl: "https://registrosociasx.it/registrazione?Locale=XP1",
    tickettailorEmbed: null,
    isRecurring: false,
    recurringPattern: null, isGenderless: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "INDUSTRIAL FETISH",
    description: "L'acciaio incontra la pelle. Una notte dedicata a chi non ha paura di osare.",
    date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    time: "22:00",
    dresscode: "Dress code: fetish obbligatorio",
    category: "SPECIAL",
    imageUrl: null,
    registrationUrl: "https://registrosociasx.it/registrazione?Locale=XP1",
    tickettailorEmbed: null,
    isRecurring: false,
    recurringPattern: null, isGenderless: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "BLACKOUT",
    description: "Buio totale. Solo suoni, tocchi e istinto. L'esperienza sensoriale definitiva.",
    date: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0],
    time: "23:00",
    dresscode: "Dress code: nero assoluto",
    category: "SERATA",
    imageUrl: null,
    registrationUrl: "https://registrosociasx.it/registrazione?Locale=XP1",
    tickettailorEmbed: null,
    isRecurring: false,
    recurringPattern: null, isGenderless: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function EventRow({ event, usingRealEvents, past, posterSrc }: { event: Event; usingRealEvents: boolean; past?: boolean; posterSrc: string }) {
  const { day, date } = formatDate(event.date);
  return (
    <div className={`px-6 md:px-12 py-10 border-b border-white/10 hover:bg-white/[0.02] transition-colors group ${past ? "opacity-50 hover:opacity-70" : ""}`}>
      <div className="flex gap-6 items-start">
        <div className="flex-shrink-0 w-20 h-28 sm:w-28 sm:h-36 lg:w-36 lg:h-48 overflow-hidden border border-white/10 group-hover:border-[#FF006E]/30 transition-colors">
          <img
            src={posterSrc}
            alt={event.title}
            className={`w-full h-full object-cover transition-opacity ${event.imageUrl ? "opacity-80 group-hover:opacity-100" : "opacity-60 group-hover:opacity-90"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          {event.category && (
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase text-[#FF006E] mb-3">
              {event.category}
            </p>
          )}
          <p className="text-[12px] tracking-[0.2em] uppercase text-white/40 mb-1">{day}</p>
          <p className="text-sm font-mono text-white/60 mb-4">{date} &nbsp; {event.time}</p>

          {usingRealEvents ? (
            <Link href={`/eventi/${event.id}`}>
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black uppercase leading-none tracking-tighter text-white mb-4 group-hover:text-[#FF006E] transition-colors duration-300 cursor-pointer">
                {event.title}
              </h2>
            </Link>
          ) : (
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black uppercase leading-none tracking-tighter text-white mb-4 group-hover:text-[#FF006E] transition-colors duration-300">
              {event.title}
            </h2>
          )}

          {event.description && (
            <p className="text-sm text-white/50 max-w-xl leading-relaxed mb-3">{event.description}</p>
          )}
          {event.dresscode && (
            <p className="text-[13px] tracking-[0.15em] uppercase text-white/30 mb-5">{event.dresscode}</p>
          )}

          {usingRealEvents ? (
            <Link href={`/eventi/${event.id}`}
              className="inline-block text-[12px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] border-b border-white/20 hover:border-[#FF006E] pb-0.5 transition-colors">
              {past ? "VEDI DETTAGLI →" : "ACCEDI ALL'EVENTO →"}
            </Link>
          ) : (
            <a href={event.registrationUrl ?? "https://registrosociasx.it/registrazione?Locale=XP1"}
              target="_blank" rel="noopener noreferrer"
              className="inline-block text-[12px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] border-b border-white/20 hover:border-[#FF006E] pb-0.5 transition-colors">
              ACCEDI ALL'EVENTO →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function todayString(): string {
  return toISO(new Date());
}

function endOfNextMonthISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  d.setDate(0);
  return toISO(d);
}

const WEEKLY_DOW: Record<string, number> = {
  "tutti-i-mercoledi": 3,
  "tutti-i-venerdi": 5,
  "tutti-i-sabati": 6,
};

const NTH_SAT: Record<string, number> = {
  "primo-sabato": 1,
  "secondo-sabato": 2,
  "terzo-sabato": 3,
  "quarto-sabato": 4,
};

function generateOccurrences(event: Event, fromISOStr: string, toISOStr: string): string[] {
  const from = new Date(fromISOStr + "T00:00:00");
  const to = new Date(toISOStr + "T00:00:00");
  if (to < from) return [];
  const pattern = event.recurringPattern ?? "";
  const out: string[] = [];

  if (pattern in WEEKLY_DOW) {
    const dow = WEEKLY_DOW[pattern];
    const cursor = new Date(from);
    while (cursor.getDay() !== dow) cursor.setDate(cursor.getDate() + 1);
    while (cursor <= to) {
      out.push(toISO(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return out;
  }

  if (pattern in NTH_SAT) {
    const n = NTH_SAT[pattern];
    const monthCursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (monthCursor <= to) {
      const firstDow = monthCursor.getDay();
      const offset = (6 - firstDow + 7) % 7;
      const day = 1 + offset + (n - 1) * 7;
      const cand = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
      if (cand.getMonth() === monthCursor.getMonth() && cand >= from && cand <= to) {
        out.push(toISO(cand));
      }
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
    return out;
  }

  if (event.date >= fromISOStr && event.date <= toISOStr) out.push(event.date);
  return out;
}

function expandEvents(allEvents: Event[], todayISO: string, windowEndISO: string): Event[] {
  const out: Event[] = [];
  for (const e of allEvents) {
    if (e.isRecurring) {
      const cap = e.recurringUntil && e.recurringUntil < windowEndISO ? e.recurringUntil : windowEndISO;
      if (cap < todayISO) continue;
      const startFrom = e.date > todayISO ? e.date : todayISO;
      for (const d of generateOccurrences(e, startFrom, cap)) {
        out.push({ ...e, date: d });
      }
    } else if (e.date >= todayISO && e.date <= windowEndISO) {
      out.push(e);
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export default function Home() {
  const { data: apiEvents, isLoading } = useListEvents();
  const getEventPoster = useEventPoster();
  const usingRealEvents = !!(apiEvents && apiEvents.length > 0);
  const allEvents: Event[] = usingRealEvents ? apiEvents! : PLACEHOLDER_EVENTS;

  const today = todayString();
  const windowEnd = endOfNextMonthISO();
  // Upcoming: expand recurring events into occurrences within current + next month window
  const events = expandEvents(allEvents, today, windowEnd);
  // Past: before today, most-recent first (no expansion — archive uses original dates)
  const pastEvents = allEvents.filter((e) => e.date < today).reverse();

  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const uniqueMonths = Array.from(
    new Set(events.map((e) => getMonthYear(e.date)))
  ).map((key) => {
    const e = events.find((ev) => getMonthYear(ev.date) === key)!;
    return { key, label: getMonthKey(e.date) };
  });

  useEffect(() => {
    if (events.length > 0) {
      setActiveMonth(getMonthYear(events[0].date));
    }
  }, [events.length]);

  function scrollToMonth(key: string) {
    const el = monthRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveMonth(key);
    setMenuOpen(false);
  }

  return (
    <div className="bg-black min-h-screen text-white flex" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Fixed background — rotates from gallery */}
      <RotatingBackground
        fallback={clubPhoto}
        filter="saturate(1.3) hue-rotate(40deg) brightness(0.65)"
      />
      {/* Subtle pink glow — bottom-right where lights are */}
      <div className="fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse at 70% 60%, rgba(255,0,110,0.18) 0%, rgba(0,0,0,0) 60%)" }} />
      {/* Dark vignette to help text readability without killing the photo */}
      <div className="fixed inset-0 z-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.15) 100%)" }} />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 md:hidden border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src={boxxLogo} alt="Boxx Club" className="w-8 h-8 object-cover" />
          <span
            className="text-xl uppercase text-[#FF1493]"
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              letterSpacing: "0.05em",
              textShadow: "0 0 4px #FF006E, 0 0 10px rgba(255,0,110,0.6)",
            }}
          >
            BOXX
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white/60 hover:text-white text-sm tracking-widest uppercase transition-colors"
        >
          {menuOpen ? "CHIUDI" : "MENU"}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 flex flex-col items-center justify-center gap-6 md:hidden">
          {uniqueMonths.map((m) => (
            <button
              key={m.key}
              onClick={() => scrollToMonth(m.key)}
              className={`text-2xl font-bold tracking-widest uppercase transition-colors ${activeMonth === m.key ? "text-[#FF006E]" : "text-white/50 hover:text-white"}`}
            >
              {m.label}
            </button>
          ))}
          <div className="border-t border-white/10 pt-6 flex flex-col items-center gap-4 w-full">
            <a
              href="tel:+393758001920"
              className="text-xl font-black tracking-wide text-white hover:text-[#FF006E] transition-colors"
            >
              +39 375 800 1920
            </a>
            <Link
              href="/chi-siamo"
              onClick={() => setMenuOpen(false)}
              className="text-sm tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors"
            >
              Chi Siamo
            </Link>
            <Link
              href="/gallery"
              onClick={() => setMenuOpen(false)}
              className="text-sm tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors"
            >
              Gallery
            </Link>
            <a
              href="https://registrosociasx.it/registrazione?Locale=XP1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-[0.2em] uppercase text-[#FF006E] hover:text-white transition-colors"
            >
              Pre-Tesseramento
            </a>
          </div>
        </div>
      )}

      {/* Left sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full z-30 flex-col justify-between py-10 px-6"
        style={{ width: "220px" }}>
        <div>
          {/* Logo + brand */}
          <div className="mb-10">
            <img src={boxxLogo} alt="Boxx Club" className="w-14 h-14 object-cover mb-4 border border-white/10" />
            <p className="text-[12px] font-bold tracking-[0.4em] uppercase text-white/40 leading-relaxed">
              CLUB PRIVATO<br />LAGO DI GARDA
            </p>
          </div>

          {/* Month nav */}
          <nav className="flex flex-col gap-1">
            {uniqueMonths.map((m) => (
              <button
                key={m.key}
                onClick={() => scrollToMonth(m.key)}
                className={`text-left text-sm font-bold tracking-[0.15em] uppercase py-1 transition-colors ${
                  activeMonth === m.key
                    ? "text-[#FF006E]"
                    : "text-white/30 hover:text-white/80"
                }`}
              >
                {m.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <a
            href="tel:+393758001920"
            className="text-[13px] font-black tracking-[0.2em] text-white/70 hover:text-[#FF006E] transition-colors"
          >
            +39 375 800 1920
          </a>
          <Link href="/chi-siamo" className="text-[12px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] transition-colors">
            CHI SIAMO
          </Link>
          <Link href="/gallery" className="text-[12px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] transition-colors">
            GALLERY
          </Link>
          <a
            href="https://registrosociasx.it/registrazione?Locale=XP1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] transition-colors"
          >
            PRE-TESSERAMENTO
          </a>
          <div className="flex gap-3">
            <a
              href="https://t.me/boxx_clubb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF006E]/10 hover:bg-[#FF006E] text-[#FF006E] hover:text-white border border-[#FF006E]/40 hover:border-[#FF006E] transition-colors px-3 py-1.5 text-[12px] font-bold tracking-[0.2em] uppercase"
            >
              <TelegramIcon className="w-4 h-4" />
              <span className="leading-none">Telegram</span>
            </a>
          </div>
          <p className="text-[13px] text-white/20 tracking-widest">
            &copy; {new Date().getFullYear()} BOXX CLUB
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="relative z-10 w-full pt-16 md:pt-0"
        style={{ marginLeft: "0", paddingLeft: "0" }}
      >
        <div className="md:ml-[220px] min-h-screen">
          {/* Hero header */}
          <div className="px-6 md:px-12 pt-16 md:pt-20 pb-8 border-b border-white/10">
            <h1
              className="uppercase leading-none text-[#FF1493] flex items-center"
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              <span className="text-[clamp(2.5rem,7vw,5rem)]">B</span>
              <span className="text-[clamp(2.5rem,7vw,5rem)]">O</span>
              <span
                className="text-[clamp(2.9rem,8vw,5.75rem)]"
                style={{
                  textShadow:
                    "0 0 10px #FF006E, 0 0 24px rgba(255,0,110,0.9), 0 0 50px rgba(255,0,110,0.6), 0 0 90px rgba(255,0,110,0.4)",
                }}
              >
                X
              </span>
              <span className="text-[clamp(2.5rem,7vw,5rem)]">X</span>
            </h1>
            <p className="text-[13px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-white/40 mt-2 leading-relaxed">
              uno spazio contemporaneo<br className="sm:hidden" /> per una comunità libera<br className="sm:hidden" /> di essere se stessa — Lago di Garda
            </p>
          </div>

          {/* Events */}
          {isLoading ? (
            <div className="px-6 md:px-12 py-20 text-white/30 text-sm tracking-widest uppercase">
              Caricamento eventi...
            </div>
          ) : (
            <div>
              {/* Phone — mobile only, above the first month */}
              <div className="md:hidden px-6 pt-5 pb-3">
                <a
                  href="tel:+393758001920"
                  className="text-[13px] tracking-[0.25em] uppercase text-white/40 hover:text-[#FF006E] transition-colors"
                >
                  Per info → <span className="text-white/70 font-bold">375 800 1920</span>
                </a>
              </div>

              {/* Upcoming events */}
              {events.length === 0 && !isLoading && (
                <div className="px-6 md:px-12 py-20 text-white/20 text-sm tracking-[0.35em] uppercase">
                  Nessun evento in programma
                </div>
              )}
              {uniqueMonths.map((m) => {
                const monthEvents = events.filter(
                  (e) => getMonthYear(e.date) === m.key
                );
                return (
                  <div
                    key={m.key}
                    ref={(el) => { monthRefs.current[m.key] = el; }}
                  >
                    {/* Month label */}
                    <div className="px-6 md:px-12 py-3 border-b border-white/5 sticky top-[0px] md:top-0 z-20 bg-black/60 backdrop-blur-sm mt-14 md:mt-0">
                      <span className="text-[12px] font-bold tracking-[0.4em] uppercase text-[#FF006E]">
                        {m.label}
                      </span>
                    </div>

                    {monthEvents.map((event) => (
                      <EventRow key={`${event.id}-${event.date}`} event={event} usingRealEvents={usingRealEvents} posterSrc={getEventPoster({ id: event.id, imageUrl: event.imageUrl })} />
                    ))}
                  </div>
                );
              })}

              {/* Archive */}
              {pastEvents.length > 0 && (
                <div className="border-t border-white/10">
                  <button
                    onClick={() => setArchiveOpen(!archiveOpen)}
                    className="w-full px-6 md:px-12 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                  >
                    <span className="text-[12px] font-bold tracking-[0.4em] uppercase text-white/20 group-hover:text-white/40 transition-colors">
                      ARCHIVIO ({pastEvents.length} {pastEvents.length === 1 ? "evento" : "eventi"})
                    </span>
                    <span className="text-white/20 group-hover:text-white/40 transition-colors text-sm">
                      {archiveOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {archiveOpen && pastEvents.map((event) => (
                    <EventRow key={event.id} event={event} usingRealEvents={usingRealEvents} past posterSrc={getEventPoster({ id: event.id, imageUrl: event.imageUrl })} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CTA + Footer */}
          <div className="border-t border-white/10">
            {/* CTA row */}
            <div className="px-6 md:px-12 py-16">
              <p className="text-[12px] tracking-[0.35em] uppercase text-white/30 mb-4">
                ACCESSO RISERVATO AI SOCI
              </p>
              <a
                href="https://registrosociasx.it/registrazione?Locale=XP1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-lg md:text-2xl font-black uppercase tracking-tighter text-white hover:text-[#FF006E] transition-colors border-b-2 border-white/20 hover:border-[#FF006E] pb-1"
              >
                Richiedi il Pre-Tesseramento →
              </a>
            </div>

            {/* Contacts + Address */}
            <div className="px-6 md:px-12 py-10 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Contatti</p>
                <a href="tel:+393758001920" className="block text-sm text-white/50 hover:text-white transition-colors mb-1">
                  +39 375 800 1920
                </a>
                <a href="mailto:info@xpositive.it" className="block text-sm text-white/50 hover:text-white transition-colors">
                  info@xpositive.it
                </a>
              </div>
              <div>
                <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Indirizzo</p>
                <p className="text-sm text-white/50 leading-relaxed">
                  Via Molini 69<br />
                  Lonato del Garda 25017<br />
                  Scala A
                </p>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Seguici</p>
                  <a
                    href="https://t.me/boxx_clubb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#FF006E]/10 hover:bg-[#FF006E] text-[#FF006E] hover:text-white border border-[#FF006E]/40 hover:border-[#FF006E] transition-colors px-4 py-2 text-[13px] font-bold tracking-[0.2em] uppercase"
                  >
                    <TelegramIcon className="w-4 h-4" />
                    <span>Telegram</span>
                  </a>
                  <p className="text-[12px] text-white/30 tracking-wider mt-2">
                    Canale ufficiale @boxx_clubb
                  </p>
                </div>
                {/* Annunci69 badge */}
                <div className="a69_icon" style={{ textDecoration: "none" }} data-rel="@A69_cFx1042">
                  <a
                    style={{ textDecoration: "none" }}
                    href="https://www.annunci69.it/clubprive/brescia/Boxx-Club/1042/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-start gap-1"
                  >
                    <img
                      style={{ width: "90px", height: "auto" }}
                      src="https://www.annunci69.it/clubprive/imgs/logo-white.png"
                      alt="Powered by Annunci69"
                    />
                    <span className="text-[13px] text-white/30 tracking-widest">Siamo su Annunci69.it</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="px-6 md:px-12 py-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-[13px] text-white/20 tracking-[0.2em] uppercase">
                Xpositive APS — C.F. 94025390173 — xpositive@pec.it
              </p>
              <p className="text-[13px] text-white/20 tracking-widest">
                &copy; {new Date().getFullYear()} BOXX CLUB
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
