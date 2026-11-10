import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, } from "react-router-dom";
import { hasValidSession, clearSession } from "./session";
const SignIn = lazy(() => import("./SignIn"));
const RedRouteLandingUltra = lazy(() => import("./RedRouteLandingUltra"));
const HotelDetail = lazy(() => import("./HotelDetail"));
const Checkout = lazy(() => import("./Checkout"));
const EventDetail = lazy(() => import("./EventDetail"));
const EventCheckout = lazy(() => import("./EventCheckout"));
function PageFallback() {
    return (_jsx("div", { className: "grid min-h-screen place-items-center bg-black text-white", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#E50914]", role: "status", "aria-label": "Loading" }) }));
}
function RequireAuth() {
    const valid = hasValidSession();
    return valid ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/login", replace: true });
}
function Logout() {
    useEffect(() => {
        clearSession();
        window.location.replace("/login");
    }, []);
    return null;
}
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsx(Suspense, { fallback: _jsx(PageFallback, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(SignIn, {}) }), _jsx(Route, { path: "/hotels/:id", element: _jsx(HotelDetail, {}) }), _jsx(Route, { path: "/events/:id", element: _jsx(EventDetail, {}) }), _jsxs(Route, { element: _jsx(RequireAuth, {}), children: [_jsx(Route, { path: "/home", element: _jsx(RedRouteLandingUltra, {}) }), _jsx(Route, { path: "/checkout", element: _jsx(Checkout, {}) }), _jsx(Route, { path: "/events/checkout", element: _jsx(EventCheckout, {}) })] }), _jsx(Route, { path: "/logout", element: _jsx(Logout, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }) }));
}
