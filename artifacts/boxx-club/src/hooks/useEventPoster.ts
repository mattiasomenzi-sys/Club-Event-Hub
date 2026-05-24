import { useListGalleryPhotos } from "@workspace/api-client-react";
import clubPhoto from "@assets/IMG_1665_1779270012804.jpg";

function resolveSrc(imageUrl: string): string {
  if (imageUrl.startsWith("/objects/")) return `/api/storage${imageUrl}`;
  return imageUrl;
}

function hashId(id: number | string): number {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function useEventPoster() {
  const { data } = useListGalleryPhotos();
  const photos = (data ?? []).map((p) => resolveSrc(p.imageUrl));

  return function getPoster(event: { id: number | string; imageUrl?: string | null }): string {
    if (event.imageUrl) return resolveSrc(event.imageUrl);
    if (photos.length === 0) return clubPhoto;
    return photos[hashId(event.id) % photos.length];
  };
}
