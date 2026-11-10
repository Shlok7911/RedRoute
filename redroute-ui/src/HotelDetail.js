import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, MapPin, Minus, Plus, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
/* -------------------- auth helper (for posting reviews) -------------------- */
async function getMe() {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (!r.ok)
        throw new Error("Not authenticated");
    const me = await r.json().catch(() => ({}));
    return {
        id: me?.user?.id ?? me?.id ?? null,
        email: me?.user?.email ?? me?.email ?? null,
        firstName: me?.user?.firstName ?? me?.firstName ?? null,
        lastName: me?.user?.lastName ?? me?.lastName ?? null,
    };
}
function authHeadersFrom(me) {
    const h = {};
    if (me.id)
        h["x-user-id"] = String(me.id);
    if (me.email)
        h["x-user-email"] = String(me.email);
    return h;
}
function plusDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function fmtDateYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function initials(name, email) {
    const n = (name || "").trim();
    if (n) {
        const parts = n.split(/\s+/);
        return (parts[0][0] || "") + (parts[1]?.[0] || "");
    }
    const e = (email || "").trim();
    return e ? e[0]?.toUpperCase() || "U" : "U";
}
function Stars({ value, size = 16 }) {
    const full = Math.floor(value);
    const hasHalf = value - full >= 0.5;
    const arr = [0, 1, 2, 3, 4];
    return (_jsxs("span", { className: "inline-flex items-center gap-0.5", title: `${value.toFixed(1)} / 5`, children: [arr.map((i) => (_jsx(Star, { width: size, height: size, stroke: "currentColor", fill: i < full ? "currentColor" : hasHalf && i === full ? "url(#half)" : "none" }, i))), _jsx("svg", { width: "0", height: "0", children: _jsx("defs", { children: _jsxs("linearGradient", { id: "half", children: [_jsx("stop", { offset: "50%", stopColor: "currentColor" }), _jsx("stop", { offset: "50%", stopColor: "transparent" })] }) }) })] }));
}
const isSameDate = (a, b) => a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
const isWithin = (d, a, b) => {
    if (!a || !b)
        return false;
    const t = +new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const t1 = +new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const t2 = +new Date(b.getFullYear(), b.getMonth(), b.getDate());
    const [min, max] = t1 <= t2 ? [t1, t2] : [t2, t1];
    return t > min && t < max;
};
const fmtShort = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
function DateRangePopover({ startYMD, endYMD, onChange, placeholder = "Select dates", }) {
    const anchorRef = useRef(null);
    const popRef = useRef(null);
    const [open, setOpen] = useState(false);
    const initStart = startYMD ? new Date(startYMD) : null;
    const initEnd = endYMD ? new Date(endYMD) : null;
    const [start, setStart] = useState(initStart);
    const [end, setEnd] = useState(initEnd);
    useEffect(() => {
        setStart(startYMD ? new Date(startYMD) : null);
        setEnd(endYMD ? new Date(endYMD) : null);
    }, [startYMD, endYMD]);
    const now = new Date();
    const [viewY, setViewY] = useState((start ?? now).getFullYear());
    const [viewM, setViewM] = useState((start ?? now).getMonth());
    const cells = useMonthMatrix(viewY, viewM);
    const monthName = (y, m) => new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
    const label = start && end ? `${fmtShort(start)} — ${fmtShort(end)}` : start ? `${fmtShort(start)} — …` : "";
    const onPrev = () => {
        const m = viewM - 1;
        if (m < 0) {
            setViewM(11);
            setViewY((y) => y - 1);
        }
        else
            setViewM(m);
    };
    const onNext = () => {
        const m = viewM + 1;
        if (m > 11) {
            setViewM(0);
            setViewY((y) => y + 1);
        }
        else
            setViewM(m);
    };
    const onPick = (d) => {
        if (!start || (start && end)) {
            setStart(d);
            setEnd(null);
        }
        else {
            const newStart = start;
            const newEnd = d;
            setEnd(d);
            setTimeout(() => {
                onChange(fmtDateYMD(newStart), fmtDateYMD(newEnd));
                setOpen(false);
            }, 80);
        }
    };
    useEffect(() => {
        function handler(e) {
            if (!open)
                return;
            const t = e.target;
            if (popRef.current &&
                !popRef.current.contains(t) &&
                anchorRef.current &&
                !anchorRef.current.contains(t)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);
    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const selected = (d) => (start && isSameDate(d, start)) || (end && isSameDate(d, end));
    const inRange = (d) => isWithin(d, start, end);
    return (_jsxs("div", { ref: anchorRef, className: "relative", children: [_jsx("button", { type: "button", className: "h-10 w-full rounded-xl px-3 text-left text-sm border border-white/15 bg-white/5 text-white/90 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-red-600/60", onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": open, children: label || placeholder }), _jsx(AnimatePresence, { children: open && (_jsxs(motion.div, { ref: popRef, initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.98 }, transition: { type: "spring", stiffness: 240, damping: 20 }, className: "absolute z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-white/12 bg-[rgba(0,0,0,0.7)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.45)]", role: "dialog", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.06]", children: [_jsx("button", { onClick: onPrev, className: "grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20", "aria-label": "Previous month", children: _jsx(ChevronLeft, { className: "size-4" }) }), _jsx("div", { className: "text-sm font-semibold", children: monthName(viewY, viewM) }), _jsx("button", { onClick: onNext, className: "grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20", "aria-label": "Next month", children: _jsx(ChevronRight, { className: "size-4" }) })] }), _jsxs("div", { className: "px-3 py-2", children: [_jsx("div", { className: "mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-white/60", children: dow.map((d) => (_jsx("div", { className: "py-1", children: d }, d))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: cells.map(({ date, currentMonth, isToday }, idx) => (_jsx("button", { onClick: () => onPick(date), className: [
                                            "relative h-10 rounded-lg text-sm",
                                            "border border-white/10",
                                            currentMonth ? "text-white/90" : "text-white/40",
                                            "bg-white/5 hover:bg-white/10",
                                            selected(date) ? "bg-[#E50914] text-white border-[#E50914]" : "",
                                            inRange(date) ? "bg-white/10" : "",
                                            isToday && !selected(date) ? "ring-1 ring-white/30" : "",
                                        ].join(" "), title: date.toDateString(), children: date.getDate() }, idx))) }), _jsxs("div", { className: "mt-2 flex items-center justify-between px-1 text-[11px] text-white/60", children: [_jsx("span", { children: "Pick start, then end" }), _jsx("button", { className: "underline hover:text-white", onClick: () => { setStart(null); setEnd(null); onChange("", ""); }, children: "Clear" })] })] })] })) })] }));
}
/* =============================== PAGE ================================= */
export default function HotelDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [me, setMe] = useState(null);
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [checkIn, setCheckIn] = useState(() => {
        const q = new URLSearchParams(window.location.search).get("checkIn");
        return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : fmtDateYMD(plusDays(new Date(), 1));
    });
    const [checkOut, setCheckOut] = useState(() => {
        const q = new URLSearchParams(window.location.search).get("checkOut");
        return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : fmtDateYMD(plusDays(new Date(), 3));
    });
    const [guests, setGuests] = useState(() => {
        const n = Number(new URLSearchParams(window.location.search).get("guests"));
        return Number.isFinite(n) && n > 0 ? Math.min(10, Math.round(n)) : 2;
    });
    const [busy] = useState(false);
    const [reserveMsg, setReserveMsg] = useState(null);
    const abortRef = useRef(null);
    const ci = useMemo(() => (checkIn ? new Date(checkIn) : null), [checkIn]);
    const co = useMemo(() => (checkOut ? new Date(checkOut) : null), [checkOut]);
    const datesValid = useMemo(() => !!(ci && co && +co > +ci), [ci, co]);
    // Reviews
    const [reviews, setReviews] = useState([]);
    const [revLoading, setRevLoading] = useState(true);
    const [revErr, setRevErr] = useState(null);
    // New review
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formMsg, setFormMsg] = useState(null);
    useEffect(() => {
        (async () => {
            try {
                const m = await getMe();
                setMe(m);
            }
            catch { }
        })();
    }, []);
    // Load hotel (and hydrate reviews if included)
    useEffect(() => {
        (async () => {
            if (!id) {
                setErr("Missing hotel id");
                setLoading(false);
                return;
            }
            abortRef.current?.abort();
            const ac = new AbortController();
            abortRef.current = ac;
            try {
                const r = await fetch(`/api/hotels/${encodeURIComponent(id)}`, {
                    credentials: "include",
                    signal: ac.signal,
                });
                const ct = r.headers.get("content-type") || "";
                if (!ct.includes("application/json")) {
                    const txt = await r.text().catch(() => "");
                    throw new Error(`Expected JSON but got ${ct || "unknown"}: ${txt.slice(0, 80)}`);
                }
                if (!r.ok) {
                    const j = await r.json().catch(() => null);
                    throw new Error(j?.error || `Failed to load (HTTP ${r.status})`);
                }
                const data = await r.json();
                setHotel(data);
                setErr(null);
                if (Array.isArray(data.reviews)) {
                    setReviews(data.reviews);
                    setRevErr(null);
                }
                else {
                    try {
                        const rr = await fetch(`/api/hotels/${encodeURIComponent(id)}/reviews`, {
                            credentials: "include",
                            signal: ac.signal,
                        });
                        if (!rr.ok)
                            throw new Error(`HTTP ${rr.status}`);
                        const list = await rr.json();
                        setReviews(Array.isArray(list) ? list : []);
                        setRevErr(null);
                    }
                    catch (revError) {
                        if (revError?.name === "AbortError")
                            return;
                        setRevErr(revError?.message || "Failed to load reviews");
                    }
                }
            }
            catch (e) {
                if (e?.name === "AbortError")
                    return;
                setErr(e?.message || "Could not load hotel");
            }
            finally {
                if (!ac.signal.aborted) {
                    setLoading(false);
                    setRevLoading(false);
                }
            }
        })();
        return () => abortRef.current?.abort();
    }, [id]);
    const avgRating = useMemo(() => {
        if (!reviews.length)
            return hotel?.rating ?? null;
        const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    }, [reviews, hotel?.rating]);
    const cap = hotel?.capacity ?? 10;
    async function reserve() {
        if (!hotel || !id)
            return;
        if (!datesValid) {
            setReserveMsg?.({ ok: false, text: "Please select a valid date range." });
            return;
        }
        const totalGuests = Math.max(1, Math.min(cap, guests));
        const payload = {
            hotelId: Number(id),
            name: hotel.name,
            city: hotel.city,
            image: hotel.images?.[0]?.url || "/images/featured_hotel.avif",
            price: hotel.price, // nightly
            checkIn,
            checkOut,
            guests: totalGuests,
        };
        try {
            sessionStorage.setItem("rr_checkout", JSON.stringify(payload));
        }
        catch { }
        navigate("/checkout", { state: payload });
    }
    async function submitReview() {
        try {
            if (!me)
                throw new Error("Please sign in to post a review.");
            if (!id)
                throw new Error("Missing hotel id.");
            if (!rating || !body.trim())
                throw new Error("Please add a rating and some text.");
            setSubmitting(true);
            setFormMsg(null);
            // prefer POST /api/hotels/:id; fallback to /api/hotels/:id/reviews
            const postOnce = (url) => fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeadersFrom(me) },
                credentials: "include",
                body: JSON.stringify({ rating, title: title || null, body }),
            });
            let resp = await postOnce(`/api/hotels/${id}`);
            if (!resp.ok && (resp.status === 404 || resp.status === 405)) {
                resp = await postOnce(`/api/hotels/${id}/reviews`);
            }
            const isJson = (resp.headers.get("content-type") || "").includes("application/json");
            const payload = isJson ? await resp.json().catch(() => null) : null;
            if (!resp.ok)
                throw new Error(payload?.error || `HTTP ${resp.status}`);
            const created = payload?.review ?? payload;
            setReviews((prev) => {
                // upsert by userId (one review per user per hotel)
                const rest = prev.filter((x) => x.userId !== created.userId);
                return [created, ...rest];
            });
            // reflect aggregates if returned
            if (payload?.reviewsAvg != null || payload?.reviewsCount != null) {
                setHotel((h) => h
                    ? {
                        ...h,
                        rating: payload?.reviewsAvg != null ? Number(payload.reviewsAvg) : h.rating,
                        reviewsCount: payload?.reviewsCount != null ? Number(payload.reviewsCount) : h.reviewsCount,
                    }
                    : h);
            }
            setTitle("");
            setBody("");
            setRating(5);
            setFormMsg("Thanks! Your review was posted.");
        }
        catch (e) {
            setFormMsg(e?.message || "Could not post review.");
        }
        finally {
            setSubmitting(false);
        }
    }
    /* --------------------------- UI -------------------------- */
    return (_jsxs("div", { className: "min-h-screen bg-black text-white", children: [_jsxs("button", { onClick: () => navigate(-1), className: "fixed top-5 left-5 z-50 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm \n        font-semibold bg-white/10 border border-white/15 text-white hover:bg-white/20", children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), " Back"] }), loading && (_jsxs("div", { className: "mx-auto max-w-5xl p-6", children: [_jsx("div", { className: "h-72 w-full rounded-2xl bg-white/5 border border-white/10 animate-pulse mb-6" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: Array.from({ length: 6 }).map((_, i) => (_jsx("div", { className: "h-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" }, i))) })] })), !loading && err && (_jsx("div", { className: "max-w-3xl mx-auto p-6", children: _jsxs("div", { className: "rounded-2xl border border-white/15 bg-white/5 p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-white/80 mb-4", children: err }), _jsx("button", { onClick: () => navigate("/home"), className: "rounded-xl bg-[#E50914] px-5 py-2 font-semibold hover:brightness-110", children: "Go Home" })] }) })), !loading && !err && hotel && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative mx-auto max-w-5xl", children: [_jsx("img", { src: hotel.images?.[0]?.url || "/images/featured_hotel.avif", alt: hotel.images?.[0]?.alt ?? hotel.name, className: "h-72 w-full rounded-2xl object-cover" }), _jsxs("div", { className: "absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-sm", children: [_jsx(MapPin, { className: "mr-1 inline h-4 w-4" }), " ", hotel.city] })] }), _jsxs("div", { className: "mx-auto max-w-5xl p-6 space-y-10", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: hotel.name }), _jsxs("div", { className: "mt-1 flex items-center gap-2 text-sm text-white/80", children: [avgRating != null && _jsx(Stars, { value: avgRating }), _jsx("span", { children: avgRating != null ? `${avgRating.toFixed(1)}★` : (hotel.rating ?? "—") }), _jsxs("span", { children: ["\u2022 Capacity ", hotel.capacity] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-2xl font-bold", children: ["$", hotel.price] }), _jsx("div", { className: "text-xs text-white/60", children: "per night" })] })] }), _jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-5 md:items-end", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("div", { className: "mb-1 text-sm text-white/80", children: "Dates" }), _jsx(DateRangePopover, { startYMD: checkIn, endYMD: checkOut, onChange: (s, e) => {
                                                        setCheckIn(s);
                                                        setCheckOut(e);
                                                    }, placeholder: "Select dates" })] }), _jsxs("label", { className: "text-sm", children: [_jsxs("span", { className: "mb-1 block text-white/80", children: ["Guests (max ", hotel.capacity, ")"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => setGuests((g) => Math.max(1, g - 1)), className: "grid size-8 place-items-center rounded-lg border border-white/12 bg-white text-black hover:bg-white/90", "aria-label": "Decrease guests", children: _jsx(Minus, { className: "size-4" }) }), _jsx("div", { className: "w-8 text-center text-sm tabular-nums", children: guests }), _jsx("button", { type: "button", onClick: () => setGuests((g) => Math.min(hotel.capacity, g + 1)), className: "grid size-8 place-items-center rounded-lg border border-white/12 bg-white text-black hover:bg-white/90", "aria-label": "Increase guests", children: _jsx(Plus, { className: "size-4" }) })] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("button", { onClick: reserve, disabled: busy, className: "h-10 w-full rounded-xl bg-[#E50914] text-sm font-semibold hover:brightness-110 disabled:opacity-60", children: busy ? "Reserving…" : "Reserve Now" }), reserveMsg && (_jsx("div", { className: `mt-2 text-sm ${reserveMsg.ok ? "text-green-400" : "text-red-400"}`, children: reserveMsg.text }))] })] }) }), hotel.images?.length > 1 && (_jsxs("div", { children: [_jsx("h2", { className: "mb-4 text-2xl font-semibold", children: "Gallery" }), _jsx("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-3", children: hotel.images.slice(1).map((img, i) => (_jsx(motion.img, { src: img.url, alt: img.alt ?? hotel.name, className: "h-48 w-full rounded-xl object-cover", whileHover: { scale: 1.04 }, onError: (e) => {
                                                e.currentTarget.src = "/images/fallback.jpg";
                                            } }, i))) })] })), _jsxs("div", { children: [_jsx("h2", { className: "mb-2 text-2xl font-semibold", children: "Overview" }), _jsxs("p", { className: "text-white/80", children: ["A modern stay in ", hotel.city, ", rated ", avgRating != null ? `${avgRating.toFixed(1)}★` : `${hotel.rating ?? "—"}★`, " and starting at $", hotel.price, "/night, awaits travelers looking for more than just a room. Perfect for a cinematic escape with RedRoute\u2019s signature glow, feather-light interactions, and ultra-fast booking.", _jsx("br", {}), _jsx("br", {}), "Wake up to skyline views, unwind in a lobby that hums with style, and head out to explore local food, music, and culture \u2014 all a stone\u2019s throw away. Expect streaming-fast Wi-Fi, generous beds, rain showers, and a breakfast spread that just hits.", _jsx("br", {}), _jsx("br", {}), "Located in the heart of ", hotel.city, ", you\u2019ll be steps from cultural landmarks, buzzing nightlife, and hidden gems known only to locals. Whether you\u2019re planning a romantic weekend, an adventure with friends, or a solo city break, the combination of attentive service, world-class amenities, and effortless RedRoute booking makes this hotel the perfect base for memories that linger long after checkout."] })] }), _jsxs("section", { children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Reviews" }), avgRating != null && (_jsxs("div", { className: "text-sm text-white/80", children: [_jsx(Stars, { value: avgRating }), " ", _jsxs("span", { className: "ml-2", children: [avgRating.toFixed(1), " / 5 \u2022 ", reviews.length] })] }))] }), _jsxs("div", { className: "rounded-2xl border border-white/10 bg-black/30 p-4", children: [_jsx("div", { className: "mb-2 text-sm text-white/80", children: "Write a review" }), _jsxs("div", { className: "mb-3 flex items-center gap-2", children: [[1, 2, 3, 4, 5].map((n) => (_jsx("button", { type: "button", onClick: () => setRating(n), title: `${n} star${n > 1 ? "s" : ""}`, className: "hover:scale-105 transition", children: _jsx(Star, { className: "h-6 w-6", stroke: "currentColor", fill: n <= rating ? "currentColor" : "none" }) }, n))), _jsxs("span", { className: "text-sm text-white/70", children: [rating, " / 5"] })] }), _jsx("input", { className: "mb-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Title (optional)", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx("textarea", { className: "mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Share your experience\u2026", rows: 3, value: body, onChange: (e) => setBody(e.target.value) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-xs text-white/60", children: "Be kind and constructive. One review per account." }), _jsxs("button", { disabled: submitting, onClick: submitReview, className: "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-[#E50914] hover:brightness-110 disabled:opacity-60", children: [_jsx(Send, { className: "h-4 w-4" }), " ", submitting ? "Posting…" : "Post"] })] }), formMsg && _jsx("div", { className: "mt-2 text-sm text-white/80", children: formMsg })] }), _jsxs("div", { className: "mt-4 space-y-3", children: [revLoading && _jsx("div", { className: "text-white/70", children: "Loading reviews\u2026" }), !revLoading && revErr && _jsx("div", { className: "text-red-400", children: revErr }), !revLoading && !revErr && reviews.length === 0 && (_jsx("div", { className: "text-white/70", children: "No reviews yet. Be the first!" })), !revLoading && !revErr && reviews.map((r) => {
                                                const name = (r.user?.firstName || r.user?.lastName)
                                                    ? [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ")
                                                    : (r.user?.email || "Guest");
                                                return (_jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-semibold", children: initials(name, r.user?.email) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "font-semibold", children: name }), _jsx("div", { className: "text-xs text-white/60", children: fmtDate(r.createdAt) })] }), _jsxs("div", { className: "mt-1 flex items-center gap-2 text-sm", children: [_jsx(Stars, { value: r.rating }), r.title && _jsxs("span", { className: "text-white/80 font-medium", children: ["\u2022 ", r.title] })] }), _jsx("p", { className: "mt-2 text-white/80 whitespace-pre-wrap", children: r.body })] })] }) }, r.id));
                                            })] })] })] })] }))] }));
}
