"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardLayout({ children, activeTab, setActiveTab, userInfo, onLogout, onProfileClick }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#02000d] text-white selection:bg-pink-500/30 relative overflow-hidden flex flex-col items-center">
      {/* Optimized Clean Background */}

      {/* Header */}
      <header className="w-full max-w-7xl pt-12 px-6 flex justify-between items-center relative z-20 mx-auto">
        <Link href="/" className="group hover:scale-[1.02] transition-all duration-500 flex items-center gap-4">
          <div className="relative h-12 w-12 flex-shrink-0 group-hover:rotate-[360deg] transition-all duration-1000 ease-in-out">
            <img
              src="/icon.png"
              alt="TaskZen Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,45,149,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(255,45,149,0.5)] transition-all duration-500"
            />
          </div>
          <h1 className="inline-block text-4xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d95] via-[#d946ef] to-[#6366f1] drop-shadow-[0_10px_20px_rgba(255,45,149,0.2)] pr-[0.3em] -mr-[0.3em] whitespace-nowrap overflow-visible">
            TaskZen
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={onProfileClick}
            className="hidden sm:flex flex-col items-end mr-2 group/user cursor-pointer hover:opacity-80 transition-all text-right"
          >
            <span className="text-sm font-bold text-white leading-none capitalize group-hover/user:text-pink-400 transition-colors">{userInfo.firstName} {userInfo.lastName}</span>
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-1 opacity-60 group-hover/user:opacity-100 transition-opacity">NeuralOperator</span>
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-slate-500 transition-colors shadow-lg group"
            title="Disconnect Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </motion.button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="w-full max-w-4xl px-6 mt-12 mb-10 relative z-20">
        <div className="flex items-center gap-1 bg-white/[0.05] backdrop-blur-2xl border-2 border-white/15 p-1.5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.02)] relative transition-all hover:border-white/20">
          <div
            className="absolute h-[calc(100%-12px)] top-[6px] transition-all duration-500 ease-out bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-[1.6rem] shadow-[0_0_20px_rgba(255,45,149,0.3)]"
            style={{
              width: "calc(33.33% - 4px)",
              left: activeTab === "overview" ? "6px" : activeTab === "add" ? "33.33%" : "66.66%"
            }}
          />
          {["overview", "add", "list"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[13px] font-black tracking-[0.2em] relative z-10 transition-colors duration-500 ${activeTab === tab ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              {tab === "overview" ? "Overview" : tab === "add" ? "Allocate Node" : "Registry"}
            </button>
          ))}
        </div>
      </nav>

      {/* Content Area */}
      <div className="w-full max-w-7xl px-6 pb-24 relative z-20 flex-1 flex flex-col items-center mx-auto">
        {children}
      </div>


    </main>
  );
}
