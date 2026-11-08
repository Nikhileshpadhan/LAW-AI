import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SunlitCourtroomScene from "./SunlitCourtroomScene";

export default function LandingHero({ onEnterChamber, onExploreCorpus }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemFadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section
      id="hero"
      aria-label="Supreme Court Legal Intelligence Chamber"
      className="relative min-h-dvh h-dvh w-full bg-black flex flex-col justify-end pb-12 sm:pb-16 md:pb-20 px-6 sm:px-10 md:px-16 lg:px-20 overflow-hidden select-none"
    >
      {/* 1. Full-Screen Sunlit Courtroom Scene: God Rays, Central Desk Caustics & Dust Particles */}
      <SunlitCourtroomScene />

      {/* 2. Lower Screen Editorial Layout: Bottom-Left Focus + Bottom-Right Descriptive Text */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-30 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end"
      >
        {/* ================= LOWER-LEFT QUADRANT: KICKER, SERIF HEADLINE & GHOST CTAS ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 text-left">
          {/* Kicker Text: Small, all-caps, widely spaced sans-serif in pure white */}
          <motion.div variants={itemFadeUp}>
            <p className="brand-mark font-sans text-xs tracking-[0.25em] uppercase font-medium text-white">
              Supreme Court Intelligence
            </p>
          </motion.div>

          {/* Main Headline: Large, high-contrast classic Serif font in pure white */}
          <motion.h1
            variants={itemFadeUp}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.08]"
          >
            RAG-Based
            <br />
            Law Intelligence
          </motion.h1>

          {/* Ghost Buttons: Strictly transparent background, thin crisp white border, white text, minimalist right-arrow icon */}
          <motion.div
            variants={itemFadeUp}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            {/* Primary Ghost CTA */}
            <button
              type="button"
              onClick={onEnterChamber}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-transparent border border-white text-white hover:bg-white hover:text-black font-medium text-sm rounded transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Ghost CTA */}
            <button
              type="button"
              onClick={onExploreCorpus}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent border border-white/60 text-white/90 hover:border-white hover:text-white hover:bg-white/10 font-medium text-sm rounded transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>Explore Corpus</span>
            </button>
          </motion.div>
        </div>

        {/* ================= BOTTOM-RIGHT CORNER: SECONDARY DESCRIPTIVE PARAGRAPH ================= */}
        <motion.div
          variants={itemFadeUp}
          className="lg:col-span-5 xl:col-span-4 flex flex-col justify-end text-left lg:text-left pb-1"
        >
          <p className="font-sans text-sm sm:text-base md:text-lg text-white/85 font-light leading-relaxed max-w-md">
            Analyze legal cases, discover precedents, and gain actionable insights
            through advanced AI-driven legal research.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}