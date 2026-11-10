import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/gaming-login.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setSession } from "./session";
const LANDING_ROUTE = '/home';
const API_BASE = import.meta.env.VITE_API_BASE ?? ''; // leave blank for same-origin
const FormInput = ({ icon, type, placeholder, value, onChange, required, autoComplete, className = "pr-3", }) => (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none", children: icon }), _jsx("input", { type: type, placeholder: placeholder, value: value, onChange: onChange, required: required, autoComplete: autoComplete, className: `w-full pl-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#E50914]/70 focus:ring-2 focus:ring-[#E50914]/40 transition-colors ${className}` })] }));
const ToggleSwitch = ({ checked, onChange, id }) => (_jsxs("div", { className: "relative inline-block w-10 h-5 cursor-pointer", children: [_jsx("input", { type: "checkbox", id: id, className: "sr-only", checked: checked, onChange: onChange }), _jsx("div", { className: `absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-[#E50914]' : 'bg-white/20'}`, children: _jsx("div", { className: `absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-5' : ''}` }) })] }));
const GamingLogin = ({ onSubmit }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    // shared
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    // register-only fields
    const [password2, setPassword2] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState(''); // yyyy-mm-dd
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const validate = () => {
        if (!email || !password)
            return 'Please fill all fields.';
        if (!/\S+@\S+\.\S+/.test(email))
            return 'Enter a valid email.';
        if (password.length < 6)
            return 'Password must be at least 6 characters.';
        if (mode === 'register') {
            if (!firstName.trim() || !lastName.trim())
                return 'Name is required.';
            if (!dob)
                return 'Date of birth is required.';
            if (password !== password2)
                return 'Passwords do not match.';
            const d = new Date(dob);
            if (Number.isNaN(d.getTime()))
                return 'Enter a valid date of birth.';
        }
        return null;
    };
    async function call(path, body) {
        // If no API, this may 404/405 on Vercel; we’ll handle that gracefully.
        const r = await fetch(`${API_BASE}/api/auth/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        }).catch(() => {
            const err = new Error('Network error');
            err.status = -1; // sentinel for fetch failure
            throw err;
        });
        const raw = await r.text(); // handle non-JSON bodies
        let data = null;
        try {
            data = raw ? JSON.parse(raw) : null;
        }
        catch { }
        if (!r.ok) {
            const err = new Error(data?.error || `Request failed (${r.status})`);
            err.status = r.status;
            throw err;
        }
        return data;
    }
    function demoFallbackAndGo() {
        // Seamless “demo mode” when API isn’t present on Vercel
        setSession("auth");
        if (firstName) {
            try {
                localStorage.setItem('rr_name', firstName);
            }
            catch { }
        }
        navigate(LANDING_ROUTE, { replace: true });
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        setSubmitting(true);
        try {
            if (mode === 'register') {
                await call('register', {
                    email,
                    password,
                    remember,
                    firstName,
                    lastName,
                    dob: new Date(dob).toISOString(), // Prisma DateTime compatible
                });
            }
            else {
                await call('login', { email, password, remember });
            }
            onSubmit?.(email, mode); // optional analytics
            // Mark session + try to cache name (if API populated it)
            setSession("auth");
            try {
                const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' }).then(r => r.json());
                if (me?.user?.firstName)
                    localStorage.setItem('rr_name', me.user.firstName);
            }
            catch { }
            navigate(LANDING_ROUTE, { replace: true });
        }
        catch (err) {
            // If API isn’t deployed or doesn’t accept POST (405/404/501), use demo fallback.
            if ([404, 405, 500, 501, -1].includes(err?.status)) {
                demoFallbackAndGo();
                return;
            }
            setError(err?.message || 'Something went wrong.');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "p-8 rounded-2xl backdrop-blur-sm bg-black/50 border border-white/10 w-[min(460px,92vw)]", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsxs("h2", { className: "text-3xl font-bold mb-2 relative group", children: [_jsx("span", { className: "absolute -inset-1 bg-[#E50914]/25 blur-xl opacity-75" }), _jsx("span", { className: "relative inline-block text-3xl font-bold mb-2 text-white", children: "RedRoute" })] }), _jsx("p", { className: "text-white/80 mt-2", children: mode === 'login' ? 'Welcome back' : 'Create your account' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", noValidate: true, children: [_jsx(FormInput, { icon: _jsx(Mail, { className: "text-white/60", size: 18 }), type: "email", placeholder: "Email address", value: email, onChange: (e) => setEmail(e.target.value), required: true, autoComplete: "email" }), _jsxs("div", { className: "relative", children: [_jsx(FormInput, { icon: _jsx(Lock, { className: "text-white/60", size: 18 }), type: showPassword ? 'text' : 'password', placeholder: mode === 'register' ? 'Create a password' : 'Password', value: password, onChange: (e) => setPassword(e.target.value), required: true, autoComplete: mode === 'register' ? 'new-password' : 'current-password', className: "pr-10" }), _jsx("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white", onClick: () => setShowPassword(s => !s), "aria-label": showPassword ? 'Hide password' : 'Show password', children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }), mode === 'register' && (_jsxs(_Fragment, { children: [_jsx(FormInput, { icon: _jsx(Lock, { className: "text-white/60", size: 18 }), type: "password", placeholder: "Confirm password", value: password2, onChange: (e) => setPassword2(e.target.value), required: true, autoComplete: "new-password" }), _jsx(FormInput, { icon: _jsx(UserIcon, { className: "text-white/60", size: 18 }), type: "text", placeholder: "First name", value: firstName, onChange: (e) => setFirstName(e.target.value), required: true, autoComplete: "given-name" }), _jsx(FormInput, { icon: _jsx(UserIcon, { className: "text-white/60", size: 18 }), type: "text", placeholder: "Last name", value: lastName, onChange: (e) => setLastName(e.target.value), required: true, autoComplete: "family-name" }), _jsx(FormInput, { icon: _jsx(CalendarIcon, { className: "text-white/60", size: 18 }), type: "date", placeholder: "Date of birth", value: dob, onChange: (e) => setDob(e.target.value), required: true, autoComplete: "bday", className: "pr-3 [color-scheme:dark]" })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(ToggleSwitch, { checked: remember, onChange: () => setRemember(r => !r), id: "remember-me" }), _jsx("label", { htmlFor: "remember-me", className: "text-sm text-white/80 cursor-pointer", children: "Remember me" })] }), mode === 'login' ? (_jsx("button", { type: "button", className: "text-sm text-white/80 hover:text-white", onClick: () => setMode('register'), children: "Create account" })) : (_jsx("button", { type: "button", className: "text-sm text-white/80 hover:text-white", onClick: () => setMode('login'), children: "Have an account? Sign in" }))] }), error && _jsx("div", { className: "text-sm text-red-400", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full py-3 rounded-lg text-white font-medium transition-all bg-[#E50914] hover:bg-[#c40b13] focus:outline-none focus:ring-2 focus:ring-[#E50914]/50 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(229,9,20,0.35)]", children: submitting
                            ? (mode === 'login' ? 'Logging in…' : 'Creating…')
                            : (mode === 'login' ? 'Login' : 'Create Account') }), _jsx("button", { type: "button", onClick: () => {
                            setSession("guest");
                            navigate(LANDING_ROUTE, { replace: true });
                        }, className: "w-full py-3 rounded-lg text-white font-medium transition-all bg-white/10 hover:bg-white/15 border border-white/15", children: "Proceed as Guest" })] })] }));
};
export default GamingLogin;
