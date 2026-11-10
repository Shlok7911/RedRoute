import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MapPin, Minus, Plus, CheckCircle2, ChevronLeft, Home, Star, Send } from "lucide-react";
import confetti from "canvas-confetti";
/* ------------ tiny auth helper ------------ */
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
/* ------------ utils ------------ */
function fmtWhen(iso) {
    if (!iso)
        return "";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
    });
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
/* ------------ confetti hook (50% intensity, evenly spread) ------------ */
function useCelebration() {
    const rafRef = useRef(null);
    const flipRef = useRef(0);
    function stop() {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }
    function start(durationMs = 2800) {
        stop();
        const base = { startVelocity: 45, ticks: 200, zIndex: 9999 };
        const end = Date.now() + durationMs;
        const run = () => {
            const left = end - Date.now();
            if (left <= 0)
                return stop();
            const progress = left / durationMs;
            const particleCount = Math.max(6, Math.floor(35 * progress));
            const flip = (flipRef.current ^= 1);
            const rand = (a, b) => Math.random() * (b - a) + a;
            if (flip) {
                confetti({ ...base, particleCount, spread: 70, origin: { x: 0.05, y: 0.05 } });
                confetti({ ...base, particleCount, spread: 70, origin: { x: 0.95, y: 0.95 } });
                confetti({ ...base, particleCount: Math.ceil(particleCount * 0.8), spread: 110, origin: { x: rand(0.2, 0.8), y: 0 } });
            }
            else {
                confetti({ ...base, particleCount, spread: 70, origin: { x: 0.95, y: 0.05 } });
                confetti({ ...base, particleCount, spread: 70, origin: { x: 0.05, y: 0.95 } });
                confetti({ ...base, particleCount: Math.ceil(particleCount * 0.8), spread: 110, origin: { x: rand(0.2, 0.8), y: 1 } });
            }
            rafRef.current = requestAnimationFrame(run);
        };
        rafRef.current = requestAnimationFrame(run);
    }
    useEffect(() => stop, []);
    return { start, stop };
}
/* ------------ page ------------ */
export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const celebration = useCelebration();
    const [me, setMe] = useState(null);
    const [ev, setEv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [booking, setBooking] = useState(null);
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
                setMe({ id: m.id, email: m.email });
                const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
                setContactName(full || (m.email ? m.email.split("@")[0] : ""));
                setContactEmail(m.email || "");
            }
            catch { }
        })();
    }, []);
    // Load event by id (hydrate reviews if included)
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const r = await fetch(`/api/events/${id}`, { credentials: "include" });
                const ct = r.headers.get("content-type") || "";
                if (!ct.includes("application/json")) {
                    const txt = await r.text().catch(() => "");
                    throw new Error(`Expected JSON but got ${ct || "unknown"}: ${txt.slice(0, 80)}`);
                }
                if (!r.ok) {
                    const j = await r.json().catch(() => null);
                    throw new Error(j?.error || `Failed to load (HTTP ${r.status})`);
                }
                const e = await r.json();
                setEv(e);
                if (Array.isArray(e.reviews)) {
                    setReviews(e.reviews);
                    setRevErr(null);
                }
                else {
                    try {
                        const rr = await fetch(`/api/events/${id}/reviews`, { credentials: "include" });
                        if (rr.ok) {
                            const data = await rr.json();
                            setReviews(Array.isArray(data) ? data : []);
                            setRevErr(null);
                        }
                    }
                    catch (revError) {
                        setRevErr(revError?.message || "Failed to load reviews");
                    }
                }
            }
            catch {
                setEv(null);
            }
            finally {
                setLoading(false);
                setRevLoading(false);
            }
        })();
    }, [id]);
    const subtotal = useMemo(() => (!ev ? 0 : ev.price * qty), [ev, qty]);
    const valid = !!ev && qty > 0;
    const avgRating = useMemo(() => {
        if (ev?.reviewsAvg != null)
            return ev.reviewsAvg;
        if (!reviews.length)
            return null;
        const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    }, [ev?.reviewsAvg, reviews]);
    async function payAndBook() {
        try {
            setMsg(null);
            if (!valid)
                throw new Error("Missing details.");
            if (!me)
                throw new Error("Not authenticated.");
            setBusy(true);
            const r = await fetch("/api/event-bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeadersFrom(me) },
                credentials: "include",
                body: JSON.stringify({
                    eventId: ev.id,
                    qty,
                    contactName: contactName || null,
                    contactEmail: contactEmail || null,
                }),
            });
            const raw = await r.text();
            const payload = raw ? (() => { try {
                return JSON.parse(raw);
            }
            catch {
                return null;
            } })() : null;
            if (!r.ok)
                throw new Error(payload?.error || `HTTP ${r.status}`);
            setBooking(payload?.booking ?? null);
            setConfirmed(true);
            setMsg({ ok: true, text: "Tickets confirmed!" });
            celebration.start(3000);
        }
        catch (e) {
            setMsg({ ok: false, text: e?.message || "Payment failed." });
        }
        finally {
            setBusy(false);
        }
    }
    async function submitReview() {
        try {
            if (!me)
                throw new Error("Please sign in to post a review.");
            if (!id)
                throw new Error("Missing event id.");
            if (!rating || !body.trim())
                throw new Error("Please add a rating and some text.");
            setSubmitting(true);
            setFormMsg(null);
            // prefer POST /api/events/:id; fallback to /api/events/:id/reviews
            const postOnce = (url) => fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeadersFrom(me) },
                credentials: "include",
                body: JSON.stringify({ rating, title: title || null, body }),
            });
            let resp = await postOnce(`/api/events/${id}`);
            if (!resp.ok && (resp.status === 404 || resp.status === 405)) {
                resp = await postOnce(`/api/events/${id}/reviews`);
            }
            const isJson = (resp.headers.get("content-type") || "").includes("application/json");
            const payload = isJson ? await resp.json().catch(() => null) : null;
            if (!resp.ok)
                throw new Error(payload?.error || `HTTP ${resp.status}`);
            const created = payload?.review ?? payload;
            setReviews((prev) => {
                const rest = prev.filter((x) => x.userId !== created.userId); // one review per user per event
                return [created, ...rest];
            });
            // reflect aggregates if returned
            if (payload?.reviewsAvg != null || payload?.reviewsCount != null) {
                setEv((e) => e
                    ? {
                        ...e,
                        reviewsAvg: payload?.reviewsAvg != null ? Number(payload.reviewsAvg) : e.reviewsAvg ?? null,
                        reviewsCount: payload?.reviewsCount != null ? Number(payload.reviewsCount) : e.reviewsCount ?? null,
                    }
                    : e);
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
    if (loading) {
        return _jsx("div", { className: "min-h-screen bg-black text-white grid place-items-center", children: "Loading\u2026" });
    }
    if (!ev) {
        return _jsx("div", { className: "min-h-screen bg-black text-white grid place-items-center", children: "Event not found" });
    }
    return (_jsxs("div", { className: "min-h-screen bg-black text-white", children: [_jsxs("button", { onClick: () => navigate("/home"), className: "fixed left-5 top-5 z-[9999] inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-white/10 border border-white/15 hover:bg-white/20", "aria-label": "Back to home", title: "Back to home", children: [_jsx(Home, { className: "h-4 w-4" }), "Home"] }), _jsxs("div", { className: "mx-auto max-w-5xl p-6 grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]", children: [_jsxs("article", { className: "rounded-3xl border border-white/10 bg-white/5 p-4", children: [_jsx("div", { className: "relative h-72 w-full overflow-hidden rounded-2xl", children: _jsx("img", { src: ev.imageUrl, alt: ev.imageAlt ?? ev.name, className: "h-full w-full object-cover", onError: (e) => (e.currentTarget.src = "/images/fallback.jpg") }) }), _jsx("h1", { className: "mt-4 text-2xl font-extrabold", children: ev.name }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3 text-white/80 text-sm", children: [_jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(CalendarDays, { className: "h-4 w-4" }), " ", fmtWhen(ev.startsAt)] }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(MapPin, { className: "h-4 w-4" }), " ", ev.location] })] }), _jsx("p", { className: "mt-4 text-white/85", children: ev.description }), confirmed && (_jsx("div", { className: "mt-5 rounded-2xl border border-green-600/30 bg-green-600/15 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-green-500 shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold text-green-400", children: "Tickets confirmed!" }), _jsxs("div", { className: "text-white/85", children: ["You\u2019re all set for ", _jsx("strong", { children: ev.name }), " on ", _jsx("strong", { children: fmtWhen(ev.startsAt) }), ".", " ", booking?.contactEmail ? _jsxs(_Fragment, { children: ["A confirmation email was sent to ", _jsx("strong", { children: booking.contactEmail }), "."] }) : null] }), _jsxs("div", { className: "mt-2 text-xs text-white/70", children: ["Reference: ", _jsx("span", { className: "font-mono", children: booking?.id ?? "—" }), " \u2022 Qty: ", booking?.qty ?? qty, " \u2022 Paid: $", (booking?.totalCost ?? subtotal).toLocaleString()] })] })] }) }))] }), _jsx("aside", { className: "rounded-3xl border border-white/10 bg-white/5 p-4 h-fit", children: !confirmed ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Get tickets" }), _jsx("div", { className: "mb-2 text-sm text-white/80", children: "Contact" }), _jsx("input", { className: "mb-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Contact name", value: contactName, onChange: (e) => setContactName(e.target.value) }), _jsx("input", { className: "mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Contact email", value: contactEmail, onChange: (e) => setContactEmail(e.target.value) }), _jsx("div", { className: "mb-2 text-sm text-white/80", children: "Tickets" }), _jsxs("div", { className: "mb-4 inline-flex items-center gap-2", children: [_jsx("button", { onClick: () => setQty((q) => Math.max(1, q - 1)), disabled: qty <= 1, className: "grid size-9 place-items-center rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 disabled:opacity-50", children: _jsx(Minus, { className: "h-4 w-4" }) }), _jsx("div", { className: "w-12 text-center text-base tabular-nums", children: qty }), _jsx("button", { onClick: () => setQty((q) => Math.min(10, q + 1)), className: "grid size-9 place-items-center rounded-xl border border-white/15 bg-white/10 hover:bg-white/20", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-sm", children: [_jsx("span", { children: "Price" }), _jsxs("span", { children: ["$", ev.price.toLocaleString()] })] }), _jsxs("div", { className: "mt-1 flex items-center justify-between text-sm", children: [_jsx("span", { children: "Qty" }), _jsx("span", { children: qty })] }), _jsxs("div", { className: "mt-3 border-t border-white/10 pt-3 flex items-center justify-between", children: [_jsx("span", { className: "text-base font-semibold", children: "Total" }), _jsxs("span", { className: "text-lg font-bold", children: ["$", subtotal.toLocaleString()] })] }), msg && (_jsx("div", { className: `mt-3 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`, "aria-live": "polite", children: msg.text })), _jsx("button", { disabled: !valid || busy, onClick: payAndBook, className: "mt-4 h-11 w-full rounded-xl font-semibold hover:brightness-110 disabled:opacity-60", style: { background: "#E50914" }, children: busy ? "Processing…" : "Pay & Confirm" }), _jsxs("button", { onClick: () => navigate(-1), className: "mt-2 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white", children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), " Back"] })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-green-500/15 text-green-400", children: _jsx(CheckCircle2, { className: "h-5 w-5" }) }), _jsx("div", { className: "text-center text-lg font-semibold", children: "Tickets confirmed" }), _jsx("p", { className: "mt-1 text-center text-sm text-white/70", children: "Enjoy the show! Your purchase details are saved below." }), _jsxs("div", { className: "mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { children: "Event" }), _jsx("span", { className: "font-medium", children: ev.name })] }), _jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { children: "When" }), _jsx("span", { className: "font-medium", children: fmtWhen(ev.startsAt) })] }), _jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { children: "Tickets" }), _jsx("span", { className: "font-medium", children: booking?.qty ?? qty })] }), _jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { children: "Total paid" }), _jsxs("span", { className: "font-bold", children: ["$", (booking?.totalCost ?? subtotal).toLocaleString()] })] }), _jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { children: "Reference" }), _jsx("span", { className: "font-mono", children: booking?.id ?? "—" })] })] })] })) })] }), _jsx("div", { className: "mx-auto max-w-5xl p-6", children: _jsxs("section", { children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Reviews" }), avgRating != null && (_jsxs("div", { className: "text-sm text-white/80", children: [_jsx(Stars, { value: avgRating }), " ", _jsxs("span", { className: "ml-2", children: [avgRating.toFixed(1), " / 5 \u2022 ", reviews.length] })] }))] }), _jsxs("div", { className: "rounded-2xl border border-white/10 bg-black/30 p-4", children: [_jsx("div", { className: "mb-2 text-sm text-white/80", children: "Write a review" }), _jsxs("div", { className: "mb-3 flex items-center gap-2", children: [[1, 2, 3, 4, 5].map((n) => (_jsx("button", { type: "button", onClick: () => setRating(n), title: `${n} star${n > 1 ? "s" : ""}`, className: "hover:scale-105 transition", children: _jsx(Star, { className: "h-6 w-6", stroke: "currentColor", fill: n <= rating ? "currentColor" : "none" }) }, n))), _jsxs("span", { className: "text-sm text-white/70", children: [rating, " / 5"] })] }), _jsx("input", { className: "mb-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Title (optional)", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx("textarea", { className: "mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Share your experience\u2026", rows: 3, value: body, onChange: (e) => setBody(e.target.value) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-xs text-white/60", children: "Be kind and constructive. One review per account." }), _jsxs("button", { disabled: submitting, onClick: submitReview, className: "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-[#E50914] hover:brightness-110 disabled:opacity-60", children: [_jsx(Send, { className: "h-4 w-4" }), " ", submitting ? "Posting…" : "Post"] })] }), formMsg && _jsx("div", { className: "mt-2 text-sm text-white/80", children: formMsg })] }), _jsxs("div", { className: "mt-4 space-y-3", children: [revLoading && _jsx("div", { className: "text-white/70", children: "Loading reviews\u2026" }), !revLoading && revErr && _jsx("div", { className: "text-red-400", children: revErr }), !revLoading && !revErr && reviews.length === 0 && (_jsx("div", { className: "text-white/70", children: "No reviews yet. Be the first!" })), !revLoading && !revErr && reviews.map((r) => {
                                    const displayName = (r.user?.firstName || r.user?.lastName)
                                        ? [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ")
                                        : (r.user?.email || "Guest");
                                    return (_jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-semibold", children: initials(displayName, r.user?.email) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "font-semibold", children: displayName }), _jsx("div", { className: "text-xs text-white/60", children: fmtDate(r.createdAt) })] }), _jsxs("div", { className: "mt-1 flex items-center gap-2 text-sm", children: [_jsx(Stars, { value: r.rating }), r.title && _jsxs("span", { className: "text-white/80 font-medium", children: ["\u2022 ", r.title] })] }), _jsx("p", { className: "mt-2 text-white/80 whitespace-pre-wrap", children: r.body })] })] }) }, r.id));
                                })] })] }) })] }));
}
