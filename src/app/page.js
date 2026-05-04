"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AestheticBackground from "@/components/AestheticBackground";
import GalaxyBackground from "@/components/GalaxyBackground";

export default function LandingPage() {
  const [showFeatures, setShowFeatures] = useState(false);
  const featuresRef = useRef(null);

  const toggleFeatures = () => {
    const newState = !showFeatures;
    setShowFeatures(newState);
    if (newState) {
      featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isAuth = document.cookie.includes('user_info=');
      setIsLoggedIn(isAuth);
    }
  }, []);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#02000d] text-white selection:bg-pink-500/30 relative overflow-hidden flex flex-col items-center">

      {/* Background Layers */}
      <AestheticBackground />
      <GalaxyBackground />

      {/* Grid overlay for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative z-20 w-full max-w-6xl px-6 py-12 flex-1 text-center flex flex-col justify-center items-center"
      >
        {/* Content */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none z-0"
        ></div>

        <motion.h1
          variants={fadeInUp}
          className="text-5xl sm:text-8xl md:text-9xl font-black tracking-tight leading-[0.95] mb-8 relative z-10"
        >
          <span className="text-gradient drop-shadow-[0_0_30px_rgba(255,45,149,0.3)]">Manage your </span>
          <span className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] italic block sm:inline">life, simply.</span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-lg sm:text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-12"
        >
          Organize your daily chores and reach your goals
          <span className="text-slate-200"> with a clean, easy-to-use workspace.</span>
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto relative z-10"
        >
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-premium-pink group w-full sm:w-auto py-4 sm:py-5"
            >
              {isLoggedIn ? "Access Dashboard" : "Get Started"}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFeatures}
            className={`btn-premium-glass px-10 py-4 sm:py-5 w-full sm:w-auto transition-all duration-500 border border-white/10 hover:border-white/30 hover:bg-white/5 ${showFeatures ? 'bg-white/10 border-white/30' : ''}`}
          >
            How it works
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`ml-3 transition-transform duration-500 ${showFeatures ? 'rotate-180' : 'opacity-60'}`}><path d="m6 9 6 6 6-6" /></svg>
          </motion.button>
        </motion.div>
      </motion.div>

      <div
        id="features"
        className={`relative z-10 w-full max-w-7xl px-6 transition-all duration-0 ease-in-out expandable-grid ${showFeatures ? 'expanded opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="expandable-content" ref={featuresRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left border-t border-white/5 pt-12 sm:pt-16 pb-12 sm:pb-20">
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className={`group relative bg-white/[0.02] backdrop-blur-2xl border border-white/5 shadow-2xl rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 transition-all duration-1000 transform hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-3`}
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-8 sm:py-12 text-slate-500 relative z-10 border-t border-white/[0.03] mt-auto">
        <p className="text-[10px] sm:text-xs font-black tracking-widest uppercase opacity-60">
          Designed for the ambitious. © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}