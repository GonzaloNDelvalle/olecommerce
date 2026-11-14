"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/cn";

const HeroCloth = dynamic(() => import("@/components/three/HeroCloth"), { ssr: false });

/** ¿Vale la pena montar WebGL en este dispositivo? */
function canUseWebGL(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  return true;
}

/** URL same-origin optimizada por Next: evita problemas de CORS en la textura. */
function textureUrl(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=80`;
}

interface HeroMediaProps {
  imageUrl: string | null;
  videoUrl: string | null;
  alt: string;
}

export function HeroMedia({ imageUrl, videoUrl, alt }: HeroMediaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enable3D, setEnable3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (videoUrl || !imageUrl) return;
    // Esperar a que el navegador esté libre: el LCP es la imagen, no la escena.
    const start = () => setEnable3D(canUseWebGL());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(start, 1200);
    return () => globalThis.clearTimeout(id);
  }, [imageUrl, videoUrl]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">

      {videoUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          poster={imageUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-500",
            ready && "opacity-0",
          )}
        />
      ) : null}

      {enable3D && imageUrl && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <HeroCloth src={textureUrl(imageUrl)} active={inView} onReady={handleReady} />
        </div>
      )}
    </div>
  );
}
