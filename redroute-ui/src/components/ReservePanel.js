import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Button } from "../components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
/* ---------------- auth helper ---------------- */
async function getAuthHeaders() {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (!r.ok)
        throw new Error("Not authenticated");
    const me = await r.json().catch(() => ({}));
    const id = me?.user?.id ?? me?.id ?? null;
    const email = me?.user?.email ?? me?.email ?? null;
    if (id)
        return { "x-user-id": String(id) };
    if (email)
        return { "x-user-email": String(email) };
    throw new Error("Not authenticated");
}
export default function ReservePanel({ hotelId, maxGuests = 10 }) {
    const navigate = useNavigate();
    const [checkIn, setCheckIn] = React.useState("");
    const [checkOut, setCheckOut] = React.useState("");
    const [guests, setGuests] = React.useState(2);
    const [contactName, setContactName] = React.useState("");
    const [contactEmail, setContactEmail] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);
    const dec = () => setGuests((g) => Math.max(1, g - 1));
    const inc = () => setGuests((g) => Math.min(maxGuests, g + 1));
    async function reserve() {
        setSubmitting(true);
        setError(null);
        try {
            const authHeaders = await getAuthHeaders();
            const r = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                credentials: "include",
                body: JSON.stringify({
                    hotelId,
                    checkIn: checkIn ? new Date(checkIn).toISOString() : null,
                    checkOut: checkOut ? new Date(checkOut).toISOString() : null,
                    guests,
                    contactName: contactName || null,
                    contactEmail: contactEmail || null,
                }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok)
                throw new Error(data?.error || `HTTP ${r.status}`);
            // ✅ server returns { ok: true, booking: {...} }
            navigate(`/booking/${data.booking.id}`);
        }
        catch (e) {
            setError(e.message || "Failed to reserve");
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/5 p-4 text-white", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "text-sm", children: [_jsx("span", { className: "mb-1 block text-white/80", children: "Check-in" }), _jsx("input", { type: "date", className: "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/90", value: checkIn, onChange: (e) => setCheckIn(e.target.value) })] }), _jsxs("label", { className: "text-sm", children: [_jsx("span", { className: "mb-1 block text-white/80", children: "Check-out" }), _jsx("input", { type: "date", className: "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/90", value: checkOut, onChange: (e) => setCheckOut(e.target.value) })] })] }), _jsxs("div", { className: "mt-3 flex items-center justify-between", children: [_jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "text-white/80", children: "Guests" }), _jsxs("div", { className: "text-white/60 text-xs", children: ["Max ", maxGuests] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: dec, className: "grid size-8 place-items-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/20", "aria-label": "Decrease guests", children: _jsx(Minus, { className: "size-4" }) }), _jsx("div", { className: "w-8 text-center text-sm tabular-nums", children: guests }), _jsx("button", { type: "button", onClick: inc, className: "grid size-8 place-items-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/20", "aria-label": "Increase guests", children: _jsx(Plus, { className: "size-4" }) })] })] }), _jsxs("div", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "text-sm", children: [_jsx("span", { className: "mb-1 block text-white/80", children: "Contact name (optional)" }), _jsx("input", { className: "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/90", value: contactName, onChange: (e) => setContactName(e.target.value), placeholder: "John Doe" })] }), _jsxs("label", { className: "text-sm", children: [_jsx("span", { className: "mb-1 block text-white/80", children: "Contact email (optional)" }), _jsx("input", { type: "email", className: "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/90", value: contactEmail, onChange: (e) => setContactEmail(e.target.value), placeholder: "john@doe.com" })] })] }), error && _jsx("div", { className: "mt-3 text-sm text-red-400", children: error }), _jsx(Button, { className: "mt-4 h-11 w-full rounded-xl text-sm font-semibold", disabled: submitting, onClick: reserve, style: { background: "#E50914" }, children: submitting ? "Reserving…" : "Reserve now" })] }));
}
