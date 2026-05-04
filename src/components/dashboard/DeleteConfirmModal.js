"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteConfirmModal({ isOpen, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={deleting ? undefined : onCancel}
          className="fixed inset-0 bg-[#02000d]/90 backdrop-blur-md" 
        />
        
        <div className="flex min-h-full items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#050510] border-2 border-rose-500/20 rounded-[2.5rem] p-10 text-center shadow-[0_50px_100px_rgba(0,0,0,0.8),0_0_50px_rgba(244,63,94,0.1)] overflow-visible"
          >
          {/* Warning Icon Background */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-[50px]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="h-20 w-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-8 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>

            <h2 className="text-3xl font-black text-white italic tracking-tight mb-4 leading-normal pr-[0.3em] -mr-[0.3em] overflow-visible">
              Delete Permanently
            </h2>

            <p className="text-slate-400 text-base leading-relaxed italic mb-10">
              This node will be <span className="text-rose-500 font-bold">permanently decommissioned</span> from the global registry. This protocol cannot be reversed.
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black tracking-widest transition-all text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Abort
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleting}
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 border border-rose-500/50 rounded-2xl text-[11px] font-black tracking-widest transition-all text-white shadow-[0_10px_20px_rgba(244,63,94,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Purging...
                  </>
                ) : "Execute Purge"}
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
