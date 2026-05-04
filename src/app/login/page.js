"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(null); // Now using object to store message + url
    const router = useRouter();

    useEffect(() => {
        if (typeof document !== 'undefined' && document.cookie.includes('user_info=')) {
            router.push("/dashboard");
        }
    }, [router]);

    const clearForm = () => {
        setEmail("");
        setFirstName("");
        setLastName("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccessMessage(null);
    };

    const toggleRegistering = () => {
        setIsRegistering(!isRegistering);
        clearForm();
    };




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

        const username = email.trim();
        const trimmedPassword = password.trim();

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username, 
                    password: trimmedPassword, 
                    isRegistering,
                    firstName: isRegistering ? firstName.trim() : undefined,
                    lastName: isRegistering ? lastName.trim() : undefined
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (isRegistering) {
                    const methodText = "confirmation email";
                    setSuccessMessage({
                        text: `Success! Your ${methodText} has been sent. You can now sign in.`,
                        url: data.previewUrl
                    });

                    // Don't auto-open window anymore, it's blocked by browsers and causes auth errors

                    setTimeout(() => {
                        if (!error) toggleRegistering();
                    }, 4000);
                } else {
                    router.push("/dashboard");
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
                        <h2 className="text-4xl font-black mb-2 text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,45,149,0.3)]">
                            {isRegistering ? "Create Account" : "Sign In"}
                        </h2>
                    <p className="text-slate-500 font-light">
                        {isRegistering ? "Create an account to save your tasks." : "Sign in to access your dashboard."}
                    </p>
                </div>

                <div className="bg-[#050510]/95 backdrop-blur-3xl border-2 border-pink-500/30 p-8 sm:p-10 rounded-[3rem] shadow-[0_0_100px_rgba(255,45,149,0.1)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegistering && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-black tracking-wider text-slate-300 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required={isRegistering}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-black tracking-wider text-slate-300 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required={isRegistering}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                            <label className="text-[13px] font-black tracking-wider text-slate-300 ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="Example@mail.com"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-black tracking-wider text-slate-300 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter Password"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold pr-12"
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
                                <label className="text-[13px] font-black tracking-wider text-slate-300 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm Your Password"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold pr-12"
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
                                        <a href={successMessage.url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-white rounded-lg transition-colors border border-emerald-500/30 text-xs font-bold tracking-tight">
                                            View Real Email
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-premium-pink py-5 rounded-2xl text-[17px] font-bold tracking-tight disabled:opacity-50"
                        >
                            {loading ? "Processing..." : isRegistering ? "Create Account" : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2">
                        <span className="text-[11px] font-bold tracking-tight text-slate-400">
                            {isRegistering ? "Already have an account?" : "Don't have an account?"}
                        </span>
                        <button
                            type="button"
                            onClick={toggleRegistering}
                            className="text-[11px] font-bold tracking-tight text-pink-500 hover:text-pink-400 hover:underline underline-offset-4 transition-all"
                        >
                            {isRegistering ? "Sign In" : "Sign Up"}
                        </button>
                    </div>
                </div>

                <footer className="mt-12 text-center text-slate-500 uppercase tracking-widest text-[9px] font-black opacity-60">
                    Your data is encrypted and secure.
                </footer>
            </div>
        </main>
    );
}
