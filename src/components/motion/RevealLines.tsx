import type { CSSProperties, ElementType, ReactNode } from "react";

interface RevealLinesProps {
  /** Cada entrada es una línea visual del titular. */
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Titular editorial que se revela línea por línea al entrar en pantalla.
 * Server Component: el texto completo está en el HTML (SEO intacto).
 */
export function RevealLines({ lines, as: Tag = "h2", className, id }: RevealLinesProps) {
  return (
    <Tag id={id} className={className} data-reveal="lines">
      {lines.map((line, i) => (
        <span key={i} className="reveal-line">
          <span style={{ "--line": i } as CSSProperties}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
