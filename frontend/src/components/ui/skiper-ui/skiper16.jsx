import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Skiper16 Card Stack Scroll Component
 * Inspired by @skiper-ui/skiper16
 * Monochromatic high-contrast legal-tech aesthetic with depth scaling and dimming.
 */
export function SkiperCard({
  i,
  total,
  item,
  progress,
}) {
  const containerRef = useRef(null);
  const Icon = item.icon;

  // Each card begins scaling down and slightly dimming as subsequent cards stack over it
  const range = [i * 0.22, 1];
  const targetScale = Math.max(0.88, 1 - (total - i - 1) * 0.04);
  const scale = useTransform(progress, range, [1, targetScale]);

  // Darken stacked cards behind the active one to simulate physical depth
  const targetBrightness = Math.max(0.68, 1 - (total - i - 1) * 0.09);
  const brightness = useTransform(progress, range, [1, targetBrightness]);

  return (
    <div
      ref={containerRef}
      className="sticky top-28 sm:top-32 mb-12 sm:mb-16 flex flex-col justify-center"
      style={{
        zIndex: i + 1,
      }}
    >
      <motion.div
        style={{
          scale,
          filter: useTransform(brightness, (b) => `brightness(${b})`),
          top: `calc(6.5rem + ${i * 22}px)`,
        }}
        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-7 sm:p-10 shadow-2xl relative overflow-hidden transition-colors hover:border-white/20"
      >
        {/* Subtle glass reflection highlight */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />

        {/* Card Header: Monochromatic Pure White Exhibit Label & Icon */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="font-sans text-xs font-semibold text-white">
              Exhibit {item.num}
            </span>
          </div>

          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Card Body: High-Contrast Classic Serif Title & Soft Silver Sans-Serif Body */}
        <div className="py-6 space-y-4">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight leading-snug">
            {item.title}
          </h3>

          <p className="font-sans text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            {item.desc}
          </p>
        </div>

        {/* Card Footer: Metadata Specs & Attribute Tag */}
        <div className="pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <span className="font-mono text-zinc-400">{item.spec}</span>
          <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-medium">
            {item.badge}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function SkiperCardStack({ items }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative w-full pb-20">
      {items.map((item, i) => (
        <SkiperCard
          key={item.num || i}
          i={i}
          total={items.length}
          item={item}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
}
