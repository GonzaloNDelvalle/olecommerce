"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Video de la campaña: a pantalla completa, en loop y sin sonido. Con
 * "reducir movimiento" no se reproduce y queda la imagen de portada (o el
 * primer cuadro del video).
 */
export function CampaignMedia({ imageUrl, videoUrl }: { imageUrl: string | null; videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      video.removeAttribute("autoplay");
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {imageUrl && <Image src={imageUrl} alt="" fill sizes="100vw" className="object-cover" />}
      <video
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
    </div>
  );
}
