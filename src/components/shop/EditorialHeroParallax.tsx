"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function EditorialHeroParallax() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Desplazamiento vertical más lento que el scroll para crear profundidad Parallax
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "32%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-stone-950"
    >
      {/* Contenedor del video con movimiento Parallax */}
      <motion.div
        style={{ y: videoY, scale: videoScale }}
        className="pointer-events-none absolute -inset-y-[12%] inset-x-0 will-change-transform"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=85"
          className="h-full w-full object-cover object-center opacity-80"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-neon-light-39877-large.mp4"
            type="video/mp4"
          />
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-a-brown-coat-41763-large.mp4"
            type="video/mp4"
          />
        </video>
      </motion.div>

      {/* Overlay oscuro cálido para garantizar legibilidad del texto blanco y del Navbar transparente */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/35 to-stone-950/70" />

      {/* Contenido Central del Hero con entrada escalonada y Parallax suave */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.14,
              delayChildren: 0.1,
            },
          },
        }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 text-center text-stone-50 sm:px-6"
      >
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, ease: EASE_EDITORIAL },
            },
          }}
          className="text-[11px] font-medium tracking-[0.38em] text-stone-200/90 uppercase sm:text-xs"
        >
          OL Indumenti • Autumn / Winter Collection
        </motion.p>

        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.85, ease: EASE_EDITORIAL },
            },
          }}
          className="mt-5 font-serif text-5xl font-normal tracking-[0.16em] text-white uppercase sm:text-7xl lg:text-8xl"
        >
          NEUTRAL STATE - FW&apos;26
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.75, ease: EASE_EDITORIAL },
            },
          }}
          className="mt-5 max-w-lg text-xs leading-relaxed font-light tracking-wider text-stone-200/85 sm:text-sm"
        >
          Siluetas depuradas, sastrería contemporánea y texturas nobles en una
          paleta de crudos, piedra y chocolate profundo.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.75, ease: EASE_EDITORIAL },
            },
          }}
          className="mt-10"
        >
          <Link
            href="/productos"
            className="inline-flex items-center justify-center border border-stone-100/85 bg-transparent px-11 py-4 text-xs font-medium tracking-[0.32em] text-stone-50 uppercase transition-all duration-300 hover:border-[#D2B48C] hover:bg-stone-50 hover:text-stone-950"
          >
            EXPLORAR
          </Link>
        </motion.div>
      </motion.div>

      {/* Indicador inferior minimalista */}
      <div className="pointer-events-none absolute right-0 bottom-8 left-0 z-10 flex justify-center">
        <span className="text-[10px] tracking-[0.3em] text-stone-300/75 uppercase">
          Scroll Editorial
        </span>
      </div>
    </section>
  );
}
