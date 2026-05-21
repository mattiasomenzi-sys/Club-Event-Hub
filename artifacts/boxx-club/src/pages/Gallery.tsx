import { useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { useListGalleryPhotos } from "@workspace/api-client-react";
import boxxLogo from "@assets/boxx-logo.jpeg";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";
import RotatingBackground from "@/components/RotatingBackground";

function resolveSrc(imageUrl: string): string {
  if (imageUrl.startsWith("/objects/")) return `/api/storage${imageUrl}`;
  return imageUrl;
}

export default function Gallery() {
  const { data, isLoading } = useListGalleryPhotos();
  const photos = data ?? [];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div
      className="bg-black min-h-screen text-white"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <RotatingBackground
        fallback={clubPhoto}
        filter="saturate(1.2) hue-rotate(40deg) brightness(0.3)"
      />
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/70 backdrop-blur-sm">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <img src={boxxLogo} alt="Boxx Club" className="w-8 h-8 object-cover border border-white/10" />
            <span className="text-sm font-bold tracking-[0.3em] uppercase text-white/60 group-hover:text-white transition-colors">
              ← Torna agli eventi
            </span>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <p className="text-[12px] font-bold tracking-[0.5em] uppercase text-[#FF006E] mb-4">
          Gallery
        </p>
        <h1
          className="uppercase text-3xl md:text-5xl font-black tracking-tight mb-2"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Atmosfere
        </h1>
        <p className="text-sm md:text-base text-white/50 mb-12 max-w-2xl">
          Frammenti di serate e dettagli del club.
        </p>

        {isLoading && (
          <p className="text-white/30 text-sm tracking-widest uppercase">Caricamento…</p>
        )}

        {!isLoading && photos.length === 0 && (
          <p className="text-white/30 text-sm tracking-widest uppercase">
            Nessuna foto ancora pubblicata.
          </p>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {photos.map((p, i) => {
              const src = resolveSrc(p.imageUrl);
              return (
                <button
                  key={p.id}
                  onClick={() => setLightbox(i)}
                  className="group relative aspect-square overflow-hidden bg-white/5"
                >
                  <img
                    src={src}
                    alt={p.caption ?? "Boxx Club"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightbox(null)}
            aria-label="Chiudi"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={resolveSrc(photos[lightbox].imageUrl)}
            alt={photos[lightbox].caption ?? "Boxx Club"}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos[lightbox].caption && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm tracking-widest uppercase px-6">
              {photos[lightbox].caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
