"use client";

// Adaptado do Animated Group (Motion Primitives, MIT).
// Restrito a elementos div para evitar criar tipos de componente durante o render.
import { Children, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

type Preset = "fade" | "slide" | "scale";
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};
const items: Record<Preset, Variants> = {
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  slide: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
};

export function AnimatedGroup({
  children, className, preset = "fade",
}: {
  children: ReactNode;
  className?: string;
  preset?: Preset;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={container}
    >
      {Children.map(children, (child, index) => (
        <motion.div key={index} variants={items[preset]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
