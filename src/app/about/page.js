"use client";

import Link from "next/link";

export default function About() {
  return (
    <main className="min-h-screen bg-[#02000d] text-white flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[140px]"></div>
      </div>

      <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <div className="p-2 rounded-full border border-white/5 bg-white/5 group-hover:bg-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5"><path d="m15 18-6-6 6-6" /></svg>
        </div>
        <span className="font-medium text-sm sm:text-base">Back to Home</span>
      </Link>

      <div className="relative z-10 text-center space-y-6 sm:space-y-8 max-w-2xl px-4 sm:px-6">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-gradient leading-[0.9] sm:leading-none">
          Our Goal.
        </h1>
        <p className="text-lg sm:text-2xl text-slate-400 font-light leading-relaxed">
          We believe that staying organized should be <span className="text-white">easy for everyone.</span> Our goal is to provide a clean space where you can focus on your work without any distractions.
        </p>
        <div className="pt-6 sm:pt-8">
          <Link href="/login">
            <button className="btn-premium-pink py-4 sm:py-5 px-8 sm:px-10 text-base sm:text-lg">
              Start Organizing
            </button>
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 sm:bottom-12 w-full text-center text-slate-700 uppercase tracking-widest text-[9px] sm:text-xs font-bold opacity-30 px-4">
        Making productivity simple for everyone.
      </footer>
    </main>
  );
}