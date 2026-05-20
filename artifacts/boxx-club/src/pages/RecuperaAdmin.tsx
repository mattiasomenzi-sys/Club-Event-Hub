import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import boxxLogo from "@assets/boxx-logo.jpeg";

export default function RecuperaAdmin() {
  const [, navigate] = useLocation();
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newKey !== confirm) { setError("Le due chiavi non coincidono."); return; }
    if (newKey.length < 8) { setError("La chiave deve essere almeno 8 caratteri."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recover-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryKey, newKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Errore."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch { setError("Errore di connessione."); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-4 mb-10">
          <img src={boxxLogo} alt="Boxx" className="w-10 h-10 border border-white/10 object-cover" />
          <span className="text-xs tracking-[0.35em] uppercase text-white/40">Recupero accesso</span>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-[#FF006E] font-black text-xl uppercase tracking-tighter mb-2">Chiave aggiornata</p>
            <p className="text-white/40 text-sm">Reindirizzamento al login…</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">Recupera accesso</h1>
            <p className="text-xs text-white/30 leading-relaxed mb-8">
              Inserisci il <strong className="text-white/50">codice di recupero</strong> (visibile nelle impostazioni Replit → Secrets → RECOVERY_KEY) e scegli una nuova chiave admin.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/40 block mb-1">Codice di recupero</label>
                <input
                  type="password"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  required
                  className="bg-white/5 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-[#FF006E] transition-colors placeholder-white/20"
                  placeholder="Codice di recupero"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/40 block mb-1">Nuova chiave admin</label>
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                  minLength={8}
                  className="bg-white/5 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-[#FF006E] transition-colors placeholder-white/20"
                  placeholder="Min. 8 caratteri"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/40 block mb-1">Conferma nuova chiave</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="bg-white/5 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-[#FF006E] transition-colors placeholder-white/20"
                  placeholder="Ripeti la nuova chiave"
                />
              </div>
              {error && <p className="text-[#FF006E] text-xs tracking-widest uppercase">{error}</p>}
              <button type="submit" disabled={loading || !recoveryKey || !newKey || !confirm}
                className="bg-[#FF006E] text-white text-xs font-bold tracking-[0.3em] uppercase py-3 px-6 hover:bg-white hover:text-black transition-colors disabled:opacity-40">
                {loading ? "..." : "IMPOSTA NUOVA CHIAVE"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <Link href="/admin" className="text-[10px] tracking-[0.25em] uppercase text-white/25 hover:text-white transition-colors">
                ← Torna al login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
