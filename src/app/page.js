"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [showFeatures, setShowFeatures] = useState(false);
  const featuresRef = useRef(null);

  const toggleFeatures = () => {
    setShowFeatures(!showFeatures);
    if (!showFeatures) {
      setTimeout(() => {
        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isAuth = document.cookie.includes('user_info=');
      setIsLoggedIn(isAuth);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#02000d] text-white selection:bg-pink-500/30 relative overflow-hidden flex flex-col items-center">

      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-fuchsia-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Animated Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center flex flex-col items-center">
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-6 sm:mb-8 hover:border-white/20 transition-all cursor-default group">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          <span className="text-[10px] sm:text-sm font-medium text-pink-200/80 tracking-wide uppercase">
            Simple Task Management
          </span>
        </div>

        <h1 className="text-5xl sm:text-8xl md:text-9xl font-black tracking-tight leading-[1.1] sm:leading-[1.1] mb-6 sm:mb-8">
          <span className="text-gradient inline-block">Manage your life,</span><br />
          <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">simply.</span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-12">
          Organize your daily chores and reach your goals with a
          <span className="text-slate-200 block sm:inline"> clean, easy-to-use workspace.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <Link href={isLoggedIn ? "/tasks" : "/login"} className="w-full sm:w-auto">
            <button className="btn-premium-pink group w-full sm:w-auto py-4 sm:py-5">
              {isLoggedIn ? "Access Dashboard" : "Get Started"}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          </Link>
          <button
            onClick={toggleFeatures}
            className={`btn-premium-glass px-10 py-4 sm:py-5 w-full sm:w-auto transition-all duration-500 ${showFeatures ? 'bg-white/10 border-white/30' : ''}`}
          >
            How it works
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`ml-3 transition-transform duration-500 ${showFeatures ? 'rotate-180' : 'opacity-60'}`}><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>
      </div>

      <div
        ref={featuresRef}
        id="features"
        className={`relative z-10 w-full max-w-7xl px-6 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${showFeatures ? 'max-h-[3000px] opacity-100 py-10 sm:py-16' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left border-t border-white/5 pt-12 sm:pt-16">
          {[
            {
              title: "Clean Design",
              desc: "A distraction-free space that helps you focus on what really needs to be done today.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><path d="M12 2v20" /><path d="M2 12h20" /><path d="m4.93 4.93 14.14 14.14" /><path d="m4.93 19.07 14.14-14.14" /></svg>,
              color: "from-pink-500/20"
            },
            {
              title: "Easy to Use",
              desc: "Adding and managing tasks is as simple as typing a note. No complicated setup required.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-400"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
              color: "from-fuchsia-500/20"
            },
            {
              title: "Stay Focused",
              desc: "Keep track of your progress and feel the satisfaction of clearing your list one by one.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>,
              color: "from-indigo-500/20"
            }
          ].map((feat, i) => (
            <div
              key={i}
              className={`group relative bg-white/[0.02] backdrop-blur-2xl border border-white/5 shadow-2xl rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 transition-all duration-700 transform hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-3 ${showFeatures ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl sm:rounded-[3rem]`}></div>

              <div className="relative z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-white/[0.03] flex items-center justify-center mb-6 sm:mb-8 border border-white/5 group-hover:border-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                  {feat.icon}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-slate-400 leading-relaxed text-lg sm:text-xl font-light group-hover:text-slate-300 transition-colors">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="w-full text-center py-8 sm:py-12 text-slate-600 relative z-10 border-t border-white/[0.02] mt-auto">
        <p className="text-[10px] sm:text-sm font-medium tracking-widest uppercase opacity-40">
          Designed for the ambitious. © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}