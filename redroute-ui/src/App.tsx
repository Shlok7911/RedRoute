// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { hasValidSession, clearSession } from "./session";

const SignIn = lazy(() => import("./SignIn.tsx"));
const RedRouteLandingUltra = lazy(() => import("./RedRouteLandingUltra"));
const HotelDetail = lazy(() => import("./HotelDetail"));
const Checkout = lazy(() => import("./Checkout"));
const EventDetail = lazy(() => import("./EventDetail"));
const EventCheckout = lazy(() => import("./EventCheckout"));

function PageFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-black text-white">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#E50914]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function RequireAuth() {
  const valid = hasValidSession();
  return valid ? <Outlet /> : <Navigate to="/login" replace />;
}

function Logout() {
  useEffect(() => {
    clearSession();
    window.location.replace("/login");
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<SignIn />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/events/:id" element={<EventDetail />} />

          <Route element={<RequireAuth />}>
            <Route path="/home" element={<RedRouteLandingUltra />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/events/checkout" element={<EventCheckout />} />
          </Route>

          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
