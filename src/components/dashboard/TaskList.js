"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

// ─── Icons ────────────────────────────────────────────────────────────────────
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

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
);

// ─── Skeleton loader for "Show More" transition ───────────────────────────────
function TaskSkeleton() {
  return (
    <div className="group relative backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-9 flex flex-col lg:flex-row items-stretch justify-between gap-8 border-2 bg-white/[0.02] border-white/5 overflow-hidden mb-8 animate-pulse">
      <div className="flex items-start sm:items-center gap-6 sm:gap-8 flex-1 min-w-0">
        <div className="flex-shrink-0 h-14 w-14 rounded-[1.25rem] bg-white/[0.04] border-2 border-white/10" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="h-3 w-24 bg-white/[0.05] rounded-full" />
          <div className="h-7 w-3/4 bg-white/[0.07] rounded-xl" />
          <div className="h-4 w-full bg-white/[0.04] rounded-lg" />
          <div className="h-4 w-2/3 bg-white/[0.04] rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col items-end justify-between border-t lg:border-t-0 border-white/[0.05] pt-6 lg:pt-0 gap-6 flex-shrink-0 min-h-[110px]">
        <div className="h-6 w-6 rounded-xl bg-white/[0.04] border-2 border-white/10" />
        <div className="flex gap-3">
          <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/5" />
          <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/5" />
          <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TaskList({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
  onViewTask,
  selectedIds = new Set(),
  onToggleSelect,
  hasMore,
  onShowMore,
  onHide,
  isLoadingMore,
  search,
  onSearchChange,
  onRefresh,
  isRefreshing,
}) {
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [internalLoading, setInternalLoading] = useState(false);

  // Ref used to scroll container back to top on "Hide"
  const listRef = useRef(null);

  // Track the previous tasks reference so we can detect list identity changes
  const prevTasksRef = useRef(tasks);

  // Reset pagination whenever the tasks array changes identity (search / refresh / add / delete)
  // Reset scroll on tasks change if needed (usually handled by onHide)
  useEffect(() => {
    if (prevTasksRef.current !== tasks) {
      prevTasksRef.current = tasks;
    }
  }, [tasks]);

  // ── Loading helpers ──────────────────────────────────────────────────────
  const setLoading = useCallback((id, val) => setLoadingIds(prev => {
    const next = new Set(prev);
    val ? next.add(id) : next.delete(id);
    return next;
  }), []);

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

  // ── Show More: API driven ───────────────────────────────────────────────
  const handleShowMore = async () => {
    if (isLoadingMore || internalLoading) return;
    setInternalLoading(true);
    
    // Store current scroll height before loading more
    const scrollContainer = listRef.current?.querySelector('.overflow-y-auto');
    const previousScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

    try {
      if (onShowMore) {
        await onShowMore();
        
        // Auto-scroll to the newly loaded content
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: previousScrollHeight - 50, // Scroll to roughly where new tasks start
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  // ── Hide: collapse back to first page via API ────────────────────────────
  const handleHide = async () => {
    if (onHide) {
      await onHide();
    }
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ─── Empty state ──────────────────────────────────────────────────────────


  const visibleTasks = tasks;
  // logic: show hide if we have nodes and we've reached the end (hasMore is false) 
  // and we have more than one page worth of nodes
  const canHide = tasks.length > 5 && !hasMore;
  const showLoading = isLoadingMore || internalLoading;

  console.log('[TaskList] Render state:', { tasksCount: tasks.length, hasMore, canHide, showLoading, isLoadingMore, internalLoading });

  return (
    <div ref={listRef} className="w-full max-w-6xl mx-auto relative mt-12 sm:mt-20">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-[#0b0b1a]/80 backdrop-blur-[40px] border-2 border-white/[0.12] rounded-[3rem] sm:rounded-[5rem] p-4 sm:p-12 shadow-[0_0_120px_rgba(255,45,149,0.1)] relative flex flex-col h-[82vh] sm:h-[950px] overflow-hidden group">
        
        {/* Subtle Inner Border Glow */}
        <div className="absolute inset-0 rounded-[3rem] sm:rounded-[5rem] border border-white/5 pointer-events-none" />
        <div className="absolute inset-0 rounded-[3rem] sm:rounded-[5rem] bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

        {/* Search & Refresh Tools */}
        <div className="mb-10 flex gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-pink-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Search neural registry sequences..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/[0.04] backdrop-blur-[10px] border-2 border-white/10 rounded-3xl pl-12 sm:pl-16 pr-8 py-4 sm:py-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/40 transition-all font-bold italic text-sm sm:text-base shadow-inner"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`px-4 sm:px-8 rounded-3xl bg-white/[0.04] backdrop-blur-[10px] border-2 border-white/10 transition-all shadow-lg active:scale-95 flex items-center justify-center ${isRefreshing ? "text-pink-500 border-pink-500/30 bg-pink-500/10" : "text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.06]"}`}
            title="Refresh Sequence"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin" : "transition-transform hover:rotate-180"}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-4.4 3.6-8 8-8 3.3 0 6.2 2 7.4 4.9M22 12c0 4.4-3.6 8-8 8-3.3 0-6.2-2-7.4-4.9"></path></svg>
          </button>
        </div>

        {/* Bulk Actions Area */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-8 flex justify-center sticky top-0 z-[30]"
            >
              <button
                onClick={() => onDeleteTask("BULK")}
                className="flex items-center gap-3 py-3 px-10 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[12px] tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(225,29,72,0.4)] active:scale-95 transition-all"
              >
                <TrashIcon />
                Purge {selectedIds.size} Node{selectedIds.size > 1 ? "s" : ""}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grouped Task Stream */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-16 custom-scrollbar-blue relative z-10 min-h-0">
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-8">
              <div className="h-32 w-32 rounded-[2.5rem] bg-white/[0.02] flex items-center justify-center border border-white/5 opacity-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M2 12h20" /></svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-2">Registry Offline</h3>
                <p className="text-slate-500 font-medium text-lg italic">{search ? "No matching nodes found for this sequence." : "No active nodes detected in this sector."}</p>
              </div>
            </div>
          ) : (
            Object.entries(visibleTasks.reduce((groups, task) => {
              const date = new Date(task.taskDate || task.taskdate).toLocaleDateString("en-US", {
                day: "2-digit", month: "short", year: "numeric",
              });
              if (!groups[date]) groups[date] = [];
              groups[date].push(task);
              return groups;
            }, {})).sort(([a], [b]) => new Date(b) - new Date(a)).map(([date, dateTasks]) => (
              <div key={date} className="space-y-8">
                <div className="sticky top-0 z-10 py-5 bg-[#08081a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-[0.3em] text-pink-500 italic uppercase">{date}</span>
                  <div className="h-px flex-1 mx-8 bg-gradient-to-r from-pink-500/20 to-transparent" />
                </div>

                <div className="grid gap-8">
                  {dateTasks.map(task => {
                    const isSelected = selectedIds.has(task.id);
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={task.id} 
                        className="relative group/task overflow-visible w-full max-w-5xl mx-auto"
                      >
                        <div className="relative bg-[#0d0d21]/60 backdrop-blur-3xl border-2 border-white/10 p-4 sm:p-9 rounded-[2.5rem] sm:rounded-[3rem] transition-all">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex-1 min-w-0">
                              {/* Selection Box - Absolutely positioned to top right */}
                              <button
                                onClick={() => onToggleSelect(task.id)}
                               className={`lg:hidden absolute top-5 right-5 sm:top-9 sm:right-9 h-8 w-8 rounded-lg border-2 flex items-center justify-center transition-all active:scale-95 z-20 ${isSelected ? "bg-pink-500 border-pink-500 shadow-[0_0_15px_rgba(255,45,149,0.3)]" : "border-white/10 bg-white/5 hover:border-pink-500/40 text-transparent hover:text-pink-500"}`}
                              >
                                <CheckIcon />
                              </button>

                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                  {/* Desktop Select Box */}
                                  <button 
                                    onClick={() => onToggleSelect(task.id)}
                                    className={`hidden lg:flex h-6 w-6 rounded-lg border-2 items-center justify-center transition-all active:scale-95 ${isSelected ? "bg-pink-500 border-pink-500 shadow-[0_0_15px_rgba(255,45,149,0.3)]" : "border-white/10 bg-white/5 hover:border-pink-500/40 text-transparent hover:text-pink-500"}`}
                                  >
                                    <div className="scale-75"><CheckIcon /></div>
                                  </button>
                                  <span className={`px-4 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border ${task.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-pink-500/10 text-pink-500 border-pink-500/20"}`}>
                                      {task.status === "Completed" ? "Completed" : "Pending"}
                                  </span>
                                </div>
                                <h3 className={`text-xl sm:text-4xl font-black italic tracking-tighter leading-tight transition-all duration-500 capitalize ${task.status === "Completed" ? "text-slate-500/60" : "text-white"}`}>
                                    {(task.title || '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                </h3>
                                <p className={`text-[14px] sm:text-base font-medium italic leading-relaxed truncate max-w-3xl border-l-[3px] border-white/5 pl-6 transition-colors ${task.status === "Completed" ? "text-slate-700" : "text-slate-400"}`}>
                                  {task.description || "No neural data logged."}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-row items-center justify-center lg:justify-end gap-1.5 sm:gap-5 pt-6 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0 relative z-10">
                              <button 
                                  onClick={() => handleToggle(task.id)} 
                                  disabled={loadingIds.has(task.id)}
                                  title={task.status === 'Completed' ? 'Reset to Pending' : 'Mark as Completed'}
                                  className={`h-10 w-10 sm:h-14 sm:w-14 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 ${task.status === 'Completed' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                              >
                                  {task.status === 'Completed' ? <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <CheckIcon />}
                              </button>
                              <button onClick={() => onViewTask(task)} title="View Node" className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-sky-500/10 border-2 border-sky-500/20 flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/40 text-sky-400 transition-all active:scale-90"><ViewIcon /></button>
                              <button onClick={() => onEditTask(task)} title="Edit Node" className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 transition-all active:scale-90"><EditIcon /></button>
                              <button onClick={() => handleDelete(task.id)} title="Purge Node" className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center hover:bg-rose-600 hover:text-white text-rose-400 transition-all active:scale-90"><TrashIcon /></button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {showLoading && (
            <div className="space-y-8 mt-8">
              {[...Array(2)].map((_, i) => <TaskSkeleton key={i} />)}
            </div>
          )}
        </div>

        {/* Pagination Console */}
        {(hasMore || canHide) && (
          <div className="mt-12 flex justify-center relative z-20 pb-4">
            {hasMore ? (
              <button
                onClick={handleShowMore}
                disabled={showLoading}
                className="px-10 py-4 rounded-2xl bg-pink-500 text-white font-black text-[13px] tracking-widest shadow-[0_15px_35px_rgba(255,45,149,0.4)] hover:bg-pink-400 active:scale-95 transition-all disabled:opacity-50"
              >
                Show More Nodes
              </button>
            ) : (
              <button
                onClick={handleHide}
                className="px-10 py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-slate-400 font-black text-[13px] tracking-widest hover:border-white/20 transition-all shadow-xl"
              >
                Hide Nodes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
