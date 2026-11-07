import React, { useEffect, useRef } from "react";

export default function SunlitCourtroomScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Exact Angled Polygon Geometry of the God Rays from the Window to the Center Wooden Table
    // Point 1: Window top-left (0.22, 0.04)
    // Point 2: Window top-right (0.315, 0.08)
    // Point 3: Center table bottom-right (0.62, 0.88)
    // Point 4: Center table bottom-left (0.34, 0.86)
    const getBeamLimits = (y, w, h) => {
      const topY = h * 0.04;
      const bottomY = h * 0.87;
      const t = Math.max(0, Math.min(1, (y - topY) / (bottomY - topY)));
      const xLeft = w * (0.22 + 0.12 * t);
      const xRight = w * (0.315 + 0.305 * t);
      return { xLeft, xRight, t };
    };

    const particleCount = 140;

    const spawnParticle = (initialRandom = false) => {
      const t = initialRandom ? Math.random() : Math.random() * 0.15;
      const y = height * (0.04 + 0.83 * t);
      const { xLeft, xRight } = getBeamLimits(y, width, height);
      // Spawn strictly within the left and right boundary of the ray
      const margin = (xRight - xLeft) * 0.05;
      const x = (xLeft + margin) + Math.random() * Math.max(5, (xRight - xLeft) - margin * 2);

      return {
        x,
        y,
        // Microscopic authentic dust specks: pinpricks of light (0.35px to 0.95px radius)
        radius: 0.35 + Math.random() * 0.6,
        // Slow suspended drift matching natural air currents inside a room
        vx: (Math.random() - 0.46) * 0.16 + 0.04,
        vy: (Math.random() - 0.46) * 0.14 + 0.05,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        tumbleSpeed: 1.4 + Math.random() * 2.6,
        baseAlpha: 0.35 + Math.random() * 0.55,
      };
    };

    let particles = Array.from({ length: particleCount }, () => spawnParticle(true));

    let time = 0;
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // STRICT MASK: Clip canvas rendering strictly to the angled god ray polygon path
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width * 0.22, height * 0.04);
      ctx.lineTo(width * 0.315, height * 0.08);
      ctx.lineTo(width * 0.62, height * 0.88);
      ctx.lineTo(width * 0.34, height * 0.86);
      ctx.closePath();
      ctx.clip(); // Nothing outside this exact path can ever render

      // Render only the drifting, swirling sunlit dust motes inside the clipped beam
      particles.forEach((p, idx) => {
        // Natural turbulent micro-swirls of air
        const eddyX =
          Math.sin(time * 0.5 + p.phaseY) * 0.18 +
          Math.cos(time * 0.8 + p.phaseX) * 0.12;
        const eddyY =
          Math.cos(time * 0.4 + p.phaseX) * 0.15 +
          Math.sin(time * 0.7 + p.phaseY) * 0.08;

        p.x += p.vx + eddyX;
        p.y += p.vy + eddyY;

        const { xLeft, xRight, t } = getBeamLimits(p.y, width, height);

        // If particle touches boundary of the light ray or reaches table floor, recycle inside beam
        if (t <= 0 || t >= 1 || p.x < xLeft || p.x > xRight) {
          particles[idx] = spawnParticle(false);
          return;
        }

        // Rotational sparkle / glint as micro-dust flakes catch the sunlight
        const sparkle = 0.5 + 0.5 * Math.pow(Math.sin(time * p.tumbleSpeed + p.phaseX), 2);
        const alpha = p.baseAlpha * sparkle;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Sunlight warm ivory pinprick (pure dust mote, NO bubbles)
        ctx.fillStyle = `rgba(255, 250, 235, ${alpha})`;
        ctx.fill();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Full-Screen Sunlit Courtroom Base Image (100% Seamless, Zero Overlay Cuts) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center md:bg-[position:center_30%] scale-100"
        style={{
          backgroundImage: `url('/sunlit_empty_courtroom.png')`,
        }}
      />

      {/* 2. Shifting Volumetric God Rays Overlay (SVG Animation) */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none opacity-85"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sunBeamMain" x1="25%" y1="10%" x2="52%" y2="82%">
            <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.48" />
            <stop offset="25%" stopColor="#FDE68A" stopOpacity="0.35" />
            <stop offset="65%" stopColor="#D4AF37" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sunBeamLeftEdge" x1="22%" y1="8%" x2="42%" y2="78%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
            <stop offset="35%" stopColor="#FEF3C7" stopOpacity="0.25" />
            <stop offset="85%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sunBeamRightEdge" x1="29%" y1="14%" x2="60%" y2="85%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.2" />
            <stop offset="90%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="deskCausticPool" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#FCD34D" stopOpacity="0.28" />
            <stop offset="75%" stopColor="#B45309" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <polygon
          points="310,80 370,140 580,780 430,760"
          fill="url(#sunBeamLeftEdge)"
          className="court-godray-pulse-slow"
        />

        <polygon
          points="330,70 410,130 780,820 520,800"
          fill="url(#sunBeamMain)"
          className="court-godray-pulse-main"
        />

        <polygon
          points="390,110 430,160 880,830 710,810"
          fill="url(#sunBeamRightEdge)"
          className="court-godray-pulse-fast"
        />

        {/* Shimmering Reflections Over Central Desk and Floor */}
        <g id="desk-shimmer-reflections">
          <ellipse
            cx="690"
            cy="650"
            rx="200"
            ry="70"
            fill="url(#deskCausticPool)"
            className="court-desk-caustics"
          />

          <polygon
            points="480,780 820,790 980,880 360,860"
            fill="url(#deskCausticPool)"
            className="court-floor-shimmer"
            opacity="0.65"
          />
        </g>
      </svg>

      {/* 3. Realistic Floating & Swirling Sunbeam Dust Motes Canvas (Strictly masked via ctx.clip) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );
}