import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyProfile,
  useUpsertMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";

const TIPOLOGIE = [
  { value: "singolo", label: "Singolo" },
  { value: "coppia", label: "Coppia" },
  { value: "singola", label: "Singola" },
  { value: "trav", label: "Trav" },
] as const;

const INTERESSI = [
  { value: "swinger", label: "Serate swinger" },
  { value: "sexpositive", label: "Serate sexpositive" },
  { value: "gangbang", label: "Gang bang" },
  { value: "kinky", label: "Serate kinky" },
] as const;

export default function Profilo() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const profileQuery = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey(), enabled: isLoaded && !!isSignedIn, retry: false },
  });
  const upsert = useUpsertMyProfile();

  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [memberType, setMemberType] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [consentEmail, setConsentEmail] = useState<boolean | null>(null);
  const [consentMessages, setConsentMessages] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) setLocation("/sign-in");
  }, [isLoaded, isSignedIn, setLocation]);

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setNickname(p.nickname);
      setAge(String(p.age));
      setEmail(p.email);
      setTelegram(p.telegram ?? "");
      setWhatsapp(p.whatsapp ?? "");
      setMemberType(p.memberType);
      setInterests(p.interests);
      setPhotoUrl(p.photoUrl ?? null);
      setConsentEmail(p.consentEmail);
      setConsentMessages(p.consentMessages);
    } else if (user?.primaryEmailAddress?.emailAddress && !email) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data, user?.id]);

  if (!isLoaded || !isSignedIn) return null;

  const toggleInterest = (v: string) =>
    setInterests((prev) => (prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const ageNum = parseInt(age, 10);
    if (!nickname.trim()) return setError("Inserisci un nickname");
    if (!Number.isInteger(ageNum) || ageNum < 18) return setError("Devi avere almeno 18 anni");
    if (!email.trim() || !email.includes("@")) return setError("Inserisci una mail valida");
    if (!telegram.trim() && !whatsapp.trim())
      return setError("Inserisci almeno un contatto: Telegram o WhatsApp");
    if (!memberType) return setError("Seleziona la tipologia");
    if (consentEmail === null) return setError("Indica se autorizzi le email");
    if (consentMessages === null) return setError("Indica se autorizzi i messaggi Telegram/WhatsApp");
    if (!consentEmail && !consentMessages)
      return setError("Devi autorizzare almeno un canale: email oppure Telegram/WhatsApp");

    try {
      let newPhotoUrl = photoUrl;
      if (photoFile) {
        const urlRes = await fetch(`/api/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: photoFile.name, size: photoFile.size, contentType: photoFile.type }),
        });
        if (!urlRes.ok) return setError("Errore caricamento foto");
        const { uploadURL, objectPath } = await urlRes.json();
        const putRes = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": photoFile.type }, body: photoFile });
        if (!putRes.ok) return setError("Errore caricamento foto");
        newPhotoUrl = objectPath;
      }
      await upsert.mutateAsync({
        data: {
          nickname: nickname.trim(),
          age: ageNum,
          email: email.trim(),
          ...(telegram.trim() ? { telegram: telegram.trim() } : {}),
          ...(whatsapp.trim() ? { whatsapp: whatsapp.trim() } : {}),
          memberType: memberType as "singolo" | "coppia" | "singola" | "trav",
          interests: interests as ("swinger" | "sexpositive" | "kinky" | "gangbang")[],
          consentEmail,
          consentMessages,
          ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      setSaved(true);
      // Mostra brevemente la conferma, poi torna alla home
      setTimeout(() => setLocation("/"), 900);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: unknown }).error)
          : "Errore durante il salvataggio";
      setError(msg);
    }
  };

  const inputCls =
    "w-full bg-[#161616] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF006E] transition-colors";

  return (
    <div className="min-h-screen bg-black text-white font-['Space_Grotesk'] px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
            className="text-sm text-gray-400 hover:text-[#FF006E]"
          >
            Esci
          </button>
        </div>

        <h1 className="text-3xl font-extrabold mb-2">
          IL TUO <span className="text-[#FF006E]">PROFILO</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Completa il profilo per accedere a Partecipa e Pre-tesseramento.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Nickname *</label>
            <input className={inputCls} value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Età *</label>
            <input className={inputCls} type="number" min={18} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Mail *</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Contatti — almeno uno tra Telegram e WhatsApp *
            </label>
            <div className="space-y-2">
              <input
                className={inputCls}
                placeholder="Telegram: @iltuousername"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                maxLength={80}
              />
              <input
                className={inputCls}
                placeholder="WhatsApp: +39 …"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Tipologia *</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOLOGIE.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setMemberType(t.value)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold border transition-colors ${
                    memberType === t.value
                      ? "bg-[#FF006E] border-[#FF006E] text-white"
                      : "border-white/20 text-gray-300 hover:border-white/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Interessatə a</label>
            <div className="space-y-2">
              {INTERESSI.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => toggleInterest(i.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold border transition-colors ${
                    interests.includes(i.value)
                      ? "bg-[#FF006E]/20 border-[#FF006E] text-white"
                      : "border-white/20 text-gray-300 hover:border-white/40"
                  }`}
                >
                  <span className="mr-2">{interests.includes(i.value) ? "✓" : "○"}</span>
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Foto profilo <span className="text-gray-500">(usata per gli eventi che la richiedono)</span>
            </label>
            {photoUrl && !photoFile && (
              <div className="flex items-center gap-3 mb-2">
                <img src={photoUrl.startsWith("/objects/") ? `/api/storage${photoUrl}` : photoUrl} alt="Foto profilo" className="w-14 h-14 rounded object-cover border border-white/15" />
                <span className="text-xs text-gray-400">Foto attuale — caricane una nuova per sostituirla</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="text-gray-300 text-sm w-full file:mr-3 file:py-2 file:px-3 file:border-0 file:rounded file:bg-white/10 file:text-white file:text-xs file:uppercase file:cursor-pointer hover:file:bg-[#FF006E]/80 transition-colors"
            />
            {photoFile && <p className="text-xs text-gray-400 mt-1 truncate">{photoFile.name}</p>}
          </div>

          <div className="space-y-4 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-gray-300 font-semibold">Autorizzazioni *</p>
            {[
              {
                label: "Vuoi ricevere promo e info via email?",
                value: consentEmail,
                set: setConsentEmail,
              },
              {
                label: "Possiamo scriverti su Telegram o WhatsApp?",
                value: consentMessages,
                set: setConsentMessages,
              },
            ].map((c) => (
              <div key={c.label}>
                <p className="text-sm text-gray-400 mb-1.5">{c.label}</p>
                <div className="flex gap-2">
                  {[
                    { v: true, label: "Sì, autorizzo" },
                    { v: false, label: "No" },
                  ].map((opt) => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => c.set(opt.v)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        c.value === opt.v
                          ? "bg-[#FF006E] border-[#FF006E] text-white"
                          : "border-white/20 text-gray-300 hover:border-white/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-gray-500">
              Almeno un canale deve essere autorizzato (email oppure Telegram/WhatsApp). Puoi cambiare idea in qualsiasi momento da questa pagina.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {saved && <p className="text-green-400 text-sm">Profilo salvato ✓</p>}

          <button
            type="submit"
            disabled={upsert.isPending}
            className="w-full bg-[#FF006E] hover:bg-[#FF1493] disabled:opacity-50 text-white font-bold py-3.5 rounded-lg transition-colors"
          >
            {upsert.isPending ? "Salvataggio…" : "SALVA PROFILO"}
          </button>
        </form>
      </div>
    </div>
  );
}
