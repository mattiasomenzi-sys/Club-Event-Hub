import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useClerk } from "@clerk/react";
import { useListEvents, useListGalleryPhotos, useListBanners } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getListEventsQueryKey, getListGalleryPhotosQueryKey, getListBannersQueryKey } from "@workspace/api-client-react";
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

const DEFAULT_MEMBER_QUOTES = JSON.stringify([
  { label: "Coppie", price: "Promo Fine Mese", fixed: true },
  { label: "Singola", price: "Promo Fine Mese", fixed: true },
  { label: "Singoli", price: "80 euro", fixed: true },
]);

const DEFAULT_MEMBER_NOTES = `Per le categorie fa fede il genere indicato sul documento d'identità

TAVOLI VIP info e prenotazioni al 3758001920

Pink 1 fino a 4 persone, inclusi ingressi, priority check, bottiglia al tavolo, tavolo e stanza riservati.
Pink 2 fino a 6 persone, inclusi ingressi, priority check, bottiglia al tavolo, tavolo e stanza riservati.`;

type Template = { id: string; name: string; text: string };

const DEFAULT_DRESSCODE_TEMPLATES: Template[] = [
  { id: "1", name: "Come as u are", text: "Come as u are – Nessun obbligo di dress specifico, no giacca e cravatta.\nSi può essere swag anche in tuta. No sciatteria." },
  { id: "2", name: "Fetish / Latex", text: "FETISH, LATEX, PELLE" },
  { id: "3", name: "Glamour", text: "GLAMOUR, ELEGANTE, PROVOCANTE" },
];

const DEFAULT_AREA_TEMPLATES: Template[] = [
  { id: "1", name: "Standard", text: DEFAULT_AREA_DESCRIPTION },
];

function loadTemplates(storageKey: string, defaults: Template[]): Template[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return defaults;
}

function persistTemplates(storageKey: string, tpls: Template[]) {
  localStorage.setItem(storageKey, JSON.stringify(tpls));
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
  promo: string;
  memberNotes: string;
  isRecurring: boolean;
  recurringPattern: string;
  recurringUntil: string;
  isGenderless: boolean;
  isPasswordProtected: boolean;
  password: string;
  isDraft: boolean;
  photoRequirement: "none" | "optional" | "required";
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
  promo: "Promo Under 35\nAvete entrambi meno 35 anni? Il Sabato sera le coppie giovani sono nostre ospiti!\nUn invito speciale per chi ha voglia di esplorare\nLa promo non esclude dalla sangria offerta.",
  memberNotes: DEFAULT_MEMBER_NOTES,
  isRecurring: false,
  recurringPattern: "",
  recurringUntil: "",
  isGenderless: false,
  isPasswordProtected: false,
  password: "",
  isDraft: false,
  photoRequirement: "none",
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
        <span className="text-[12px] tracking-[0.25em] uppercase text-white/40">{label}</span>
        <button type="button" onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 text-[12px] text-white/30 hover:text-[#FF006E] transition-colors border border-white/10 hover:border-[#FF006E]/40 px-2 py-1">
          {editing ? <><Check className="w-3 h-3" /> Chiudi</> : <><Pencil className="w-3 h-3" /> Modifica</>}
        </button>
      </div>
      {editing ? (
        <textarea className={inputClass} rows={rows} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="bg-white/5 border border-white/5 px-4 py-3 text-sm text-white/50 whitespace-pre-wrap leading-relaxed min-h-[3rem]">
          {value || <span className="text-white/20 italic">{placeholder ?? "Non compilato"}</span>}
        </div>
      )}
    </div>
  );
}

interface PricingRow { label: string; price: string; fixed: boolean; consumazioni?: number }

function parsePricing(value: string): PricingRow[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return (parsed as PricingRow[]).map(r => ({ ...r, consumazioni: r.consumazioni ?? 0 }));
  } catch { /* legacy text */ }
  return [
    { label: "Coppie", price: "", fixed: true, consumazioni: 0 },
    { label: "Singola", price: "", fixed: true, consumazioni: 0 },
    { label: "Singoli", price: "", fixed: true, consumazioni: 0 },
  ];
}

function PricingEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [rows, setRows] = useState<PricingRow[]>(() => parsePricing(value));
  const inputBase = "bg-white/5 border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20";
  const inputClass = `${inputBase} w-full`;

  function update(next: PricingRow[]) {
    setRows(next);
    onChange(JSON.stringify(next));
  }

  function setPrice(idx: number, price: string) {
    update(rows.map((r, i) => i === idx ? { ...r, price } : r));
  }

  function setLabel(idx: number, label: string) {
    update(rows.map((r, i) => i === idx ? { ...r, label } : r));
  }

  function setConsumazioni(idx: number, consumazioni: number) {
    update(rows.map((r, i) => i === idx ? { ...r, consumazioni } : r));
  }

  function addRow() {
    update([...rows, { label: "", price: "", fixed: false, consumazioni: 0 }]);
  }

  function removeRow(idx: number) {
    update(rows.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] tracking-[0.25em] uppercase text-white/40">Quote soci</span>
        <button type="button" onClick={addRow}
          className="flex items-center gap-1 text-[12px] text-[#FF006E] hover:text-white border border-[#FF006E]/30 hover:border-white/20 px-2 py-1 transition-colors">
          + Aggiungi voce
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((row, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 border border-white/5 p-3">
            <div className="flex items-center gap-2">
              {row.fixed ? (
                <div className="bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-2 w-28 flex-shrink-0 font-medium">
                  {row.label}
                </div>
              ) : (
                <input className={`${inputBase} w-28 flex-shrink-0`} placeholder="Categoria"
                  value={row.label} onChange={(e) => setLabel(idx, e.target.value)} />
              )}
              <span className="text-white/20 text-sm flex-shrink-0">–</span>
              <input className={inputClass} placeholder="es. 50 euro / Promo Fine Mese"
                value={row.price} onChange={(e) => setPrice(idx, e.target.value)} />
              {!row.fixed && (
                <button type="button" onClick={() => removeRow(idx)}
                  className="text-white/20 hover:text-[#FF006E] transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-white/30 tracking-wide w-28 flex-shrink-0">
                Consumazioni
                {row.label === "Coppie" && <span className="text-white/20"> (×pers.)</span>}
              </span>
              <input
                type="number"
                min={0}
                className={`${inputBase} w-20 flex-shrink-0`}
                placeholder="0"
                value={row.consumazioni ?? 0}
                onChange={(e) => setConsumazioni(idx, parseInt(e.target.value) || 0)}
              />
              <span className="text-[12px] text-white/20 tracking-wide">
                {(row.consumazioni ?? 0) === 0 ? "— non compare" : row.label === "Coppie" ? "a persona" : "incluse"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateChips({
  storageKey, defaults, value, onChange,
}: { storageKey: string; defaults: Template[]; value: string; onChange: (v: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>(() => loadTemplates(storageKey, defaults));
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full";

  function saveNew() {
    if (!newName.trim() || !value.trim()) return;
    const updated = [...templates, { id: Date.now().toString(), name: newName.trim(), text: value }];
    persistTemplates(storageKey, updated);
    setTemplates(updated);
    setNewName("");
    setSaving(false);
  }

  function deleteTemplate(id: string, name: string) {
    if (!confirm(`Eliminare il template "${name}"?`)) return;
    const updated = templates.filter(t => t.id !== id);
    persistTemplates(storageKey, updated);
    setTemplates(updated);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <button type="button" onClick={() => setSaving(!saving)}
          className="text-[12px] text-[#FF006E] hover:text-white border border-[#FF006E]/30 hover:border-white/30 px-2 py-1 transition-colors">
          {saving ? "Annulla" : "+ Salva template"}
        </button>
      </div>
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-1 group">
              <button type="button" onClick={() => onChange(t.text)}
                className="text-[12px] tracking-[0.15em] uppercase px-3 py-1.5 border border-white/10 text-white/50 hover:text-white hover:border-[#FF006E]/50 transition-colors">
                {t.name}
              </button>
              <button type="button" onClick={() => deleteTemplate(t.id, t.name)}
                title="Elimina template"
                className="text-white/20 hover:text-[#FF006E] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 -ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {saving && (
        <div className="flex gap-2">
          <input className={`${inputClass} flex-1`} placeholder="Nome template…"
            value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button type="button" onClick={saveNew}
            className="bg-[#FF006E] text-white text-[12px] font-bold tracking-[0.2em] uppercase px-4 hover:bg-white hover:text-black transition-colors">
            SALVA
          </button>
        </div>
      )}
      <p className="text-[12px] text-white/20">Clicca un template per applicarlo, poi modificalo. Passa col mouse sul template per eliminarlo.</p>
    </div>
  );
}

function DresscodeTemplatePicker({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full";
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] tracking-[0.25em] uppercase text-white/40">Dress Code</span>
      <TemplateChips storageKey="boxx_dresscode_templates" defaults={DEFAULT_DRESSCODE_TEMPLATES}
        value={value} onChange={onChange} />
      <input className={inputClass} placeholder="Scrivi o seleziona un template sopra…"
        value={value} onChange={(e) => onChange(e.target.value)} />
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
          <span className="text-sm tracking-[0.35em] uppercase text-white/40">Admin</span>
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
          {error && <p className="text-[#FF006E] text-sm tracking-widest uppercase">{error}</p>}
          <button type="submit" disabled={loading || !key}
            className="bg-[#FF006E] text-white text-sm font-bold tracking-[0.3em] uppercase py-3 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40">
            {loading ? "..." : "ACCEDI"}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-2">
          <Link href="/admin/recupera" className="text-[12px] tracking-[0.25em] uppercase text-white/25 hover:text-[#FF006E] transition-colors">
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
              <span className="text-sm tracking-[0.25em] uppercase text-white">Cambia immagine</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-white/30 group-hover:text-white/60 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-[12px] tracking-[0.25em] uppercase">Carica locandina</span>
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
      {error && <p className="text-[#FF006E] text-[12px] tracking-widest uppercase mt-1">{error}</p>}
    </div>
  );
}

function ImportFromEventDropdown({
  events,
  currentEventId,
  onImport,
}: {
  events: Event[];
  currentEventId?: number;
  onImport: (e: Event) => void;
}) {
  const [open, setOpen] = useState(false);
  const candidates = events.filter((e) => e.id !== currentEventId);
  if (candidates.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between border border-dashed border-white/20 hover:border-[#FF006E]/60 px-4 py-3 text-white/40 hover:text-[#FF006E] transition-colors text-sm tracking-[0.2em] uppercase"
      >
        <span>↓ Importa testi da un evento esistente</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 border border-white/10 bg-black/95 max-h-64 overflow-y-auto">
          {candidates.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => { onImport(e); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
            >
              <span className="font-medium text-white/80">{e.title}</span>
              <span className="ml-3 text-white/30 text-xs">{e.date}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EventForm({
  initial,
  adminKey,
  eventId,
  allEvents,
  onSave,
  onCancel,
}: {
  initial: EventFormData;
  adminKey: string;
  eventId?: number;
  allEvents: Event[];
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

  function importFromEvent(e: Event) {
    setForm((f) => ({
      ...f,
      dresscode: e.dresscode ?? f.dresscode,
      description: e.description ?? f.description,
      areaDescription: e.areaDescription ?? f.areaDescription,
      membershipInfo: e.membershipInfo ?? f.membershipInfo,
      memberQuotes: e.memberQuotes ?? f.memberQuotes,
      promo: e.promo ?? f.promo,
      memberNotes: e.memberNotes ?? f.memberNotes,
      registrationUrl: e.registrationUrl ?? f.registrationUrl,
      tickettailorEmbed: e.tickettailorEmbed ?? f.tickettailorEmbed,
    }));
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
      body.promo = form.promo;
      body.memberNotes = form.memberNotes;
      body.isRecurring = form.isRecurring;
      if (form.isRecurring && finalPattern) body.recurringPattern = finalPattern;
      if (form.isRecurring && form.recurringUntil) body.recurringUntil = form.recurringUntil;
      body.isGenderless = form.isGenderless;
      body.isPasswordProtected = form.isPasswordProtected;
      if (form.isPasswordProtected && form.password) body.password = form.password;
      body.isDraft = form.isDraft;
      body.photoRequirement = form.photoRequirement;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let parsed: { error?: string } = {};
        try { parsed = JSON.parse(text); } catch { /* not json */ }
        const detail = parsed.error ?? text.slice(0, 200);
        console.error("Errore salvataggio evento", { status: res.status, body, detail });
        setError(`Errore ${res.status}: ${detail || "salvataggio fallito"}`);
        setLoading(false);
        return;
      }

      onSave();
    } catch (err) {
      console.error("Errore di rete salvataggio evento", err);
      setError(`Errore di connessione: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  }

  const inputClass = "bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-[#FF006E] transition-colors placeholder-white/20 w-full";
  const labelClass = "text-[12px] tracking-[0.25em] uppercase text-white/40 mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Importa da evento esistente */}
      <ImportFromEventDropdown
        events={allEvents}
        currentEventId={eventId}
        onImport={importFromEvent}
      />

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
            <span className="text-[12px] text-white/30 font-mono truncate flex-1">{form.imageUrl}</span>
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
        <p className="text-[13px] tracking-[0.4em] uppercase text-white/20 mb-4">Sezioni fisse dell'evento</p>
      </div>

      {/* Descrizione aree (tavoli, privè…) con template */}
      <div className="flex flex-col gap-2">
        <TemplateChips storageKey="boxx_area_templates" defaults={DEFAULT_AREA_TEMPLATES}
          value={form.areaDescription} onChange={(v) => set("areaDescription", v)} />
        <PencilField
          label="Descrizione aree"
          value={form.areaDescription}
          onChange={(v) => set("areaDescription", v)}
          rows={5}
          placeholder="Info su tavoli, privè, darkroom…"
        />
      </div>

      {/* Badge statico — non modificabile */}
      <div className="flex items-center gap-3 border border-white/10 px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-[#FF006E] flex-shrink-0" />
        <div>
          <p className="text-[12px] font-bold tracking-[0.3em] uppercase text-white">Evento riservato ai soci</p>
          <p className="text-[13px] text-white/30 tracking-wider">Campo fisso — non modificabile</p>
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
      <PricingEditor
        value={form.memberQuotes}
        onChange={(v) => set("memberQuotes", v)}
      />

      {/* Evento genderless — collegato alle quote */}
      <div className="border border-[#FF006E]/20 bg-[#FF006E]/5 p-4 -mt-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("isGenderless", !form.isGenderless)}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${form.isGenderless ? "bg-[#FF006E]" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.isGenderless ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <div>
            <span className="text-sm text-white font-medium">Evento genderless</span>
            <span className="text-[12px] text-white/40 tracking-wider block">
              Nasconde le righe Coppie / Singoli / Singole dalle quote qui sopra
            </span>
          </div>
        </label>
      </div>

      {/* Promo */}
      <PencilField
        label="Promo"
        value={form.promo}
        onChange={(v) => set("promo", v)}
        rows={5}
        placeholder="Es. Promo Under 35 — se vuoto non compare sul sito"
      />

      {/* Note */}
      <PencilField
        label="Note"
        value={form.memberNotes}
        onChange={(v) => set("memberNotes", v)}
        rows={6}
        placeholder="Info VIP, disclaimer categorie, contatti prenotazioni…"
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
            <span className="text-[12px] text-white/30 tracking-wider">
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
            <div>
              <label className={labelClass}>
                Fine ricorrenza <span className="text-white/20 normal-case tracking-normal">(opzionale)</span>
              </label>
              <input
                type="date"
                className={inputClass}
                value={form.recurringUntil}
                onChange={(e) => set("recurringUntil", e.target.value)}
              />
              <p className="text-[12px] text-white/25 mt-1 tracking-wide">
                Lascia vuoto per ricorrenza senza fine. Il sito mostra comunque solo le occorrenze del mese corrente e del successivo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Link registrazione */}
      <div>
        <label className={labelClass}>Link registrazione</label>
        <input className={inputClass} value={form.registrationUrl}
          onChange={(e) => set("registrationUrl", e.target.value)} />
      </div>

      {/* Foto richiesta */}
      <div>
        <label className={labelClass}>Foto iscrizione</label>
        <select
          className={inputClass}
          value={form.photoRequirement}
          onChange={(e) => set("photoRequirement", e.target.value as "none" | "optional" | "required")}
        >
          <option value="none">Non richiesta</option>
          <option value="optional">Opzionale</option>
          <option value="required">Obbligatoria</option>
        </select>
        <p className="text-[12px] text-white/30 mt-1 tracking-wide">
          Se attiva, nel form "Mettiti in lista" comparirà un campo per caricare una foto.
        </p>
      </div>

      {/* Bozza */}
      <div className="border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("isDraft", !form.isDraft)}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${form.isDraft ? "bg-[#FF006E]" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.isDraft ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <div>
            <span className="text-sm text-white font-medium">Bozza</span>
            <span className="text-[12px] text-white/40 tracking-wider block">
              Salva l'evento senza renderlo visibile al pubblico. Visibile solo qui in admin.
            </span>
          </div>
        </label>
      </div>

      {/* Password protezione evento */}
      <div className="border border-[#FF006E]/20 bg-[#FF006E]/5 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("isPasswordProtected", !form.isPasswordProtected)}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${form.isPasswordProtected ? "bg-[#FF006E]" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.isPasswordProtected ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <div>
            <span className="text-sm text-white font-medium">Protetto da password</span>
            <span className="text-[12px] text-white/40 tracking-wider block">
              Nasconde dettagli + biglietti finché non viene inserita la password
            </span>
          </div>
        </label>
        {form.isPasswordProtected && (
          <div className="mt-4">
            <label className={labelClass}>
              Password evento
              {eventId && <span className="ml-2 text-white/30 normal-case tracking-normal">(lascia vuoto per non modificare)</span>}
            </label>
            <input
              type="text"
              className={inputClass}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={eventId ? "Nuova password (opzionale)" : "Es. boxx2026"}
              autoComplete="off"
            />
            <p className="text-[12px] text-white/30 mt-1 tracking-wide">
              I soci dovranno inserire questa password per vedere i dettagli e accedere al versamento della quota sociale.
            </p>
          </div>
        )}
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
          className={`${inputClass} resize-none font-mono text-sm`}
          rows={5}
          placeholder={`<iframe src="https://www.tickettailor.com/..." />`}
          value={form.tickettailorEmbed}
          onChange={(e) => set("tickettailorEmbed", e.target.value)}
        />
        <p className="text-[12px] text-white/25 mt-1 tracking-wide">
          Incolla qui il codice embed HTML o shortcode di Tickettailor. Verrà mostrato nella pagina evento.
        </p>
      </div>

      {error && <p className="text-[#FF006E] text-sm tracking-widest uppercase">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-[#FF006E] text-white text-sm font-bold tracking-[0.3em] uppercase py-2.5 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40">
          {loading ? "..." : eventId ? "SALVA MODIFICHE" : "CREA EVENTO"}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-bold tracking-[0.3em] uppercase py-2.5 px-6 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors">
          ANNULLA
        </button>
      </div>
    </form>
  );
}

function adminTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function AdminDashboard({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin", "events", adminKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events`, { headers: { "X-Admin-Key": adminKey } });
      if (!res.ok) throw new Error("Errore caricamento eventi");
      return (await res.json()) as Event[];
    },
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const today = adminTodayString();
  // Recurring events are "live" until their recurringUntil cap (or forever if not set)
  const upcomingEvents = events.filter((e) =>
    e.isRecurring ? (!e.recurringUntil || e.recurringUntil >= today) : e.date >= today
  );
  const pastEvents = events.filter((e) =>
    e.isRecurring ? (!!e.recurringUntil && e.recurringUntil < today) : e.date < today
  ).sort((a, b) => b.date.localeCompare(a.date));
  const visibleEvents = showArchive ? pastEvents : upcomingEvents;

  async function handleDelete(id: number) {
    if (!confirm("Eliminare questo evento?")) return;
    setDeletingId(id);
    await fetch(`${API_BASE}/events/${id}`, { method: "DELETE", headers: { "X-Admin-Key": adminKey } });
    await queryClient.invalidateQueries({ queryKey: ["admin", "events", adminKey] });
    await queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    setDeletingId(null);
  }

  async function handleSave() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "events", adminKey] });
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
      promo: e.promo ?? "",
      memberNotes: e.memberNotes ?? DEFAULT_MEMBER_NOTES,
      isRecurring: e.isRecurring ?? false,
      recurringPattern: e.recurringPattern ?? "",
      recurringUntil: e.recurringUntil ?? "",
      isGenderless: e.isGenderless ?? false,
      isPasswordProtected: e.isPasswordProtected ?? false,
      password: "",
      isDraft: e.isDraft ?? false,
      photoRequirement: (e.photoRequirement ?? "none") as "none" | "optional" | "required",
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
            <p className="text-sm font-bold tracking-[0.3em] uppercase text-white">BOXX CLUB</p>
            <p className="text-[12px] tracking-widest uppercase text-white/30">Admin Panel</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/" className="text-[12px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors">VEDI SITO</a>
          <a href="/admin/statistiche" className="text-[12px] tracking-[0.25em] uppercase text-white/30 hover:text-[#FF006E] transition-colors">STATISTICHE</a>
          <button onClick={onLogout}
            className="text-[12px] tracking-[0.25em] uppercase text-white/30 hover:text-[#FF006E] transition-colors">
            ESCI
          </button>
        </div>
      </div>

      {/* Add event button */}
      {!showForm && !editingEvent && (
        <div className="mb-10">
          <button onClick={() => setShowForm(true)}
            className="bg-[#FF006E] text-white text-sm font-bold tracking-[0.3em] uppercase py-3 px-8 hover:bg-white hover:text-black transition-colors">
            + AGGIUNGI EVENTO
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && !editingEvent && (
        <div className="mb-12 border border-white/10 p-6 md:p-8">
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-white mb-6">Nuovo Evento</h2>
          <EventForm initial={emptyForm} adminKey={adminKey} allEvents={events} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Edit form */}
      {editingEvent && (
        <div className="mb-12 border border-[#FF006E]/30 p-6 md:p-8">
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#FF006E] mb-6">
            Modifica: {editingEvent.title}
          </h2>
          <EventForm initial={toFormData(editingEvent)} adminKey={adminKey} eventId={editingEvent.id}
            allEvents={events} onSave={handleSave} onCancel={() => setEditingEvent(null)} />
        </div>
      )}

      {/* Events list */}
      <div>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="text-[12px] font-bold tracking-[0.4em] uppercase text-white/40">
            {showArchive ? `ARCHIVIO (${pastEvents.length})` : `EVENTI ATTIVI (${upcomingEvents.length})`}
          </h2>
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="text-[12px] font-bold tracking-[0.3em] uppercase py-2 px-4 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
          >
            {showArchive ? `← EVENTI ATTIVI (${upcomingEvents.length})` : `ARCHIVIO PASSATI (${pastEvents.length}) →`}
          </button>
        </div>

        {isLoading && <p className="text-white/30 text-sm tracking-widest uppercase">Caricamento...</p>}
        {!isLoading && visibleEvents.length === 0 && (
          <p className="text-white/20 text-sm">
            {showArchive ? "Nessun evento in archivio." : "Nessun evento attivo. Aggiungine uno."}
          </p>
        )}

        <div className="flex flex-col divide-y divide-white/5">
          {visibleEvents.map((event) => (
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
                    <span className="text-[12px] tracking-[0.3em] uppercase text-[#FF006E]">{event.category}</span>
                  )}
                  {event.isRecurring && (
                    <span className="inline-flex items-center gap-1 text-[13px] tracking-wider uppercase text-white/30 border border-white/10 px-1.5 py-0.5">
                      <RefreshCw className="w-2.5 h-2.5" /> Ricorrente
                    </span>
                  )}
                  {event.isDraft && (
                    <span className="text-[12px] tracking-[0.3em] uppercase text-black bg-[#FF006E] px-1.5 py-0.5 font-bold">
                      BOZZA
                    </span>
                  )}
                </div>
                <p className="font-black text-lg uppercase tracking-tight text-white leading-tight mb-1">
                  {event.title}
                </p>
                <p className="text-sm text-white/40 font-mono mb-1">{event.date} — {event.time}</p>
                {event.isRecurring && event.recurringPattern && (
                  <p className="text-[12px] text-white/25 tracking-wider mb-1">
                    {RECURRING_PATTERNS.find(p => p.value === event.recurringPattern)?.label ?? event.recurringPattern}
                  </p>
                )}
                {event.dresscode && (
                  <p className="text-[13px] text-white/30 uppercase tracking-wider">{event.dresscode}</p>
                )}
                {event.description && (
                  <p className="text-sm text-white/40 mt-1 line-clamp-2">{event.description}</p>
                )}
                {event.tickettailorEmbed && (
                  <p className="text-[12px] text-[#FF006E]/50 tracking-wider mt-1">↳ Tickettailor embed presente</p>
                )}
              </div>

              <div className="flex gap-3 items-center flex-shrink-0">
                <CopyParticipateLink eventId={event.id} />
                <ParticipationsButton eventId={event.id} adminKey={adminKey} initialPhotoRequirement={(event.photoRequirement ?? "none") as "none" | "optional" | "required"} />
                <InvitesButton eventId={event.id} adminKey={adminKey} />
                <button
                  onClick={() => {
                    setEditingEvent(event);
                    setShowForm(false);
                    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                  }}
                  className="text-[12px] tracking-[0.25em] uppercase text-white/30 hover:text-white border-b border-transparent hover:border-white/30 transition-colors pb-0.5"
                >
                  MODIFICA
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deletingId === event.id}
                  className="text-[12px] tracking-[0.25em] uppercase text-white/20 hover:text-[#FF006E] border-b border-transparent hover:border-[#FF006E]/30 transition-colors pb-0.5 disabled:opacity-30"
                >
                  {deletingId === event.id ? "..." : "ELIMINA"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner management */}
      <ProfilesSection adminKey={adminKey} />

      <EmailSection adminKey={adminKey} />

      <BannerManager adminKey={adminKey} />

      {/* Gallery management */}
      <GalleryManager adminKey={adminKey} />

      {/* Cambia chiave */}
      <ChangeKeySection adminKey={adminKey} onKeyChanged={(newKey) => { localStorage.setItem("boxx_admin_key", newKey); onLogout(); }} />
    </div>
  );
}

type AdminProfile = {
  id: number;
  nickname: string;
  age: number;
  email: string;
  telegram: string | null;
  whatsapp: string | null;
  memberType: string;
  interests: string[];
  consentEmail: boolean;
  consentMessages: boolean;
  createdAt: string;
};

const INTEREST_LABELS: Record<string, string> = {
  swinger: "Swinger",
  sexpositive: "Sexpositive",
  kinky: "Kinky",
  gangbang: "Gang bang",
};

function EmailSection({ adminKey }: { adminKey: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Compila oggetto e messaggio");
      return;
    }
    if (!window.confirm("Inviare questa email a TUTTI gli utenti iscritti?")) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/admin/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore invio");
      setResult(`Inviate ${data.sent} email su ${data.total}${data.failed ? ` (${data.failed} non riuscite)` : ""}.`);
      setSubject("");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore invio");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full bg-[#161616] border border-white/15 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF006E] transition-colors text-sm";

  return (
    <div className="mt-16">
      <h2 className="text-xl font-black tracking-[0.2em] uppercase text-white mb-2">
        EMAIL AGLI ISCRITTI
      </h2>
      <p className="text-white/40 text-sm mb-6">
        Invia promo e novità via email a tutti gli utenti registrati.
      </p>
      <div className="space-y-3 max-w-xl">
        <input
          className={inputCls}
          placeholder="Oggetto (es. Nuova serata il 30 agosto)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
        />
        <textarea
          className={`${inputCls} min-h-[140px]`}
          placeholder="Testo del messaggio…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {result && <p className="text-green-400 text-sm">{result}</p>}
        <button
          onClick={send}
          disabled={sending}
          className="bg-[#FF006E] hover:bg-[#FF1493] disabled:opacity-50 text-white font-bold px-6 py-3 rounded text-sm tracking-widest uppercase transition-colors"
        >
          {sending ? "Invio in corso…" : "INVIA A TUTTI"}
        </button>
      </div>
    </div>
  );
}

function ProfilesSection({ adminKey }: { adminKey: string }) {
  const { data: profiles = [], isLoading } = useQuery<AdminProfile[]>({
    queryKey: ["admin", "profiles", adminKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/profiles`, { headers: { "X-Admin-Key": adminKey } });
      if (!res.ok) throw new Error("Errore caricamento profili");
      return res.json();
    },
  });

  return (
    <div className="mt-16">
      <h2 className="text-xl font-black tracking-[0.2em] uppercase text-white mb-2">
        UTENTI REGISTRATI ({profiles.length})
      </h2>
      <p className="text-white/40 text-sm mb-6">
        Profili compilati dagli utenti al momento della registrazione.
      </p>
      {isLoading ? (
        <p className="text-white/40 text-sm">Caricamento…</p>
      ) : profiles.length === 0 ? (
        <p className="text-white/40 text-sm">Nessun utente registrato per ora.</p>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase text-[11px] tracking-[0.15em]">
                <th className="px-4 py-3">Nickname</th>
                <th className="px-4 py-3">Età</th>
                <th className="px-4 py-3">Mail</th>
                <th className="px-4 py-3">Contatto</th>
                <th className="px-4 py-3">Tipologia</th>
                <th className="px-4 py-3">Interessi</th>
                <th className="px-4 py-3">Autorizzazioni</th>
                <th className="px-4 py-3">Registrato</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-white/5 text-white/80">
                  <td className="px-4 py-3 font-bold">{p.nickname}</td>
                  <td className="px-4 py-3">{p.age}</td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3">
                    {p.telegram && (
                      <div>
                        <span className="text-white/40 uppercase text-[11px] mr-1.5">TG</span>
                        {p.telegram}
                      </div>
                    )}
                    {p.whatsapp && (
                      <div>
                        <span className="text-white/40 uppercase text-[11px] mr-1.5">WA</span>
                        {p.whatsapp}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{p.memberType}</td>
                  <td className="px-4 py-3">
                    {p.interests.length > 0
                      ? p.interests.map((i) => INTEREST_LABELS[i] ?? i).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[11px] uppercase">
                    <span className={p.consentEmail ? "text-green-400" : "text-white/30"}>
                      Email {p.consentEmail ? "✓" : "✗"}
                    </span>
                    <span className="mx-1 text-white/20">·</span>
                    <span className={p.consentMessages ? "text-green-400" : "text-white/30"}>
                      Msg {p.consentMessages ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40">
                    {new Date(p.createdAt).toLocaleDateString("it-IT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BannerManager({ adminKey }: { adminKey: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useListBanners();
  const banners = data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: getListBannersQueryKey() });
  }

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const urlRes = await fetch(`${API_BASE}/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        });
        if (!urlRes.ok) { setError("Errore richiesta URL upload"); continue; }
        const { uploadURL, objectPath } = await urlRes.json();
        const putRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) { setError("Errore upload"); continue; }
        const createRes = await fetch(`${API_BASE}/banners`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
          body: JSON.stringify({ imageUrl: objectPath }),
        });
        if (!createRes.ok) { setError("Errore salvataggio"); continue; }
      }
      await refresh();
    } catch { setError("Errore di connessione"); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(id: number) {
    if (!confirm("Rimuovere questa comunicazione dalla home?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/banners/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      await refresh();
    } catch { /* ignore */ }
    setDeletingId(null);
  }

  return (
    <div className="mt-16 border-t border-white/10 pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[12px] font-bold tracking-[0.4em] uppercase text-white/40">
          COMUNICAZIONI HOME ({banners.length})
        </h2>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-[#FF006E] text-white text-[12px] font-bold tracking-[0.3em] uppercase py-2 px-5 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
        >
          {uploading ? "Caricamento..." : "+ AGGIUNGI IMMAGINE"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
        />
      </div>
      <p className="text-[12px] text-white/30 mb-4 tracking-wider">
        Le immagini compaiono in home tra la scritta di apertura e il calendario (calendario orari, note del direttivo, avvisi). Con più di 2 immagini scorrono in automatico.
      </p>
      {error && <p className="text-[#FF006E] text-[12px] tracking-widest uppercase mb-3">{error}</p>}
      {isLoading && <p className="text-white/30 text-sm tracking-widest uppercase">Caricamento...</p>}
      {!isLoading && banners.length === 0 && (
        <p className="text-white/20 text-sm">Nessuna comunicazione. Aggiungi un'immagine.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {banners.map((b) => (
          <div key={b.id} className="relative group overflow-hidden border border-white/10 bg-white/5">
            <img src={getImageSrc(b.imageUrl)} alt={b.caption ?? ""} className="w-full h-auto object-contain max-h-56" />
            <button
              onClick={() => handleDelete(b.id)}
              disabled={deletingId === b.id}
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#FF006E] text-[12px] font-bold tracking-[0.3em] uppercase"
            >
              {deletingId === b.id ? "..." : "ELIMINA"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryManager({ adminKey }: { adminKey: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useListGalleryPhotos();
  const photos = data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: getListGalleryPhotosQueryKey() });
  }

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const urlRes = await fetch(`${API_BASE}/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        });
        if (!urlRes.ok) { setError("Errore richiesta URL upload"); continue; }
        const { uploadURL, objectPath } = await urlRes.json();
        const putRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) { setError("Errore upload"); continue; }
        const createRes = await fetch(`${API_BASE}/gallery`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
          body: JSON.stringify({ imageUrl: objectPath }),
        });
        if (!createRes.ok) { setError("Errore salvataggio"); continue; }
      }
      await refresh();
    } catch { setError("Errore di connessione"); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminare questa foto dalla gallery?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/gallery/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      await refresh();
    } catch { /* ignore */ }
    setDeletingId(null);
  }

  return (
    <div className="mt-16 border-t border-white/10 pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[12px] font-bold tracking-[0.4em] uppercase text-white/40">
          GALLERY ({photos.length})
        </h2>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-[#FF006E] text-white text-[12px] font-bold tracking-[0.3em] uppercase py-2 px-5 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
        >
          {uploading ? "Caricamento..." : "+ AGGIUNGI FOTO"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
        />
      </div>
      <p className="text-[12px] text-white/30 mb-4 tracking-wider">
        Le foto vengono mostrate nella pagina /gallery e fanno da sfondo rotante in tutto il sito (cambia ogni 30 sec).
      </p>
      {error && <p className="text-[#FF006E] text-[12px] tracking-widest uppercase mb-3">{error}</p>}
      {isLoading && <p className="text-white/30 text-sm tracking-widest uppercase">Caricamento...</p>}
      {!isLoading && photos.length === 0 && (
        <p className="text-white/20 text-sm">Nessuna foto. Aggiungine una.</p>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {photos.map((p) => (
          <div key={p.id} className="relative group aspect-square overflow-hidden border border-white/10 bg-white/5">
            <img src={getImageSrc(p.imageUrl)} alt={p.caption ?? ""} className="w-full h-full object-cover" />
            <button
              onClick={() => handleDelete(p.id)}
              disabled={deletingId === p.id}
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#FF006E] text-[12px] font-bold tracking-[0.3em] uppercase"
            >
              {deletingId === p.id ? "..." : "ELIMINA"}
            </button>
          </div>
        ))}
      </div>
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
        className="text-[12px] tracking-[0.3em] uppercase text-white/20 hover:text-white/50 transition-colors">
        {open ? "— Nascondi" : "⚙ Cambia chiave di accesso"}
      </button>
      {open && (
        <div className="mt-6 max-w-sm">
          {success ? (
            <p className="text-[#FF006E] text-sm font-bold tracking-wider uppercase">Chiave aggiornata — ri-login in corso…</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] tracking-[0.25em] uppercase text-white/40 block mb-1">Chiave attuale</label>
                <input type="password" className={inputClass} value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)} required placeholder="Chiave attuale" />
              </div>
              <div>
                <label className="text-[12px] tracking-[0.25em] uppercase text-white/40 block mb-1">Nuova chiave</label>
                <input type="password" className={inputClass} value={newKey}
                  onChange={(e) => setNewKey(e.target.value)} required minLength={8} placeholder="Min. 8 caratteri" />
              </div>
              <div>
                <label className="text-[12px] tracking-[0.25em] uppercase text-white/40 block mb-1">Conferma nuova chiave</label>
                <input type="password" className={inputClass} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} required placeholder="Ripeti la nuova chiave" />
              </div>
              {error && <p className="text-[#FF006E] text-[12px] tracking-widest uppercase">{error}</p>}
              <button type="submit" disabled={loading || !currentKey || !newKey || !confirm}
                className="bg-white/10 text-white text-sm font-bold tracking-[0.3em] uppercase py-2.5 px-6 hover:bg-[#FF006E] transition-colors disabled:opacity-30 self-start">
                {loading ? "..." : "AGGIORNA CHIAVE"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

interface ParticipationEntry { id: number; name: string; contact: string; photoUrl?: string | null; inviteType?: string | null; createdAt: string }

function CopyParticipateLink({ eventId }: { eventId: number }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const url = `${window.location.origin}/eventi/${eventId}?partecipa=1`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      window.prompt("Copia il link:", url);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copia il link al modulo di partecipazione"
      className="text-[12px] tracking-[0.25em] uppercase text-white/30 hover:text-[#FF006E] border-b border-transparent hover:border-[#FF006E]/30 transition-colors pb-0.5"
    >
      {copied ? "COPIATO ✓" : "LINK PARTECIPA"}
    </button>
  );
}

type AdminInvite = {
  id: number;
  token: string;
  inviteType: string;
  note: string | null;
  uses: number;
  createdAt: string;
};

function InvitesButton({ eventId, adminKey }: { eventId: number; adminKey: string }) {
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<AdminInvite[] | null>(null);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = async () => {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}/invites`, { headers: { "X-Admin-Key": adminKey } });
    if (res.ok) setInvites(await res.json());
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && invites === null) await load();
  };

  const create = async (inviteType: "ospite" | "regolare") => {
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ inviteType, ...(note.trim() ? { note: note.trim() } : {}) }),
      });
      if (res.ok) {
        setNote("");
        await load();
      }
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Disattivare questo link di invito? Le iscrizioni già fatte restano.")) return;
    await fetch(`${API_BASE}/admin/invites/${id}`, { method: "DELETE", headers: { "X-Admin-Key": adminKey } });
    await load();
  };

  const copy = async (inv: AdminInvite) => {
    const url = `${window.location.origin}/eventi/${eventId}?invito=${inv.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={toggle}
        className="text-[11px] tracking-[0.2em] uppercase text-white/50 hover:text-[#FF006E] border border-white/15 px-3 py-1.5 transition-colors"
      >
        INVITI
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 bg-[#111] border border-white/15 p-4 shadow-xl text-left">
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/40 mb-3">Link di invito</p>
          <input
            className="w-full bg-[#1a1a1a] border border-white/15 rounded px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF006E] mb-2"
            placeholder="Nota (es. amici di Marco) — opzionale"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => create("ospite")}
              disabled={creating}
              className="flex-1 bg-[#FF006E] hover:bg-[#FF1493] disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-widest py-2 rounded"
            >
              + Ospite
            </button>
            <button
              onClick={() => create("regolare")}
              disabled={creating}
              className="flex-1 border border-[#FF006E] text-[#FF006E] hover:bg-[#FF006E]/10 disabled:opacity-50 text-[11px] font-bold uppercase tracking-widest py-2 rounded"
            >
              + Regolare
            </button>
          </div>
          {invites === null ? (
            <p className="text-white/30 text-xs">Caricamento…</p>
          ) : invites.length === 0 ? (
            <p className="text-white/30 text-xs">Nessun invito creato.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {invites.map((inv) => (
                <div key={inv.id} className="border border-white/10 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={inv.inviteType === "ospite" ? "text-green-400 uppercase font-bold" : "text-[#FF1493] uppercase font-bold"}>
                      {inv.inviteType}
                    </span>
                    <span className="text-white/40">{inv.uses} iscritti</span>
                  </div>
                  {inv.note && <p className="text-white/50 mt-1">{inv.note}</p>}
                  <div className="flex gap-3 mt-1.5">
                    <button onClick={() => copy(inv)} className="text-white/60 hover:text-white uppercase tracking-widest text-[10px]">
                      {copiedId === inv.id ? "Copiato ✓" : "Copia link"}
                    </button>
                    <button onClick={() => remove(inv.id)} className="text-red-400/70 hover:text-red-400 uppercase tracking-widest text-[10px]">
                      Disattiva
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParticipationsButton({ eventId, adminKey, initialPhotoRequirement }: { eventId: number; adminKey: string; initialPhotoRequirement: "none" | "optional" | "required" }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ParticipationEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoReq, setPhotoReq] = useState<"none" | "optional" | "required">(initialPhotoRequirement);
  const [savingReq, setSavingReq] = useState(false);
  const [reqMsg, setReqMsg] = useState("");

  async function load() {
    if (list !== null) { setOpen(!open); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/participations`, {
        headers: { "X-Admin-Key": adminKey },
      });
      if (res.ok) setList(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
    setOpen(true);
  }

  async function updatePhotoReq(value: "none" | "optional" | "required") {
    const prev = photoReq;
    setPhotoReq(value);
    setSavingReq(true);
    setReqMsg("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ photoRequirement: value }),
      });
      if (!res.ok) { setPhotoReq(prev); setReqMsg("Errore"); }
      else { setReqMsg("Salvato"); setTimeout(() => setReqMsg(""), 1500); }
    } catch { setPhotoReq(prev); setReqMsg("Errore"); }
    setSavingReq(false);
  }

  return (
    <div className="relative">
      <button onClick={load}
        className="text-[12px] tracking-[0.25em] uppercase text-white/30 hover:text-white border-b border-transparent hover:border-white/30 transition-colors pb-0.5">
        {loading ? "..." : `ISCRITTI${list ? ` (${list.length})` : ""}`}
      </button>
      {open && list !== null && (
        <div className="absolute right-0 top-6 z-50 bg-black border border-white/20 p-4 w-80 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold tracking-[0.3em] uppercase text-[#FF006E]">Lista iscritti</p>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white text-sm">✕</button>
          </div>

          {/* Quick toggle: foto richiesta */}
          <div className="mb-3 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] tracking-[0.25em] uppercase text-white/40">Foto iscrizione</label>
              {reqMsg && <span className="text-[10px] tracking-widest uppercase text-white/40">{reqMsg}</span>}
            </div>
            <select
              value={photoReq}
              disabled={savingReq}
              onChange={(e) => updatePhotoReq(e.target.value as "none" | "optional" | "required")}
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-[#FF006E] transition-colors disabled:opacity-50"
            >
              <option value="none">Non richiesta</option>
              <option value="optional">Opzionale</option>
              <option value="required">Obbligatoria</option>
            </select>
          </div>

          {list.length === 0 ? (
            <p className="text-white/30 text-sm">Nessuna iscrizione</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {list.map((p) => (
                <div key={p.id} className="border-b border-white/5 pb-2 flex gap-2">
                  {p.photoUrl && (
                    <a href={getImageSrc(p.photoUrl)} target="_blank" rel="noreferrer" className="flex-shrink-0">
                      <img src={getImageSrc(p.photoUrl)} alt={p.name}
                        className="w-12 h-12 object-cover border border-white/10 hover:border-[#FF006E] transition-colors" />
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      {p.name}
                      {p.inviteType && (
                        <span className={`ml-2 text-[10px] uppercase tracking-widest ${p.inviteType === "ospite" ? "text-green-400" : "text-[#FF1493]"}`}>
                          {p.inviteType}
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-white/40 font-mono truncate">{p.contact}</p>
                    <p className="text-[13px] text-white/20">{new Date(p.createdAt).toLocaleString("it-IT")}</p>
                  </div>
                </div>
              ))}
            </div>
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
  // Se l'utente è loggato con un account admin (es. email nella lista admin),
  // entra senza chiave: il server accetta il cookie di sessione.
  const [clerkAdmin, setClerkAdmin] = useState<boolean | null>(null);
  const { signOut } = useClerk();

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/admin/whoami`)
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d: { isAdmin?: boolean }) => alive && setClerkAdmin(!!d.isAdmin))
      .catch(() => alive && setClerkAdmin(false));
    return () => { alive = false; };
  }, []);

  function handleLogin(key: string) {
    localStorage.setItem("boxx_admin_key", key);
    setAdminKey(key);
  }

  function handleLogout() {
    localStorage.removeItem("boxx_admin_key");
    setAdminKey(null);
    setClerkAdmin(false);
    // Esce anche dall'account Clerk, altrimenti si resta loggati sul sito
    void signOut({ redirectUrl: import.meta.env.BASE_URL });
  }

  if (adminKey) return <AdminDashboard adminKey={adminKey} onLogout={handleLogout} />;
  if (clerkAdmin === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm tracking-widest uppercase">Caricamento…</p>
      </div>
    );
  }
  if (clerkAdmin) return <AdminDashboard adminKey="" onLogout={handleLogout} />;
  return <AdminLogin onLogin={handleLogin} />;
}
