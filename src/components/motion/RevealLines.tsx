import type { CSSProperties, ElementType, ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

interface RevealLinesProps {
  /** Cada entrada es una línea visual del titular. */
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Titular editorial que se revela línea por línea al entrar en pantalla.
 * El texto completo está en el HTML del servidor (SEO intacto).
 */
export function RevealLines({ lines, as = "h2", className, id }: RevealLinesProps) {
  return (
    <Reveal as={as} variant="lines" id={id} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="reveal-line">
          <span style={{ "--line": i } as CSSProperties}>{line}</span>
        </span>
      ))}
    </Reveal>
  );
}
