import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Minus, Plus, CheckCircle2, Home } from "lucide-react";
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
/* ---------- date/time helpers ---------- */
function fmtEventWhen(iso) {
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
/* ---------- Confetti: fire from all sides, no overlay canvas ---------- */
function useCelebration() {
    const rafRef = useRef(null);
    function stop() {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }
    function start(durationMs = 2600) {
        stop(); // ensure clean start
        const animationEnd = Date.now() + durationMs;
        const base = { startVelocity: 45, ticks: 200, zIndex: 9999 };
        const rand = (min, max) => Math.random() * (max - min) + min;
        const frame = () => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0)
                return stop();
            const particleCount = Math.max(12, Math.floor(80 * (timeLeft / durationMs)));
            // 4 corners
            confetti({ ...base, particleCount, spread: 70, origin: { x: 0.05, y: 0.05 } }); // TL
            confetti({ ...base, particleCount, spread: 70, origin: { x: 0.95, y: 0.05 } }); // TR
            confetti({ ...base, particleCount, spread: 70, origin: { x: 0.05, y: 0.95 } }); // BL
            confetti({ ...base, particleCount, spread: 70, origin: { x: 0.95, y: 0.95 } }); // BR
            // top & bottom sweeps
            confetti({ ...base, particleCount: 24, spread: 120, origin: { x: rand(0.2, 0.8), y: 0 } });
            confetti({ ...base, particleCount: 24, spread: 120, origin: { x: rand(0.2, 0.8), y: 1 } });
            rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
    }
    useEffect(() => stop, []); // cleanup on unmount
    return { start, stop };
}
export default function EventCheckout() {
    const navigate = useNavigate();
    const { state } = useLocation();
    // 1) router state
    let initial = state ?? {};
    // 2) sessionStorage
    if (!initial?.eventId) {
        try {
            const saved = JSON.parse(sessionStorage.getItem("rr_event_checkout") || "null");
            if (saved && typeof saved === "object")
                initial = { ...saved, ...initial };
        }
        catch { }
    }
    // 3) minimal query fallback
    const params = new URLSearchParams(location.search);
    if (!initial.eventId && params.get("eventId")) {
        initial.eventId = Number(params.get("eventId"));
    }
    if (!initial.qty && params.get("qty"))
        initial.qty = Number(params.get("qty"));
    const [eventId] = useState(Number(initial.eventId || 0));
    const [name, setName] = useState(initial.name || "");
    const [where, setWhere] = useState(initial.location || "");
    const [when, setWhen] = useState(initial.startsAt || "");
    const [image, setImage] = useState(initial.imageUrl || "/images/fallback.jpg");
    const [price, setPrice] = useState(initial.price);
    const [qty, setQty] = useState(Math.max(1, Number(initial.qty || 1)));
    // contact derived from /api/auth/me (also used to send headers)
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [me, setMe] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    // NEW: stay-on-page confirmation + saved booking
    const [confirmed, setConfirmed] = useState(false);
    const [booking, setBooking] = useState(null);
    // Persist basic payload so refresh/back keeps data
    useEffect(() => {
        try {
            sessionStorage.setItem("rr_event_checkout", JSON.stringify({
                eventId,
                name,
                location: where,
                startsAt: when,
                imageUrl: image,
                price,
                qty,
            }));
        }
        catch { }
    }, [eventId, name, where, when, image, price, qty]);
    // Fetch event if details missing
    useEffect(() => {
        (async () => {
            if (!eventId)
                return;
            if (name && price != null && when)
                return;
            try {
                const r = await fetch(`/api/events/${eventId}`, { credentials: "include" });
                if (!r.ok)
                    throw new Error();
                const ev = await r.json();
                setName(ev.name);
                setWhere(ev.location);
                setWhen(ev.startsAt);
                setPrice(ev.price);
                if (ev.imageUrl)
                    setImage(ev.imageUrl);
            }
            catch {
                // ignore (UI shows fallbacks)
            }
        })();
    }, [eventId, name, price, when]);
    // Get me for auth headers + contact defaults
    useEffect(() => {
        (async () => {
            try {
                const m = await getMe();
                setMe({ id: m.id, email: m.email });
                const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
                setContactName(full || (m.email ? m.email.split("@")[0] : ""));
                setContactEmail(m.email || "");
            }
            catch {
                // route guard should handle unauthenticated
            }
        })();
    }, []);
    const subtotal = useMemo(() => {
        if (price == null || qty < 1)
            return 0;
        return price * qty;
    }, [price, qty]);
    const valid = eventId && qty > 0 && price != null;
    // confetti hook
    const celebration = useCelebration();
    async function payAndBook() {
        try {
            setMsg(null);
            if (!valid)
                throw new Error("Missing or invalid booking details.");
            if (!me)
                throw new Error("Not authenticated.");
            setBusy(true);
            const r = await fetch("/api/event-bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeadersFrom(me),
                },
                credentials: "include",
                body: JSON.stringify({
                    eventId,
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
                throw new Error(payload?.error || `Payment/booking failed (HTTP ${r.status})`);
            setBooking(payload?.booking ?? null);
            setConfirmed(true);
            setMsg({ ok: true, text: "Payment successful! Your tickets are booked." });
            // fire confetti exactly when success happens
            celebration.start(3000);
        }
        catch (e) {
            setMsg({ ok: false, text: e?.message || "Payment failed." });
        }
        finally {
            setBusy(false);
        }
    }
    const minQty = 1;
    const maxQty = 10; // adjust if you enforce capacity
    return (_jsxs("div", { className: "min-h-screen bg-black text-white relative", children: [_jsxs("button", { onClick: () => navigate("/home"), className: "fixed left-5 top-5 z-[9999] inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-white/10 border border-white/15 hover:bg-white/20", "aria-label": "Back to home", title: "Back to home", children: [_jsx(Home, { className: "h-4 w-4" }), "Home"] }), _jsxs("div", { className: "mx-auto max-w-4xl p-6", children: [_jsxs("button", { onClick: () => navigate(-1), className: "mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-white/10 border border-white/15 hover:bg-white/20", disabled: busy, children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), " Back"] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("img", { src: image, alt: name, className: "h-28 w-36 rounded-xl object-cover", onError: (e) => (e.currentTarget.src = "/images/fallback.jpg") }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-xl font-semibold", children: name || "Event" }), _jsx("div", { className: "text-white/70", children: where }), _jsx("div", { className: "mt-2 text-sm text-white/80", children: fmtEventWhen(when) }), _jsxs("div", { className: "mt-1 text-sm text-white/80", children: [qty, " ", qty === 1 ? "ticket" : "tickets"] })] })] }), _jsxs("div", { className: "mt-5 rounded-xl border border-white/10 bg-black/30 p-4", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { children: price != null ? `$${price} × ${qty} ticket${qty !== 1 ? "s" : ""}` : "Price" }), _jsxs("span", { className: "font-semibold", children: ["$", subtotal.toLocaleString()] })] }), _jsxs("div", { className: "mt-3 border-t border-white/10 pt-3 flex items-center justify-between", children: [_jsx("span", { className: "text-base font-semibold", children: "Total" }), _jsxs("span", { className: "text-lg font-bold", children: ["$", subtotal.toLocaleString()] })] })] }), msg && (_jsx("div", { className: `mt-4 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`, children: msg.text })), confirmed && (_jsx("div", { className: "mt-5 rounded-2xl border border-green-600/30 bg-green-600/15 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-green-500 shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold text-green-400", children: "Tickets confirmed!" }), _jsxs("div", { className: "text-white/85", children: ["You\u2019re all set for ", _jsx("strong", { children: name }), " \u2014 ", fmtEventWhen(when), " at", " ", _jsx("strong", { children: where }), ".", booking?.contactEmail ? _jsxs(_Fragment, { children: [" A confirmation was sent to ", _jsx("strong", { children: booking.contactEmail }), "."] }) : null] }), _jsxs("div", { className: "mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Reference" }), _jsx("span", { className: "font-mono", children: booking?.id ?? "—" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Tickets" }), _jsx("span", { children: booking?.qty ?? qty })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/70", children: "Total paid" }), _jsxs("span", { children: ["$", (booking?.totalCost ?? subtotal).toLocaleString()] })] })] })] })] }) }))] }), _jsx("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-5 h-fit", children: !confirmed ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-sm text-white/80 mb-2", children: "Contact" }), _jsx("input", { className: "mb-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Contact name", value: contactName, onChange: (e) => setContactName(e.target.value) }), _jsx("input", { className: "mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm", placeholder: "Contact email", value: contactEmail, onChange: (e) => setContactEmail(e.target.value) }), _jsx("div", { className: "text-sm text-white/80 mb-2", children: "Tickets" }), _jsxs("div", { className: "mb-4 inline-flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => setQty((q) => Math.max(minQty, q - 1)), disabled: qty <= minQty, className: "grid size-9 place-items-center rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 disabled:opacity-50", "aria-label": "Decrease tickets", children: _jsx(Minus, { className: "h-4 w-4" }) }), _jsx("div", { className: "w-10 text-center text-base tabular-nums", children: qty }), _jsx("button", { type: "button", onClick: () => setQty((q) => Math.min(maxQty, q + 1)), disabled: qty >= maxQty, className: "grid size-9 place-items-center rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 disabled:opacity-50", "aria-label": "Increase tickets", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "text-sm text-white/80 mb-2", children: "Amount due" }), _jsxs("div", { className: "text-3xl font-bold mb-5", children: ["$", subtotal.toLocaleString()] }), _jsx("button", { disabled: !valid || busy, onClick: payAndBook, className: "h-11 w-full rounded-xl font-semibold hover:brightness-110 disabled:opacity-60", style: { background: "#E50914" }, children: busy ? "Processing…" : "Pay & Confirm" }), !valid && (_jsx("div", { className: "mt-3 text-xs text-red-400", children: "Missing/invalid details. Go back and pick tickets again." })), _jsx("div", { className: "mt-5 text-xs text-white/60", children: "By confirming, you agree to our Terms and Cancellation Policy." })] })) : (_jsxs("div", { className: "text-center", children: [_jsx(CheckCircle2, { className: "w-12 h-12 text-green-500 mx-auto mb-3" }), _jsx("div", { className: "text-xl font-bold", children: "Payment complete" }), _jsx("div", { className: "mt-1 text-white/80", children: "Your ticket details are shown on the left and saved to your account." })] })) })] })] })] }));
}
