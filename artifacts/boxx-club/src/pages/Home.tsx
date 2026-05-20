import React, { useState, useRef, useEffect } from "react";
import { Instagram } from "lucide-react";
import { Link } from "wouter";
import { useListEvents } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";

import boxxLogo from "@assets/boxx-logo.jpeg";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";

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
    recurringPattern: null,
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
    recurringPattern: null,
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
    recurringPattern: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function Home() {
  const { data: apiEvents, isLoading } = useListEvents();
  const usingRealEvents = !!(apiEvents && apiEvents.length > 0);
  const events: Event[] = usingRealEvents ? apiEvents! : PLACEHOLDER_EVENTS;
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
      {/* Fixed background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${clubPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "saturate(1.3) hue-rotate(40deg) brightness(0.65)",
        }}
      />
      {/* Subtle pink glow — bottom-right where lights are */}
      <div className="fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse at 70% 60%, rgba(255,0,110,0.18) 0%, rgba(0,0,0,0) 60%)" }} />
      {/* Dark vignette to help text readability without killing the photo */}
      <div className="fixed inset-0 z-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.15) 100%)" }} />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 md:hidden border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src={boxxLogo} alt="Boxx Club" className="w-8 h-8 object-cover" />
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-white">BOXX</span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white/60 hover:text-white text-xs tracking-widest uppercase transition-colors"
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
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 leading-relaxed">
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
            className="text-[11px] font-black tracking-[0.2em] text-white/70 hover:text-[#FF006E] transition-colors"
          >
            +39 375 800 1920
          </a>
          <Link href="/chi-siamo" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] transition-colors">
            CHI SIAMO
          </Link>
          <a
            href="https://registrosociasx.it/registrazione?Locale=XP1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] transition-colors"
          >
            PRE-TESSERAMENTO
          </a>
          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/boxxclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-[#FF006E] transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/boxxclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold tracking-widest uppercase text-white/30 hover:text-[#FF006E] transition-colors leading-none mt-0.5"
            >
              TG
            </a>
          </div>
          <p className="text-[9px] text-white/20 tracking-widest">
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
              className="text-[clamp(2.5rem,8vw,6rem)] font-black uppercase leading-none tracking-tighter text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              BOXX
            </h1>
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-white/40 mt-2 leading-relaxed">
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
                      <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#FF006E]">
                        {m.label}
                      </span>
                    </div>

                    {monthEvents.map((event) => {
                      const { day, date } = formatDate(event.date);
                      return (
                        <div
                          key={event.id}
                          className="px-6 md:px-12 py-10 border-b border-white/10 hover:bg-white/[0.02] transition-colors group"
                        >
                          <div className="flex gap-6 items-start">
                            {/* Text content */}
                            <div className="flex-1 min-w-0">
                              {event.category && (
                                <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#FF006E] mb-3">
                                  {event.category}
                                </p>
                              )}

                              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">
                                {day}
                              </p>
                              <p className="text-sm font-mono text-white/60 mb-4">
                                {date} &nbsp; {event.time}
                              </p>

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
                                <p className="text-sm text-white/50 max-w-xl leading-relaxed mb-3">
                                  {event.description}
                                </p>
                              )}

                              {event.dresscode && (
                                <p className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">
                                  {event.dresscode}
                                </p>
                              )}

                              {usingRealEvents ? (
                                <Link
                                  href={`/eventi/${event.id}`}
                                  className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] border-b border-white/20 hover:border-[#FF006E] pb-0.5 transition-colors"
                                >
                                  ACCEDI ALL'EVENTO →
                                </Link>
                              ) : (
                                <a
                                  href={event.registrationUrl ?? "https://registrosociasx.it/registrazione?Locale=XP1"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#FF006E] border-b border-white/20 hover:border-[#FF006E] pb-0.5 transition-colors"
                                >
                                  ACCEDI ALL'EVENTO →
                                </a>
                              )}
                            </div>

                            {/* Locandina thumbnail */}
                            {event.imageUrl && (
                              <div className="flex-shrink-0 w-20 h-28 sm:w-28 sm:h-36 lg:w-36 lg:h-48 overflow-hidden border border-white/10 group-hover:border-[#FF006E]/30 transition-colors">
                                <img
                                  src={event.imageUrl.startsWith("/objects/") ? `/api/storage${event.imageUrl}` : event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA + Footer */}
          <div className="border-t border-white/10">
            {/* CTA row */}
            <div className="px-6 md:px-12 py-16">
              <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-4">
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
                <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Contatti</p>
                <a href="tel:+393758001920" className="block text-xs text-white/50 hover:text-white transition-colors mb-1">
                  +39 375 800 1920
                </a>
                <a href="mailto:info@xpositive.it" className="block text-xs text-white/50 hover:text-white transition-colors">
                  info@xpositive.it
                </a>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Indirizzo</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Via Molini 69<br />
                  Lonato del Garda 25017<br />
                  Scala A
                </p>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-3">Seguici</p>
                  <a
                    href="https://www.instagram.com/boxxclub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-white/50 hover:text-white transition-colors mb-1"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://t.me/boxxclub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-white/50 hover:text-white transition-colors"
                  >
                    Telegram
                  </a>
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
                    <span className="text-[9px] text-white/30 tracking-widest">Siamo su Annunci69.it</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="px-6 md:px-12 py-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-[9px] text-white/20 tracking-[0.2em] uppercase">
                Xpositive APS — C.F. 94025390173 — xpositive@pec.it
              </p>
              <p className="text-[9px] text-white/20 tracking-widest">
                &copy; {new Date().getFullYear()} BOXX CLUB
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
