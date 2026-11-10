import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
export function Input(props) {
    const base = "h-12 w-full rounded-xl border border-white/20 bg-transparent px-3 text-white placeholder:text-white/50 outline-none";
    return _jsx("input", { ...props, className: `${base} ${props.className || ""}` });
}
