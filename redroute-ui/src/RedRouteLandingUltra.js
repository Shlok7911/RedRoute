import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/RedRouteLandingUltra.tsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, useScroll, useInView, animate, AnimatePresence, } from "framer-motion";
import { Button } from "./components/ui/button";
import { Calendar, MapPin, User, Star, Zap, ChevronUp, ChevronLeft, ChevronRight, LogOut, Sparkles, TimerReset, ShieldCheck, Check, Minus, Plus, } from "lucide-react";
import { clearSession } from "./session";
import EventCard, {} from "./components/EventCard";
/* --------------------- cookie helpers (kept) --------------------- */
function setCookie(name, value, days = 7) {
    const maxAge = `Max-Age=${days * 24 * 60 * 60}`;
    const sameSite = "SameSite=Lax";
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? " Secure" : "";
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; ${maxAge}; ${sameSite};${secure}`;
}
function deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}
const RR = { red: "#E50914" };
function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
/* --------------------------- KINETIC HEADLINE ------------------------------ */
function Kinetic({ text, className = "" }) {
    const words = text.split(" ");
    return (_jsx("h1", { className: `font-black leading-[1.05] tracking-tight ${className}`, children: words.map((w, wi) => (_jsx(motion.span, { initial: { y: "0.3em", opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.045 * wi, duration: 0.35, ease: "easeOut" }, className: "mr-[0.28em] inline-block whitespace-nowrap last:mr-0", children: w }, `${w}-${wi}`))) }));
}
/* ---------------------------- FIELD WRAPPER -------------------------------- */
function Field({ icon, label, children, }) {
    return (_jsxs("div", { role: "group", className: "flex flex-col gap-2 rounded-2xl p-2 text-white/90", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm opacity-80 min-h-[20px]", children: [icon != null && (_jsx("span", { className: "grid place-content-center rounded-md border border-white/15 bg-white/10 p-1", children: icon })), _jsx("span", { children: label })] }), children] }));
}
/* ------------------------- SCROLL PROGRESS BAR ----------------------------- */
function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    return (_jsx(motion.div, { className: "fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-[#E50914]", style: { scaleX: scrollYProgress } }));
}
function useMonthMatrix(year, month) {
    return useMemo(() => {
        const first = new Date(year, month, 1);
        const startWeekday = (first.getDay() + 6) % 7; // Mon=0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const cells = [];
        for (let i = startWeekday - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const date = new Date(year, month - 1, d);
            cells.push({ date, currentMonth: false, isToday: isSameDate(date, new Date()) });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            cells.push({ date, currentMonth: true, isToday: isSameDate(date, new Date()) });
        }
        while (cells.length % 7 !== 0) {
            const last = cells[cells.length - 1]?.date ?? new Date(year, month, 1);
            const date = new Date(last);
            date.setDate(date.getDate() + 1);
            cells.push({ date, currentMonth: false, isToday: isSameDate(date, new Date()) });
        }
        return cells;
    }, [year, month]);
}
const monthName = (y, m) => new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
const isSameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isWithin = (d, a, b) => {
    if (!a || !b)
        return false;
    const t = +new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const t1 = +new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const t2 = +new Date(b.getFullYear?.() ?? b.getFullYear(), b.getMonth(), b.getDate());
    const [min, max] = t1 <= t2 ? [t1, t2] : [t2, t1];
    return t > min && t < max;
};
const fmtShort = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
function PillInput(props) {
    return (_jsx("input", { ...props, className: [
            "h-10 w-full rounded-xl px-3 text-left text-sm",
            "border border-white/15 bg-white/5 text-white/90 placeholder-white/60",
            "hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-red-600/60",
        ].join(" ") }));
}
function CalendarPopover({ value, onChange, }) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const popRef = useRef(null);
    const now = new Date();
    const [viewY, setViewY] = useState(now.getFullYear());
    const [viewM, setViewM] = useState(now.getMonth());
    const [start, setStart] = useState(value?.start ?? null);
    const [end, setEnd] = useState(value?.end ?? null);
    useEffect(() => {
        setStart(value?.start ?? null);
        setEnd(value?.end ?? null);
    }, [value?.start, value?.end]);
    const cells = useMonthMatrix(viewY, viewM);
    const onPrev = () => {
        const m = viewM - 1;
        setViewM(m < 0 ? 11 : m);
        if (m < 0)
            setViewY((y) => y - 1);
    };
    const onNext = () => {
        const m = viewM + 1;
        setViewM(m > 11 ? 0 : m);
        if (m > 11)
            setViewY((y) => y + 1);
    };
    const onPick = (d) => {
        const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
        if (!start || end) {
            setStart(d);
            setEnd(null);
            onChange?.({ start: d, end: null });
            return;
        }
        const [a, b] = day(d) < day(start) ? [d, start] : [start, d];
        setStart(a);
        setEnd(b);
        onChange?.({ start: a, end: b });
        window.setTimeout(() => setOpen(false), 120);
    };
    const label = start && end ? `${fmtShort(start)} — ${fmtShort(end)}`
        : start ? `${fmtShort(start)} — …`
            : "";
    useEffect(() => {
        function handler(e) {
            if (!open)
                return;
            const t = e.target;
            if (popRef.current && !popRef.current.contains(t) && anchorRef.current && !anchorRef.current.contains(t)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);
    const isSelected = useCallback((d) => (start && isSameDate(d, start)) || (end && isSameDate(d, end)), [start, end]);
    return (_jsxs("div", { ref: anchorRef, className: "relative", children: [_jsx(PillInput, { readOnly: true, value: label, placeholder: "Select dates", onClick: () => setOpen(true), onFocus: () => setOpen(true), role: "combobox", "aria-haspopup": "dialog", "aria-expanded": open, "aria-label": "Select dates" }), _jsx(AnimatePresence, { children: open && (_jsxs(motion.div, { ref: popRef, initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.98 }, transition: { type: "spring", stiffness: 240, damping: 20 }, className: "absolute left-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.92)] shadow-[0_20px_60px_rgba(0,0,0,.45)]", role: "dialog", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.06]", children: [_jsx("button", { onClick: onPrev, className: "grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20", "aria-label": "Previous month", children: _jsx(ChevronLeft, { className: "size-4" }) }), _jsx("div", { className: "text-sm font-semibold", children: monthName(viewY, viewM) }), _jsx("button", { onClick: onNext, className: "grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20", "aria-label": "Next month", children: _jsx(ChevronRight, { className: "size-4" }) })] }), _jsxs("div", { className: "px-3 py-2", children: [_jsx("div", { className: "mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-white/60", children: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (_jsx("div", { className: "py-1", children: d }, d))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: cells.map(({ date, currentMonth, isToday }, idx) => {
                                        const selected = isSelected(date);
                                        const inRange = isWithin(date, start, end);
                                        return (_jsx("button", { onClick: () => onPick(date), className: [
                                                "relative h-10 rounded-lg text-sm",
                                                "border border-white/10",
                                                currentMonth ? "text-white/90" : "text-white/40",
                                                "bg-white/5 hover:bg-white/10",
                                                selected ? "bg-[#E50914] text-white border-[#E50914]" : "",
                                                inRange ? "bg-white/10" : "",
                                                isToday && !selected ? "ring-1 ring-white/30" : "",
                                            ].join(" "), title: date.toDateString(), children: date.getDate() }, idx));
                                    }) }), _jsxs("div", { className: "mt-2 flex items-center justify-between px-1 text-[11px] text-white/60", children: [_jsx("span", { children: "Pick start, then end" }), _jsx("button", { type: "button", className: "underline hover:text-white", onClick: () => { setStart(null); setEnd(null); onChange?.({ start: null, end: null }); }, children: "Clear" })] })] })] })) })] }));
}
const DESTINATIONS = [
    { id: "doha", label: "Doha, Qatar", meta: "Popular • Middle East", emoji: "🏜️", group: "Popular", tokens: "doha qatar middle east" },
    { id: "dubai", label: "Dubai, UAE", meta: "Popular • Middle East", emoji: "🏙️", group: "Popular", tokens: "dubai uae united arab emirates middle east" },
    { id: "paris", label: "Paris, France", meta: "Popular • Europe", emoji: "🗼", group: "Popular", tokens: "paris france europe" },
    { id: "bali", label: "Bali, Indonesia", meta: "Popular • Asia", emoji: "🏖️", group: "Popular", tokens: "bali indonesia asia denpasar" },
    { id: "london", label: "London, United Kingdom", meta: "Popular • Europe", emoji: "🎡", group: "Popular", tokens: "london uk united kingdom england europe" },
    { id: "rome", label: "Rome, Italy", meta: "City • Europe", emoji: "🏛️", group: "Cities", tokens: "rome italy europe" },
    { id: "barcelona", label: "Barcelona, Spain", meta: "City • Europe", emoji: "🏖️", group: "Cities", tokens: "barcelona spain europe" },
    { id: "istanbul", label: "Istanbul, Türkiye", meta: "City • Europe/Asia", emoji: "🕌", group: "Cities", tokens: "istanbul turkey türkiye eurasia" },
    { id: "newyork", label: "New York, USA", meta: "City • North America", emoji: "🗽", group: "Cities", tokens: "new york nyc usa united states america" },
    { id: "tokyo", label: "Tokyo, Japan", meta: "City • Asia", emoji: "🏮", group: "Cities", tokens: "tokyo japan asia" },
    { id: "amalfi", label: "Amalfi Coast, Italy", meta: "Region • Europe", emoji: "🌊", group: "Regions", tokens: "amalfi coast italy europe" },
    { id: "alps", label: "Swiss Alps, Switzerland", meta: "Region • Europe", emoji: "🏔️", group: "Regions", tokens: "swiss alps switzerland europe mountains" },
    { id: "riviera", label: "French Riviera, France", meta: "Region • Europe", emoji: "🌞", group: "Regions", tokens: "french riviera cote d azur france europe nice cannes monaco" },
    { id: "bavaria", label: "Bavaria, Germany", meta: "Region • Europe", emoji: "🏰", group: "Regions", tokens: "bavaria germany europe munich" },
    { id: "maldives", label: "Maldives", meta: "Region • Indian Ocean", emoji: "🏝️", group: "Regions", tokens: "maldives indian ocean resort islands" },
];
function normalize(s) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}
/** CONTROLLED: value = current city string, onChange(cityOnly) updates parent */
function DestinationPicker({ value, onChange, }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(null);
    const rootRef = useRef(null);
    const listRef = useRef(null);
    const filtered = useMemo(() => {
        const q = normalize(value);
        if (!q)
            return DESTINATIONS;
        return DESTINATIONS.filter((d) => d.tokens.includes(q));
    }, [value]);
    const grouped = useMemo(() => {
        const out = { Popular: [], Cities: [], Regions: [] };
        for (const d of filtered)
            out[d.group].push(d);
        return out;
    }, [filtered]);
    useEffect(() => {
        if (!open)
            return;
        if (filtered.length === 0) {
            setActive(null);
            return;
        }
        const current = filtered.find((d) => d.id === active);
        if (!current)
            setActive(filtered[0].id);
    }, [open, filtered, active]);
    useEffect(() => {
        function onDocClick(e) {
            if (!open)
                return;
            const t = e.target;
            if (rootRef.current && !rootRef.current.contains(t))
                setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);
    function onKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) {
                setOpen(true);
                return;
            }
            const idx = filtered.findIndex((d) => d.id === active);
            const next = filtered[Math.min(idx + 1, filtered.length - 1)];
            if (next)
                setActive(next.id);
            scrollIntoView(next?.id);
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) {
                setOpen(true);
                return;
            }
            const idx = filtered.findIndex((d) => d.id === active);
            const prev = filtered[Math.max(idx - 1, 0)];
            if (prev)
                setActive(prev.id);
            scrollIntoView(prev?.id);
        }
        else if (e.key === "Enter") {
            if (!open)
                return;
            e.preventDefault();
            const sel = filtered.find((d) => d.id === active) ?? filtered[0];
            if (sel) {
                const cityOnly = sel.label.split(",")[0];
                onChange(cityOnly);
                setOpen(false);
            }
        }
        else if (e.key === "Escape") {
            if (open) {
                e.preventDefault();
                setOpen(false);
            }
        }
    }
    function scrollIntoView(id) {
        if (!id || !listRef.current)
            return;
        const el = listRef.current.querySelector(`[data-id="${id}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }
    function select(d) {
        const cityOnly = d.label.split(",")[0];
        onChange(cityOnly);
        setOpen(false);
    }
    return (_jsxs("div", { ref: rootRef, className: "relative", children: [_jsx(PillInput, { role: "combobox", "aria-expanded": open, "aria-controls": "destination-listbox", "aria-activedescendant": active ? `dest-${active}` : undefined, placeholder: "Where to?", value: value, onChange: (e) => { onChange(e.target.value); setOpen(true); }, onFocus: () => setOpen(true), onKeyDown: onKeyDown, autoComplete: "off", spellCheck: false }), _jsx(AnimatePresence, { children: open && (_jsxs(motion.div, { initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.98 }, transition: { type: "spring", stiffness: 240, damping: 22 }, className: "absolute left-0 z-50 mt-2 max-h-[320px] w-[min(22.5rem,calc(100vw-2rem))] overflow-auto rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.92)] shadow-[0_20px_60px_rgba(0,0,0,.45)]", id: "destination-listbox", role: "listbox", ref: listRef, children: [["Popular", "Cities", "Regions"].map((g) => {
                            const items = grouped[g];
                            if (!items || items.length === 0)
                                return null;
                            return (_jsxs("div", { className: "px-2 py-2", children: [_jsx("div", { className: "sticky top-0 z-10 -mx-2 mb-2 border-b border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/75", children: g }), items.map((d) => {
                                        const isActive = active === d.id;
                                        const isSelected = normalize(value) === normalize(d.label.split(",")[0]);
                                        return (_jsxs("button", { type: "button", "data-id": d.id, id: `dest-${d.id}`, role: "option", "aria-selected": isSelected, onMouseEnter: () => setActive(d.id), onClick: () => select(d), className: [
                                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                                                "hover:bg-white/10 focus:bg-white/10",
                                                isActive ? "bg-white/10" : "",
                                            ].join(" "), children: [_jsx("span", { className: "text-lg", children: d.emoji ?? "📍" }), _jsxs("span", { className: "flex-1", children: [_jsx("div", { className: "leading-tight", children: d.label }), d.meta && _jsx("div", { className: "text-[11px] text-white/60", children: d.meta })] }), isSelected && _jsx(Check, { className: "size-4 opacity-80" })] }, d.id));
                                    })] }, g));
                        }), filtered.length === 0 && (_jsx("div", { className: "px-4 py-6 text-sm text-white/70", children: "No matches. Try a city, country, or region." }))] })) })] }));
}
const MIN_ADULTS = 1;
const MAX_TOTAL = 10;
function GuestsPopover({ value, onChange, }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const total = value.adults + value.kids;
    const label = useMemo(() => {
        const parts = [];
        parts.push(`${value.adults} ${value.adults === 1 ? "Adult" : "Adults"}`);
        if (value.kids > 0)
            parts.push(`${value.kids} ${value.kids === 1 ? "Kid" : "Kids"}`);
        return parts.join(", ") || "Guests";
    }, [value]);
    useEffect(() => {
        function onDocClick(e) {
            if (!open)
                return;
            const t = e.target;
            if (rootRef.current && !rootRef.current.contains(t))
                setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);
    function bump(key, delta) {
        let next = { adults: value.adults, kids: value.kids };
        if (key === "adults")
            next.adults = Math.max(MIN_ADULTS, value.adults + delta);
        else
            next.kids = Math.max(0, value.kids + delta);
        if (next.adults + next.kids > MAX_TOTAL)
            return;
        onChange(next);
    }
    function Row({ title, note, value, onMinus, onPlus, disabledMinus, disabledPlus }) {
        return (_jsxs("div", { className: "flex items-center justify-between gap-4 py-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm", children: title }), note && _jsx("div", { className: "text-[11px] text-white/60", children: note })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: onMinus, disabled: disabledMinus, className: "grid size-8 place-items-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/20 disabled:opacity-40", "aria-label": `Decrease ${title}`, children: _jsx(Minus, { className: "size-4" }) }), _jsx("div", { className: "w-6 text-center text-sm tabular-nums", children: value }), _jsx("button", { type: "button", onClick: onPlus, disabled: disabledPlus, className: "grid size-8 place-items-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/20 disabled:opacity-40", "aria-label": `Increase ${title}`, children: _jsx(Plus, { className: "size-4" }) })] })] }));
    }
    return (_jsxs("div", { ref: rootRef, className: "relative", children: [_jsx("button", { type: "button", onClick: () => setOpen((v) => !v), className: "h-10 w-full rounded-xl px-3 text-left text-sm border border-white/15 bg-white/5 text-white/90 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-red-600/60", "aria-expanded": open, "aria-haspopup": "dialog", children: label }), _jsx(AnimatePresence, { children: open && (_jsxs(motion.div, { initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.98 }, transition: { type: "spring", stiffness: 240, damping: 20 }, className: "absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.92)] p-3 shadow-[0_20px_60px_rgba(0,0,0,.45)]", role: "dialog", children: [_jsxs("div", { className: "px-1 text-[11px] text-white/60", children: ["Max ", MAX_TOTAL, " guests total"] }), _jsx(Row, { title: "Adults", note: "Ages 13+", value: value.adults, onMinus: () => bump("adults", -1), onPlus: () => bump("adults", +1), disabledMinus: value.adults <= MIN_ADULTS, disabledPlus: total >= MAX_TOTAL }), _jsx(Row, { title: "Kids", note: "Ages 2\u201312", value: value.kids, onMinus: () => bump("kids", -1), onPlus: () => bump("kids", +1), disabledMinus: value.kids <= 0, disabledPlus: total >= MAX_TOTAL }), _jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [_jsx("button", { className: "text-[12px] underline text-white/80 hover:text-white", onClick: () => onChange({ adults: 2, kids: 0 }), children: "Reset" }), _jsx(Button, { className: "h-9 rounded-xl px-4 text-sm", onClick: () => setOpen(false), style: { background: RR.red }, children: "Done" })] })] })) })] }));
}
function BookNowButton({ onClick }) {
    return (_jsxs("button", { type: "button", onClick: onClick, className: "inline-flex items-center gap-2 rounded-2xl bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(229,9,20,0.45)] transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70", children: [_jsx(Zap, { className: "size-4" }), " Book now"] }));
}
/* ------------------------------- STATS STRIP ------------------------------- */
function CountUp({ value, decimals = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
    const mv = useMotionValue(0);
    const rounded = useTransform(mv, (v) => decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString());
    useEffect(() => {
        if (!inView)
            return;
        const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" });
        return () => controls.stop();
    }, [inView, value, mv, decimals]);
    return _jsx(motion.span, { ref: ref, children: rounded });
}
function StatsStrip() {
    const items = [
        { icon: _jsx(Sparkles, { className: "size-5" }), label: "Experiences booked", value: 128_432 },
        { icon: _jsx(TimerReset, { className: "size-5" }), label: "Avg. checkout time", value: 28, suffix: "s" },
        { icon: _jsx(ShieldCheck, { className: "size-5" }), label: "Hotels partnered", value: 960 },
        { icon: _jsx(Star, { className: "size-5" }), label: "Avg. rating", value: 4.9, decimals: 1, suffix: "★" },
    ];
    return (_jsx("section", { className: "px-6 pt-10 text-white", children: _jsx("div", { className: "mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4", children: items.map((it) => (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4", children: [_jsx("div", { className: "grid place-items-center rounded-xl bg-white/10 p-2", children: it.icon }), _jsxs("div", { children: [_jsxs("div", { className: "text-xl font-bold tabular-nums", children: [_jsx(CountUp, { value: it.value, decimals: it.decimals }), it.suffix ?? ""] }), _jsx("div", { className: "text-xs text-white/70", children: it.label })] })] }, it.label))) }) }));
}
function Featured({ cityFilter, guests, dates, }) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const r = await fetch("/api/hotels", { credentials: "include" });
                if (!r.ok) {
                    const maybeJson = await r.json().catch(() => null);
                    const msg = maybeJson?.error ?? `HTTP ${r.status}`;
                    throw new Error(msg);
                }
                const data = await r.json();
                setItems(data);
            }
            catch (e) {
                setError(e?.message || "Failed to load hotels");
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const filtered = useMemo(() => {
        const q = cityFilter.trim().toLowerCase();
        const totalGuests = (guests?.adults ?? 0) + (guests?.kids ?? 0);
        return items.filter((h) => {
            const cityOk = q ? h.city?.toLowerCase().includes(q) : true;
            const capOk = totalGuests > 0 && h.capacity != null
                ? h.capacity >= totalGuests
                : true;
            return cityOk && capOk;
        });
    }, [items, cityFilter, guests]);
    return (_jsx("section", { id: "featured", className: "px-6 py-16 text-white", children: _jsxs("div", { className: "mx-auto max-w-7xl", children: [_jsx("h2", { className: "text-3xl font-bold", children: "Featured stays" }), _jsxs("p", { className: "mb-6 text-white/70", children: [cityFilter ? `Stays in ${cityFilter}` : "Hand-picked hotels", (guests.adults + guests.kids) > 0 ? ` for ${guests.adults + guests.kids} guests` : "", dates.start && dates.end ? ` · ${fmtShort(dates.start)} – ${fmtShort(dates.end)}` : "", "."] }), loading && (_jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: Array.from({ length: 3 }).map((_, i) => (_jsx("div", { className: "h-60 rounded-2xl bg-white/5 animate-pulse border border-white/10" }, i))) })), !loading && error && (_jsxs("div", { className: "mt-2 text-red-400 text-base", children: ["Couldn\u2019t load hotels: ", error] })), !loading && !error && filtered.length === 0 && (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-8 text-center", children: [_jsx("p", { className: "text-lg font-semibold", children: "No stays match that search" }), _jsx("p", { className: "mt-1 text-sm text-white/70", children: "Try another city, or fewer guests." })] })), !loading && !error && filtered.length > 0 && (_jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: filtered.map((h) => {
                        const img = h.images?.[0]?.url || "/images/featured_hotel.avif";
                        const params = new URLSearchParams();
                        if (dates.start)
                            params.set("checkIn", toYMD(dates.start));
                        if (dates.end)
                            params.set("checkOut", toYMD(dates.end));
                        const totalGuests = (guests?.adults ?? 0) + (guests?.kids ?? 0);
                        if (totalGuests > 0)
                            params.set("guests", String(totalGuests));
                        const q = params.toString();
                        return (_jsxs(Link, { to: q ? `/hotels/${h.id}?${q}` : `/hotels/${h.id}`, className: "block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]", title: `View details for ${h.name}`, children: [_jsxs("div", { className: "relative h-60 w-full overflow-hidden", children: [_jsx("img", { src: img, alt: h.images?.[0]?.alt ?? h.name, className: "h-full w-full object-cover", loading: "lazy", decoding: "async" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" }), _jsx("div", { className: "absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs", children: h.city })] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "text-lg font-semibold", children: h.name }), _jsxs("div", { className: "mt-1 flex items-center gap-1 text-sm text-white/80", children: [_jsx(Star, { className: "h-4 w-4 fill-white/80" }), h.rating ?? "—", " \u00B7 Free cancellation"] })] }), _jsxs("div", { className: "shrink-0 text-right", children: [_jsxs("div", { className: "text-xl font-bold", children: ["$", h.price] }), _jsx("div", { className: "text-xs text-white/60", children: "per night" })] })] }), _jsx("div", { className: "mt-4", children: _jsx("span", { className: "inline-flex rounded-xl bg-[#E50914] px-4 py-2 text-sm font-semibold", children: "View stay" }) })] })] }, h.id));
                    }) }))] }) }));
}
/* ----------------------------- Events (DB-driven) -------------------------- */
function formatWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "";
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${date} • ${time}`;
}
function KenBurnsShowcase({ events }) {
    const slides = useMemo(() => (events ?? [])
        .slice(0, 6)
        .map((e) => ({ img: e.imageUrl, title: e.name, sub: `${e.location} • ${formatWhen(e.startsAt)}` })), [events]);
    const seq = slides.length > 0 ? [...slides, ...slides] : [];
    if (seq.length === 0)
        return null;
    return (_jsx("section", { className: "px-6 pb-16 text-white", "aria-label": "Upcoming events", children: _jsx("div", { className: "mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/5", children: _jsx("div", { className: "rr-marquee flex w-max", children: seq.map((s, i) => (_jsxs("div", { className: "relative h-56 w-[70vw] shrink-0 overflow-hidden md:h-72 md:w-[28rem]", children: [_jsx("img", { src: s.img, onError: (e) => { e.currentTarget.src = "/images/fallback.jpg"; }, alt: "", className: "absolute inset-0 h-full w-full object-cover", loading: "lazy", decoding: "async" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" }), _jsxs("div", { className: "absolute bottom-3 left-4 right-4", children: [_jsx("div", { className: "text-sm text-white/80", children: s.sub }), _jsx("div", { className: "text-xl font-semibold", children: s.title })] })] }, `${s.title}-${i}`))) }) }) }));
}
/* Events grid fed from DB */
function EventStrip({ events, loading, error }) {
    return (_jsx("section", { className: "px-6 pb-24 text-white", children: _jsxs("div", { className: "mx-auto max-w-7xl", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-3xl font-bold", children: "Tonight in the city" }), _jsx("p", { className: "text-white/70", children: "Shows and nights out you can book with your stay." })] }), loading && (_jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: Array.from({ length: 3 }).map((_, i) => (_jsx("div", { className: "h-60 rounded-2xl bg-white/5 animate-pulse border border-white/10" }, i))) })), !loading && error && (_jsxs("div", { className: "text-red-400", children: ["Couldn\u2019t load events: ", error] })), !loading && !error && events.length === 0 && (_jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70", children: "No events listed right now." })), !loading && !error && events.length > 0 && (_jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: events.map((e) => _jsx(EventCard, { ev: e }, e.id)) }))] }) }));
}
function Hero({ city, setCity, guests, setGuests, dates, setDates, onSearch, }) {
    // Personalized headline
    const [firstName, setFirstName] = useState(null);
    useEffect(() => {
        const fromLS = (localStorage.getItem("rr_name") || "").trim();
        if (fromLS) {
            setFirstName(fromLS.split(" ")[0]);
            return;
        }
        (async () => {
            try {
                const r = await fetch("/api/auth/me", { credentials: "include" });
                if (r.ok) {
                    const me = await r.json().catch(() => null);
                    const fn = me?.user?.firstName || me?.firstName || me?.user?.name || me?.name;
                    const id = me?.user?.id || me?.id;
                    const email = me?.user?.email || me?.email;
                    if (fn && fn.trim()) {
                        localStorage.setItem("rr_name", fn);
                        setFirstName(fn.split(" ")[0]);
                    }
                    if (id && typeof id === "string")
                        setCookie("uid", id, 7);
                    if (email && typeof email === "string") {
                        localStorage.setItem("rr_email", email);
                        setCookie("email", email, 7);
                    }
                    return;
                }
            }
            catch { }
            const email = (localStorage.getItem("rr_email") || "").trim();
            if (email.includes("@")) {
                const guess = email.split("@")[0];
                if (guess)
                    setFirstName(guess);
            }
        })();
    }, []);
    const headline = `Welcome to RedRoute${firstName ? `,\u00A0${firstName}` : ""}`;
    const ticker = "Doha Jazz Fest  ·  Skyline Luxe Deal  ·  Rooftop Cinema  ·  Live Arena Tour  ·  Theatre Night";
    return (_jsxs("section", { className: "relative isolate bg-black text-white", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_18%_0%,rgba(229,9,20,0.22),transparent_55%)]" }), _jsx("div", { className: "mx-auto w-full max-w-7xl px-4 py-8 md:py-12", children: _jsxs("div", { className: "rounded-[28px] border border-white/12 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,.45)] md:p-8", children: [_jsxs("div", { className: "max-w-3xl space-y-3 md:space-y-4", children: [_jsx(Kinetic, { text: headline, className: "text-4xl md:text-6xl" }), _jsx("p", { className: "max-w-xl text-sm text-white/85 md:text-base", children: "Hotels, events, and experiences. Search once, then book the stay." }), _jsx(BookNowButton, { onClick: onSearch }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-[12px] text-white/75 md:text-sm", children: [_jsx("div", { className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-1", children: "Trusted by 120k+" }), _jsx("div", { className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-1", children: "4.9\u2605 rating" }), _jsx("div", { className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-1", children: "Fast checkout" })] })] }), _jsxs("div", { className: "mt-6 rounded-2xl border border-white/10 bg-white/5 p-3", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end", children: [_jsx(Field, { icon: _jsx(MapPin, { className: "size-4" }), label: "Destination", children: _jsx(DestinationPicker, { value: city, onChange: setCity }) }), _jsx(Field, { icon: _jsx(Calendar, { className: "size-4" }), label: "Dates", children: _jsx(CalendarPopover, { value: dates, onChange: setDates }) }), _jsx(Field, { icon: _jsx(User, { className: "size-4" }), label: "Guests", children: _jsx(GuestsPopover, { value: guests, onChange: (g) => setGuests(g) }) }), _jsx(Field, { label: _jsx("span", { className: "sr-only", children: "Search" }), children: _jsx(Button, { className: "h-10 w-full rounded-xl text-sm", onClick: onSearch, children: "Search" }) })] }), _jsx("div", { className: "mt-3 overflow-hidden rounded-xl border border-white/10", children: _jsxs("div", { className: "rr-marquee flex w-max whitespace-nowrap text-[11px] text-white/80 md:text-xs", children: [_jsx("span", { className: "px-6 py-2", children: ticker }), _jsx("span", { className: "px-6 py-2", "aria-hidden": "true", children: ticker })] }) })] })] }) })] }));
}
/* ------------------------------- PAGE -------------------------------------- */
export default function RedRouteLandingUltra() {
    const navigate = useNavigate();
    // Stop any videos from earlier pages
    useEffect(() => {
        document.querySelectorAll("video").forEach((v) => {
            v.pause();
            v.removeAttribute("src");
            try {
                v.load();
            }
            catch { }
        });
    }, []);
    // ----- Draft (UI) state vs Applied (filter) state -----
    const [cityDraft, setCityDraft] = useState("");
    const [guestsDraft, setGuestsDraft] = useState({ adults: 2, kids: 0 });
    const [datesDraft, setDatesDraft] = useState({ start: null, end: null });
    const [cityApplied, setCityApplied] = useState("");
    const [guestsApplied, setGuestsApplied] = useState({ adults: 0, kids: 0 });
    const [datesApplied, setDatesApplied] = useState({ start: null, end: null });
    const [showTop, setShowTop] = useState(false);
    const doSearch = () => {
        setCityApplied(cityDraft.trim());
        setGuestsApplied(guestsDraft);
        setDatesApplied(datesDraft);
        document.getElementById("featured")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 480);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    // Events state (single fetch used by both marquee + grid)
    const [events, setEvents] = useState([]);
    const [evLoading, setEvLoading] = useState(true);
    const [evError, setEvError] = useState(null);
    useEffect(() => {
        (async () => {
            setEvLoading(true);
            try {
                const r = await fetch("/api/events", { credentials: "include" });
                if (!r.ok) {
                    const maybe = await r.json().catch(() => null);
                    throw new Error(maybe?.error ?? `HTTP ${r.status}`);
                }
                const data = await r.json();
                setEvents(data);
            }
            catch (e) {
                setEvError(e?.message || "Failed to load events");
            }
            finally {
                setEvLoading(false);
            }
        })();
    }, []);
    const logout = () => {
        clearSession();
        try {
            localStorage.removeItem("rr_email");
            deleteCookie("uid");
            deleteCookie("userId");
            deleteCookie("user_id");
            deleteCookie("email");
            deleteCookie("user_email");
        }
        catch { }
        navigate("/login", { replace: true });
    };
    return (_jsxs("div", { className: "min-h-screen w-full bg-black font-sans text-white", children: [_jsx(ScrollProgress, {}), _jsxs("header", { className: "sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-zinc-950 px-4 py-3", children: [_jsx(Link, { to: "/home", className: "text-lg font-black tracking-tight", children: "RedRoute" }), _jsxs("button", { type: "button", onClick: logout, className: "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70", children: [_jsx(LogOut, { className: "size-4" }), " Log out"] })] }), _jsx(Hero, { city: cityDraft, setCity: setCityDraft, guests: guestsDraft, setGuests: setGuestsDraft, dates: datesDraft, setDates: setDatesDraft, onSearch: doSearch }), _jsx(StatsStrip, {}), _jsx(Featured, { cityFilter: cityApplied, guests: guestsApplied, dates: datesApplied }), _jsx(KenBurnsShowcase, { events: events }), _jsx(EventStrip, { events: events, loading: evLoading, error: evError }), _jsx(Testimonials, {}), _jsx(SiteFooter, {}), showTop && (_jsx("button", { type: "button", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }), className: "fixed bottom-6 right-6 grid h-12 w-12 place-items-center rounded-full bg-[#E50914] shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70", "aria-label": "Back to top", children: _jsx(ChevronUp, { className: "size-6 text-white" }) }))] }));
}
/* --------------------------- Testimonials / Footer ------------------------- */
function Testimonials() {
    const quotes = [
        { name: "Aman Mehra", role: "Product Lead", text: "RedRoute feels like a movie trailer — fast, beautiful, and I’m checked out in seconds.", initials: "AM", rating: 5 },
        { name: "Sara Khan", role: "Event Planner", text: "Searching hotels + events in one flow is brilliant. The micro-interactions are 👌", initials: "SK", rating: 5 },
    ];
    return (_jsx("section", { className: "px-6 pb-16 text-white", children: _jsxs("div", { className: "mx-auto max-w-7xl", children: [_jsx("h2", { className: "mb-6 text-3xl font-bold", children: "What people say" }), _jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-2", children: quotes.map((q) => (_jsx("div", { className: "rounded-3xl border border-white/10 bg-white/5 p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "grid h-12 w-12 place-items-center rounded-full bg-white/15 text-sm font-semibold", children: q.initials }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "mb-2 flex gap-1 text-white/90", children: Array.from({ length: q.rating }).map((_, i) => (_jsx(Star, { className: "h-4 w-4 fill-white/90" }, i))) }), _jsx("p", { className: "text-white/85", children: q.text }), _jsxs("div", { className: "mt-3 text-sm text-white/70", children: [q.name, " \u2022 ", q.role] })] })] }) }, q.name))) })] }) }));
}
function SiteFooter() {
    const year = new Date().getFullYear();
    return (_jsx("footer", { className: "px-6 pb-16 pt-10 text-white", children: _jsxs("div", { className: "mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-6", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-black", children: "RedRoute" }), _jsx("div", { className: "text-white/70", children: "Hotels \u00B7 Events \u00B7 Experiences" })] }), _jsxs("div", { className: "mt-6 border-t border-white/10 pt-4 text-sm text-white/60", children: ["\u00A9 ", year, " RedRoute. All rights reserved."] })] }) }));
}
