import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/Checkout.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
/* ---------- auth/meta helper ---------- */
async function getMe() {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (!r.ok)
        throw new Error("Not authenticated");
    const me = await r.json().catch(() => ({}));
    const id = me?.user?.id ?? me?.id ?? null;
    const email = me?.user?.email ?? me?.email ?? null;
    const firstName = me?.user?.firstName ?? me?.firstName ?? null;
    const lastName = me?.user?.lastName ?? me?.lastName ?? null;
    return { id, email, firstName, lastName };
}
function authHeadersFrom(me) {
    const h = {};
    if (me.id)
        h["x-user-id"] = String(me.id);
    if (me.email)
        h["x-user-email"] = String(me.email);
    return h;
}
/* ---------- date helpers (UTC) ---------- */
function parseYMD(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}
const MS_PER_NIGHT = 24 * 60 * 60 * 1000;
export default function Checkout() {
    const navigate = useNavigate();
    const { state } = useLocation();
    // 1) router state
    let initial = state ?? {};
    // 2) sessionStorage fallback
    if (!initial?.hotelId) {
        try {
            const saved = JSON.parse(sessionStorage.getItem("rr_checkout") || "null");
            if (saved && typeof saved === "object")
                initial = { ...saved, ...initial };
        }
        catch { }
    }
    // 3) query params fallback
    const params = new URLSearchParams(location.search);
    if (!initial.hotelId && params.get("hotelId"))
        initial.hotelId = Number(params.get("hotelId"));
    initial.checkIn = initial.checkIn ?? params.get("checkIn") ?? "";
    initial.checkOut = initial.checkOut ?? params.get("checkOut") ?? "";
    if (!initial.guests && params.get("guests"))
        initial.guests = Number(params.get("guests"));
    const [hotelId] = useState(Number(initial.hotelId || 0));
    const [checkIn] = useState(String(initial.checkIn || ""));
    const [checkOut] = useState(String(initial.checkOut || ""));
    const [guests] = useState(Number(initial.guests || 1));
    const [name, setName] = useState(initial.name || "");
    const [city, setCity] = useState(initial.city || "");
    const [image, setImage] = useState(initial.image || "/images/featured_hotel.avif");
    const [price, setPrice] = useState(initial.price);
    // contact derived from /api/auth/me
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    // confirmation state + saved booking
    const [confirmed, setConfirmed] = useState(false);
    const [booking, setBooking] = useState(null);
    // ---- CONFETTI SETUP (full-screen canvas) ----
    const canvasRef = useRef(null);
    function fireCelebration() {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const shoot = confetti.create(canvas, { resize: true, useWorker: true });
        const duration = 2500; // ms
        const end = Date.now() + duration;
        const defaults = { startVelocity: 45, spread: 75, ticks: 250, scalar: 1 };
        const rand = (min, max) => Math.random() * (max - min) + min;
        const interval = setInterval(() => {
            const timeLeft = end - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }
            const particleCount = 40;
            // Top-left
            shoot({ ...defaults, particleCount, origin: { x: rand(0.00, 0.15), y: rand(0.00, 0.10) } });
            // Top-right
            shoot({ ...defaults, particleCount, origin: { x: rand(0.85, 1.00), y: rand(0.00, 0.10) } });
            // Bottom-left
            shoot({ ...defaults, particleCount, origin: { x: rand(0.00, 0.15), y: rand(0.90, 1.00) } });
            // Bottom-right
            shoot({ ...defaults, particleCount, origin: { x: rand(0.85, 1.00), y: rand(0.90, 1.00) } });
            // A few edge sweeps for fullness
            shoot({ ...defaults, particleCount: 20, spread: 120, origin: { x: rand(0.3, 0.7), y: 0 } });
            shoot({ ...defaults, particleCount: 20, spread: 120, origin: { x: rand(0.3, 0.7), y: 1 } });
        }, 180);
    }
    // fetch hotel if missing price/name
    useEffect(() => {
        (async () => {
            if (!hotelId)
                return;
            if (name && price != null)
                return;
            try {
                const r = await fetch(`/api/hotels/${hotelId}`, { credentials: "include" });
                if (!r.ok)
                    throw new Error();
                const h = await r.json();
                setName(h.name);
                setCity(h.city);
                setPrice(h.price);
                if (h.images?.[0]?.url)
                    setImage(h.images[0].url);
            }
            catch { }
        })();
    }, [hotelId, name, price]);
    // fetch me for contact + headers
    const [me, setMe] = useState(null);
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
    // compute nights
    const nights = useMemo(() => {
        if (!checkIn || !checkOut)
            return 0;
        const n = Math.round((+parseYMD(checkOut) - +parseYMD(checkIn)) / MS_PER_NIGHT);
        return Math.max(0, n);
    }, [checkIn, checkOut]);
    const subtotal = useMemo(() => {
        if (price == null || nights <= 0)
            return 0;
        return price * nights;
    }, [price, nights]);
    const valid = hotelId && checkIn && checkOut && nights > 0 && price != null;
    async function payAndBook() {
        try {
            setMsg(null);
            if (!valid)
                throw new Error("Missing or invalid booking details.");
            if (!me)
                throw new Error("Not authenticated.");
            setBusy(true);
            const r = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeadersFrom(me) },
                credentials: "include",
                body: JSON.stringify({
                    hotelId,
                    checkIn,
                    checkOut,
                    guests,
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
                throw new Error(payload?.error || `Payment/booking failed (HTTP ${r.status})`);
            setBooking(payload?.booking ?? null);
            setConfirmed(true);
            setMsg({ ok: true, text: "Payment successful! Your booking is confirmed." });
            // FIRE THE FULL-SCREEN CONFETTI
            requestAnimationFrame(() => fireCelebration());
        }
        catch (e) {
            setMsg({ ok: false, text: e?.message || "Payment failed." });
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-black text-white relative", children: [_jsx("canvas", { ref: canvasRef, className: "pointer-events-none fixed inset-0 z-[9998]", style: { width: "100vw", height: "100vh" }, "aria-hidden": "true" }), _jsxs("div", { className: "mx-auto max-w-4xl p-6", children: [_jsxs("button", { onClick: () => navigate(-1), className: "mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-white/10 border border-white/15 hover:bg-white/20", disabled: busy, children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), " Back"] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("img", { src: image, alt: name, className: "h-28 w-36 rounded-xl object-cover", onError: (e) => (e.currentTarget.src = "/images/fallback.jpg") }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-xl font-semibold", children: name || "Hotel" }), _jsx("div", { className: "text-white/70", children: city }), _jsxs("div", { className: "mt-2 text-sm text-white/80", children: [checkIn, " \u2192 ", checkOut, " \u2022 ", guests, " ", guests === 1 ? "guest" : "guests"] }), _jsx("div", { className: "mt-1 text-sm text-white/80", children: nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "Invalid dates" })] })] }), _jsxs("div", { className: "mt-5 rounded-xl border border-white/10 bg-black/30 p-4", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { children: price != null ? `$${price} × ${nights} night${nights !== 1 ? "s" : ""}` : "Price" }), _jsxs("span", { className: "font-semibold", children: ["$", subtotal.toLocaleString()] })] }), _jsxs("div", { className: "mt-3 border-t border-white/10 pt-3 flex items-center justify-between", children: [_jsx("span", { className: "text-base font-semibold", children: "Total" }), _jsxs("span", { className: "text-lg font-bold", children: ["$", subtotal.toLocaleString()] })] })] }), msg && (_jsx("div", { className: `mt-4 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`, children: msg.text })), confirmed && (_jsx("div", { className: "mt-5 rounded-2xl border border-green-600/30 bg-green-600/15 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-green-500 shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold text-green-400", children: "Booking confirmed!" }), _jsxs("div", { className: "text-white/85", children: ["You\u2019re all set for ", _jsx("strong", { children: name }), ". We\u2019ve saved your booking details ", booking?.contactEmail ? _jsxs(_Fragment, { children: ["and sent a confirmation to ", _jsx("strong", { children: booking.contactEmail })] }) : null, "."] }), _jsxs("div", { className: "mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Reference" }), _jsx("span", { className: "font-mono", children: booking?.id ?? "—" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Dates" }), _jsxs("span", { children: [checkIn, " \u2192 ", checkOut] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Guests" }), _jsx("span", { children: booking?.guests ?? guests })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Total paid" }), _jsxs("span", { children: ["$", (booking?.totalCost ?? subtotal).toLocaleString()] })] })] })] })] }) }))] }), _jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5 h-fit", children: !confirmed ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-sm text-white/80 mb-2", children: "Contact" }), _jsx("input", { className: "mb-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Contact name", value: contactName, onChange: (e) => setContactName(e.target.value) }), _jsx("input", { className: "mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Contact email", value: contactEmail, onChange: (e) => setContactEmail(e.target.value) }), _jsx("div", { className: "text-sm text-white/80 mb-2", children: "Amount due" }), _jsxs("div", { className: "text-3xl font-bold mb-5", children: ["$", subtotal.toLocaleString()] }), _jsx("button", { disabled: !valid || busy, onClick: payAndBook, className: "h-11 w-full rounded-xl font-semibold hover:brightness-110 disabled:opacity-60", style: { background: "#E50914" }, children: busy ? "Processing…" : "Pay & Confirm" }), !valid && (_jsx("div", { className: "mt-3 text-xs text-red-400", children: "Missing/invalid details. Go back and pick dates again." })), _jsx("div", { className: "mt-5 text-xs text-white/60", children: "By confirming, you agree to our Terms and Cancellation Policy." })] })) : (_jsxs("div", { className: "text-center", children: [_jsx(CheckCircle2, { className: "w-12 h-12 text-green-500 mx-auto mb-3" }), _jsx("div", { className: "text-xl font-bold", children: "Payment complete" }), _jsx("div", { className: "mt-1 text-white/80", children: "Your booking details are shown on the left and saved to your account." })] })) })] })] })] }));
}
