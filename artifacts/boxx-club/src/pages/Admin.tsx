import React, { useState, useRef } from "react";
import { Link } from "wouter";
import { useListEvents } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListEventsQueryKey } from "@workspace/api-client-react";
import { Upload, X, Loader2, RefreshCw, Pencil, Check } from "lucide-react";

import boxxLogo from "@assets/boxx-logo.jpeg";

const API_BASE = "/api";

const DEFAULT_AREA_DESCRIPTION = `🎵 Disco e tavoli
Drink & Beverage by Ste
Tavoli VIP su prenotazione, info in pvt

💞 Privè / Darkroom tematizzate`;

const DEFAULT_MEMBERSHIP_INFO = `Aderiamo alla rete di circoli ASX
L'accesso al circolo è consentito solo ai soci.
La quota associativa annua è di 30 euro ed è valida 365gg dal momento dell'emissione.`;

const DEFAULT_MEMBER_QUOTES = `💰 Quote partecipative PROMO FINE MESE
Coppie – Promo Fine Mese
Singola – Promo Fine Mese
Singoli (under 30 anni) 50 euro
Singoli (over 30) 80 euro

Per le categorie fa fede il genere indicato sul documento d'identità

TAVOLI VIP info e prenotazioni al 3758001920

Pink 1 fino a 4 persone, inclusi ingressi, priority check, bottiglia al tavolo, tavolo e stanza riservati.
Pink 2 fino a 6 persone, inclusi ingressi, priority check, bottiglia al tavolo, tavolo e stanza riservati.`;

const DEFAULT_DRESSCODE_TEMPLATES = [
  { id: "1", name: "Come as u are", text: "Come as u are – Nessun obbligo di dress specifico, no giacca e cravatta.\nSi può essere swag anche in tuta. No sciatteria." },
  { id: "2", name: "Fetish / Latex", text: "FETISH, LATEX, PELLE" },
  { id: "3", name: "Glamour", text: "GLAMOUR, ELEGANTE, PROVOCANTE" },
];

function loadDresscodeTemplates(): { id: string; name: string; text: string }[] {
  try {
    const raw = localStorage.getItem("boxx_dresscode_templates");
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return DEFAULT_DRESSCODE_TEMPLATES;
}

function saveDresscodeTemplates(tpls: { id: string; name: string; text: string }[]) {
  localStorage.setItem("boxx_dresscode_templates", JSON.stringify(tpls));
}

const RECURRING_PATTERNS = [
  { value: "primo-sabato", label: "Primo sabato del mese" },
  { value: "secondo-sabato", label: "Secondo sabato del mese" },
  { value: "terzo-sabato", label: "Terzo sabato del mese" },
  { value: "quarto-sabato", label: "Quarto sabato del mese" },
  { value: "tutti-i-venerdi", label: "Tutti i venerdì" },
  { value: "tutti-i-sabati", label: "Tutti i sabati" },
  { value: "tutti-i-mercoledi", label: "Tutti i mercoledì" },
  { value: "personalizzato", label: "Schema personalizzato" },
];

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  dresscode: string;
  category: string;
  registrationUrl: string;
  imageUrl: string;
  tickettailorEmbed: string;
  areaDescription: string;
  membershipInfo: string;
  memberQuotes: string;
  isRecurring: boolean;
  recurringPattern: string;
}

const emptyForm: EventFormData = {
  title: "",
  description: "",
  date: "",
  time: "22:00",
  dresscode: "",
  category: "SERATA",
  registrationUrl: "https://registrosociasx.it/registrazione?Locale=XP1",
  imageUrl: "",
  tickettailorEmbed: "",
  areaDescription: DEFAULT_AREA_DESCRIPTION,
  membershipInfo: DEFAULT_MEMBERSHIP_INFO,
  memberQuotes: DEFAULT_MEMBER_QUOTES,
  isRecurring: false,
  recurringPattern: "",
};

function getImageSrc(imageUrl: string): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/objects/")) return `/api/storage${imageUrl}`;
  return imageUrl;
}

function PencilField({
  label, value, onChange, rows = 4, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full resize-y";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</span>
        <button type="button" onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-[#FF006E] transition-colors border border-white/10 hover:border-[#FF006E]/40 px-2 py-1">
          {editing ? <><Check className="w-3 h-3" /> Chiudi</> : <><Pencil className="w-3 h-3" /> Modifica</>}
        </button>
      </div>
      {editing ? (
        <textarea className={inputClass} rows={rows} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="bg-white/5 border border-white/5 px-4 py-3 text-xs text-white/50 whitespace-pre-wrap leading-relaxed min-h-[3rem]">
          {value || <span className="text-white/20 italic">{placeholder ?? "Non compilato"}</span>}
        </div>
      )}
    </div>
  );
}

function DresscodeTemplatePicker({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [templates, setTemplates] = useState(() => loadDresscodeTemplates());
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full";

  function applyTemplate(text: string) { onChange(text); }

  function saveNew() {
    if (!newName.trim() || !value.trim()) return;
    const updated = [...templates, { id: Date.now().toString(), name: newName.trim(), text: value }];
    saveDresscodeTemplates(updated);
    setTemplates(updated);
    setNewName("");
    setSaving(false);
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter(t => t.id !== id);
    saveDresscodeTemplates(updated);
    setTemplates(updated);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">Dress Code</span>
        <button type="button" onClick={() => setSaving(!saving)}
          className="text-[10px] text-[#FF006E] hover:text-white border border-[#FF006E]/30 hover:border-white/30 px-2 py-1 transition-colors">
          {saving ? "Annulla" : "+ Salva template"}
        </button>
      </div>
      {/* Template buttons */}
      <div className="flex flex-wrap gap-2 mb-1">
        {templates.map(t => (
          <div key={t.id} className="flex items-center gap-1 group">
            <button type="button" onClick={() => applyTemplate(t.text)}
              className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-white/10 text-white/50 hover:text-white hover:border-[#FF006E]/50 transition-colors">
              {t.name}
            </button>
            <button type="button" onClick={() => deleteTemplate(t.id)}
              className="text-white/20 hover:text-[#FF006E] transition-colors opacity-0 group-hover:opacity-100 -ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {/* Text input */}
      <input className={inputClass} placeholder="Scrivi o seleziona un template sopra…"
        value={value} onChange={(e) => onChange(e.target.value)} />
      {/* Save new template row */}
      {saving && (
        <div className="flex gap-2">
          <input className={`${inputClass} flex-1`} placeholder="Nome template…"
            value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button type="button" onClick={saveNew}
            className="bg-[#FF006E] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-4 hover:bg-white hover:text-black transition-colors">
            SALVA
          </button>
        </div>
      )}
      <p className="text-[10px] text-white/20">Clicca un template per applicarlo, poi modificalo. "Salva template" lo memorizza per il futuro.</p>
    </div>
  );
}

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
        headers: { "Content-Type": "application/json", "X-Admin-Key": key },
        body: JSON.stringify({ title: "__test__", date: "2099-01-01", time: "00:00" }),
      });
      if (res.status === 401) { setError("Chiave non valida."); setLoading(false); return; }
      if (res.ok) {
        const created = await res.json();
        await fetch(`${API_BASE}/events/${created.id}`, { method: "DELETE", headers: { "X-Admin-Key": key } });
      }
      onLogin(key);
    } catch { setError("Errore di connessione."); }
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
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-8">Accesso Admin</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Chiave admin"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 tracking-wider"
          />
          {error && <p className="text-[#FF006E] text-xs tracking-widest uppercase">{error}</p>}
          <button type="submit" disabled={loading || !key}
            className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-3 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40">
            {loading ? "..." : "ACCEDI"}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-2">
          <Link href="/admin/recupera" className="text-[10px] tracking-[0.25em] uppercase text-white/25 hover:text-[#FF006E] transition-colors">
            Hai dimenticato la chiave? Recupera accesso →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ImageUploader({
  adminKey,
  currentImageUrl,
  onUploaded,
}: {
  adminKey: string;
  currentImageUrl: string;
  onUploaded: (objectPath: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string>(currentImageUrl ? getImageSrc(currentImageUrl) : "");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Seleziona un'immagine."); return; }
    setUploading(true);
    setError("");
    try {
      const urlRes = await fetch(`${API_BASE}/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) { setError("Errore nel richiedere l'URL di upload."); setUploading(false); return; }
      const { uploadURL, objectPath } = await urlRes.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) { setError("Errore durante l'upload del file."); setUploading(false); return; }

      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      onUploaded(objectPath);
    } catch { setError("Errore di connessione."); }
    setUploading(false);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div
        className="relative border border-white/10 hover:border-[#FF006E]/50 transition-colors cursor-pointer group"
        style={{ minHeight: 120 }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Locandina" className="w-full max-h-48 object-contain bg-black/40" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs tracking-[0.25em] uppercase text-white">Cambia immagine</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-white/30 group-hover:text-white/60 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-[10px] tracking-[0.25em] uppercase">Carica locandina</span>
              </>
            )}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF006E]" />
          </div>
        )}
      </div>
      {error && <p className="text-[#FF006E] text-[10px] tracking-widest uppercase mt-1">{error}</p>}
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
  const [customPattern, setCustomPattern] = useState(
    initial.recurringPattern && !RECURRING_PATTERNS.find(p => p.value === initial.recurringPattern && p.value !== "personalizzato")
      ? initial.recurringPattern
      : ""
  );
  const [selectedPattern, setSelectedPattern] = useState(
    initial.recurringPattern
      ? (RECURRING_PATTERNS.find(p => p.value === initial.recurringPattern) ? initial.recurringPattern : "personalizzato")
      : ""
  );

  function set<K extends keyof EventFormData>(field: K, value: EventFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalPattern = selectedPattern === "personalizzato" ? customPattern : selectedPattern;

    try {
      const url = eventId ? `${API_BASE}/events/${eventId}` : `${API_BASE}/events`;
      const method = eventId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {};
      if (form.title) body.title = form.title;
      if (form.description) body.description = form.description;
      if (form.date) body.date = form.date;
      if (form.time) body.time = form.time;
      if (form.dresscode) body.dresscode = form.dresscode;
      if (form.category) body.category = form.category;
      if (form.registrationUrl) body.registrationUrl = form.registrationUrl;
      if (form.imageUrl) body.imageUrl = form.imageUrl;
      if (form.tickettailorEmbed) body.tickettailorEmbed = form.tickettailorEmbed;
      body.areaDescription = form.areaDescription;
      body.membershipInfo = form.membershipInfo;
      body.memberQuotes = form.memberQuotes;
      body.isRecurring = form.isRecurring;
      if (form.isRecurring && finalPattern) body.recurringPattern = finalPattern;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Errore nel salvataggio.");
        setLoading(false);
        return;
      }

      onSave();
    } catch { setError("Errore di connessione."); }
    setLoading(false);
  }

  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full";
  const labelClass = "text-[10px] tracking-[0.25em] uppercase text-white/40 mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Locandina */}
      <div>
        <label className={labelClass}>Locandina</label>
        <ImageUploader
          adminKey={adminKey}
          currentImageUrl={form.imageUrl}
          onUploaded={(objectPath) => set("imageUrl", objectPath)}
        />
        {form.imageUrl && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-white/30 font-mono truncate flex-1">{form.imageUrl}</span>
            <button type="button" onClick={() => set("imageUrl", "")}
              className="text-white/30 hover:text-[#FF006E] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Titolo */}
      <div>
        <label className={labelClass}>Titolo *</label>
        <input required className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      {/* Descrizione evento (parte specifica) */}
      <div>
        <label className={labelClass}>Descrizione evento</label>
        <textarea className={`${inputClass} resize-y`} rows={5}
          placeholder="Il tema della serata, la musica, il mood specifico di questo evento…"
          value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      {/* Data & Orario */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Data *</label>
          <input required type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Orario *</label>
          <input required className={inputClass} placeholder="22:00" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className={labelClass}>Categoria</label>
        <input className={inputClass} placeholder="SERATA / SPECIAL" value={form.category}
          onChange={(e) => set("category", e.target.value)} />
      </div>

      {/* Dress Code con template salvabili */}
      <DresscodeTemplatePicker value={form.dresscode} onChange={(v) => set("dresscode", v)} />

      {/* Divider */}
      <div className="border-t border-white/10 pt-2">
        <p className="text-[9px] tracking-[0.4em] uppercase text-white/20 mb-4">Sezioni fisse dell'evento</p>
      </div>

      {/* Descrizione aree (tavoli, privè…) */}
      <PencilField
        label="Descrizione aree"
        value={form.areaDescription}
        onChange={(v) => set("areaDescription", v)}
        rows={5}
        placeholder="Info su tavoli, privè, darkroom…"
      />

      {/* Badge statico — non modificabile */}
      <div className="flex items-center gap-3 border border-white/10 px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-[#FF006E] flex-shrink-0" />
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Evento riservato ai soci</p>
          <p className="text-[9px] text-white/30 tracking-wider">Campo fisso — non modificabile</p>
        </div>
      </div>

      {/* Info tesseramento */}
      <PencilField
        label="Info tesseramento"
        value={form.membershipInfo}
        onChange={(v) => set("membershipInfo", v)}
        rows={4}
        placeholder="Info sull'iscrizione ASX…"
      />

      {/* Quote soci */}
      <PencilField
        label="Quote soci"
        value={form.memberQuotes}
        onChange={(v) => set("memberQuotes", v)}
        rows={8}
        placeholder="Quote partecipative, tavoli VIP…"
      />

      {/* Evento ricorrente */}
      <div className="border border-white/10 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("isRecurring", !form.isRecurring)}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${form.isRecurring ? "bg-[#FF006E]" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.isRecurring ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <div>
            <span className="text-sm text-white font-medium flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-white/40" />
              Evento ricorrente
            </span>
            <span className="text-[10px] text-white/30 tracking-wider">
              La data inserita sopra è la prossima occorrenza
            </span>
          </div>
        </label>

        {form.isRecurring && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className={labelClass}>Schema di ricorrenza</label>
              <select
                className={`${inputClass} appearance-none`}
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
              >
                <option value="">— Seleziona —</option>
                {RECURRING_PATTERNS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            {selectedPattern === "personalizzato" && (
              <div>
                <label className={labelClass}>Schema personalizzato</label>
                <input
                  className={inputClass}
                  placeholder="es. ogni primo e terzo sabato del mese"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link registrazione */}
      <div>
        <label className={labelClass}>Link registrazione</label>
        <input className={inputClass} value={form.registrationUrl}
          onChange={(e) => set("registrationUrl", e.target.value)} />
      </div>

      {/* Tickettailor embed */}
      <div>
        <label className={labelClass}>
          Embed Tickettailor
          <span className="ml-2 text-white/20 normal-case tracking-normal">
            (HTML o shortcode WordPress)
          </span>
        </label>
        <textarea
          className={`${inputClass} resize-none font-mono text-xs`}
          rows={5}
          placeholder={`<iframe src="https://www.tickettailor.com/..." />`}
          value={form.tickettailorEmbed}
          onChange={(e) => set("tickettailorEmbed", e.target.value)}
        />
        <p className="text-[10px] text-white/25 mt-1 tracking-wide">
          Incolla qui il codice embed HTML o shortcode di Tickettailor. Verrà mostrato nella pagina evento.
        </p>
      </div>

      {error && <p className="text-[#FF006E] text-xs tracking-widest uppercase">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-2.5 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40">
          {loading ? "..." : eventId ? "SALVA MODIFICHE" : "CREA EVENTO"}
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs font-bold tracking-[0.3em] uppercase py-2.5 px-6 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors">
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
    await fetch(`${API_BASE}/events/${id}`, { method: "DELETE", headers: { "X-Admin-Key": adminKey } });
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
      imageUrl: e.imageUrl ?? "",
      tickettailorEmbed: e.tickettailorEmbed ?? "",
      areaDescription: e.areaDescription ?? DEFAULT_AREA_DESCRIPTION,
      membershipInfo: e.membershipInfo ?? DEFAULT_MEMBERSHIP_INFO,
      memberQuotes: e.memberQuotes ?? DEFAULT_MEMBER_QUOTES,
      isRecurring: e.isRecurring ?? false,
      recurringPattern: e.recurringPattern ?? "",
    };
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-12 py-10"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
          <a href="/" className="text-[10px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors">VEDI SITO</a>
          <button onClick={onLogout}
            className="text-[10px] tracking-[0.25em] uppercase text-white/30 hover:text-[#FF006E] transition-colors">
            ESCI
          </button>
        </div>
      </div>

      {/* Add event button */}
      {!showForm && !editingEvent && (
        <div className="mb-10">
          <button onClick={() => setShowForm(true)}
            className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-3 px-8 hover:bg-white hover:text-black transition-colors">
            + AGGIUNGI EVENTO
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && !editingEvent && (
        <div className="mb-12 border border-white/10 p-6 md:p-8">
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-white mb-6">Nuovo Evento</h2>
          <EventForm initial={emptyForm} adminKey={adminKey} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Edit form */}
      {editingEvent && (
        <div className="mb-12 border border-[#FF006E]/30 p-6 md:p-8">
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#FF006E] mb-6">
            Modifica: {editingEvent.title}
          </h2>
          <EventForm initial={toFormData(editingEvent)} adminKey={adminKey} eventId={editingEvent.id}
            onSave={handleSave} onCancel={() => setEditingEvent(null)} />
        </div>
      )}

      {/* Events list */}
      <div>
        <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-6">
          EVENTI ({events.length})
        </h2>

        {isLoading && <p className="text-white/30 text-xs tracking-widest uppercase">Caricamento...</p>}
        {!isLoading && events.length === 0 && (
          <p className="text-white/20 text-sm">Nessun evento. Aggiungine uno.</p>
        )}

        <div className="flex flex-col divide-y divide-white/5">
          {events.map((event) => (
            <div key={event.id} className="py-5 flex gap-4 md:gap-6 items-start">
              {/* Thumbnail */}
              {event.imageUrl && (
                <div className="flex-shrink-0 w-16 h-20 overflow-hidden border border-white/10">
                  <img
                    src={getImageSrc(event.imageUrl)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {event.category && (
                    <span className="text-[10px] tracking-[0.3em] uppercase text-[#FF006E]">{event.category}</span>
                  )}
                  {event.isRecurring && (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-wider uppercase text-white/30 border border-white/10 px-1.5 py-0.5">
                      <RefreshCw className="w-2.5 h-2.5" /> Ricorrente
                    </span>
                  )}
                </div>
                <p className="font-black text-lg uppercase tracking-tight text-white leading-tight mb-1">
                  {event.title}
                </p>
                <p className="text-xs text-white/40 font-mono mb-1">{event.date} — {event.time}</p>
                {event.isRecurring && event.recurringPattern && (
                  <p className="text-[10px] text-white/25 tracking-wider mb-1">
                    {RECURRING_PATTERNS.find(p => p.value === event.recurringPattern)?.label ?? event.recurringPattern}
                  </p>
                )}
                {event.dresscode && (
                  <p className="text-[11px] text-white/30 uppercase tracking-wider">{event.dresscode}</p>
                )}
                {event.description && (
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{event.description}</p>
                )}
                {event.tickettailorEmbed && (
                  <p className="text-[10px] text-[#FF006E]/50 tracking-wider mt-1">↳ Tickettailor embed presente</p>
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

      {/* Cambia chiave */}
      <ChangeKeySection adminKey={adminKey} onKeyChanged={(newKey) => { localStorage.setItem("boxx_admin_key", newKey); onLogout(); }} />
    </div>
  );
}

function ChangeKeySection({ adminKey, onKeyChanged }: { adminKey: string; onKeyChanged: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 w-full outline-none focus:border-[#FF006E] transition-colors placeholder-white/20";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newKey !== confirm) { setError("Le due chiavi non coincidono."); return; }
    if (newKey.length < 8) { setError("Min. 8 caratteri."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ currentKey, newKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Errore."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => { onKeyChanged(newKey); }, 1500);
    } catch { setError("Errore di connessione."); }
    setLoading(false);
  }

  return (
    <div className="mt-16 border-t border-white/10 pt-10">
      <button onClick={() => setOpen(!open)}
        className="text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-white/50 transition-colors">
        {open ? "— Nascondi" : "⚙ Cambia chiave di accesso"}
      </button>
      {open && (
        <div className="mt-6 max-w-sm">
          {success ? (
            <p className="text-[#FF006E] text-sm font-bold tracking-wider uppercase">Chiave aggiornata — ri-login in corso…</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/40 block mb-1">Chiave attuale</label>
                <input type="password" className={inputClass} value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)} required placeholder="Chiave attuale" />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/40 block mb-1">Nuova chiave</label>
                <input type="password" className={inputClass} value={newKey}
                  onChange={(e) => setNewKey(e.target.value)} required minLength={8} placeholder="Min. 8 caratteri" />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/40 block mb-1">Conferma nuova chiave</label>
                <input type="password" className={inputClass} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} required placeholder="Ripeti la nuova chiave" />
              </div>
              {error && <p className="text-[#FF006E] text-[10px] tracking-widest uppercase">{error}</p>}
              <button type="submit" disabled={loading || !currentKey || !newKey || !confirm}
                className="bg-white/10 text-white text-xs font-bold tracking-[0.3em] uppercase py-2.5 px-6 hover:bg-[#FF006E] transition-colors disabled:opacity-30 self-start">
                {loading ? "..." : "AGGIORNA CHIAVE"}
              </button>
            </form>
          )}
        </div>
      )}
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

  if (!adminKey) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard adminKey={adminKey} onLogout={handleLogout} />;
}
