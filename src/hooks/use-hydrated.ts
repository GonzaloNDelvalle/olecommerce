import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `true` solo en el cliente después de hidratar. Reemplaza el patrón
 * `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true))`,
 * que provoca un render extra en cascada.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
