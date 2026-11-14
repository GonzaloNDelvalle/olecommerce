"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Pause, Play } from "lucide-react";

/**
 * Medio a pantalla completa de la campaña con parallax suave (±6%).
 * El video siempre se puede pausar (WCAG 2.2.2).
 */
export function CampaignMedia({ imageUrl, videoUrl }: { imageUrl: string | null; videoUrl: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div className="absolute -inset-y-[8%] inset-x-0" style={{ y }}>
        {videoUrl ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={videoUrl}
            poster={imageUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="100vw" className="object-cover object-[center_30%]" />
        ) : null}
      </motion.div>

      {videoUrl && (
        <button
          type="button"
          onClick={toggle}
          className="glass-light pressable absolute top-6 right-4 z-10 inline-flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-ink sm:right-10"
        >
          {paused ? <Play className="size-4" fill="currentColor" aria-hidden="true" /> : <Pause className="size-4" fill="currentColor" aria-hidden="true" />}
          {paused ? "Reproducir" : "Pausar video"}
        </button>
      )}
    </div>
  );
}
