import React from "react";
import { useParams, useLocation } from "wouter";
import { useGetEvent } from "@workspace/api-client-react";
import { ArrowLeft, Instagram } from "lucide-react";

import boxxLogo from "@assets/boxx-logo.jpeg";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";

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

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: event, isLoading, isError } = useGetEvent(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <p className="text-white/30 text-xs tracking-[0.35em] uppercase">Caricamento...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <p className="text-white/40 text-sm tracking-widest uppercase">Evento non trovato</p>
        <button onClick={() => navigate("/")}
          className="text-xs tracking-[0.3em] uppercase text-[#FF006E] hover:text-white transition-colors">
          ← Torna alla home
        </button>
      </div>
    );
  }

  const { weekday, day, month, year } = formatFullDate(event.date);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Background photo */}
      <div className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${event.imageUrl ?? clubPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.3) hue-rotate(40deg) brightness(0.4)",
        }}
      />
      {/* Pink glow */}
      <div className="fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at 65% 55%, rgba(255,0,110,0.22) 0%, rgba(0,0,0,0) 65%)" }}
      />
      {/* Strong dark vignette for poster readability */}
      <div className="fixed inset-0 z-0 bg-black/60" />

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
            <span className="text-[10px] tracking-[0.3em] uppercase">Tutti gli eventi</span>
          </button>
          <img src={boxxLogo} alt="Boxx Club" className="w-8 h-8 object-cover border border-white/10" />
        </div>

        {/* Poster body */}
        <div className="flex-1 flex flex-col justify-between px-6 md:px-16 lg:px-24 py-12 md:py-16 max-w-4xl mx-auto w-full">

          {/* Category + date block */}
          <div>
            {event.category && (
              <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#FF006E] mb-6">
                {event.category}
              </p>
            )}

            {/* Big date — poster style */}
            <div className="mb-10 border-l-2 border-[#FF006E] pl-5">
              <p className="text-[11px] tracking-[0.4em] uppercase text-white/50 mb-1">{weekday}</p>
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

            {/* Event title */}
            <h1 className="text-[clamp(2.8rem,9vw,7rem)] font-black uppercase leading-[0.9] tracking-tighter text-white mb-8"
              style={{ textShadow: "0 0 80px rgba(255,0,110,0.3)" }}>
              {event.title}
            </h1>

            {/* Description */}
            {event.description && (
              <p className="text-base md:text-lg text-white/60 max-w-xl leading-relaxed mb-6 font-light">
                {event.description}
              </p>
            )}

            {/* Dresscode */}
            {event.dresscode && (
              <div className="inline-flex items-center gap-3 border border-white/10 px-4 py-2.5 mb-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF006E] flex-shrink-0" />
                <span className="text-[11px] tracking-[0.25em] uppercase text-white/50">
                  {event.dresscode}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-4 mt-4">
            <a
              href={event.registrationUrl ?? "https://registrosociasx.it/registrazione?Locale=XP1"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#FF006E] text-white text-sm font-black tracking-[0.35em] uppercase py-5 px-10 hover:bg-white hover:text-black transition-colors duration-200 self-start"
            >
              PRE-TESSERAMENTO →
            </a>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25">
              L'ingresso è riservato esclusivamente ai soci tesserati
            </p>
          </div>
        </div>

        {/* Footer strip */}
        <div className="border-t border-white/5 px-6 md:px-12 py-5 flex items-center justify-between">
          <p className="text-[9px] tracking-[0.35em] uppercase text-white/20">
            BOXX CLUB PRIVATO — LAGO DI GARDA
          </p>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/boxxclub" target="_blank" rel="noopener noreferrer"
              className="text-white/20 hover:text-[#FF006E] transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
