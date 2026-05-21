import { useGalleryBackground } from "@/hooks/useGalleryBackground";

interface Props {
  fallback: string;
  filter: string;
}

export default function RotatingBackground({ fallback, filter }: Props) {
  const { current, next, fading } = useGalleryBackground(fallback);

  return (
    <>
      {next && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${next})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter,
          }}
        />
      )}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: `url(${current})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter,
          opacity: fading ? 0 : 1,
        }}
      />
    </>
  );
}
