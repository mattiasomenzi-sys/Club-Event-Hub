import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

type Row = { key: string; count: number };
type Stats = {
  days: number;
  since: string;
  totals: { views: number; uniqueVisitors: number; sessions: number; direct: number };
  timeline: { day: string; views: number; visitors: number }[];
  paths: Row[];
  referrers: Row[];
  countries: Row[];
  devices: Row[];
  browsers: Row[];
  oses: Row[];
  languages: Row[];
  utmSources: Row[];
};

const RANGES = [
  { value: 1, label: "Oggi" },
  { value: 7, label: "7 giorni" },
  { value: 30, label: "30 giorni" },
  { value: 90, label: "90 giorni" },
  { value: 365, label: "1 anno" },
];

const COUNTRY_NAMES: Record<string, string> = {
  IT: "🇮🇹 Italia", DE: "🇩🇪 Germania", FR: "🇫🇷 Francia", CH: "🇨🇭 Svizzera",
  AT: "🇦🇹 Austria", GB: "🇬🇧 Regno Unito", US: "🇺🇸 Stati Uniti", ES: "🇪🇸 Spagna",
  NL: "🇳🇱 Olanda", BE: "🇧🇪 Belgio", SI: "🇸🇮 Slovenia", HR: "🇭🇷 Croazia",
  RU: "🇷🇺 Russia", RO: "🇷🇴 Romania", PL: "🇵🇱 Polonia", BR: "🇧🇷 Brasile",
};

function countryLabel(code: string) {
  return COUNTRY_NAMES[code] ?? code;
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("it-IT").format(n);
}

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-white/80 truncate pr-3">{label}</span>
        <span className="text-white/40 tabular-nums whitespace-nowrap">{fmtNum(value)}{suffix ?? ""}</span>
      </div>
      <div className="h-1.5 bg-white/5 overflow-hidden">
        <div className="h-full bg-[#FF006E]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Card({ title, rows, emptyLabel = "Nessun dato" }: { title: string; rows: Row[]; emptyLabel?: string }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <div className="border border-white/10 bg-black/40 p-5 flex flex-col gap-4">
      <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#FF006E]">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-white/30">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <Bar key={r.key} label={r.key} value={r.count} max={max} />
          ))}
        </div>
      )}
    </div>
  );
}

function Timeline({ data }: { data: { day: string; views: number; visitors: number }[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.views), 0) || 1;
  return (
    <div className="border border-white/10 bg-black/40 p-5">
      <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-5">Andamento</p>
      {data.length === 0 ? (
        <p className="text-sm text-white/30">Nessun dato nel periodo.</p>
      ) : (
        <div className="flex items-end gap-1 h-40">
          {data.map((d) => {
            const h = (d.views / max) * 100;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 group relative min-w-0">
                <div
                  className="w-full bg-[#FF006E]/70 hover:bg-[#FF006E] transition-colors"
                  style={{ height: `${Math.max(h, 1)}%` }}
                  title={`${d.day}: ${d.views} visite, ${d.visitors} unici`}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-black/90 border border-white/10 px-2 py-1 whitespace-nowrap z-10">
                  <div className="text-white">{d.day}</div>
                  <div className="text-white/60">{d.views} visite · {d.visitors} unici</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex justify-between mt-2 text-[10px] tracking-widest uppercase text-white/30">
        <span>{data[0]?.day ?? ""}</span>
        <span>{data[data.length - 1]?.day ?? ""}</span>
      </div>
    </div>
  );
}

function Totals({ totals }: { totals: Stats["totals"] }) {
  const refShare = totals.views > 0 ? Math.round(((totals.views - totals.direct) / totals.views) * 100) : 0;
  const items = [
    { label: "Visite totali", value: fmtNum(totals.views) },
    { label: "Visitatori unici", value: fmtNum(totals.uniqueVisitors) },
    { label: "Sessioni", value: fmtNum(totals.sessions) },
    { label: "Da referral", value: `${refShare}%` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((i) => (
        <div key={i.label} className="border border-white/10 bg-black/40 p-5">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-2">{i.label}</p>
          <p className="text-3xl font-black text-white tabular-nums">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Statistiche() {
  const [, navigate] = useLocation();
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = typeof localStorage !== "undefined" ? localStorage.getItem("boxx_admin_key") : null;
    if (!key) { navigate("/admin"); return; }
    setAdminKey(key);
  }, [navigate]);

  useEffect(() => {
    if (!adminKey) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/admin/stats?days=${days}`, { headers: { "X-Admin-Key": adminKey } })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("boxx_admin_key");
          navigate("/admin");
          return null;
        }
        if (!r.ok) throw new Error("Errore caricamento");
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setStats(data as Stats);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [adminKey, days, navigate]);

  const countriesRows = useMemo(
    () => (stats?.countries ?? []).map((r) => ({ ...r, key: countryLabel(r.key) })),
    [stats],
  );

  if (!adminKey) return null;

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[12px] tracking-[0.3em] uppercase">Torna all'admin</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-[0.2em] uppercase">Statistiche</h1>
        </div>

        {/* Range selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`text-[11px] tracking-[0.3em] uppercase px-4 py-2 border transition-colors ${
                days === r.value
                  ? "border-[#FF006E] bg-[#FF006E] text-white"
                  : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-[#FF006E] text-sm tracking-widest uppercase mb-6">{error}</p>
        )}

        {loading && !stats && (
          <p className="text-white/30 text-sm tracking-[0.35em] uppercase">Caricamento...</p>
        )}

        {stats && (
          <div className="flex flex-col gap-6">
            <Totals totals={stats.totals} />
            <Timeline data={stats.timeline} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Pagine più viste" rows={stats.paths} />
              <Card title="Sorgenti (referrer)" rows={stats.referrers} emptyLabel="Solo traffico diretto." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Paesi" rows={countriesRows} />
              <Card title="Lingue" rows={stats.languages} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card title="Dispositivi" rows={stats.devices} />
              <Card title="Browser" rows={stats.browsers} />
              <Card title="Sistemi operativi" rows={stats.oses} />
            </div>

            {stats.utmSources.length > 0 && (
              <Card title="Campagne (UTM)" rows={stats.utmSources} />
            )}

            <p className="text-[11px] tracking-[0.3em] uppercase text-white/20 mt-4">
              I dati sono anonimi. Nessun cookie, nessun tracker di terze parti.
              IP utilizzati solo per geolocalizzazione e poi cifrati.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
