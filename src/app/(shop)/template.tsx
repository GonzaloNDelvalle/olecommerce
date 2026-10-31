"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

const EASE_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ShopTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_EDITORIAL }}
    >
      {children}
    </motion.div>
  );
}
