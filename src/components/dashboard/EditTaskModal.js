"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function EditTaskModalInner({ task, onClose, onTaskUpdated, actionLoading, error }) {
  const initialTitle = task?.title || "";
  const initialDesc = task?.description || "";
  const initialDate = task?.taskDate || task?.taskdate || new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(() => initialTitle);
  const [desc, setDesc] = useState(() => initialDesc);
  const [date, setDate] = useState(() => initialDate);

  const isDirty = title !== initialTitle || desc !== initialDesc || date !== initialDate;

  // Lock scroll when open
  useEffect(() => {
    if (task) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      alert("System Error: Past dates cannot be selected for neural allocation.");
      return;
    }

    const success = await onTaskUpdated(task.id, { title, description: desc, taskDate: date });
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#02000d]/80 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Top accent */}
            <div className="absolute top-0 left-12 w-32 h-1.5 bg-gradient-to-r from-indigo-500 to-fuchsia-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

            {/* Close button */}
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-slate-400 transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </motion.button>

            {/* Header */}
            <div className="px-8 pt-10 pb-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-3xl font-black text-white tracking-[0.05em]">Modify Protocol</h2>
              <p className="text-indigo-400/80 text-[11px] font-black tracking-[0.4em] mt-2">Update Neural Node Parameters</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
              {/* Title */}
              <div className="space-y-2 group">
                <label className="text-[12px] font-black tracking-[0.2em] text-slate-400 flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  Task Objective
                </label>
                <input
                  type="text"
                  placeholder="What needs to be achieved?"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-base font-normal placeholder:text-slate-600"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2 group">
                <label className="text-[12px] font-black tracking-[0.2em] text-slate-400 flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
                  Metadata Description
                </label>
                <textarea
                  placeholder="Provide context for this node..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all min-h-[120px] resize-none text-base font-normal placeholder:text-slate-600 leading-relaxed"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Date */}
              <div className="space-y-2 group">
                <label className="text-[12px] font-black tracking-[0.2em] text-slate-400 flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Execution Date
                </label>
                <input
                  type="date"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-base font-bold [color-scheme:dark]"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-rose-500 text-xs font-black tracking-widest text-center">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl bg-white/[0.04] border-2 border-white/10 text-slate-400 font-bold hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 text-sm tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !title.trim() || !isDirty}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-black tracking-widest hover:shadow-[0_0_30px_rgba(255,45,149,0.4)] transition-all active:scale-95 text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
  );
}

export default function EditTaskModal(props) {
  return (
    <AnimatePresence>
      {props.task && <EditTaskModalInner key={props.task.id} {...props} />}
    </AnimatePresence>
  );
}
