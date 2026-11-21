"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Video de la campaña: a pantalla completa, en loop y sin sonido. Hay una
 * versión horizontal (escritorio) y otra vertical (celular); si falta una se
 * usa la otra. Con "reducir movimiento" no se reproduce y queda la imagen
 * de portada (o el primer cuadro del video).
 */
export function CampaignMedia({
  imageUrl,
  desktopVideoUrl,
  mobileVideoUrl,
}: {
  imageUrl: string | null;
  desktopVideoUrl: string | null;
  mobileVideoUrl: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // En el servidor se asume escritorio; en celulares cambia al hidratar
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
  const videoUrl = isDesktop
    ? (desktopVideoUrl ?? mobileVideoUrl)
    : (mobileVideoUrl ?? desktopVideoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      video.removeAttribute("autoplay");
    }
  }, [videoUrl]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {imageUrl && <Image src={imageUrl} alt="" fill sizes="100vw" className="object-cover" />}
      {videoUrl && (
        <video
          key={videoUrl}
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          poster={imageUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
