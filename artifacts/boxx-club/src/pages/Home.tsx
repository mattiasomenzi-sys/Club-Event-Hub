import React, { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Instagram } from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";

import { Button } from "@/components/ui/button";

import boxxLogo from "@assets/boxx-logo.jpeg";
import gallery1 from "@/assets/gallery-1.png";
import gallery2 from "@/assets/gallery-2.png";
import gallery3 from "@/assets/gallery-3.png";
import gallery4 from "@/assets/gallery-4.png";

const EVENTS = [
  {
    id: 1,
    date: "14/10/2023",
    title: "NEON NIGHTS",
    description: "La nostra serata signature. Luci basse, musica forte, dress code rigoroso. Nessun compromesso.",
  },
  {
    id: 2,
    date: "28/10/2023",
    title: "INDUSTRIAL FETISH",
    description: "L'acciaio incontra la pelle. Una notte dedicata a chi non ha paura di osare.",
  },
  {
    id: 3,
    date: "11/11/2023",
    title: "BLACKOUT",
    description: "Buio totale. Solo suoni, tocchi e istinto. L'esperienza sensoriale definitiva.",
  }
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  useEffect(() => {
    // Add dark mode class to document
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="bg-black min-h-screen text-white overflow-hidden selection:bg-primary selection:text-white">
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-50 mix-blend-overlay" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}>
      </div>

      {/* Hero Section */}
      <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        <motion.div 
          style={{ y }}
          className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/80 to-black pointer-events-none"
        />
        
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
          <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full bg-primary/20 blur-[120px] mix-blend-screen" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center px-6 text-center max-w-4xl"
        >
          <img 
            src={boxxLogo} 
            alt="Boxx Club" 
            className="w-48 h-48 md:w-64 md:h-64 object-cover border border-primary/30 shadow-[0_0_40px_rgba(255,0,110,0.3)] mb-12"
          />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold uppercase tracking-tighter mb-6 text-white drop-shadow-[0_0_15px_rgba(255,0,110,0.5)]">
            Niente velluti.<br className="hidden md:block"/> Niente boudoir.
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl font-light tracking-wide mb-10">
            Uno spazio industrial per una comunità sexpositive.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <a href="https://www.boxxclub.it/pretesseramento" target="_blank" rel="noopener noreferrer">
              <Button className="h-14 px-8 text-lg font-bold uppercase tracking-widest border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,0,110,0.2)] hover:shadow-[0_0_30px_rgba(255,0,110,0.5)]">
                Richiedi Accesso
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Events Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-zinc-950 relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 uppercase flex items-center gap-4">
              <span className="w-12 h-1 bg-primary inline-block" /> Prossimi Eventi
            </h2>
            <p className="text-zinc-500 text-lg">L'ingresso è riservato esclusivamente ai tesserati.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {EVENTS.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group border border-zinc-800 bg-black p-8 hover:border-primary/50 transition-colors duration-500"
              >
                <div className="text-primary font-mono text-sm mb-4 tracking-widest">{event.date}</div>
                <h3 className="text-2xl font-display font-bold mb-4 uppercase">{event.title}</h3>
                <p className="text-zinc-400 mb-8 font-light leading-relaxed">{event.description}</p>
                <Button variant="link" className="text-white hover:text-primary p-0 h-auto font-medium tracking-wider uppercase group-hover:gap-4 transition-all duration-300">
                  Scopri di più <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-right flex flex-col items-end"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 uppercase flex items-center gap-4 justify-end">
              Gli Interni <span className="w-12 h-1 bg-primary inline-block" />
            </h2>
            <p className="text-zinc-500 text-lg max-w-md">Cemento crudo, acciaio, neon. Nessuna distrazione, solo l'essenziale.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="col-span-1 md:col-span-2 aspect-[21/9] overflow-hidden"
            >
              <img src={gallery1} alt="Club Interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 grayscale hover:grayscale-0" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="aspect-square overflow-hidden"
            >
              <img src={gallery4} alt="Club Corridor" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 grayscale hover:grayscale-0" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="aspect-square overflow-hidden"
            >
              <img src={gallery2} alt="Club Atmosphere" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 grayscale hover:grayscale-0" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative bg-zinc-950 flex items-center justify-center border-t border-b border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,110,0.1)_0%,rgba(0,0,0,1)_70%)]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center max-w-3xl"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold uppercase mb-8 text-white">
            Unisciti alla Community
          </h2>
          <p className="text-xl text-zinc-400 mb-12 font-light leading-relaxed">
            Boxx Club è un circolo privato. L'ingresso è rigorosamente su selezione e richiede il tesseramento anticipato. Non si accettano tesseramenti all'ingresso.
          </p>
          <a href="https://www.boxxclub.it/pretesseramento" target="_blank" rel="noopener noreferrer">
            <Button className="h-16 px-12 text-xl font-bold uppercase tracking-widest bg-primary text-white hover:bg-white hover:text-black transition-colors duration-300">
              Pre-Tesseramento
            </Button>
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 px-6 md:px-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <img src={boxxLogo} alt="Boxx Club" className="w-12 h-12 border border-zinc-800" />
            <div className="text-zinc-500 text-sm">
              <p className="font-bold text-white uppercase tracking-wider mb-1">BOXX CLUB</p>
              <p>Lago di Garda, Italia</p>
            </div>
          </div>

          <div className="flex gap-6">
            <a href="#" className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary transition-colors">
              <FaTelegramPlane className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-900 text-center md:text-left text-zinc-600 text-sm flex flex-col md:flex-row justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Boxx Club. Tutti i diritti riservati.</p>
          <div className="flex gap-6 justify-center">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Regolamento</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
