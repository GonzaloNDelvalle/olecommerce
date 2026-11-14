/**
 * Tokens de movimiento compartidos (DESIGN.md §4).
 * Los mismos valores existen como variables CSS en globals.css.
 */

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const DURATION = {
  press: 0.14,
  dropdownIn: 0.2,
  dropdownOut: 0.15,
  drawerIn: 0.4,
  drawerOut: 0.28,
  reveal: 0.5,
  hero: 0.6,
} as const;

export const SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;

/** Delays no uniformes para grillas: se aceleran a medida que avanzan. */
export function staggerDelay(index: number): number {
  const steps = [0, 50, 90, 120, 145, 165, 180, 190];
  return steps[Math.min(index, steps.length - 1)];
}
