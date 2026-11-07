import React, { useRef, useState } from "react";
import { motion, useInView, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";

/**
 * ScrollRevealWrapper
 * Abstracted scroll-direction-aware animation container.
 * Features dynamic directional enter/exit animations linked to user scroll behavior.
 * As user scrolls downward, elements reveal from bottom-up;
 * as user scrolls upward, elements reverse or reveal from top-down.
 */
export default function ScrollRevealWrapper({
  children,
  className = "",
  variant = "fade-up", // 'fade-up' | 'cinematic' | 'card-depth' | 'slide-reveal'
  threshold = 0.08,
  delay = 0,
  duration = 0.65,
  id,
}) {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Track in-view state (once: false ensures continuous reverse when scrolling out)
  const isInView = useInView(containerRef, {
    amount: threshold,
    once: false,
  });

  // Track scroll direction across the viewport
  const { scrollY } = useScroll();
  const [scrollDirection, setScrollDirection] = useState("down");

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = current - previous;
    if (Math.abs(diff) > 1.5) {
      setScrollDirection(diff > 0 ? "down" : "up");
    }
  });

  if (shouldReduceMotion) {
    return (
      <div id={id} ref={containerRef} className={className}>
        {children}
      </div>
    );
  }

  // Variant definitions based on variant prop & dynamic scrollDirection
  const getVariants = () => {
    switch (variant) {
      case "cinematic":
        return {
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1],
            },
            transitionEnd: {
              transform: "none",
              filter: "none",
            },
          },
          hidden: (dir) => ({
            opacity: 0,
            y: dir === "down" ? 48 : -48,
            scale: 0.97,
            filter: "blur(6px)",
            transition: {
              duration: duration * 0.75,
              ease: [0.16, 1, 0.3, 1],
            },
          }),
        };

      case "card-depth":
        return {
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            filter: "blur(0px)",
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1],
            },
            transitionEnd: {
              transform: "none",
              filter: "none",
            },
          },
          hidden: (dir) => ({
            opacity: 0,
            y: dir === "down" ? 40 : -40,
            scale: 0.95,
            rotateX: dir === "down" ? 3 : -3,
            filter: "blur(4px)",
            transition: {
              duration: duration * 0.7,
              ease: [0.16, 1, 0.3, 1],
            },
          }),
        };

      case "slide-reveal":
        return {
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1],
            },
            transitionEnd: {
              transform: "none",
              filter: "none",
            },
          },
          hidden: (dir) => ({
            opacity: 0,
            x: dir === "down" ? -25 : 25,
            y: dir === "down" ? 25 : -25,
            filter: "blur(4px)",
            transition: {
              duration: duration * 0.75,
              ease: [0.16, 1, 0.3, 1],
            },
          }),
        };

      case "fade-up":
      default:
        return {
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1],
            },
            transitionEnd: {
              transform: "none",
              filter: "none",
            },
          },
          hidden: (dir) => ({
            opacity: 0,
            y: dir === "down" ? 36 : -36,
            scale: 0.98,
            filter: "blur(4px)",
            transition: {
              duration: duration * 0.75,
              ease: [0.16, 1, 0.3, 1],
            },
          }),
        };
    }
  };

  const variants = getVariants();

  return (
    <div id={id} ref={containerRef} className={`w-full ${className}`}>
      <motion.div
        custom={scrollDirection}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={variants}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
