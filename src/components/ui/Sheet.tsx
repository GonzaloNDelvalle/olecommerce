"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { EASE_DRAWER } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Etiqueta accesible si el título no es texto plano. */
  ariaLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Ancho del panel lateral en desktop. */
  widthClass?: string;
  /** Lado en desktop. En mobile siempre sube desde abajo. */
  side?: "right" | "left";
}

function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const isDesktopSnapshot = () => window.matchMedia("(min-width: 1024px)").matches;

/**
 * Panel deslizable (DESIGN.md §4 y §6): lateral en desktop, bottom sheet en
 * mobile. Se cierra arrastrando (por distancia o por velocidad), con Escape o
 * tocando el fondo. Entra en 400ms y sale en 280ms con la curva de drawer.
 */
export function Sheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  widthClass = "lg:w-[480px]",
  side = "right",
}: SheetProps) {
  const isDesktop = useSyncExternalStore(subscribeDesktop, isDesktopSnapshot, () => true);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Trampa de foco simple: Tab no sale del panel
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const axis = isDesktop ? "x" : "y";
  const hidden = isDesktop ? { x: side === "right" ? "100%" : "-100%" } : { y: "100%" };
  const shown = isDesktop ? { x: 0 } : { y: 0 };

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    const size = isDesktop ? (panelRef.current?.offsetWidth ?? 480) : (panelRef.current?.offsetHeight ?? 600);
    const offset = isDesktop ? (side === "right" ? info.offset.x : -info.offset.x) : info.offset.y;
    const velocity = isDesktop ? (side === "right" ? info.velocity.x : -info.velocity.x) : info.velocity.y;
    if (offset > size * 0.4 || velocity > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" data-lenis-prevent>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-espresso/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
            tabIndex={-1}
            initial={hidden}
            animate={{ ...shown, transition: { duration: 0.4, ease: EASE_DRAWER } }}
            exit={{ ...hidden, transition: { duration: 0.28, ease: EASE_DRAWER } }}
            drag={axis}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={
              isDesktop
                ? side === "right"
                  ? { left: 0.05, right: 1 }
                  : { left: 1, right: 0.05 }
                : { top: 0.05, bottom: 1 }
            }
            onDragEnd={onDragEnd}
            className={cn(
              "absolute flex flex-col bg-white shadow-[0_-20px_60px_rgba(21,17,14,0.18)] outline-none",
              "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px]",
              "lg:inset-y-0 lg:bottom-auto lg:h-dvh lg:max-h-none lg:rounded-none",
              side === "right" ? "lg:right-0 lg:left-auto" : "lg:right-auto lg:left-0",
              widthClass,
            )}
          >
            {/* Asa de arrastre (mobile) / zona de arrastre (desktop: el header) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex shrink-0 touch-none cursor-grab flex-col border-b border-stone-200 active:cursor-grabbing"
            >
              <span aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-stone-300 lg:hidden" />
              <div className="flex items-center justify-between gap-4 py-3 pr-3 pl-6 lg:py-5">
                <h2 className="display text-[30px] text-ink lg:text-[34px]">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="pressable inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/5"
                >
                  <X className="size-5" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-stone-200 bg-white px-6 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
