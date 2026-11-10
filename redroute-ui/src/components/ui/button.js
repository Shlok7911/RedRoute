import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
export function Button({ className = "", variant = "solid", type = "button", ...props }) {
    const base = "inline-flex items-center justify-center h-10 px-4 rounded-2xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60";
    const solid = "bg-[#E50914] text-white hover:brightness-110";
    const outline = "border border-white/15 bg-white/5 text-white hover:bg-white/10";
    return _jsx("button", { type: type, className: `${base} ${variant === "outline" ? outline : solid} ${className}`, ...props });
}
