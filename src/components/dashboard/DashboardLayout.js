"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children, activeTab, setActiveTab, userInfo, onLogout, onProfileClick }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
            onClick={() => setShowLogoutConfirm(true)}
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

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-[#02000d]/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#050510]/95 to-black/95 border border-rose-500/20 rounded-[2.5rem] shadow-[0_30px_100px_rgba(244,63,94,0.15)] overflow-hidden p-8 text-center"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              
              <div className="mx-auto h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(244,63,94,0.2)] text-rose-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
              </div>

              <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Disconnect Session</h3>
              <p className="text-sm font-medium italic text-slate-400 mb-8 leading-relaxed">
                Are you sure you want to terminate your neural connection?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-white/[0.04] border-2 border-white/10 text-slate-400 font-bold hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 text-sm tracking-widest"
                >
                  Abort
                </button>
                <button
                  onClick={onLogout}
                  className="flex-1 py-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 font-bold hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all active:scale-95 text-sm tracking-widest"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
