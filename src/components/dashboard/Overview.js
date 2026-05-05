"use client";

import { motion } from "framer-motion";

function GaugeChart({ completionRate }) {
  return (
    <div className="relative h-60 w-60 flex-shrink-0 flex items-center justify-center overflow-visible">
      <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 224 224">
        <circle cx="112" cy="112" r="85" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="12" fill="transparent" />
        <motion.circle
          cx="112" cy="112" r="85"
          stroke="url(#harmony-grad)"
          strokeWidth="12"
          strokeDasharray={2 * Math.PI * 85}
          initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 85 - (completionRate / 100) * 2 * Math.PI * 85 }}
          transition={{ duration: 2, ease: "circOut" }}
          fill="transparent"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="harmony-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2d95" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center justify-center overflow-visible">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-5xl font-black text-white italic inline-block pr-[0.3em] -mr-[0.3em] tracking-tight whitespace-nowrap overflow-visible"
          >
            {completionRate}%
          </motion.span>
          <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 mt-2">OptimizationSystem</span>
        </div>
      </div>
    </div>
  );
}

export default function Overview({ tasks, activities = [] }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Use activities from props, fallback to tasks if empty (for initial load)
  const displayActivities = activities.length > 0
    ? activities.slice(0, 5)
    : tasks.slice(0, 5).map(t => ({ id: t.id, type: "Added", title: t.title, time: "System Boot" }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full"
    >
      {/* Left Main Matrix */}
      <div className="lg:col-span-8 flex flex-col gap-10">
        {/* Tier 1: Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Neural Registry", value: total, color: "from-blue-600/20", textColor: "text-blue-400", tag: "Total Tasks", icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
            { label: "Stable States", value: completed, color: "from-emerald-600/20", textColor: "text-emerald-400", tag: "Completed Tasks", icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
            { label: "Active Threads", value: pending, color: "from-pink-600/20", textColor: "text-pink-400", tag: "Pending Tasks", icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-[#050510]/60 backdrop-blur-2xl border-2 border-white/[0.12] p-10 rounded-[3rem] relative overflow-hidden transition-all duration-700 hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(255,45,149,0.1)]"
            >
              <div className={`absolute -inset-1 bg-gradient-to-br ${stat.color} to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-1000`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[12px] font-black tracking-[0.3em] text-slate-300 drop-shadow-sm">{stat.tag}</div>
                  <div className={`${stat.textColor} opacity-60 group-hover:opacity-100 transition-opacity`}>{stat.icon}</div>
                </div>
                <div className={`text-5xl font-black ${stat.textColor} italic tracking-tight pr-2 mb-4 drop-shadow-[0_10_20px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105 duration-500`}>{stat.value}</div>
                <div className="text-[13px] font-bold text-slate-400 tracking-widest">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tier 2: Harmony Plot */}
        <div className="bg-gradient-to-r from-[#050510]/90 via-[#08081a]/60 to-[#050510]/90 backdrop-blur-2xl border-2 border-white/[0.12] p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,45,149,0.05),transparent)] pointer-events-none" />
          <div className="max-w-md relative z-10 font-bold">
            <h3 className="text-4xl font-black text-white italic tracking-tight mb-6 leading-tight overflow-visible pb-2">
              System <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(255,45,149,0.3)] pr-[0.3em] -mr-[0.3em] whitespace-nowrap">Integrity</span>
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed font-light italic mb-8">
              The neural cluster is processing at <span className="text-white font-bold">{completionRate}% parity</span>.
              {pending > 0 ? ` Protocol synchronization is required for ${pending} outstanding nodes.` : " All operational nodes have reached a finalized equilibrium state."}
            </p>
            <div className="flex gap-4">
              <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black tracking-widest text-slate-400">Latency: 0.04ms</div>
              <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black tracking-widest text-slate-400">Integrity: High</div>
            </div>
          </div>
          <GaugeChart completionRate={completionRate} />
        </div>
      </div>

      {/* Right Sidebar Activity */}
      <div className="lg:col-span-4 flex flex-col gap-10">
        <div className="bg-[#050510]/60 backdrop-blur-2xl border-2 border-white/[0.12] p-12 rounded-[4rem] flex-1 flex flex-col relative overflow-hidden group hover:border-pink-500/20 transition-colors duration-700">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
          <h4 className="text-[13px] font-black tracking-[0.3em] text-pink-500 mb-6 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(255,45,149,0.8)] animate-pulse" />
            Recent Activity
          </h4>

          <div className="space-y-5">
            {displayActivities.map((act, i) => {
              const colorClass =
                act.type === "Added" ? "text-emerald-400" :
                  act.type === "Updated" ? "text-blue-400" :
                    act.type === "Purged" ? "text-rose-400" :
                      "text-cyan-400";

              const dotClass =
                act.type === "Added" ? "bg-emerald-500" :
                  act.type === "Updated" ? "bg-blue-500" :
                    act.type === "Purged" ? "bg-rose-500" :
                      "bg-cyan-500";

              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={act.id || i}
                  className="relative pl-6 border-l border-white/5 group/t transition-all"
                >
                  <div className={`absolute left-[-5px] top-[10px] h-2 w-2 rounded-full ${dotClass} shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all group-hover/t:scale-150`} />
                  <div className={`text-xs font-black tracking-widest text-white mb-1 truncate group-hover:${colorClass} transition-colors`}>{act.title}</div>
                  <div className="flex justify-between items-center pr-2">
                    <div className={`text-[10px] font-bold ${colorClass} tracking-widest opacity-80`}>{act.type} Registry</div>
                    <div className="text-[9px] font-medium text-slate-600 italic">{act.time}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-auto border-t border-white/[0.05] pt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-4 w-4 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/40">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">SecurityVerified</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
              Environment has been scanned. No unauthorized leaks detected in the TaskZen ecosystem.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
