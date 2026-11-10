import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import GamingLogin from "./gaming-login";
import { clearSession } from "./session";
/** Fullscreen looping background video */
function VideoBackground({ src = "/s.mp4", poster }) {
    return (_jsxs("div", { className: "pointer-events-none absolute inset-0 -z-10", children: [_jsx("video", { "data-login-video": true, className: "h-full w-full object-cover", src: src, poster: poster, autoPlay: true, muted: true, loop: true, playsInline: true, preload: "metadata" }), _jsx("div", { className: "absolute inset-0 bg-black/40" })] }));
}
export default function SignIn() {
    const { search } = useLocation();
    // If /login?reset=1 → clear any sticky session
    useEffect(() => {
        const params = new URLSearchParams(search);
        if (params.get("reset") === "1")
            clearSession();
    }, [search]);
    return (_jsxs("div", { className: "relative min-h-screen w-full flex items-center justify-center px-4 py-12", children: [_jsx(VideoBackground, { src: "/s.mp4" }), _jsx("div", { className: "relative z-10 w-full max-w-md", children: _jsx(GamingLogin, {}) }), _jsxs("footer", { className: "absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm z-10", children: ["\u00A9 ", new Date().getFullYear(), " RedRoute"] })] }));
}
