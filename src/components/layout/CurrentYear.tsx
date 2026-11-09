"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function CurrentYear() {
  const year = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => 2026
  );

  return <>{year}</>;
}
