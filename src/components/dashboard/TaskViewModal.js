"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function TaskViewModal({ task, onClose }) {
  if (!task) return null;

  const isCompleted = task.status === "Completed";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#02000d]/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#050510] border border-white/10 rounded-[2.5rem] p-6 sm:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.8),0_0_50px_rgba(255,45,149,0.1)] overflow-hidden"
        >
          {/* Accent decoration */}
          <div className={`absolute top-0 right-0 w-64 h-64 ${isCompleted ? "bg-emerald-500/10" : "bg-pink-500/10"} rounded-full blur-[100px] -mr-32 -mt-32`} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-pink-500/10 text-pink-500 border-pink-500/30"}`}>
                {isCompleted ? "Status Completed" : "Status Pending"}
              </div>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-slate-500 transition-colors shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </motion.button>
            </div>

            <h2 className="text-2xl sm:text-5xl font-black text-white italic tracking-tighter mb-6 leading-tight pr-6">
              {task.title}
            </h2>

            <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black tracking-widest text-slate-600">Established Date</span>
                <span className="text-sm font-bold text-slate-300">{new Date(task.taskDate || task.taskdate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/5" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black tracking-widest text-slate-600">Node Identifier</span>
                <span className="text-sm font-mono text-slate-300">#ZEN-{task.id.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-6">
              <span className={`text-[10px] font-black tracking-widest ${isCompleted ? "text-emerald-500" : "text-pink-500"}`}>Supplemental Metadata</span>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-light italic bg-white/[0.02] p-5 sm:p-8 rounded-3xl border border-white/5">
                {task.description || "No further data records have been archived for this neural node."}
              </p>
            </div>

            <div className="mt-12 flex justify-end">
              <button
                onClick={onClose}
                className="px-12 py-4 btn-premium-pink border border-white/10 rounded-[2rem] text-[11px] font-black tracking-widest transition-all shadow-[0_10px_20px_rgba(255,45,149,0.1)]"
              >
                Close Observation
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
