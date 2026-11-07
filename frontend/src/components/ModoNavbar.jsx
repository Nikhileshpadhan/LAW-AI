import React from "react";

export default function ModoNavbar({
  activeView,
  setActiveView,
}) {
  const isLanding = activeView === "landing";

  if (isLanding) {
    return (
      <header className="absolute top-0 left-0 right-0 z-50 h-24 w-full px-6 sm:px-10 md:px-16 lg:px-20 flex items-center justify-between bg-transparent text-white select-none">
        {/* Left: Logo in clean Serif font - completely plain, floating text, zero borders/outlines/boxes */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveView("landing")}
            className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-white hover:opacity-85 transition-opacity duration-150 cursor-pointer select-none bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none shadow-none p-0 m-0"
          >
            LAW AI
          </button>
        </div>

        {/* Center: Navigation links evenly spaced in simple white sans-serif font */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 font-sans text-sm text-white/80">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("features") || document.getElementById("architecture");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Features
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("tech-stack") || document.getElementById("precedents");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Tech Stack
          </button>

          <button
            type="button"
            onClick={() => setActiveView("chamber")}
            className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Workbench
          </button>
        </nav>

        {/* Right: Highly contrasting solid white button with dark text */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveView("chamber")}
            className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm px-5 py-2.5 rounded transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm"
          >
            Enter Chamber
          </button>
        </div>
      </header>
    );
  }

  // Pinned Top Navigation Bar (Left Menu: Logo & Main Navigation Links)
  return (
    <header className="h-14 w-full border-b border-white/5 bg-zinc-950 px-6 md:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 text-white select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveView("landing")}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
          <span className="font-serif text-sm font-semibold tracking-tight text-white">
            LAW AI
          </span>
        </button>
        <span className="text-xs text-zinc-500 hidden sm:inline border-l border-white/10 pl-3">
          Supreme Court Repository
        </span>
      </div>

      {/* Navigation Links (Red Group: Pinned Top Navigation) */}
      <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveView("landing")}
          className="text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Features
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView("landing");
            setTimeout(() => {
              const el = document.getElementById("tech-stack") || document.getElementById("precedents");
              el?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }}
          className="text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Tech Stack
        </button>
        <button
          type="button"
          onClick={() => setActiveView("chamber")}
          className="text-white font-semibold transition-colors duration-150 cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span>Workbench</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </nav>

      {/* Mode Exit */}
      <div>
        <button
          type="button"
          onClick={() => setActiveView("landing")}
          className="h-8 px-3.5 border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 hover:text-white text-xs rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span>Exit chamber</span>
        </button>
      </div>
    </header>
  );
}
