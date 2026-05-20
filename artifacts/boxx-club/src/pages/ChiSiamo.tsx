import { Link } from "wouter";
import boxxLogo from "@assets/boxx-logo.jpeg";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";

export default function ChiSiamo() {
  return (
    <div
      className="bg-black min-h-screen text-white"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Fixed background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${clubPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.2) hue-rotate(40deg) brightness(0.35)",
        }}
      />
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/70 backdrop-blur-sm">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <img src={boxxLogo} alt="Boxx Club" className="w-8 h-8 object-cover border border-white/10" />
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-white/60 group-hover:text-white transition-colors">
              ← Torna agli eventi
            </span>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-24 px-6 md:px-16 lg:px-24 max-w-3xl mx-auto">

        {/* Label */}
        <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#FF006E] mb-8">
          Chi siamo
        </p>

        {/* Manifesto */}
        <div className="mb-16">
          <p className="text-2xl md:text-3xl lg:text-4xl font-black uppercase leading-tight tracking-tight text-white mb-6">
            Ci siamo chiesti come dovesse essere uno spazio libero, oggi.
          </p>
          <div className="space-y-4 text-base md:text-lg text-white/60 font-light leading-relaxed border-l-2 border-[#FF006E] pl-6">
            <p>Niente velluti. Niente finzioni.</p>
            <p>Musica forte, energia reale, persone vere.</p>
            <p>Nessun clima formale e nessun ruolo da interpretare.</p>
            <p>Lasciate perdere giacche, etichette e giudizi.</p>
            <p className="text-white font-medium">Siate liberi di essere voi stessi.</p>
          </div>
        </div>

        {/* About */}
        <div className="mb-16 space-y-4 text-base text-white/50 leading-relaxed">
          <p>
            Boxx Club è un club privè sul Lago di Garda con un'identità contemporanea e accesso riservato ai soci.
          </p>
          <p>
            Un ambiente pensato per coppie e singoli, facilmente raggiungibile da Desenzano, Sirmione, Brescia e Verona e dalle principali località del Lago di Garda.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-12" />

        {/* Contacts + Address in two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <div>
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-4">Contatti</p>
            <div className="space-y-2">
              <a
                href="tel:+393758001920"
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                +39 375 800 1920
              </a>
              <a
                href="mailto:info@xpositive.it"
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                info@xpositive.it
              </a>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#FF006E] mb-4">Indirizzo</p>
            <div className="space-y-1">
              <p className="text-sm text-white/60">Via Molini 69</p>
              <p className="text-sm text-white/60">Lonato del Garda 25017</p>
              <p className="text-sm text-white/60">Scala A</p>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 leading-relaxed">
            Xpositive APS — C.F. 94025390173 — xpositive@pec.it
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <a
            href="https://registrosociasx.it/registrazione?Locale=XP1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-[#FF006E] text-white text-sm font-black tracking-[0.35em] uppercase py-4 px-8 hover:bg-white hover:text-black transition-colors duration-200"
          >
            PRE-TESSERAMENTO →
          </a>
        </div>
      </div>
    </div>
  );
}
