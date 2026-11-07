import React, { useEffect, useRef } from "react";

export default function CourtroomAtmosphere() {
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

    // Subtle drifting dust / fog particles concentrated near light rays
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, () => ({
      x: width * 0.45 + Math.random() * (width * 0.55), // concentrated towards right light ray
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.6,
      speedY: -Math.random() * 0.3 - 0.08,
      speedX: (Math.random() - 0.35) * 0.18,
      opacity: Math.random() * 0.45 + 0.08,
      fadeSpeed: Math.random() * 0.006 + 0.002,
      fadingIn: Math.random() > 0.5,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Subtle alpha pulsing
        if (p.fadingIn) {
          p.opacity += p.fadeSpeed;
          if (p.opacity >= 0.55) p.fadingIn = false;
        } else {
          p.opacity -= p.fadeSpeed;
          if (p.opacity <= 0.05) p.fadingIn = true;
        }

        // Reset when moving off-screen
        if (p.y < 0) {
          p.y = height;
          p.x = width * 0.4 + Math.random() * (width * 0.6);
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = width * 0.4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        // Soft warm candlelight / gold tone matching reference beam
        ctx.fillStyle = `rgba(245, 226, 170, ${p.opacity * 0.6})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(245, 226, 170, 0.4)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Base Layer: Deep Charcoal & Black Background */}
      <div className="absolute inset-0 bg-canvas" />

      {/* 2. Authentic Reference Background Layer (Low Opacity Ambient Blend) */}
      <div
        className="absolute inset-0 bg-cover bg-right md:bg-center opacity-40 mix-blend-screen pointer-events-none"
        style={{ backgroundImage: `url('/courtroom_reference.jpg')` }}
      />

      {/* 3. Dark Architectural Fluted Courtroom Wall Panels (SVG) */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Vertical Fluted Wood Shadow & Highlights */}
          <linearGradient id="flutePanel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B0D10" />
            <stop offset="48%" stopColor="#12151A" />
            <stop offset="50%" stopColor="#1B1F26" />
            <stop offset="52%" stopColor="#0A0C0E" />
            <stop offset="100%" stopColor="#050607" />
          </linearGradient>

          {/* Top-Right Soft Cinematic Light Beam (God Ray) */}
          <linearGradient id="cinematicLightRay" x1="100%" y1="0%" x2="20%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="25%" stopColor="#FFF4D0" stopOpacity="0.14" />
            <stop offset="60%" stopColor="#C49F5A" stopOpacity="0.05" />
            <stop offset="90%" stopColor="#070809" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="secondaryRay" x1="95%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="30%" stopColor="#FFF8E7" stopOpacity="0.08" />
            <stop offset="80%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Aged Courtroom Oak Desk Surface (Bottom 18%) */}
          <linearGradient id="deskWoodGrain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#241B15" />
            <stop offset="15%" stopColor="#18120E" />
            <stop offset="45%" stopColor="#2E221A" />
            <stop offset="70%" stopColor="#120D0A" />
            <stop offset="100%" stopColor="#060403" />
          </linearGradient>

          {/* Desk Edge Specular Rim */}
          <linearGradient id="deskRimGleam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2A1E17" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#73553C" stopOpacity="0.75" />
            <stop offset="85%" stopColor="#D4AF37" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3A281E" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Vertical Fluted Courtroom Wood Panels (Repeating Across Wall) */}
        <g opacity="0.65">
          {Array.from({ length: 18 }).map((_, i) => (
            <rect
              key={i}
              x={i * 82}
              y="0"
              width="82"
              height="750"
              fill="url(#flutePanel)"
              stroke="#0A0B0E"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Soft Vignette Shadows for Text Legibility on Left Side */}
        <rect
          x="0"
          y="0"
          width="720"
          height="900"
          fill="black"
          opacity="0.55"
        />

        {/* Soft Top-Right Cinematic Light Rays Streaming In */}
        <polygon
          points="1440,-50 1150,-50 780,750 1440,750"
          fill="url(#cinematicLightRay)"
        />
        <polygon
          points="1380,-50 1280,-50 980,750 1300,750"
          fill="url(#secondaryRay)"
        />

        {/* Aged Oak Courtroom Desk (Bottom Shelf) */}
        <g id="courtroom-desk">
          {/* Main Wooden Desk Surface */}
          <rect x="0" y="740" width="1440" height="160" fill="url(#deskWoodGrain)" />

          {/* Desk Top Beveled Edge Rim (catching top-right light) */}
          <line x1="0" y1="740" x2="1440" y2="740" stroke="url(#deskRimGleam)" strokeWidth="2" />
          <line x1="0" y1="742" x2="1440" y2="742" stroke="#0A0604" strokeWidth="1.5" />

          {/* Wood Planks Hairline Joints */}
          <line x1="0" y1="785" x2="1440" y2="785" stroke="#120D0A" strokeWidth="1" opacity="0.6" />
          <line x1="0" y1="835" x2="1440" y2="835" stroke="#120D0A" strokeWidth="1" opacity="0.6" />
        </g>
      </svg>

      {/* 4. Canvas Floating Dust Motes Drifting in the Light Beam */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
      />

      {/* 5. Deep Cinematic Gradient Vignette (Ensures 100% Crisp Headline Contrast on Left) */}
      <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/80 to-transparent w-full md:w-3/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas to-transparent pointer-events-none" />
    </div>
  );
}
