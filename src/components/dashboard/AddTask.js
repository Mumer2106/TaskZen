"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AddTask({ onTaskAdded, onTaskUpdated, initialData, onCancel, actionLoading, error }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [date, setDate] = useState(initialData?.taskDate || initialData?.taskdate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDesc(initialData.description || "");
      setDate(initialData.taskDate || initialData.taskdate || new Date().toISOString().split('T')[0]);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      alert("System Error: Past dates cannot be selected for neural allocation.");
      return;
    }
    
    let success;
    if (initialData) {
      success = await onTaskUpdated(initialData.id, { title, description: desc, taskDate: date });
    } else {
      success = await onTaskAdded({ title, description: desc, taskDate: date });
    }

    if (success && !initialData) {
      setTitle("");
      setDesc("");
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl bg-[#050510]/95 backdrop-blur-xl border-2 border-indigo-500/30 rounded-[3rem] p-8 sm:p-12 shadow-[0_0_20px_rgba(79,70,229,0.1)] flex flex-col hover:border-indigo-500/50 transition-all duration-500"
    >
      <h2 className="text-3xl font-black mb-10 text-white flex items-center justify-start gap-4 tracking-tight">
        <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_15px_rgba(255,45,149,0.8)]"></span>
        {initialData ? "ModifyProtocol" : "Allocate New Node"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3 group">
          <label className="text-[13px] font-black tracking-[0.2em] text-slate-400 flex items-center gap-2 group-focus-within:text-pink-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            Task Objective
          </label>
          <input
            type="text"
            placeholder="What needs to be achieved?"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.06] focus:border-pink-500/30 transition-all text-xl font-normal placeholder:text-slate-700"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={actionLoading}
            required
          />
        </div>

        <div className="space-y-3 group">
          <label className="text-[13px] font-black tracking-[0.2em] text-slate-400 flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line x1="17" x2="3" y1="18" y2="18" /></svg>
            Metadata Description
          </label>
          <textarea
            placeholder="Provide context for this node..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.06] focus:border-indigo-500/30 transition-all min-h-[140px] resize-none text-base font-normal placeholder:text-slate-700 leading-relaxed"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={actionLoading}
          />
        </div>

        <div className="space-y-3 group">
          <label className="text-[13px] font-black tracking-[0.2em] text-slate-400 flex items-center gap-2 group-focus-within:text-pink-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
            Execution Date
          </label>
          <input
            type="date"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.06] focus:border-pink-500/30 transition-all text-lg font-bold [color-scheme:dark]"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            disabled={actionLoading}
            required
          />
        </div>

        {error && (
          <div className="text-rose-500 text-xs font-black tracking-widest text-center animate-bounce">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 btn-premium-pink py-5 rounded-[2rem] text-lg font-black tracking-widest transition-all duration-500 shadow-[0_10px_20px_rgba(255,45,149,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            disabled={actionLoading || !title.trim()}
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                {initialData ? "Saving..." : "Initializing..."}
              </>
            ) : (initialData ? "Save Changes" : "Initialize Node")}
          </button>
          
          {initialData && (
            <button
              onClick={onCancel}
              type="button"
              className="px-10 btn-premium-glass border border-white/10 rounded-[2rem] text-sm font-black tracking-widest hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
