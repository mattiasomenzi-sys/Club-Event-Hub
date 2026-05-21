import { useEffect, useState } from "react";
import { useListGalleryPhotos } from "@workspace/api-client-react";

function resolveSrc(imageUrl: string): string {
  if (imageUrl.startsWith("/objects/")) return `/api/storage${imageUrl}`;
  return imageUrl;
}

const ROTATE_MS = 30_000;

export function useGalleryBackground(fallback: string): {
  current: string;
  next: string | null;
  fading: boolean;
} {
  const { data } = useListGalleryPhotos();
  const photos = (data ?? []).map((p) => resolveSrc(p.imageUrl));

  const [index, setIndex] = useState<number>(() => Math.floor(Math.random() * 1000));
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (photos.length < 2) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => i + 1);
        setFading(false);
      }, 1500);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [photos.length]);

  // Preload the next image to avoid flash
  useEffect(() => {
    if (photos.length < 2) return;
    const nextSrc = photos[(index + 1) % photos.length];
    const img = new Image();
    img.src = nextSrc;
  }, [index, photos.length]);

  if (photos.length === 0) {
    return { current: fallback, next: null, fading: false };
  }
  const current = photos[index % photos.length];
  const next = photos.length > 1 ? photos[(index + 1) % photos.length] : null;
  return { current, next, fading };
}
