import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function LuxuryScaleOfJustice() {
  const containerRef = useRef(null);

  // Mouse Parallax tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-end luxury feel (no jitter, subtle damping)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  // Subtle rotation and translation based on cursor (max ±4px, ±1.5deg)
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-6, 6]);
  const parallaxRotate = useTransform(springX, [-0.5, 0.5], [-1.2, 1.2]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 35, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        x: parallaxX,
        y: parallaxY,
        rotate: parallaxRotate,
      }}
      className="relative w-full max-w-[540px] aspect-[4/5] flex items-center justify-center select-none"
    >
      {/* 2. Floating Breathing Container (3-5px vertical oscillation) */}
      <motion.div
        animate={{
          y: [-2.5, 3.5, -2.5],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 500 620"
          className="w-full h-full filter"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Realistic Metallic Bronze / Aged Brass Shader */}
            <linearGradient id="bronzeShaft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2E2214" />
              <stop offset="25%" stopColor="#6E502B" />
              <stop offset="50%" stopColor="#D9B774" />
              <stop offset="65%" stopColor="#9C773E" />
              <stop offset="85%" stopColor="#4A3419" />
              <stop offset="100%" stopColor="#1E140B" />
            </linearGradient>

            {/* Antique Highlight Sheen */}
            <linearGradient id="bronzeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5E4B5" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#C49F5A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#5E431E" stopOpacity="0.7" />
            </linearGradient>

            {/* Ornate Finial Gold Gradient */}
            <linearGradient id="goldFinial" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2CE" />
              <stop offset="35%" stopColor="#D4AF37" />
              <stop offset="70%" stopColor="#8A6A1E" />
              <stop offset="100%" stopColor="#382909" />
            </linearGradient>

            {/* Deep Pan Metallic Bowl Shader */}
            <radialGradient id="panBowlGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#E8CD8C" />
              <stop offset="35%" stopColor="#A8813E" />
              <stop offset="75%" stopColor="#573D16" />
              <stop offset="100%" stopColor="#1A1207" />
            </radialGradient>

            {/* Metallic Light Glider / Reflection Shimmer */}
            <linearGradient id="metalGlider" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#FFF8DB" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ================= PEDESTAL & BASE ================= */}
          <g id="scale-base">
            {/* Cast Shadow on Wood Desk */}
            <ellipse cx="250" cy="565" rx="130" ry="24" fill="#000000" opacity="0.9" filter="blur(8px)" />
            <ellipse cx="250" cy="560" rx="110" ry="18" fill="#050505" opacity="0.8" />

            {/* Bottom Fluted Base Rim */}
            <path
              d="M 150 555 C 150 540, 180 535, 250 535 C 320 535, 350 540, 350 555 C 350 570, 320 575, 250 575 C 180 575, 150 570, 150 555 Z"
              fill="url(#bronzeShaft)"
              stroke="#59401F"
              strokeWidth="1.5"
            />
            {/* Filigree Tier 2 */}
            <path
              d="M 175 538 C 175 515, 205 505, 250 505 C 295 505, 325 515, 325 538 Z"
              fill="url(#bronzeHighlight)"
              stroke="#4A3419"
              strokeWidth="1.5"
            />
            {/* Base Turned Necking */}
            <path
              d="M 210 508 C 210 490, 225 480, 250 480 C 275 480, 290 490, 290 508 Z"
              fill="url(#bronzeShaft)"
            />
            <ellipse cx="250" cy="480" rx="40" ry="8" fill="url(#goldFinial)" />
            <ellipse cx="250" cy="474" rx="30" ry="6" fill="#1E140B" />
          </g>

          {/* ================= CENTRAL VERTICAL PILLAR ================= */}
          <g id="scale-column">
            {/* Tapered Central Column */}
            <path
              d="M 242 474 L 244 195 L 256 195 L 258 474 Z"
              fill="url(#bronzeShaft)"
              stroke="#4A3419"
              strokeWidth="1"
            />
            {/* Classical Baluster Ring Bulbs */}
            <ellipse cx="250" cy="410" rx="16" ry="6" fill="url(#bronzeHighlight)" />
            <ellipse cx="250" cy="330" rx="14" ry="5" fill="url(#goldFinial)" />
            <ellipse cx="250" cy="245" rx="18" ry="7" fill="url(#bronzeHighlight)" />

            {/* Specular Highlight Streak down the pillar */}
            <line x1="248" y1="195" x2="248" y2="470" stroke="#FFF2CE" strokeWidth="1.2" opacity="0.65" />
          </g>

          {/* ================= TOP FINIAL & CARVED CREST ================= */}
          <g id="scale-finial">
            {/* Center Pivot Boss */}
            <circle cx="250" cy="195" r="14" fill="url(#goldFinial)" stroke="#382909" strokeWidth="1.5" />
            <circle cx="250" cy="195" r="7" fill="#1E140B" />
            <circle cx="250" cy="195" r="3" fill="#FFF2CE" />

            {/* Ornate Baroque Fleur-de-lis Top Finial */}
            <path
              d="M 250 110 C 242 135, 230 150, 238 175 C 242 185, 250 188, 250 188 C 250 188, 258 185, 262 175 C 270 150, 258 135, 250 110 Z"
              fill="url(#goldFinial)"
              stroke="#4D3812"
              strokeWidth="1"
            />
            {/* Finial Left & Right Leaves */}
            <path
              d="M 240 160 C 220 155, 215 135, 225 125 C 235 135, 238 145, 246 168 Z"
              fill="url(#goldFinial)"
            />
            <path
              d="M 260 160 C 280 155, 285 135, 275 125 C 265 135, 262 145, 254 168 Z"
              fill="url(#goldFinial)"
            />
          </g>

          {/* ================= GENTLE BALANCING CROSSBEAM (ANIMATED) ================= */}
          {/* Subtle slow left-to-right balancing motion: 7 seconds infinite loop */}
          <g className="court-scales-sway" style={{ transformOrigin: "250px 195px" }}>
            {/* Ornate Baroque Openwork Crossbeam */}
            <path
              d="M 70 195 C 110 182, 160 178, 250 188 C 340 178, 390 182, 430 195 C 390 208, 340 212, 250 202 C 160 212, 110 208, 70 195 Z"
              fill="url(#bronzeHighlight)"
              stroke="#382909"
              strokeWidth="1.5"
            />

            {/* Filigree Scrollwork on Crossbeam */}
            <path
              d="M 90 195 C 130 186, 170 184, 210 192"
              fill="none"
              stroke="#FFF2CE"
              strokeWidth="1.2"
              opacity="0.75"
            />
            <path
              d="M 410 195 C 370 186, 330 184, 290 192"
              fill="none"
              stroke="#FFF2CE"
              strokeWidth="1.2"
              opacity="0.75"
            />

            {/* End Hooks & Rings */}
            <circle cx="70" cy="195" r="6" fill="url(#goldFinial)" stroke="#2B1F08" strokeWidth="1" />
            <circle cx="70" cy="195" r="2.5" fill="#140D04" />
            <circle cx="430" cy="195" r="6" fill="url(#goldFinial)" stroke="#2B1F08" strokeWidth="1" />
            <circle cx="430" cy="195" r="2.5" fill="#140D04" />

            {/* ================= LEFT SUSPENDED PAN ASSEMBLY ================= */}
            <g className="court-pan-left" style={{ transformOrigin: "70px 195px" }}>
              {/* Fine Triple Link Chains */}
              <g stroke="#D4B478" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.85">
                <line x1="70" y1="195" x2="35" y2="340" />
                <line x1="70" y1="195" x2="70" y2="340" />
                <line x1="70" y1="195" x2="105" y2="340" />
              </g>

              {/* Metallic Concave Pan Dish */}
              <ellipse cx="70" cy="340" rx="48" ry="12" fill="url(#panBowlGrad)" stroke="#59401F" strokeWidth="1.5" />
              {/* Inner Bowl Depth Rim */}
              <ellipse cx="70" cy="338" rx="42" ry="9" fill="#1E140B" opacity="0.65" />
              <ellipse cx="70" cy="336" rx="38" ry="7" fill="url(#panBowlGrad)" opacity="0.8" />
              {/* Golden Rim Specular Edge */}
              <path
                d="M 22 340 C 22 352, 118 352, 118 340"
                fill="none"
                stroke="#FFF2CE"
                strokeWidth="1.2"
                opacity="0.75"
              />
            </g>

            {/* ================= RIGHT SUSPENDED PAN ASSEMBLY ================= */}
            <g className="court-pan-right" style={{ transformOrigin: "430px 195px" }}>
              {/* Fine Triple Link Chains */}
              <g stroke="#D4B478" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.85">
                <line x1="430" y1="195" x2="395" y2="340" />
                <line x1="430" y1="195" x2="430" y2="340" />
                <line x1="430" y1="195" x2="465" y2="340" />
              </g>

              {/* Metallic Concave Pan Dish */}
              <ellipse cx="430" cy="340" rx="48" ry="12" fill="url(#panBowlGrad)" stroke="#59401F" strokeWidth="1.5" />
              {/* Inner Bowl Depth Rim */}
              <ellipse cx="430" cy="338" rx="42" ry="9" fill="#1E140B" opacity="0.65" />
              <ellipse cx="430" cy="336" rx="38" ry="7" fill="url(#panBowlGrad)" opacity="0.8" />
              {/* Golden Rim Specular Edge */}
              <path
                d="M 382 340 C 382 352, 478 352, 478 340"
                fill="none"
                stroke="#FFF2CE"
                strokeWidth="1.2"
                opacity="0.75"
              />
            </g>
          </g>

          {/* ================= OCCASIONAL METALLIC REFLECTION GLIDER ================= */}
          {/* Light glides across the metal beam creating that high-end luxury feel */}
          <rect
            x="0"
            y="170"
            width="500"
            height="50"
            fill="url(#metalGlider)"
            className="metallic-shimmer-sweep pointer-events-none"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
