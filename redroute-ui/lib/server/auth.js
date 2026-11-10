import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";
const SESSION_COOKIE = process.env.SESSION_COOKIE || "rr_session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ONE_DAY = 60 * 60 * 24;
const THIRTY_DAYS = ONE_DAY * 30;
const isProd = process.env.NODE_ENV === "production";
/** Create a JWT for a user id. */
export function signSession(userId, remember = false) {
    const expiresIn = remember ? "30d" : "1d";
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn });
}
/** Verify a JWT string. Returns payload or null. */
export function verifySession(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
/** Build a Set-Cookie header value for the session cookie. */
export function makeSessionCookie(token, remember) {
    const prod = process.env.NODE_ENV === "production";
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8; // 30d or 8h
    return [
        `${process.env.SESSION_COOKIE ?? "rr_session"}=${token}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=None`, // <-- important for cross-site cookies
        prod ? `Secure` : "", // <-- required by SameSite=None
        `Max-Age=${maxAge}`
    ].filter(Boolean).join("; ");
}
/** Build a Set-Cookie header value that clears the cookie. */
export function makeClearSessionCookie() {
    return serialize(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
}
/** Read session token from request cookies (works with Express or raw Node). */
export function readSessionToken(req) {
    // If using cookie-parser in Express, you'll have req.cookies
    const viaParser = req.cookies?.[SESSION_COOKIE];
    if (viaParser)
        return viaParser;
    // Fallback: parse Cookie header
    const header = req.headers?.cookie;
    if (!header)
        return undefined;
    const parsed = parse(header);
    return parsed[SESSION_COOKIE];
}
/** Helper: get userId (sub) from a request. Returns null if not logged in. */
export function getUserIdFromRequest(req) {
    const token = readSessionToken(req);
    if (!token)
        return null;
    const payload = verifySession(token);
    return payload?.sub ?? null;
}
