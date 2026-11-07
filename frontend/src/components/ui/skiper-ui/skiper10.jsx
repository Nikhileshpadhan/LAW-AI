import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Skiper10 - Double Stairs Preloader
 * Inspired by @skiper-ui/skiper10
 * A dual-direction cascading staircase transition featuring synchronized timing,
 * multi-layered depth curtains, and editorial typography.
 */
export default function Skiper10({ onComplete }) {
  const nbOfColumns = 6;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress counter simulation (0 to 100%)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18 + 12);
      });
    }, 120);

    // Auto complete and trigger staircase exit
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Primary Stairs Column Animation Variant
  const stairTopVariants = {
    initial: {
      top: 0,
    },
    exit: (i) => ({
      top: "-100%",
      transition: {
        duration: 0.75,
        delay: 0.05 * i,
        ease: [0.76, 0, 0.24, 1],
      },
    }),
  };

  const stairBottomVariants = {
    initial: {
      bottom: 0,
    },
    exit: (i) => ({
      bottom: "-100%",
      transition: {
        duration: 0.75,
        delay: 0.05 * i,
        ease: [0.76, 0, 0.24, 1],
      },
    }),
  };

  // Secondary depth shadow stair variant (delayed layer behind)
  const depthStairVariants = {
    initial: {
      top: 0,
    },
    exit: (i) => ({
      top: "-100%",
      transition: {
        duration: 0.85,
        delay: 0.05 * i + 0.08,
        ease: [0.76, 0, 0.24, 1],
      },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: 0.7 }}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto select-none overflow-hidden"
    >
      {/* Layer 1: Background Depth Stairs (Darker Charcoal Slices) */}
      <div className="absolute inset-0 flex w-full h-full pointer-events-none z-10">
        {[...Array(nbOfColumns)].map((_, i) => (
          <motion.div
            key={`depth_${i}`}
            custom={nbOfColumns - i}
            variants={depthStairVariants}
            initial="initial"
            exit="exit"
            className="relative h-full flex-1 bg-zinc-950"
          />
        ))}
      </div>

      {/* Layer 2: Double Stairs (Top Half Sliding Up, Bottom Half Sliding Down) */}
      <div className="absolute inset-0 flex w-full h-full pointer-events-none z-20">
        {[...Array(nbOfColumns)].map((_, i) => (
          <div key={`col_${i}`} className="relative h-full flex-1 overflow-hidden">
            {/* Top Stair Half */}
            <motion.div
              custom={i}
              variants={stairTopVariants}
              initial="initial"
              exit="exit"
              className="absolute top-0 left-0 right-0 h-1/2 bg-black border-r border-white/5"
            />
            {/* Bottom Stair Half */}
            <motion.div
              custom={nbOfColumns - i}
              variants={stairBottomVariants}
              initial="initial"
              exit="exit"
              className="absolute bottom-0 left-0 right-0 h-1/2 bg-black border-r border-white/5"
            />
          </div>
        ))}
      </div>

      {/* Layer 3: Central Preloader Plaque & Progress Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94, y: -20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md"
      >
        {/* Supreme Court Seal Icon */}
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-1 shadow-2xl">
          <span className="w-3 h-3 bg-white rounded-[2px]" />
        </div>

        {/* Wordmark in Classic Serif Font */}
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white tracking-tight">
            LAW AI
          </h1>
          <p className="font-sans text-xs text-zinc-400 font-medium">
            Supreme Court Repository (2018 to 2024)
          </p>
        </div>

        {/* Minimalist Progress Meter */}
        <div className="w-48 pt-4 space-y-2">
          <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>loading</span>
            <span>{Math.min(100, progress)}%</span>
          </div>
        </div>

        {/* Skip action */}
        <button
          type="button"
          onClick={() => onComplete?.()}
          className="pt-2 text-[11px] text-zinc-500 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Skip intro
        </button>
      </motion.div>
    </motion.div>
  );
}
