import React, { useState } from "react";
import { useListEvents } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListEventsQueryKey } from "@workspace/api-client-react";

import boxxLogo from "@assets/boxx-logo.jpeg";

const API_BASE = "/api";

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  dresscode: string;
  category: string;
  registrationUrl: string;
}

const emptyForm: EventFormData = {
  title: "",
  description: "",
  date: "",
  time: "22:00",
  dresscode: "",
  category: "SERATA",
  registrationUrl: "https://registrosociasx.it/registrazione?Locale=XP1",
};

function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": key,
        },
        body: JSON.stringify({ title: "__test__", date: "2099-01-01", time: "00:00" }),
      });
      if (res.status === 401) {
        setError("Chiave non valida.");
        setLoading(false);
        return;
      }
      if (res.ok) {
        const created = await res.json();
        await fetch(`${API_BASE}/events/${created.id}`, {
          method: "DELETE",
          headers: { "X-Admin-Key": key },
        });
      }
      onLogin(key);
    } catch {
      setError("Errore di connessione.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-4 mb-10">
          <img src={boxxLogo} alt="Boxx" className="w-10 h-10 border border-white/10 object-cover" />
          <span className="text-xs tracking-[0.35em] uppercase text-white/40">Admin</span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-8">
          Accesso Admin
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Chiave admin"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 tracking-wider"
          />
          {error && <p className="text-[#FF006E] text-xs tracking-widest uppercase">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key}
            className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-3 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40"
          >
            {loading ? "..." : "ACCEDI"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EventForm({
  initial,
  adminKey,
  eventId,
  onSave,
  onCancel,
}: {
  initial: EventFormData;
  adminKey: string;
  eventId?: number;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EventFormData>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof EventFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = eventId ? `${API_BASE}/events/${eventId}` : `${API_BASE}/events`;
      const method = eventId ? "PATCH" : "POST";
      const body: Record<string, string> = {};
      if (form.title) body.title = form.title;
      if (form.description) body.description = form.description;
      if (form.date) body.date = form.date;
      if (form.time) body.time = form.time;
      if (form.dresscode) body.dresscode = form.dresscode;
      if (form.category) body.category = form.category;
      if (form.registrationUrl) body.registrationUrl = form.registrationUrl;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Errore nel salvataggio.");
        setLoading(false);
        return;
      }

      onSave();
    } catch {
      setError("Errore di connessione.");
    }
    setLoading(false);
  }

  const inputClass =
    "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full";
  const labelClass = "text-[10px] tracking-[0.25em] uppercase text-white/40 mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className={labelClass}>Titolo *</label>
        <input required className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Descrizione</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Data * (YYYY-MM-DD)</label>
          <input required type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Orario *</label>
          <input required className={inputClass} placeholder="22:00" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Categoria</label>
          <input className={inputClass} placeholder="SERATA / SPECIAL" value={form.category} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Dress Code</label>
          <input className={inputClass} value={form.dresscode} onChange={(e) => set("dresscode", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Link registrazione</label>
        <input className={inputClass} value={form.registrationUrl} onChange={(e) => set("registrationUrl", e.target.value)} />
      </div>

      {error && <p className="text-[#FF006E] text-xs tracking-widest uppercase">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-2.5 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40"
        >
          {loading ? "..." : eventId ? "SALVA MODIFICHE" : "CREA EVENTO"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold tracking-[0.3em] uppercase py-2.5 px-6 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"
        >
          ANNULLA
        </button>
      </div>
    </form>
  );
}

function AdminDashboard({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const { data: events = [], isLoading } = useListEvents();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Eliminare questo evento?")) return;
    setDeletingId(id);
    await fetch(`${API_BASE}/events/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Key": adminKey },
    });
    await queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    setDeletingId(null);
  }

  async function handleSave() {
    await queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    setShowForm(false);
    setEditingEvent(null);
  }

  function toFormData(e: Event): EventFormData {
    return {
      title: e.title,
      description: e.description ?? "",
      date: e.date,
      time: e.time,
      dresscode: e.dresscode ?? "",
      category: e.category ?? "",
      registrationUrl: e.registrationUrl ?? "https://registrosociasx.it/registrazione?Locale=XP1",
    };
  }

  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-12 py-10"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <img src={boxxLogo} alt="Boxx" className="w-9 h-9 border border-white/10 object-cover" />
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-white">BOXX CLUB</p>
            <p className="text-[10px] tracking-widest uppercase text-white/30">Admin Panel</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/" className="text-[10px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors">
            VEDI SITO
          </a>
          <button
            onClick={onLogout}
            className="text-[10px] tracking-[0.25em] uppercase text-white/30 hover:text-[#FF006E] transition-colors"
          >
            ESCI
          </button>
        </div>
      </div>

      {/* Add event button */}
      {!showForm && !editingEvent && (
        <div className="mb-10">
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-3 px-8 hover:bg-white hover:text-black transition-colors"
          >
            + AGGIUNGI EVENTO
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && !editingEvent && (
        <div className="mb-12 border border-white/10 p-6 md:p-8">
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-white mb-6">Nuovo Evento</h2>
          <EventForm
            initial={emptyForm}
            adminKey={adminKey}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingEvent && (
        <div className="mb-12 border border-[#FF006E]/30 p-6 md:p-8">
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#FF006E] mb-6">
            Modifica: {editingEvent.title}
          </h2>
          <EventForm
            initial={toFormData(editingEvent)}
            adminKey={adminKey}
            eventId={editingEvent.id}
            onSave={handleSave}
            onCancel={() => setEditingEvent(null)}
          />
        </div>
      )}

      {/* Events list */}
      <div>
        <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-6">
          EVENTI ({events.length})
        </h2>

        {isLoading && (
          <p className="text-white/30 text-xs tracking-widest uppercase">Caricamento...</p>
        )}

        {!isLoading && events.length === 0 && (
          <p className="text-white/20 text-sm">Nessun evento. Aggiungine uno.</p>
        )}

        <div className="flex flex-col divide-y divide-white/5">
          {events.map((event) => (
            <div key={event.id} className="py-5 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
              <div className="flex-1 min-w-0">
                {event.category && (
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#FF006E] mb-1">{event.category}</p>
                )}
                <p className="font-black text-lg uppercase tracking-tight text-white leading-tight mb-1">
                  {event.title}
                </p>
                <p className="text-xs text-white/40 font-mono mb-1">
                  {event.date} — {event.time}
                </p>
                {event.dresscode && (
                  <p className="text-[11px] text-white/30 uppercase tracking-wider">{event.dresscode}</p>
                )}
                {event.description && (
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{event.description}</p>
                )}
              </div>
              <div className="flex gap-3 items-center flex-shrink-0">
                <button
                  onClick={() => { setEditingEvent(event); setShowForm(false); }}
                  className="text-[10px] tracking-[0.25em] uppercase text-white/30 hover:text-white border-b border-transparent hover:border-white/30 transition-colors pb-0.5"
                >
                  MODIFICA
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deletingId === event.id}
                  className="text-[10px] tracking-[0.25em] uppercase text-white/20 hover:text-[#FF006E] border-b border-transparent hover:border-[#FF006E]/30 transition-colors pb-0.5 disabled:opacity-30"
                >
                  {deletingId === event.id ? "..." : "ELIMINA"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState<string | null>(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem("boxx_admin_key") : null
  );

  function handleLogin(key: string) {
    localStorage.setItem("boxx_admin_key", key);
    setAdminKey(key);
  }

  function handleLogout() {
    localStorage.removeItem("boxx_admin_key");
    setAdminKey(null);
  }

  if (!adminKey) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard adminKey={adminKey} onLogout={handleLogout} />;
}
