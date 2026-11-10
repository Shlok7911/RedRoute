// src/RedRouteLandingUltra.tsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  useScroll,
  useInView,
  animate,
  AnimatePresence,
} from "framer-motion";
import { Button } from "./components/ui/button";
import {
  Calendar,
  MapPin,
  User,
  Star,
  Zap,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  TimerReset,
  ShieldCheck,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { clearSession } from "./session";
import EventCard, { type EventItem } from "./components/EventCard";

/* --------------------- cookie helpers (kept) --------------------- */
function setCookie(name: string, value: string, days = 7) {
  const maxAge = `Max-Age=${days * 24 * 60 * 60}`;
  const sameSite = "SameSite=Lax";
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? " Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; ${maxAge}; ${sameSite};${secure}`;
}
function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

const RR = { red: "#E50914" } as const;

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* --------------------------- KINETIC HEADLINE ------------------------------ */
function Kinetic({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <h1 className={`font-black leading-[1.05] tracking-tight ${className}`}>
      {words.map((w, wi) => (
        <motion.span
          key={`${w}-${wi}`}
          initial={{ y: "0.3em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.045 * wi, duration: 0.35, ease: "easeOut" }}
          className="mr-[0.28em] inline-block whitespace-nowrap last:mr-0"
        >
          {w}
        </motion.span>
      ))}
    </h1>
  );
}

/* ---------------------------- FIELD WRAPPER -------------------------------- */
function Field({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div role="group" className="flex flex-col gap-2 rounded-2xl p-2 text-white/90">
      <div className="flex items-center gap-2 text-sm opacity-80 min-h-[20px]">
        {icon != null && (
          <span className="grid place-content-center rounded-md border border-white/15 bg-white/10 p-1">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

/* ------------------------- SCROLL PROGRESS BAR ----------------------------- */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-[#E50914]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

/* ----------------------- THEMED CALENDAR POPOVER (controlled) -------------- */
type DayCell = { date: Date; currentMonth: boolean; isToday: boolean };

function useMonthMatrix(year: number, month: number) {
  return useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: DayCell[] = [];
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
const monthName = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isWithin = (d: Date, a: Date | null, b: Date | null) => {
  if (!a || !b) return false;
  const t = +new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const t1 = +new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const t2 = +new Date(b.getFullYear?.() ?? b.getFullYear(), b.getMonth(), b.getDate());
  const [min, max] = t1 <= t2 ? [t1, t2] : [t2, t1];
  return t > min && t < max;
};
const fmtShort = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

function PillInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-xl px-3 text-left text-sm",
        "border border-white/15 bg-white/5 text-white/90 placeholder-white/60",
        "hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-red-600/60",
      ].join(" ")}
    />
  );
}

function CalendarPopover({
  value,
  onChange,
}: {
  value?: { start: Date | null; end: Date | null };
  onChange?: (v: { start: Date | null; end: Date | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const now = new Date();
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());

  const [start, setStart] = useState<Date | null>(value?.start ?? null);
  const [end, setEnd] = useState<Date | null>(value?.end ?? null);

  useEffect(() => {
    setStart(value?.start ?? null);
    setEnd(value?.end ?? null);
  }, [value?.start, value?.end]);

  const cells = useMonthMatrix(viewY, viewM);

  const onPrev = () => {
    const m = viewM - 1;
    setViewM(m < 0 ? 11 : m);
    if (m < 0) setViewY((y) => y - 1);
  };
  const onNext = () => {
    const m = viewM + 1;
    setViewM(m > 11 ? 0 : m);
    if (m > 11) setViewY((y) => y + 1);
  };

  const onPick = (d: Date) => {
    const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
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

  const label =
    start && end ? `${fmtShort(start)} — ${fmtShort(end)}`
      : start ? `${fmtShort(start)} — …`
      : "";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current && !popRef.current.contains(t) && anchorRef.current && !anchorRef.current.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isSelected = useCallback(
    (d: Date) => (start && isSameDate(d, start)) || (end && isSameDate(d, end)),
    [start, end]
  );

  return (
    <div ref={anchorRef} className="relative">
      <PillInput
        readOnly
        value={label}
        placeholder="Select dates"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Select dates"
      />

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="absolute left-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.92)] shadow-[0_20px_60px_rgba(0,0,0,.45)]"
            role="dialog"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.06]">
              <button
                onClick={onPrev}
                className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="text-sm font-semibold">{monthName(viewY, viewM)}</div>
              <button
                onClick={onNext}
                className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="px-3 py-2">
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-white/60">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (<div key={d} className="py-1">{d}</div>))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map(({ date, currentMonth, isToday }, idx) => {
                  const selected = isSelected(date);
                  const inRange = isWithin(date, start, end);
                  return (
                    <button
                      key={idx}
                      onClick={() => onPick(date)}
                      className={[
                        "relative h-10 rounded-lg text-sm",
                        "border border-white/10",
                        currentMonth ? "text-white/90" : "text-white/40",
                        "bg-white/5 hover:bg-white/10",
                        selected ? "bg-[#E50914] text-white border-[#E50914]" : "",
                        inRange ? "bg-white/10" : "",
                        isToday && !selected ? "ring-1 ring-white/30" : "",
                      ].join(" ")}
                      title={date.toDateString()}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-white/60">
                <span>Pick start, then end</span>
                <button type="button" className="underline hover:text-white" onClick={() => { setStart(null); setEnd(null); onChange?.({ start: null, end: null }); }}>
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------ DESTINATION PICKER ---------------- */
type Destination = {
  id: string;
  label: string;
  meta?: string;
  emoji?: string;
  group: "Popular" | "Cities" | "Regions";
  tokens: string;
};

const DESTINATIONS: Destination[] = [
  { id: "doha",     label: "Doha, Qatar",            meta: "Popular • Middle East", emoji: "🏜️", group: "Popular", tokens: "doha qatar middle east" },
  { id: "dubai",    label: "Dubai, UAE",             meta: "Popular • Middle East", emoji: "🏙️", group: "Popular", tokens: "dubai uae united arab emirates middle east" },
  { id: "paris",    label: "Paris, France",          meta: "Popular • Europe",      emoji: "🗼", group: "Popular", tokens: "paris france europe" },
  { id: "bali",     label: "Bali, Indonesia",        meta: "Popular • Asia",        emoji: "🏖️", group: "Popular", tokens: "bali indonesia asia denpasar" },
  { id: "london",   label: "London, United Kingdom", meta: "Popular • Europe",      emoji: "🎡", group: "Popular", tokens: "london uk united kingdom england europe" },
  { id: "rome",     label: "Rome, Italy",            meta: "City • Europe",  emoji: "🏛️", group: "Cities",  tokens: "rome italy europe" },
  { id: "barcelona",label: "Barcelona, Spain",       meta: "City • Europe",  emoji: "🏖️", group: "Cities",  tokens: "barcelona spain europe" },
  { id: "istanbul", label: "Istanbul, Türkiye",      meta: "City • Europe/Asia", emoji: "🕌", group: "Cities", tokens: "istanbul turkey türkiye eurasia" },
  { id: "newyork",  label: "New York, USA",          meta: "City • North America", emoji: "🗽", group: "Cities", tokens: "new york nyc usa united states america" },
  { id: "tokyo",    label: "Tokyo, Japan",           meta: "City • Asia",    emoji: "🏮", group: "Cities",  tokens: "tokyo japan asia" },
  { id: "amalfi",   label: "Amalfi Coast, Italy",    meta: "Region • Europe", emoji: "🌊", group: "Regions", tokens: "amalfi coast italy europe" },
  { id: "alps",     label: "Swiss Alps, Switzerland",meta: "Region • Europe", emoji: "🏔️", group: "Regions", tokens: "swiss alps switzerland europe mountains" },
  { id: "riviera",  label: "French Riviera, France", meta: "Region • Europe", emoji: "🌞", group: "Regions", tokens: "french riviera cote d azur france europe nice cannes monaco" },
  { id: "bavaria",  label: "Bavaria, Germany",       meta: "Region • Europe", emoji: "🏰", group: "Regions", tokens: "bavaria germany europe munich" },
  { id: "maldives", label: "Maldives",               meta: "Region • Indian Ocean", emoji: "🏝️", group: "Regions", tokens: "maldives indian ocean resort islands" },
];

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** CONTROLLED: value = current city string, onChange(cityOnly) updates parent */
function DestinationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (city: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter((d) => d.tokens.includes(q));
  }, [value]);

  const grouped = useMemo(() => {
    const out: Record<Destination["group"], Destination[]> = { Popular: [], Cities: [], Regions: [] };
    for (const d of filtered) out[d.group].push(d);
    return out;
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    if (filtered.length === 0) { setActive(null); return; }
    const current = filtered.find((d) => d.id === active);
    if (!current) setActive(filtered[0].id);
  }, [open, filtered, active]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const idx = filtered.findIndex((d) => d.id === active);
      const next = filtered[Math.min(idx + 1, filtered.length - 1)];
      if (next) setActive(next.id);
      scrollIntoView(next?.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const idx = filtered.findIndex((d) => d.id === active);
      const prev = filtered[Math.max(idx - 1, 0)];
      if (prev) setActive(prev.id);
      scrollIntoView(prev?.id);
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const sel = filtered.find((d) => d.id === active) ?? filtered[0];
      if (sel) {
        const cityOnly = sel.label.split(",")[0];
        onChange(cityOnly);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); }
    }
  }

  function scrollIntoView(id?: string) {
    if (!id || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLButtonElement>(`[data-id="${id}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }

  function select(d: Destination) {
    const cityOnly = d.label.split(",")[0];
    onChange(cityOnly);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <PillInput
        role="combobox"
        aria-expanded={open}
        aria-controls="destination-listbox"
        aria-activedescendant={active ? `dest-${active}` : undefined}
        placeholder="Where to?"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="absolute left-0 z-50 mt-2 max-h-[320px] w-[min(22.5rem,calc(100vw-2rem))] overflow-auto rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.92)] shadow-[0_20px_60px_rgba(0,0,0,.45)]"
            id="destination-listbox"
            role="listbox"
            ref={listRef}
          >
            {["Popular", "Cities", "Regions"].map((g) => {
              const items = (grouped as any)[g] as Destination[];
              if (!items || items.length === 0) return null;
              return (
                <div key={g} className="px-2 py-2">
                  <div className="sticky top-0 z-10 -mx-2 mb-2 border-b border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/75">
                    {g}
                  </div>
                  {items.map((d) => {
                    const isActive = active === d.id;
                    const isSelected = normalize(value) === normalize(d.label.split(",")[0]);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        data-id={d.id}
                        id={`dest-${d.id}`}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActive(d.id)}
                        onClick={() => select(d)}
                        className={[
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                          "hover:bg-white/10 focus:bg-white/10",
                          isActive ? "bg-white/10" : "",
                        ].join(" ")}
                      >
                        <span className="text-lg">{d.emoji ?? "📍"}</span>
                        <span className="flex-1">
                          <div className="leading-tight">{d.label}</div>
                          {d.meta && <div className="text-[11px] text-white/60">{d.meta}</div>}
                        </span>
                        {isSelected && <Check className="size-4 opacity-80" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-sm text-white/70">No matches. Try a city, country, or region.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- GUESTS POPOVER (adults/kids) ---------------------- */
type Guests = { adults: number; kids: number };
const MIN_ADULTS = 1;
const MAX_TOTAL = 10;

function GuestsPopover({
  value,
  onChange,
}: {
  value: Guests;
  onChange: (g: Guests) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const total = value.adults + value.kids;
  const label = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${value.adults} ${value.adults === 1 ? "Adult" : "Adults"}`);
    if (value.kids > 0) parts.push(`${value.kids} ${value.kids === 1 ? "Kid" : "Kids"}`);
    return parts.join(", ") || "Guests";
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function bump(key: keyof Guests, delta: number) {
    let next: Guests = { adults: value.adults, kids: value.kids };
    if (key === "adults") next.adults = Math.max(MIN_ADULTS, value.adults + delta);
    else next.kids = Math.max(0, value.kids + delta);
    if (next.adults + next.kids > MAX_TOTAL) return;
    onChange(next);
  }

  function Row({ title, note, value, onMinus, onPlus, disabledMinus, disabledPlus }: {
    title: string; note?: string; value: number;
    onMinus: () => void; onPlus: () => void;
    disabledMinus?: boolean; disabledPlus?: boolean;
  }) {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        <div>
          <div className="text-sm">{title}</div>
          {note && <div className="text-[11px] text-white/60">{note}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinus}
            disabled={disabledMinus}
            className="grid size-8 place-items-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/20 disabled:opacity-40"
            aria-label={`Decrease ${title}`}
          >
            <Minus className="size-4" />
          </button>
          <div className="w-6 text-center text-sm tabular-nums">{value}</div>
          <button
            type="button"
            onClick={onPlus}
            disabled={disabledPlus}
            className="grid size-8 place-items-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/20 disabled:opacity-40"
            aria-label={`Increase ${title}`}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-full rounded-xl px-3 text-left text-sm border border-white/15 bg-white/5 text-white/90 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-red-600/60"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.92)] p-3 shadow-[0_20px_60px_rgba(0,0,0,.45)]"
            role="dialog"
          >
            <div className="px-1 text-[11px] text-white/60">Max {MAX_TOTAL} guests total</div>
            <Row
              title="Adults"
              note="Ages 13+"
              value={value.adults}
              onMinus={() => bump("adults", -1)}
              onPlus={() => bump("adults", +1)}
              disabledMinus={value.adults <= MIN_ADULTS}
              disabledPlus={total >= MAX_TOTAL}
            />
            <Row
              title="Kids"
              note="Ages 2–12"
              value={value.kids}
              onMinus={() => bump("kids", -1)}
              onPlus={() => bump("kids", +1)}
              disabledMinus={value.kids <= 0}
              disabledPlus={total >= MAX_TOTAL}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                className="text-[12px] underline text-white/80 hover:text-white"
                onClick={() => onChange({ adults: 2, kids: 0 })}
              >
                Reset
              </button>
              <Button
                className="h-9 rounded-xl px-4 text-sm"
                onClick={() => setOpen(false)}
                style={{ background: RR.red }}
              >
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookNowButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(229,9,20,0.45)] transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <Zap className="size-4" /> Book now
    </button>
  );
}

/* ------------------------------- STATS STRIP ------------------------------- */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, value, mv, decimals]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function StatsStrip() {
  const items: {
    icon: React.ReactNode;
    label: string;
    value: number;
    decimals?: number;
    suffix?: string;
  }[] = [
    { icon: <Sparkles className="size-5" />, label: "Experiences booked", value: 128_432 },
    { icon: <TimerReset className="size-5" />, label: "Avg. checkout time", value: 28, suffix: "s" },
    { icon: <ShieldCheck className="size-5" />, label: "Hotels partnered", value: 960 },
    { icon: <Star className="size-5" />, label: "Avg. rating", value: 4.9, decimals: 1, suffix: "★" },
  ];
  return (
    <section className="px-6 pt-10 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid place-items-center rounded-xl bg-white/10 p-2">{it.icon}</div>
            <div>
              <div className="text-xl font-bold tabular-nums">
                <CountUp value={it.value} decimals={it.decimals} />
                {it.suffix ?? ""}
              </div>
              <div className="text-xs text-white/70">{it.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Featured (Hotels) ------------------------ */
type HotelImage = { id: string; url: string; alt?: string | null };
type Hotel = {
  id: string;
  name: string;
  city: string;
  price: number;
  rating: number | null;
  capacity?: number | null;
  images: HotelImage[];
};

function Featured({
  cityFilter,
  guests,
  dates,
}: {
  cityFilter: string;
  guests: Guests;
  dates: { start: Date | null; end: Date | null };
}) {
  const [items, setItems] = React.useState<Hotel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
        const data: Hotel[] = await r.json();
        setItems(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = cityFilter.trim().toLowerCase();
    const totalGuests = (guests?.adults ?? 0) + (guests?.kids ?? 0);
    return items.filter((h) => {
      const cityOk = q ? h.city?.toLowerCase().includes(q) : true;
      const capOk =
        totalGuests > 0 && h.capacity != null
          ? h.capacity >= totalGuests
          : true;
      return cityOk && capOk;
    });
  }, [items, cityFilter, guests]);

  return (
    <section id="featured" className="px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold">Featured stays</h2>
        <p className="mb-6 text-white/70">
          {cityFilter ? `Stays in ${cityFilter}` : "Hand-picked hotels"}
          {(guests.adults + guests.kids) > 0 ? ` for ${guests.adults + guests.kids} guests` : ""}
          {dates.start && dates.end ? ` · ${fmtShort(dates.start)} – ${fmtShort(dates.end)}` : ""}
          .
        </p>

        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-2 text-red-400 text-base">
            Couldn’t load hotels: {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-semibold">No stays match that search</p>
            <p className="mt-1 text-sm text-white/70">Try another city, or fewer guests.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {filtered.map((h) => {
              const img = h.images?.[0]?.url || "/images/featured_hotel.avif";
              const params = new URLSearchParams();
              if (dates.start && dates.end) {
                const [inDay, outDay] = +dates.start <= +dates.end
                  ? [dates.start, dates.end]
                  : [dates.end, dates.start];
                params.set("checkIn", toYMD(inDay));
                params.set("checkOut", toYMD(outDay));
              }
              const totalGuests = (guests?.adults ?? 0) + (guests?.kids ?? 0);
              if (totalGuests > 0) params.set("guests", String(totalGuests));
              const q = params.toString();
              return (
                <Link
                  key={h.id}
                  to={q ? `/hotels/${h.id}?${q}` : `/hotels/${h.id}`}
                  className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
                  title={`View details for ${h.name}`}
                >
                  <div className="relative h-60 w-full overflow-hidden">
                    <img
                      src={img}
                      alt={h.images?.[0]?.alt ?? h.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs">
                      {h.city}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{h.name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                          <Star className="h-4 w-4 fill-white/80" />
                          {h.rating ?? "—"} · Free cancellation
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xl font-bold">${h.price}</div>
                        <div className="text-xs text-white/60">per night</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="inline-flex rounded-xl bg-[#E50914] px-4 py-2 text-sm font-semibold">
                        View stay
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------- Events (DB-driven) -------------------------- */
function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

function KenBurnsShowcase({ events }: { events: EventItem[] }) {
  const slides = useMemo(
    () =>
      (events ?? [])
        .slice(0, 6)
        .map((e) => ({ img: e.imageUrl, title: e.name, sub: `${e.location} • ${formatWhen(e.startsAt)}` })),
    [events]
  );
  const seq = slides.length > 0 ? [...slides, ...slides] : [];
  if (seq.length === 0) return null;

  return (
    <section className="px-6 pb-16 text-white" aria-label="Upcoming events">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="rr-marquee flex w-max">
          {seq.map((s, i) => (
            <div key={`${s.title}-${i}`} className="relative h-56 w-[70vw] shrink-0 overflow-hidden md:h-72 md:w-[28rem]">
              <img
                src={s.img}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/fallback.jpg"; }}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-sm text-white/80">{s.sub}</div>
                <div className="text-xl font-semibold">{s.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Events grid fed from DB */
function EventStrip({ events, loading, error }: { events: EventItem[]; loading: boolean; error: string | null }) {
  return (
    <section className="px-6 pb-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Tonight in the city</h2>
          <p className="text-white/70">Shows and nights out you can book with your stay.</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-red-400">Couldn’t load events: {error}</div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No events listed right now.
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {events.map((e) => <EventCard key={e.id} ev={e} />)}
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------- HERO (no live filter; commit on Search) ----- */
type DatesState = { start: Date | null; end: Date | null };
function Hero({
  city, setCity,
  guests, setGuests,
  dates, setDates,
  onSearch,
}: {
  city: string;
  setCity: (c: string) => void;
  guests: Guests;
  setGuests: (g: Guests | ((prev: Guests) => Guests)) => void;
  dates: DatesState;
  setDates: (v: DatesState) => void;
  onSearch: () => void;
}) {
  // Personalized headline
  const [firstName, setFirstName] = useState<string | null>(null);
  useEffect(() => {
    const fromLS = (localStorage.getItem("rr_name") || "").trim();
    if (fromLS) { setFirstName(fromLS.split(" ")[0]); return; }
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" });
        if (r.ok) {
          const me = await r.json().catch(() => null);
          const fn: string | undefined =
            me?.user?.firstName || me?.firstName || me?.user?.name || me?.name;
          const id: string | undefined = me?.user?.id || me?.id;
          const email: string | undefined = me?.user?.email || me?.email;

          if (fn && fn.trim()) { localStorage.setItem("rr_name", fn); setFirstName(fn.split(" ")[0]); }
          if (id && typeof id === "string") setCookie("uid", id, 7);
          if (email && typeof email === "string") { localStorage.setItem("rr_email", email); setCookie("email", email, 7); }
          return;
        }
      } catch {}
      const email = (localStorage.getItem("rr_email") || "").trim();
      if (email.includes("@")) {
        const guess = email.split("@")[0];
        if (guess) setFirstName(guess);
      }
    })();
  }, []);

  const headline = `Welcome to RedRoute${firstName ? `,\u00A0${firstName}` : ""}`;
  const ticker = "Doha Jazz Fest  ·  Skyline Luxe Deal  ·  Rooftop Cinema  ·  Live Arena Tour  ·  Theatre Night";

  return (
    <section className="relative isolate bg-black text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_18%_0%,rgba(229,9,20,0.22),transparent_55%)]" />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12">
        <div className="rounded-[28px] border border-white/12 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,.45)] md:p-8">
          <div className="max-w-3xl space-y-3 md:space-y-4">
            <Kinetic text={headline} className="text-4xl md:text-6xl" />
            <p className="max-w-xl text-sm text-white/85 md:text-base">
              Hotels, events, and experiences. Search once, then book the stay.
            </p>
            <BookNowButton onClick={onSearch} />
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/75 md:text-sm">
              <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Trusted by 120k+</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">4.9★ rating</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Fast checkout</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <Field icon={<MapPin className="size-4" />} label="Destination">
                <DestinationPicker value={city} onChange={setCity} />
              </Field>
              <Field icon={<Calendar className="size-4" />} label="Dates">
                <CalendarPopover value={dates} onChange={setDates} />
              </Field>
              <Field icon={<User className="size-4" />} label="Guests">
                <GuestsPopover value={guests} onChange={(g) => setGuests(g)} />
              </Field>
              <Field label={<span className="sr-only">Search</span>}>
                <Button className="h-10 w-full rounded-xl text-sm" onClick={onSearch}>
                  Search
                </Button>
              </Field>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <div className="rr-marquee flex w-max whitespace-nowrap text-[11px] text-white/80 md:text-xs">
                <span className="px-6 py-2">{ticker}</span>
                <span className="px-6 py-2" aria-hidden="true">{ticker}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- PAGE -------------------------------------- */
export default function RedRouteLandingUltra() {
  const navigate = useNavigate();

  // Stop any videos from earlier pages
  useEffect(() => {
    document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      try { v.load(); } catch {}
    });
  }, []);

  // ----- Draft (UI) state vs Applied (filter) state -----
  const [cityDraft, setCityDraft] = useState("");
  const [guestsDraft, setGuestsDraft] = useState<Guests>({ adults: 2, kids: 0 });
  const [datesDraft, setDatesDraft] = useState<DatesState>({ start: null, end: null });

  const [cityApplied, setCityApplied] = useState("");
  const [guestsApplied, setGuestsApplied] = useState<Guests>({ adults: 0, kids: 0 });
  const [datesApplied, setDatesApplied] = useState<DatesState>({ start: null, end: null });
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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [evLoading, setEvLoading] = useState(true);
  const [evError, setEvError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setEvLoading(true);
      try {
        const r = await fetch("/api/events", { credentials: "include" });
        if (!r.ok) {
          const maybe = await r.json().catch(() => null);
          throw new Error(maybe?.error ?? `HTTP ${r.status}`);
        }
        const data: EventItem[] = await r.json();
        setEvents(data);
      } catch (e: any) {
        setEvError(e?.message || "Failed to load events");
      } finally {
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
    } catch {}
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-black font-sans text-white">
      <ScrollProgress />

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-zinc-950 px-4 py-3">
        <Link to="/home" className="text-lg font-black tracking-tight">RedRoute</Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <LogOut className="size-4" /> Log out
        </button>
      </header>

      <Hero
        city={cityDraft}
        setCity={setCityDraft}
        guests={guestsDraft}
        setGuests={setGuestsDraft}
        dates={datesDraft}
        setDates={setDatesDraft}
        onSearch={doSearch}
      />
      <StatsStrip />

      <Featured cityFilter={cityApplied} guests={guestsApplied} dates={datesApplied} />

      <KenBurnsShowcase events={events} />

      <EventStrip events={events} loading={evLoading} error={evError} />

      <Testimonials />
      <SiteFooter />

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 grid h-12 w-12 place-items-center rounded-full bg-[#E50914] shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Back to top"
        >
          <ChevronUp className="size-6 text-white" />
        </button>
      )}
    </div>
  );
}

/* --------------------------- Testimonials / Footer ------------------------- */
function Testimonials() {
  const quotes = [
    { name: "Aman Mehra", role: "Product Lead", text: "RedRoute feels like a movie trailer — fast, beautiful, and I’m checked out in seconds.", initials: "AM", rating: 5 },
    { name: "Sara Khan", role: "Event Planner", text: "Searching hotels + events in one flow is brilliant. The micro-interactions are 👌", initials: "SK", rating: 5 },
  ];
  return (
    <section className="px-6 pb-16 text-white">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-3xl font-bold">What people say</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {quotes.map((q) => (
            <div key={q.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-sm font-semibold">{q.initials}</div>
                <div className="flex-1">
                  <div className="mb-2 flex gap-1 text-white/90">
                    {Array.from({ length: q.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-white/90" />
                    ))}
                  </div>
                  <p className="text-white/85">{q.text}</p>
                  <div className="mt-3 text-sm text-white/70">
                    {q.name} • {q.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="px-6 pb-16 pt-10 text-white">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <div className="text-2xl font-black">RedRoute</div>
          <div className="text-white/70">Hotels · Events · Experiences</div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/60">
          © {year} RedRoute. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
