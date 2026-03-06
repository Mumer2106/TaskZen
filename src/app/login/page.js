"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
    const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'phone'
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("+1");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(null); // Now using object to store message + url
    const router = useRouter();

    const clearForm = () => {
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccessMessage(null);
    };

    const handleMethodChange = (method) => {
        setLoginMethod(method);
        clearForm();
    };

    const toggleRegistering = () => {
        setIsRegistering(!isRegistering);
        clearForm();
    };

    const COUNTRIES = [
        { code: "+1", name: "🇺🇸 +1 (US/CA)" },
        { code: "+44", name: "🇬🇧 +44 (UK)" },
        { code: "+91", name: "🇮🇳 +91 (IN)" },
        { code: "+92", name: "🇵🇰 +92 (PK)" },
        { code: "+61", name: "🇦🇺 +61 (AU)" },
        { code: "+81", name: "🇯🇵 +81 (JP)" },
        { code: "+49", name: "🇩🇪 +49 (DE)" },
        { code: "+33", name: "🇫🇷 +33 (FR)" },
        { code: "+86", name: "🇨🇳 +86 (CN)" },
        { code: "+971", name: "🇦🇪 +971 (AE)" },
        { code: "+966", name: "🇸🇦 +966 (SA)" },
        { code: "+64", name: "🇳🇿 +64 (NZ)" },
        { code: "+55", name: "🇧🇷 +55 (BR)" },
        { code: "+27", name: "🇿🇦 +27 (ZA)" },
        { code: "+7", name: "🇷🇺 +7 (RU)" },
        { code: "+82", name: "🇰🇷 +82 (KR)" },
        { code: "+65", name: "🇸🇬 +65 (SG)" },
        { code: "+34", name: "🇪🇸 +34 (ES)" },
        { code: "+39", name: "🇮🇹 +39 (IT)" },
    ];


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage(null);

        if (isRegistering) {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }
            const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
            if (!passRegex.test(password)) {
                setError("Password must be at least 6 characters long and contain letters, numbers, and special characters.");
                setLoading(false);
                return;
            }
        }

        const cleanedPhone = phone.startsWith('0') ? phone.substring(1) : phone;
        const username = loginMethod === "email" ? email.trim() : `${countryCode}${cleanedPhone}`;
        const trimmedPassword = password.trim();

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password: trimmedPassword, isRegistering }),
            });

            const data = await res.json();

            if (res.ok) {
                if (isRegistering) {
                    const methodText = username.includes('@') ? "confirmation email" : "SMS notification";
                    setSuccessMessage({
                        text: `Success! Your ${methodText} has been sent. You can now sign in.`,
                        url: data.previewUrl
                    });

                    // Don't auto-open window anymore, it's blocked by browsers and causes auth errors

                    setTimeout(() => {
                        if (!error) toggleRegistering();
                    }, 4000);
                } else {
                    router.push("/tasks");
                }
            } else {
                setError(data.error || "Something went wrong");
            }
        } catch (err) {
            setError("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#02000d] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-8 hover:scale-105 transition-transform">
                        <h1 className="text-4xl font-black tracking-tighter text-gradient italic">
                            TaskZen
                        </h1>
                    </Link>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase italic">
                        {isRegistering ? "Join the Flow" : "Welcome Back"}
                    </h2>
                    <p className="text-slate-500 font-light">
                        {isRegistering ? "Create an account to save your tasks." : "Sign in to access your dashboard."}
                    </p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 sm:p-10 rounded-[3rem] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Toggle Email / Phone */}
                        <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => handleMethodChange('email')}
                                className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${loginMethod === 'email' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMethodChange('phone')}
                                className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${loginMethod === 'phone' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Phone Number
                            </button>
                        </div>

                        {loginMethod === 'email' ? (
                            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="example@mail.com"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-bold"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Mobile Number</label>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-black/60 border border-white/10 rounded-2xl px-3 sm:px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-bold text-center [&>option]:bg-[#02000d] custom-scrollbar cursor-pointer outline-none hover:bg-black/80"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                    >
                                        {COUNTRIES.map((c) => (
                                            <option key={c.code} value={c.code} className="py-4 font-bold">{c.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        placeholder="000 000 0000"
                                        className="flex-1 w-full min-w-0 bg-black/40 border border-white/5 rounded-2xl px-4 sm:px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-bold"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700/80 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-bold pr-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12.5a11.1 11.1 0 0 1 20 0 11.1 11.1 0 0 1-20 0z"></path><circle cx="12" cy="12.5" r="3"></circle></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {isRegistering && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700/80 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-bold pr-12"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="px-4 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold text-center leading-relaxed backdrop-blur-sm animate-in zoom-in-95 duration-300">
                                {successMessage.text}
                                {successMessage.url && (
                                    <div className="mt-3">
                                        <a href={successMessage.url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-white rounded-lg transition-colors border border-emerald-500/30 text-xs tracking-wide uppercase">
                                            View Real Email
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-premium-pink py-5 rounded-2xl text-base disabled:opacity-50"
                        >
                            {loading ? "PROCESSING..." : isRegistering ? "CREATE ACCOUNT" : "SIGN IN"}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2">
                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-600">
                            {isRegistering ? "Already have an account?" : "Don't have an account?"}
                        </span>
                        <button
                            type="button"
                            onClick={toggleRegistering}
                            className="text-[10px] font-black tracking-widest uppercase text-pink-500 hover:text-pink-400 hover:underline underline-offset-4 transition-all"
                        >
                            {isRegistering ? "Sign In" : "Sign Up"}
                        </button>
                    </div>
                </div>

                <footer className="mt-12 text-center text-slate-800 uppercase tracking-widest text-[9px] font-bold opacity-40">
                    Your data is encrypted and secure.
                    <Link href="/admin-portal" className="ml-2 hover:text-rose-900 transition-colors opacity-10 hover:opacity-100">Portal</Link>
                </footer>
            </div>
        </main>
    );
}
