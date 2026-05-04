"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export default function TaskList({ tasks, onToggleStatus, onDeleteTask, onEditTask, onViewTask, selectedIds = new Set(), onToggleSelect }) {
  const [loadingIds, setLoadingIds] = useState(new Set());

  const setLoading = (id, val) => setLoadingIds(prev => {
    const next = new Set(prev);
    val ? next.add(id) : next.delete(id);
    return next;
  });

  const handleToggle = async (id) => {
    if (loadingIds.has(id)) return;
    setLoading(id, true);
    try { await onToggleStatus(id); } finally { setLoading(id, false); }
  };

  const handleDelete = async (id) => {
    if (loadingIds.has(id)) return;
    setLoading(id, true);
    try { await onDeleteTask(id); } finally { setLoading(id, false); }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
        <div className="h-32 w-32 rounded-[2.5rem] bg-white/[0.02] flex items-center justify-center border border-white/5 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M2 12h20" /></svg>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-2">RegistryOffline</h3>
          <p className="text-slate-500 font-medium text-lg italic">No active nodes detected in this sector.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 max-w-6xl mx-auto relative mt-2 sm:mt-6">
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -top-10 sm:-top-11 right-6 sm:right-9 z-20"
          >
            <button
              onClick={() => onDeleteTask("BULK")}
              className="flex items-center gap-2 py-2 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] tracking-[0.2em] uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Purge {selectedIds.size} Node{selectedIds.size > 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {tasks.map((task, i) => {
          const formattedDate = new Date(task.taskDate || task.taskdate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
          
          const isSelected = selectedIds.has(task.id);

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              key={task.id}
              className={`group relative backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-9 flex flex-col lg:flex-row items-stretch justify-between gap-8 border-2 transition-all duration-700 overflow-hidden ${
                isSelected
                  ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_40px_rgba(244,63,94,0.15)]"
                  : "bg-white/[0.04] border-white/10 hover:border-pink-500/40 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_40px_rgba(255,45,149,0.1)]"
              }`}
            >
              {/* Background Glow */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              {/* Holographic scanner effect */}
              <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400/20 to-transparent top-0 animate-scanline pointer-events-none" />

              <div className="flex items-start sm:items-center gap-6 sm:gap-8 flex-1 min-w-0">
                {/* Status Checkbox */}
                <button 
                  onClick={() => handleToggle(task.id)}
                  disabled={loadingIds.has(task.id)}
                  className={`flex-shrink-0 h-14 w-14 rounded-[1.25rem] border-2 flex items-center justify-center transition-all duration-700 relative overflow-hidden group/check disabled:cursor-not-allowed ${task.status === "Completed" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-white/[0.04] border-white/10 text-slate-600 hover:border-pink-500/50 hover:bg-pink-500/5"}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/check:opacity-100 transition-opacity" />
                  {loadingIds.has(task.id) ? (
                    <svg className="animate-spin h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                  ) : task.status === "Completed" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckIcon /></motion.div>
                  ) : (
                    <div className="opacity-40 group-hover/check:opacity-100 group-hover/check:scale-110 transition-all"><CheckIcon /></div>
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  {/* DATE ABOVE TITLE */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black tracking-widest text-slate-600">RegistryLog</span>
                    <span className="text-[11px] font-bold text-slate-400 tracking-tight">{formattedDate}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <h3 className={`text-2xl sm:text-3xl font-black tracking-tighter italic truncate pr-6 transition-all duration-700 ${task.status === "Completed" ? "text-slate-600 blur-[0.5px] scale-95" : "text-white group-hover:text-pink-50 shadow-sm"}`}>
                      {task.title}
                    </h3>
                    {task.status === "Completed" ? (
                       <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-in fade-in zoom-in duration-500">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400">Completed</span>
                       </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full">
                          <div className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                          <span className="text-[10px] font-black tracking-[0.2em] text-pink-500">Pending</span>
                       </div>
                    )}
                  </div>
                  <p className={`text-base italic leading-relaxed transition-all duration-700 ${task.status === "Completed" ? "text-slate-700" : "text-slate-400 group-hover:text-slate-200"}`}>
                    {task.description || "No supplemental data available for this node."}
                  </p>
                </div>
              </div>

              {/* Right Side: Select & Actions */}
              <div className="flex flex-col items-end justify-between border-t lg:border-t-0 border-white/[0.05] pt-6 lg:pt-0 gap-6 flex-shrink-0 min-h-[110px]">
                {/* Selection checkbox - Top Right */}
                <button 
                  onClick={() => onToggleSelect(task.id)}
                  className={`h-6 w-6 sm:h-8 sm:w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 z-10 cursor-pointer ${
                    isSelected 
                      ? "bg-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" 
                      : "border-white/20 bg-white/[0.02] opacity-40 group-hover:opacity-100 hover:border-rose-400 hover:bg-rose-500/10"
                  }`}
                  title={isSelected ? "Deselect" : "Select Node"}
                >
                  {isSelected && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></motion.svg>
                  )}
                </button>

                {/* Actions Bar - Bottom Right */}
                <div className="flex flex-row items-center gap-3 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => onViewTask(task)}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-500 active:scale-90 flex items-center justify-center group/btn"
                    title="View Detail"
                  >
                    <motion.div whileHover={{ scale: 1.1 }}><ViewIcon /></motion.div>
                  </button>
                  <button 
                    onClick={() => onEditTask(task)}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-500 active:scale-90 flex items-center justify-center"
                    title="Edit Protocol"
                  >
                    <motion.div whileHover={{ scale: 1.1 }}><EditIcon /></motion.div>
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    disabled={loadingIds.has(task.id)}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-500 active:scale-90 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Node"
                  >
                    {loadingIds.has(task.id) ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                    ) : (
                      <motion.div whileHover={{ scale: 1.1 }}><TrashIcon /></motion.div>
                    )}
                  </button>
                </div>
              </div>

              {/* Hover Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-pink-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
