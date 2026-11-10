import React, { useState } from "react";
import { Scale } from "lucide-react";

export default function CounselAvatar({ user, size = "sm" }) {
  const [imgError, setImgError] = useState(false);

  const rawName = user?.name || user?.full_name || user?.email?.split("@")[0] || "Counsel";
  const cleanName = rawName.replace(/^Counsel\s*:\s*/i, "").replace(/^Counsel\s+/i, "").trim();

  // Extract up to 2 initials (e.g., "Rajesh Sharma" -> "RS")
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0]?.toUpperCase() || "C");

  const sizeClasses = size === "md" ? "w-7 h-7 text-xs" : "w-5 h-5 text-[10px]";

  if (user?.picture && !imgError) {
    return (
      <img
        src={user.picture}
        alt={cleanName}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover border border-white/20 flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-zinc-800/90 border border-white/20 flex items-center justify-center font-semibold text-zinc-100 flex-shrink-0 select-none shadow-sm`}
      title={`Counsel: ${cleanName}`}
    >
      {initials ? (
        <span className="leading-none">{initials}</span>
      ) : (
        <Scale className="w-3 h-3 text-zinc-300" />
      )}
    </div>
  );
}
