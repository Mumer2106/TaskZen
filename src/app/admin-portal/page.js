"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const USERS_PAGE = 5;
const TASKS_PAGE = 5;

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
);

// ─── UI Components (High Fidelity) ───────────────────────────────────────────

function StatCard({ label, value, icon, colorClass, glowClass }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`group bg-[#050510]/80 backdrop-blur-3xl border-2 border-white/[0.15] p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] relative overflow-hidden transition-all duration-700 hover:border-pink-500/40 shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(${glowClass},0.05)]`}
        >
            <div className={`absolute -inset-1 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-1000`} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="text-[10px] sm:text-[12px] font-black tracking-widest text-slate-300 italic border-b border-pink-500/30 pb-1">{label}</div>
                    <div className={`${colorClass} opacity-60 group-hover:opacity-100 transition-opacity scale-75 sm:scale-100`}>{icon}</div>
                </div>
                <div className={`text-5xl sm:text-7xl font-black ${colorClass} italic tracking-tighter mb-1 sm:mb-2 drop-shadow-[0_10px_30px_rgba(${glowClass},0.3)]`}>
                    {value}
                </div>
                <div className="text-[8px] sm:text-[10px] font-black text-slate-500 tracking-widest mt-1 italic uppercase opacity-60">Real-Time Sync</div>
            </div>
        </motion.div>
    );
}

function DonutChart({ pending, completed }) {
    const total = pending + completed;
    const completedRate = total > 0 ? (completed / total) * 100 : 0;
    const r = 85;
    const circ = 2 * Math.PI * r;
    const offset = circ - (completedRate / 100) * circ;

    return (
        <div className="relative h-56 w-56 sm:h-72 sm:w-72 flex items-center justify-center overflow-visible">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 224 224">
                <circle cx="112" cy="112" r={r} stroke="rgba(255, 45, 149, 0.05)" strokeWidth="18" fill="transparent" />
                <motion.circle
                    cx="112" cy="112" r={r}
                    stroke="url(#professional-grad)"
                    strokeWidth="18"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "circOut" }}
                    fill="transparent"
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="professional-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff2d95" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-7xl font-black text-white italic drop-shadow-[0_0_30px_rgba(255,45,149,0.5)]"
                >
                    {Math.round(completedRate)}%
                </motion.span>
                <span className="text-[8px] sm:text-[11px] font-black tracking-[0.3em] sm:tracking-[0.5em] text-slate-500 uppercase mt-1 sm:mt-2 italic">Integrity Index</span>
            </div>
        </div>
    );
}

function BarChart({ tasks }) {
    const data = useMemo(() => {
        // Build a map of date -> count from tasks
        const groups = tasks.reduce((acc, task) => {
            const raw = task.taskDate || task.taskdate;
            if (!raw || raw === "Unknown") return acc;
            const date = raw.split('T')[0]; // Normalize to YYYY-MM-DD
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Determine date range: from earliest task date to today
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const allDates = Object.keys(groups).sort();
        const startDate = allDates.length > 0 ? allDates[0] : today;

        // Generate every day from startDate to today
        const fullRange = [];
        const cursor = new Date(startDate);
        const end = new Date(today);
        while (cursor <= end) {
            const dateStr = cursor.toLocaleDateString('en-CA');
            fullRange.push([dateStr, groups[dateStr] || 0]);
            cursor.setDate(cursor.getDate() + 1);
        }

        // Show last 7 days (1 week) so the chart stays clean
        return fullRange.slice(-7);
    }, [tasks]);

    const max = Math.max(...data.map(([, v]) => v), 1);
    const yAxisLabels = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0];

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 flex mt-8 sm:mt-12 overflow-visible min-h-[300px]">
                {/* Plot Area & X-Axis combined */}
                <div className="flex-1 flex items-end justify-between sm:px-4 h-[22rem] relative overflow-visible">
                    {/* Grid Lines */}
                    <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none opacity-[0.03] pb-0">
                        {yAxisLabels.map((_, i) => (
                            <div key={i} className="w-full border-t border-white h-0" />
                        ))}
                    </div>

                    {/* Bars + Labels Pair */}
                    {data.map(([date, value], i) => {
                        const isEmpty = value === 0;
                        return (
                            <div key={date} className="flex-1 flex flex-col items-center justify-end h-full relative z-10 group/bar px-0.5 sm:px-1">
                                <div className="relative w-full flex-1 flex items-end justify-center mb-6">
                                    {isEmpty ? (
                                        /* Empty day — faded dim bar with 0 label */
                                        <div className="w-full flex items-end justify-center h-full">
                                            <div className="w-full max-w-[24px] sm:max-w-[36px] h-[18%] bg-gradient-to-t from-white/[0.06] to-white/[0.12] rounded-t-xl border border-white/[0.08] backdrop-blur-sm relative">
                                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-black text-slate-500 bg-white/[0.05] px-1.5 py-1 sm:px-2 rounded-lg border border-white/[0.07] whitespace-nowrap">
                                                    <span className="opacity-60 mr-0.5 text-[7px] sm:text-[8px]">T:</span>0
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(value / max) * 100}%` }}
                                            transition={{ duration: 1, delay: i * 0.07, ease: "circOut" }}
                                            className="w-full max-w-[24px] sm:max-w-[36px] bg-gradient-to-t from-indigo-600 via-purple-500 to-pink-500 rounded-t-2xl relative group-hover/bar:brightness-125 transition-all shadow-[0_0_30px_rgba(255,45,149,0.2)]"
                                        >
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[9px] sm:text-[11px] font-black text-white bg-pink-600 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-[0_10px_25px_rgba(255,45,149,0.5)] opacity-100 group-hover/bar:scale-110 transition-all whitespace-nowrap border border-white/20 z-20">
                                                <span className="opacity-60 mr-0.5 text-[7px] sm:text-[9px]">T:</span>{value}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                {/* Date label */}
                                <div className="h-10 flex items-center justify-center">
                                    <div className={`inline-block text-[7px] sm:text-[9px] font-black tracking-widest px-1 py-1 sm:px-2 rounded-lg border shadow-inner ${isEmpty ? 'text-slate-600 bg-white/[0.02] border-white/[0.03]' : 'text-slate-400 bg-white/5 border-white/5'}`}>
                                        {date.split('-').slice(1).join('/')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ResonanceChart({ tasks }) {

    const data = useMemo(() => {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const dayCounts = tasks.reduce((acc, task) => {
            const date = task.taskDate || task.taskdate;
            if (!date || date === "Unknown") return acc;
            const dateStr = date.split('T')[0]; // Ensure only YYYY-MM-DD
            if (!acc[dateStr]) acc[dateStr] = { created: 0, completed: 0 };
            acc[dateStr].created++;
            if (task.status === 'Completed') acc[dateStr].completed++;
            return acc;
        }, {});

        // Generate exactly the last 7 days including today
        const fullRange = [];
        const cursor = new Date();
        cursor.setDate(cursor.getDate() - 6); // Start from 6 days ago

        for (let i = 0; i < 7; i++) {
            const dateStr = cursor.toLocaleDateString('en-CA');
            fullRange.push({
                date: dateStr,
                ...(dayCounts[dateStr] || { created: 0, completed: 0 })
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        return fullRange;
    }, [tasks]);

    const isTodayEmpty = useMemo(() => {
        const today = new Date().toLocaleDateString('en-CA');
        const todayData = data.find(d => d.date === today);
        return !todayData || todayData.created === 0;
    }, [data]);

    if (!data || data.length < 2) {
        return (
            <div className="h-80 w-full flex flex-col items-center justify-center opacity-30 italic">
                <div className="w-10 h-10 border-2 border-slate-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Initializing Core...</p>
            </div>
        );
    }

    const max = Math.max(...data.map(d => d.created + d.completed), 1);

    const getPath = (key, offset = 0, isArea = false) => {
        const pts = data.map((d, i) => ({
            x: (i / (data.length - 1)) * 100,
            y: 50 - ((d[key] / max) * 45) + offset
        }));

        let d = `M 0,${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) / 2;
            d += ` C ${cp1x},${pts[i].y} ${cp1x},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
        }
        if (isArea) {
            d += ` L 100,100 L 0,100 Z`;
        }
        return d;
    };

    return (
        <div className="h-[28rem] sm:h-[32rem] lg:h-[26rem] w-full relative mt-4 px-2 group select-none">


            {/* Background Technical Mesh */}
            <div className="absolute inset-x-0 top-0 bottom-20 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050510] to-[#050510]" />
            </div>

            {/* No Tasks Today Message */}
            <AnimatePresence>
                {isTodayEmpty && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-x-0 top-1/4 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="bg-[#08081a]/40 backdrop-blur-3xl border-2 border-white/10 px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 italic">No Operational Tasks Encountered Today</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="h-full w-full relative overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-[120%] h-[60%] overflow-visible -ml-[10%]" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="area-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(79, 70, 229, 0.4)" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <linearGradient id="area-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(236, 72, 153, 0.4)" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>

                        {/* Shimmer Pattern for continuous movement */}
                        <linearGradient id="flow-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                            <stop offset="50%" stopColor="white" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                            <animate attributeName="x1" from="-100%" to="100%" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="x2" from="0%" to="200%" dur="3s" repeatCount="indefinite" />
                        </linearGradient>

                        <filter id="glow">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Background Filled Areas with horizontal oscillation */}
                    <motion.g animate={{ x: [-1, 1, -1] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                        <motion.path d={getPath('created', -5, true)} fill="url(#area-grad-1)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} />
                        <motion.path d={getPath('completed', 15, true)} fill="url(#area-grad-2)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.5 }} />

                        {/* The Main Waves with continuous movement */}
                        <motion.path
                            d={getPath('created', -5)}
                            fill="none" stroke="#6366f1" strokeWidth="1.5" filter="url(#glow)"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 3, ease: "easeInOut" }}
                        />
                        <motion.path
                            d={getPath('completed', 15)}
                            fill="none" stroke="#ec4899" strokeWidth="1.5" filter="url(#glow)"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
                        />

                        {/* Shimmer Overlays */}
                        <path d={getPath('created', -5)} fill="none" stroke="url(#flow-shimmer)" strokeWidth="2" />
                        <path d={getPath('completed', 15)} fill="none" stroke="url(#flow-shimmer)" strokeWidth="2" />
                    </motion.g>


                    {/* Animated Particles along paths */}
                    {[0, 25, 50, 75].map(offset => (
                        <motion.circle key={offset} r="0.6" fill="#fff" className="shadow-[0_0_8px_white]">
                            <animateMotion dur="5s" repeatCount="indefinite" path={getPath('created', -5)} keyPoints={`${offset / 100};${(offset / 100 + 1) % 1}`} keyTimes="0;1" />
                        </motion.circle>
                    ))}
                </svg>

                {/* Mobile View: Stats arranged horizontally (Left - Center - Right) */}
                <div className="lg:hidden absolute inset-x-0 bottom-8 flex items-end justify-center gap-2 px-2 pointer-events-none">

                    {/* Mobile: Inbound (Left) */}
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-2 sm:p-3 rounded-[1rem] sm:rounded-[1.5rem] shadow-xl space-y-1">
                        <div className="text-[7px] font-black text-indigo-400 tracking-widest italic text-center">Inbound</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white italic tracking-tighter">{data[data.length - 1].created}</span>
                        </div>
                    </div>

                    {/* Mobile: Focal Point (Sync Index - Center) */}
                    <div className="relative group mx-2">
                        <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                        <div className="relative bg-[#08081a]/80 backdrop-blur-3xl border-2 border-white/10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,45,149,0.15)] gap-0.5">
                            <div className="text-[7px] font-black text-slate-500 tracking-widest mb-1 text-center px-1">Sync Index</div>
                            <div className="text-xl font-black text-white italic tracking-tighter flex items-center gap-0.5">
                                {Math.round((data[data.length - 1].completed / data[data.length - 1].created) * 100 || 0)}
                                <span className="text-[10px] opacity-40 ml-0.5 font-bold">%</span>
                            </div>
                            <div className="h-1 w-8 bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500 rounded-full shadow-[0_0_10px_#ec4899] mt-1.5" />
                        </div>
                    </div>

                    {/* Mobile: Outbound (Right) */}
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-2 sm:p-3 rounded-[1rem] sm:rounded-[1.5rem] shadow-xl space-y-1 text-right">
                        <div className="text-[7px] font-black text-pink-400 tracking-widest italic text-center">Outbound</div>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl font-black text-white italic tracking-tighter">{data[data.length - 1].completed}</span>
                        </div>
                    </div>
                </div>

                {/* Desktop View: Restore Original Bottom Layout */}
                <div className="hidden lg:flex absolute inset-x-0 bottom-0 justify-between items-end pb-12 px-12 pointer-events-none">
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl space-y-3">
                        <div className="text-[10px] font-black text-indigo-400 tracking-widest italic mb-1 text-center">Total Tasks</div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-2xl">{data[data.length - 1].created}</span>
                            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Tasks</span>
                        </div>
                    </div>

                    <div className="relative group -mb-4">
                        <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" />
                        <div className="relative bg-[#08081a]/80 backdrop-blur-3xl border-2 border-white/10 w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,45,149,0.1)] gap-1">
                            <div className="text-[10px] font-black text-slate-500 tracking-widest mb-2 text-center">Sync Index</div>
                            <div className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-1">
                                {Math.round((data[data.length - 1].completed / data[data.length - 1].created) * 100 || 0)}
                                <span className="text-xl opacity-40 ml-1">%</span>
                            </div>
                            <div className="h-1.5 w-14 bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500 rounded-full shadow-[0_0_15px_#ec4899] mt-3" />
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl space-y-3 text-right">
                        <div className="text-[10px] font-black text-pink-400 tracking-widest italic mb-1 text-center">Completed Tasks</div>
                        <div className="flex items-baseline justify-end gap-3">
                            <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-2xl">{data[data.length - 1].completed}</span>
                            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Done</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}








// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function UserSkeleton() {
    return (
        <div className="flex items-center justify-between p-8 border-2 border-white/5 rounded-[2.5rem] bg-white/[0.02] animate-pulse">
            <div className="min-w-0 flex-1 mr-6 space-y-4">
                <div className="h-5 w-48 bg-white/[0.07] rounded-full" />
                <div className="h-3 w-32 bg-white/[0.04] rounded-full" />
            </div>
            <div className="h-12 w-32 rounded-2xl bg-white/[0.06]" />
        </div>
    );
}

function TaskSkeletonAdmin() {
    return (
        <div className="relative bg-white/[0.02] border-2 border-white/5 p-10 rounded-[3.5rem] animate-pulse">
            <div className="flex justify-between items-start mb-8">
                <div className="min-w-0 flex-1 space-y-5">
                    <div className="h-8 w-3/4 bg-white/[0.07] rounded-2xl" />
                    <div className="flex gap-4">
                        <div className="h-6 w-28 bg-white/[0.05] rounded-full" />
                        <div className="h-6 w-24 bg-white/[0.04] rounded-full" />
                    </div>
                </div>
                <div className="hidden lg:flex gap-4">
                    <div className="h-12 w-24 rounded-2xl bg-white/[0.05]" />
                    <div className="h-12 w-12 rounded-2xl bg-white/[0.05]" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-4 w-full bg-white/[0.04] rounded-lg" />
                <div className="h-4 w-5/6 bg-white/[0.04] rounded-lg" />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPortal() {
    const [secret, setSecret] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Stats — from /api/admin/data
    const [stats, setStats] = useState(null);

    // Visible slices driven by pagination state
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [modalTasks, setModalTasks] = useState([]);


    const [chartTasks, setChartTasks] = useState([]);
    const [usersHasMore, setUsersHasMore] = useState(false);
    const [tasksHasMore, setTasksHasMore] = useState(false);
    const [usersTotal, setUsersTotal] = useState(0);
    const [tasksTotal, setTasksTotal] = useState(0);

    // Pagination offsets
    const [usersOffset, setUsersOffset] = useState(0);
    const [tasksOffset, setTasksOffset] = useState(0);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [showMoreUsersLoading, setShowMoreUsersLoading] = useState(false);
    const [showMoreTasksLoading, setShowMoreTasksLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Refs for stable retrieval in callbacks without re-triggering them
    const usersOffsetRef = useRef(0);
    const tasksOffsetRef = useRef(0);

    const [error, setError] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [taskDropdown, setTaskDropdown] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const usersListRef = useRef(null);
    const tasksListRef = useRef(null);

    const onlineUsers = useMemo(() => {
        const sourceData = stats?.recentActiveUsers || [];
        return sourceData.map(u => ({
            ...u,
            isOnline: !!u.isOnline // Use server-calculated status
        }));
    }, [stats]);

    // ── Auth helpers ─────────────────────────────────────────────────────────
    const handleLogin = async (e) => { e.preventDefault(); fetchData(secret); };
    const handleLock = () => { setIsAuthenticated(false); setSecret(""); resetState(); };

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        await fetchData(secret, true, true); // silent refresh, force all
        // Artificial delay for better UX feel
        setTimeout(() => setRefreshing(false), 800);
    };

    const resetState = () => {
        setStats(null);
        setUsers([]); setTasks([]); setChartTasks([]);
        setUsersOffset(0); setTasksOffset(0);
        setUsersHasMore(false); setTasksHasMore(false);
        setSelectedUserId(null);
    };

    // ── /api/admin/data  →  stats block only ─────────────────────────────────
    const fetchStats = useCallback(async (adminSecret) => {
        try {
            const res = await fetch(`/api/admin/data?secret=${encodeURIComponent(adminSecret)}`);
            const result = await res.json();
            if (res.ok) {
                setStats(result.stats);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    // ── /api/admin/users  →  User Registry panel ──────────────────────────────
    const fetchUsers = useCallback(async (adminSecret, offset = 0, append = false) => {
        try {
            const params = new URLSearchParams({
                secret: adminSecret,
                limit: USERS_PAGE,
                offset,
            });
            const res = await fetch(`/api/admin/users?${params}`);
            const result = await res.json();
            if (res.ok) {
                setUsers(prev => append ? [...prev, ...result.users] : result.users);
                setUsersHasMore(result.hasMore);
                setUsersTotal(result.total);
                return result;
            }
        } catch (err) {
            console.error('[fetchUsers]', err);
        }
    }, []);

    // ── /api/admin/tasks  →  Data Stream panel ────────────────────────────────
    const fetchTasks = useCallback(async (adminSecret, offset = 0, userId = null, append = false) => {
        try {
            const params = new URLSearchParams({
                secret: adminSecret,
                limit: userId ? 1000 : TASKS_PAGE,
                offset,
            });
            if (userId) params.set('userId', userId);
            const res = await fetch(`/api/admin/tasks?${params}`);
            const result = await res.json();
            if (res.ok) {
                setTasks(prev => append ? [...prev, ...result.tasks] : result.tasks);
                setTasksHasMore(result.hasMore);
                setTasksTotal(result.total);
                return result;
            }
        } catch (err) {
            console.error('[fetchTasks]', err);
        }
    }, []);

    // ── Initial data fetch — fires all APIs ──────────────────────────────────
    const fetchData = useCallback(async (adminSecret, silent = false, forceAll = false) => {
        if (!silent) {
            setLoading(true);
            setUsersOffset(0);
            usersOffsetRef.current = 0;
            setTasksOffset(0);
            tasksOffsetRef.current = 0;
        }
        setError("");

        try {
            const statsOk = await fetchStats(adminSecret);
            if (!statsOk && !silent) { setError("Access Denied"); return; }
            setIsAuthenticated(true);

            // Surgical Data Retrieval Strategy
            const promises = [];

            if (activeTab === 'overview' || forceAll) {
                // Dashboard needs bulk tasks for charts only on initial load or manual refresh
                if (!silent || forceAll) {
                    promises.push(
                        fetch(`/api/admin/tasks?secret=${encodeURIComponent(adminSecret)}&limit=1000`)
                            .then(res => res.json())
                            .then(data => setChartTasks(data.tasks || []))
                            .catch(e => console.error(e))
                    );

                    // Pre-fetch registry data
                    promises.push(fetchUsers(adminSecret, 0, false));
                    promises.push(fetchTasks(adminSecret, 0, null, false));
                }
            }

            if (activeTab === 'users' || (forceAll && activeTab !== 'overview')) {
                promises.push(fetchUsers(adminSecret, usersOffsetRef.current, false));
            }

            if (activeTab === 'tasks' || (forceAll && activeTab !== 'overview')) {
                promises.push(fetchTasks(adminSecret, tasksOffsetRef.current, null, false));
            }

            // Refresh modal tasks if viewing a specific user's activity
            if (showActivityModal && selectedUserId) {
                promises.push(
                    fetch(`/api/admin/tasks?secret=${encodeURIComponent(adminSecret)}&userId=${selectedUserId}&limit=1000`)
                        .then(res => res.json())
                        .then(data => setModalTasks(data.tasks || []))
                        .catch(e => console.error(e))
                );
            }

            if (promises.length > 0) await Promise.all(promises);
        } catch (err) {
            if (!silent) setError("Connection failed");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [fetchStats, fetchUsers, fetchTasks, selectedUserId, activeTab]);



    // ── Block background scroll when modals are open ──────────────────────────
    useEffect(() => {
        const isModalOpen = showUserModal || showActivityModal || !!pendingDelete;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--scrollbar-width, 0px)'; // Optional: prevent layout shift
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [showUserModal, showActivityModal, pendingDelete]);

    // ── Show More: Users  →  /api/admin/users ────────────────────────────────
    const handleShowMoreUsers = async () => {
        if (showMoreUsersLoading) return;
        setShowMoreUsersLoading(true);
        const nextOffset = usersOffset + USERS_PAGE;
        await fetchUsers(secret, nextOffset, true);   // append = true
        setUsersOffset(nextOffset);
        usersOffsetRef.current = nextOffset;
        setShowMoreUsersLoading(false);

        // Auto-scroll to the bottom of the list to show new content
        setTimeout(() => {
            if (usersListRef.current) {
                usersListRef.current.scrollTo({
                    top: usersListRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    // ── Hide: Users  →  re-fetch first page from /api/admin/users ────────────
    const handleHideUsers = () => {
        setUsers(prev => prev.slice(0, USERS_PAGE));
        setUsersOffset(0);
        usersOffsetRef.current = 0;
        setUsersHasMore(true);
        if (usersListRef.current) usersListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Show More: Tasks  →  /api/admin/tasks ────────────────────────────────
    const handleShowMoreTasks = async () => {
        if (showMoreTasksLoading) return;
        setShowMoreTasksLoading(true);
        const nextOffset = tasksOffset + TASKS_PAGE;
        await fetchTasks(secret, nextOffset, null, true);  // Always global
        setTasksOffset(nextOffset);
        tasksOffsetRef.current = nextOffset;
        setShowMoreTasksLoading(false);

        // Auto-scroll to the bottom of the list to show new content
        setTimeout(() => {
            if (tasksListRef.current) {
                tasksListRef.current.scrollTo({
                    top: tasksListRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    // ── Hide: Tasks  →  re-fetch first page from /api/admin/tasks ────────────
    const handleHideTasks = () => {
        setTasks(prev => prev.slice(0, TASKS_PAGE));
        setTasksOffset(0);
        tasksOffsetRef.current = 0;
        setTasksHasMore(true);
        if (tasksListRef.current) tasksListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── User filter: reset task pagination & re-fetch from /api/admin/tasks ──
    const handleSelectUser = async (userId) => {
        const newId = userId;
        // Instant data retrieval from pre-cached chartTasks for 0% delay
        const cachedTasks = chartTasks.filter(t => t.userId === newId || t.createdBy === newId);
        setModalTasks(cachedTasks);
        setSelectedUserId(newId);
        setShowActivityModal(true);

        // Background sync to ensure data integrity without blocking UI
        try {
            const res = await fetch(`/api/admin/tasks?secret=${encodeURIComponent(secret)}&userId=${newId}&limit=1000`);
            if (res.ok) {
                const result = await res.json();
                setModalTasks(result.tasks || []);
            }
        } catch (err) { console.error(err); }
    };

    const handleClearFilter = async () => {
        setSelectedUserId(null);
        setShowActivityModal(false);
        setModalTasks([]);
        // Re-fetch users to ensure the full list is visible after clearing individual review
        if (isAuthenticated && secret) {
            fetchUsers(secret, 0, false);
            setUsersOffset(0);
            usersOffsetRef.current = 0;
            setUsersHasMore(true);
        }
    };


    // Cross-tab sync removed — data is fetched on-demand only.


    // ── Online Status Check (Optimized Polling) ─────────────────────────────
    // Balanced setting: updates automatically every 30s for a "live" feel
    // without the network noise of high-frequency polling.
    useEffect(() => {
        if (!isAuthenticated || !secret || activeTab !== 'overview') return;

        const checkOnlineStatus = async () => {
            // Only poll if tab is active and visible
            if (document.visibilityState !== 'visible') return;

            try {
                const res = await fetch(`/api/admin/online?secret=${encodeURIComponent(secret)}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => prev ? { ...prev, recentActiveUsers: data.users } : prev);
                }
            } catch (err) { }
        };

        checkOnlineStatus();
        const interval = setInterval(checkOnlineStatus, 30000); // 30s for optimal load balance
        return () => clearInterval(interval);
    }, [isAuthenticated, secret, activeTab]);

    // ── Task status toggle ────────────────────────────────────────────────────
    const toggleTaskStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";

        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        setModalTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        setChartTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        setStats(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                pendingTasks: prev.pendingTasks + (newStatus === 'Pending' ? 1 : -1),
                completedTasks: prev.completedTasks + (newStatus === 'Completed' ? 1 : -1),
            };
        });

        setActionLoading({ id, type: 'status' });
        try {
            // ↳ dedicated task endpoint
            const res = await fetch(`/api/admin/tasks?secret=${encodeURIComponent(secret)}&id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                // Rollback optimistic update
                await fetchTasks(secret, 0, selectedUserId, false);
                setTasksOffset(0);
            } else {
                localStorage.setItem('taskzen_registry_sync', Date.now());
                // Keep stats in sync
                fetchStats(secret);
            }
        } catch (err) {
            console.error(err);
            await fetchTasks(secret, 0, selectedUserId, false);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateUser = async (userId, updates) => {
        setUpdateLoading(true);
        try {
            const res = await fetch(`/api/admin/users?secret=${encodeURIComponent(secret)}&id=${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser.user } : u));
                setShowUserModal(false);
                setEditingUser(null);
                localStorage.setItem('taskzen_registry_sync', Date.now());
                fetchStats(secret);
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to update user vertex.");
            }
        } catch (err) {
            console.error(err);
            alert("Connection error during vertex synchronization.");
        } finally {
            setUpdateLoading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const { id, type } = pendingDelete;

        setActionLoading({ id, type: 'delete' });
        setPendingDelete(null);
        try {
            // Route to the correct dedicated endpoint per resource type
            const endpoint = type === 'user'
                ? `/api/admin/users?secret=${encodeURIComponent(secret)}&id=${id}`
                : `/api/admin/tasks?secret=${encodeURIComponent(secret)}&id=${id}`;

            const res = await fetch(endpoint, { method: 'DELETE' });

            if (res.ok) {
                if (type === 'user' && selectedUserId === id) handleClearFilter();

                // Optimistic removal from visible list
                if (type === 'user') {
                    setUsers(prev => prev.filter(u => u.id !== id));
                    setUsersTotal(prev => Math.max(0, prev - 1));
                    setStats(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            totalUsers: Math.max(0, prev.totalUsers - 1),
                            recentActiveUsers: prev.recentActiveUsers ? prev.recentActiveUsers.filter(u => u.id !== id) : []
                        };
                    });
                } else if (type === 'task') {
                    const removed = tasks.find(t => t.id === id) || chartTasks.find(t => t.id === id) || modalTasks.find(t => t.id === id);
                    setTasks(prev => prev.filter(t => t.id !== id));
                    setModalTasks(prev => prev.filter(t => t.id !== id));
                    setChartTasks(prev => prev.filter(t => t.id !== id));
                    setTasksTotal(prev => Math.max(0, prev - 1));
                    setStats(prev => {
                        if (!prev || !removed) return prev;
                        return {
                            ...prev,
                            totalTasks: Math.max(0, prev.totalTasks - 1),
                            pendingTasks: prev.pendingTasks - (removed.status === 'Pending' ? 1 : 0),
                            completedTasks: prev.completedTasks - (removed.status === 'Completed' ? 1 : 0),
                        };
                    });
                }

                localStorage.setItem('taskzen_registry_sync', Date.now());
                fetchStats(secret);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSelectId = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── Login Screen ──────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-[#050014] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-rose-600/20 rounded-full blur-[160px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Animated Scanline */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

                <div className="relative z-10 w-full max-w-md text-center">
                    <div className="inline-block p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl mb-8 shadow-2xl relative group">
                        <div className="absolute -inset-1 bg-rose-500 rounded-full opacity-20 group-hover:opacity-40 animate-ping duration-1000"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500 relative z-10"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight text-white italic drop-shadow-2xl">
                        Vault <span className="text-rose-500">Access</span>
                    </h1>
                    <p className="text-slate-300 mb-10 font-black tracking-widest text-[10px]">Secure Gateway Protocol — v4.0</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600/50 to-indigo-600/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <input
                                type="password"
                                placeholder="Enter Security Key"
                                className="relative w-full bg-black/80 border border-white/10 rounded-2xl px-6 py-5 text-center text-white placeholder:text-slate-600 placeholder:normal-case focus:outline-none focus:border-rose-500/50 transition-all font-black text-lg sm:text-xl tracking-widest uppercase"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 py-3 rounded-xl">
                                <p className="text-rose-500 text-xs font-bold uppercase tracking-widest animate-pulse">{error}</p>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-black rounded-2xl tracking-wider transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-[0_20px_50px_rgba(225,29,72,0.3)] relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative z-10">{loading ? "Decrypting..." : "Authorize Access"}</span>
                        </button>
                    </form>
                    <Link href="/" className="inline-block mt-12 text-slate-500 hover:text-white text-[10px] font-black tracking-widest transition-colors border-b border-transparent hover:border-white/20 pb-1">
                        ReturnToSignal
                    </Link>
                </div>
            </main>
        );
    }

    const canHideUsers = usersOffset > 0 || users.length > USERS_PAGE;
    const canHideTasks = tasksOffset > 0 || tasks.length > TASKS_PAGE;

    return (
        <main className="min-h-screen bg-[#02000d] text-white selection:bg-pink-500/30 relative overflow-hidden flex flex-col items-center">
            {/* Optimized Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            {/* Header */}
            <header className="w-full max-w-7xl pt-4 sm:pt-8 px-6 flex flex-row justify-between items-center gap-4 relative z-20 mx-auto">
                <div className="flex items-center gap-4 group cursor-default">
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 group-hover:rotate-[360deg] transition-all duration-1000 ease-in-out">
                        <img src="/icon.png" alt="TaskZen" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,45,149,0.3)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d95] via-[#d946ef] to-[#6366f1] pr-[0.3em] -mr-[0.3em]">
                            Admin Portal
                        </h1>
                        <p className="text-[8px] sm:text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase mt-0.5 ml-1">Management Portal v5.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="relative h-12 w-12 flex items-center justify-center rounded-2xl border-2 border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/60 hover:bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-500 group overflow-hidden backdrop-blur-xl"
                        title="Refresh All Data"
                    >
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="relative z-10 text-indigo-400 group-hover:text-indigo-300"
                        >
                            {refreshing ? (
                                <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            ) : (
                                <RefreshIcon />
                            )}

                        </motion.div>

                        {/* Status Pulse Dot */}
                        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/40 opacity-0 group-hover:opacity-100 shadow-[0_0_8px_#10b981] transition-all duration-500" />
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLock} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(225,29,72,0.2)] text-rose-500 transition-all group" title="Lock Console">
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </motion.button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="w-full max-w-4xl px-4 sm:px-6 mt-4 sm:mt-6 mb-6 sm:mb-8 relative z-20 mx-auto">
                <div className="flex items-center gap-1 bg-white/[0.05] backdrop-blur-2xl border-2 border-white/15 p-1 rounded-[1.5rem] sm:rounded-[2rem] relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <motion.div
                        className="absolute h-[calc(100%-8px)] sm:h-[calc(100%-12px)] top-[4px] sm:top-[6px] transition-all duration-500 ease-out bg-gradient-to-r from-pink-500 to-indigo-600 rounded-[1.2rem] sm:rounded-[1.6rem] shadow-[0_0_20px_rgba(255,45,149,0.3)]"
                        animate={{
                            left: activeTab === "overview" ? "4px" : activeTab === "users" ? "calc(33.33% + 2px)" : "calc(66.66% + 2px)",
                            width: "calc(33.33% - 4px)"
                        }}
                    />
                    {["overview", "users", "tasks"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 sm:py-4 text-[10px] sm:text-[13px] font-black tracking-widest relative z-10 transition-colors duration-500 ${activeTab === tab ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                            {tab === "overview" ? "Dashboard" : tab === "users" ? "Users" : "Tasks"}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="w-full max-w-7xl px-6 pb-24 relative z-20 flex-1 flex flex-col mx-auto">

                <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 sm:space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Total Users" value={stats?.totalUsers || 0} colorClass="text-blue-500" glowClass="59,130,246" icon={<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m23 21-2-2 2-2" /><path d="m19 21 2-2-2-2" /></svg>} />
                                <StatCard label="Total Tasks" value={stats?.totalTasks || 0} colorClass="text-purple-500" glowClass="168,85,247" icon={<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h.01" /></svg>} />
                                <StatCard label="Pending Tasks" value={stats?.pendingTasks || 0} colorClass="text-pink-500" glowClass="255,45,149" icon={<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>} />
                                <StatCard label="Completed Tasks" value={stats?.completedTasks || 0} colorClass="text-emerald-500" glowClass="16,185,129" icon={<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 bg-[#050510]/85 backdrop-blur-3xl border-2 border-white/[0.18] p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] relative overflow-hidden group h-auto lg:h-[600px] flex flex-col shadow-[0_0_80px_rgba(255,45,149,0.12)]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 italic tracking-tight">Task Distribution</h3>
                                            <p className="text-[10px] font-bold text-slate-500 tracking-wider mt-1 italic">Operational Variance</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400">
                                                <span className="w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(255,45,149,0.5)]"></span>
                                                System Data
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 tracking-tighter bg-white/5 px-2 py-1 rounded-lg">Total: {chartTasks.length}</div>
                                        </div>
                                    </div>
                                    <BarChart tasks={chartTasks} />
                                </div>
                                <div className="lg:col-span-4 bg-[#050510]/85 backdrop-blur-3xl border-2 border-white/[0.18] p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] flex flex-col items-center justify-center h-auto lg:h-[600px] shadow-[0_0_80px_rgba(16,185,129,0.12)] relative overflow-hidden min-h-[500px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 blur-[60px] -mr-16 -mt-16 rounded-full" />
                                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 italic tracking-tight w-full border-b border-white/5 pb-4 mb-8">System Efficiency</h3>
                                    <DonutChart pending={stats?.pendingTasks || 0} completed={stats?.completedTasks || 0} />
                                    <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4 w-full">
                                        <div className="text-center p-4 sm:p-5 bg-white/5 backdrop-blur-xl rounded-[1.5rem] sm:rounded-3xl border border-white/10 shadow-inner group/stat hover:border-indigo-500/30 transition-all">
                                            <div className="text-[8px] sm:text-[10px] font-black text-slate-500 tracking-widest mb-1 sm:mb-2 italic uppercase">Backlog</div>
                                            <div className="text-xl sm:text-2xl font-black text-white italic group-hover/stat:text-indigo-400 transition-colors">{stats?.pendingTasks || 0}</div>
                                        </div>
                                        <div className="text-center p-4 sm:p-5 bg-white/5 backdrop-blur-xl rounded-[1.5rem] sm:rounded-3xl border border-white/10 shadow-inner group/stat hover:border-emerald-500/30 transition-all">
                                            <div className="text-[8px] sm:text-[10px] font-black text-slate-500 tracking-widest mb-1 sm:mb-2 italic uppercase">Resolved</div>
                                            <div className="text-xl sm:text-2xl font-black text-emerald-400 italic group-hover/stat:brightness-125 transition-all">{stats?.completedTasks || 0}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-[#050510]/85 backdrop-blur-3xl border-2 border-white/[0.18] p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] group h-auto lg:h-[600px] flex flex-col shadow-[0_0_80px_rgba(59,130,246,0.12)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 blur-[60px] -mr-16 -mt-16 rounded-full" />
                                    <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6 gap-6 overflow-hidden">
                                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 italic tracking-tight shrink-0">Operational Resonance</h3>
                                        <div className="flex items-center gap-3 opacity-90 shrink-0">
                                            <div className="hidden sm:block text-[9px] font-black text-slate-500 tracking-widest italic">System Epoch</div>
                                            <div className="text-[11px] font-black text-white italic tracking-tighter border-b border-pink-500/30 pb-0.5">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <ResonanceChart tasks={chartTasks} />
                                    </div>
                                </div>
                                <div className="bg-[#050510]/85 backdrop-blur-3xl border-2 border-white/[0.18] p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] group flex flex-col h-auto lg:h-[600px] shadow-[0_0_80px_rgba(251,191,36,0.12)] relative overflow-hidden min-h-[500px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 blur-[60px] -mr-16 -mt-16 rounded-full" />
                                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 italic tracking-tight mb-8 border-b border-white/5 pb-4">Active System Users</h3>
                                    <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar-blue -mr-4">
                                        {onlineUsers.length > 0 ? onlineUsers.map((u, i) => (
                                            <div key={u.id} className="flex items-center justify-between p-4 sm:p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] sm:rounded-3xl group hover:border-blue-500/30 transition-all hover:bg-white/[0.08] shadow-xl">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[1rem] sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-[10px] sm:text-xs text-white shadow-lg group-hover:scale-110 transition-transform">
                                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs sm:text-sm font-black text-white italic tracking-tight">{u.firstName} {u.lastName}</div>
                                                        <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 tracking-widest italic uppercase opacity-60 group-hover:opacity-100 transition-opacity">{u.username}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    {u.isOnline ? (
                                                        <div className="flex items-center gap-1 sm:gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                            <div className="text-[8px] sm:text-[10px] font-black text-emerald-500 italic uppercase tracking-widest">Active</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[8px] sm:text-[10px] font-black text-slate-600 italic uppercase tracking-widest">Idle</div>
                                                    )}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
                                                <svg className="w-12 h-12 mb-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">No recent activity<br /><span className="text-[8px] opacity-60">System stands ready</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "users" && (
                        <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8 h-full w-full max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* User Registry List - Full Width */}
                                <div className="bg-[#0b0b1a]/80 backdrop-blur-[40px] border-2 border-white/[0.12] rounded-[3rem] sm:rounded-[5rem] p-5 sm:p-12 shadow-[0_0_120px_rgba(255,45,149,0.1)] relative flex flex-col h-[85vh] sm:h-[950px] overflow-hidden lg:col-span-12">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 blur-[130px] -mr-48 -mt-48 rounded-full pointer-events-none" />
                                    <div className="absolute inset-0 rounded-[3rem] sm:rounded-[5rem] border border-white/5 pointer-events-none" />

                                    <div className="flex items-center justify-between mb-8 relative z-10 px-4">
                                        <div className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-white tracking-widest italic uppercase">{usersTotal} Nodes</span>
                                        </div>
                                        {selectedUserId && (
                                            <button onClick={handleClearFilter} className="px-6 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[12px] font-black rounded-xl tracking-widest uppercase hover:bg-rose-500 hover:text-white transition-all">Reset Selection</button>
                                        )}
                                    </div>

                                    <div ref={usersListRef} className="flex-1 overflow-y-auto pr-2 sm:pr-4 space-y-4 custom-scrollbar-blue relative z-10">
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleSelectUser(user.id)}
                                                className={`group/item flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all cursor-pointer gap-4 ${selectedUserId === user.id ? 'bg-pink-600/10 border-pink-500/40 shadow-[0_0_30px_rgba(255,45,149,0.15)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex items-center gap-4 text-left flex-1 min-w-0">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-base text-white shadow-xl transition-transform group-hover/item:scale-110 shrink-0 ${selectedUserId === user.id ? 'bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-[0_0_20px_rgba(255,45,149,0.3)]' : 'bg-slate-800'}`}>
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-black text-sm sm:text-lg italic tracking-tight mb-0.5 truncate ${selectedUserId === user.id ? 'text-pink-400' : 'text-white'}`}>{user.firstName} {user.lastName}</h3>
                                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 tracking-wider italic uppercase opacity-60 truncate">{user.username}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-auto shrink-0">
                                                    {/* Desktop View Buttons */}
                                                    <div className="hidden sm:flex items-center gap-3">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => { e.stopPropagation(); setEditingUser(user); setShowUserModal(true); }}
                                                            className="px-8 py-3.5 border border-white/10 text-white text-[11px] font-bold rounded-[1.2rem] tracking-wider transition-all shadow-xl backdrop-blur-md bg-white/[0.03] hover:border-indigo-500/40"
                                                        >
                                                            View
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: user.id, type: 'user', label: user.username }); }}
                                                            className="px-8 py-3.5 border border-rose-500/20 text-rose-500 text-[11px] font-bold rounded-[1.2rem] tracking-wider transition-all shadow-xl backdrop-blur-md bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40"
                                                        >
                                                            Purge
                                                        </motion.button>
                                                    </div>

                                                    {/* Mobile View Overflow Menu (3 dots) */}
                                                    <div className="sm:hidden relative">
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdown(openDropdown === user.id ? null : user.id);
                                                            }}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${openDropdown === user.id ? 'bg-pink-500 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-white/5 border-white/10 text-slate-400 active:bg-white/10'}`}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                                        </motion.button>

                                                        <AnimatePresence>
                                                            {openDropdown === user.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                                                                        className="absolute right-0 top-12 z-50 w-48 bg-[#0b0b1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
                                                                    >
                                                                        <div className="p-2 space-y-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setOpenDropdown(null);
                                                                                    setEditingUser(user);
                                                                                    setShowUserModal(true);
                                                                                }}
                                                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-300 text-[12px] font-black tracking-widest transition-all"
                                                                            >
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                                View
                                                                            </button>
                                                                            <div className="h-px bg-white/5 my-1" />
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setOpenDropdown(null);
                                                                                    setPendingDelete({ id: user.id, type: 'user', label: user.username });
                                                                                }}
                                                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 text-[12px] font-black tracking-widest transition-all"
                                                                            >
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                                                                Purge
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {showMoreUsersLoading && <UserSkeleton />}
                                    </div>

                                    <div className="pt-6 flex justify-center relative z-20 pb-4 bg-transparent border-t border-white/5 mt-4">
                                        {usersHasMore && !showMoreUsersLoading ? (
                                            <button onClick={handleShowMoreUsers} className="px-10 py-4 rounded-2xl bg-pink-500 text-white font-black text-[13px] tracking-widest shadow-[0_15px_35px_rgba(255,45,149,0.4)] hover:bg-pink-400 active:scale-95 transition-all">Show More Nodes</button>
                                        ) : canHideUsers && !usersHasMore && !showMoreUsersLoading && (
                                            <button onClick={handleHideUsers} className="px-10 py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-slate-400 font-black text-[13px] tracking-widest hover:border-white/20 transition-all shadow-xl">Hide Nodes</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "tasks" && (
                        <motion.div key="tasks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full max-w-7xl mx-auto flex flex-col h-full">
                            <div className="bg-[#0b0b1a]/80 backdrop-blur-[40px] border-2 border-white/[0.12] rounded-[3rem] sm:rounded-[5rem] p-5 sm:p-12 lg:p-16 shadow-[0_0_120px_rgba(255,45,149,0.1)] relative flex flex-col h-[85vh] sm:h-[950px] overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 blur-[130px] -mr-48 -mt-48 rounded-full pointer-events-none" />
                                <div className="absolute inset-0 rounded-[3rem] sm:rounded-[5rem] border border-white/5 pointer-events-none" />
                                <div className="flex items-center justify-between mb-10 relative z-10 px-4">
                                    <div className="px-6 py-2 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3">
                                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-xs font-black text-white tracking-widest italic uppercase">{tasksTotal} Operational Units</span>
                                    </div>
                                </div>

                                <div ref={tasksListRef} className="flex-1 overflow-y-auto pr-4 space-y-12 custom-scrollbar-purple">
                                    {Object.entries(tasks.reduce((groups, task) => {
                                        const date = task.taskDate || task.taskdate || "Unscheduled";
                                        if (!groups[date]) groups[date] = [];
                                        groups[date].push(task);
                                        return groups;
                                    }, {})).sort(([a], [b]) => new Date(b) - new Date(a)).map(([date, dateTasks]) => (
                                        <div key={date} className="space-y-8">
                                            <div className="sticky top-0 z-10 py-5 bg-[#08081a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
                                                <span className="text-[11px] font-black tracking-widest text-indigo-400 italic uppercase">{date}</span>
                                                <div className="h-px flex-1 mx-8 bg-gradient-to-r from-indigo-500/20 to-transparent" />
                                            </div>
                                            <div className="grid gap-8">
                                                {dateTasks.map(task => (
                                                    <div key={task.id} className="group/task relative bg-white/5 backdrop-blur-3xl border-2 border-white/10 p-5 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] hover:bg-white/[0.08] hover:border-indigo-500/40 transition-all shadow-2xl overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] -mr-16 -mt-16 rounded-full group-hover/task:bg-indigo-500/10 transition-all" />

                                                        {/* Mobile Selection Box */}
                                                        <div
                                                            onClick={(e) => { e.stopPropagation(); toggleSelectId(task.id); }}
                                                            className={`lg:hidden absolute top-8 right-8 h-8 w-8 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center z-[20] ${selectedIds.has(task.id) ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-white/20 bg-white/5 hover:border-indigo-500/50'}`}
                                                        >
                                                            {selectedIds.has(task.id) && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                                        </div>
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                                            <div className="space-y-4 flex-1 min-w-0 text-left">
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center gap-3">
                                                                        {/* Desktop Select Box */}
                                                                        <div
                                                                            onClick={(e) => { e.stopPropagation(); toggleSelectId(task.id); }}
                                                                            className={`hidden lg:flex h-6 w-6 rounded-lg border-2 cursor-pointer transition-all items-center justify-center ${selectedIds.has(task.id) ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-white/20 bg-white/5 hover:border-indigo-500/50'}`}
                                                                        >
                                                                            {selectedIds.has(task.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                                                        </div>
                                                                        <span className={`px-4 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                            {task.status === 'Completed' ? 'Completed' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-lg sm:text-3xl font-black text-white italic tracking-tighter capitalize break-words">
                                                                        {(task.title || '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                                                    </h3>
                                                                </div>
                                                                <p className="text-base text-slate-400 font-medium italic leading-relaxed truncate max-w-3xl border-l-2 border-white/5 pl-6">{task.description}</p>
                                                            </div>

                                                            <div className="flex flex-row items-center justify-center lg:justify-end gap-4 sm:gap-8 pt-6 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0">
                                                                {/* Status Toggle */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id, task.status); }}
                                                                    disabled={actionLoading?.id === task.id}
                                                                    className={`h-12 w-12 sm:h-16 sm:w-16 rounded-[1.5rem] border-2 flex items-center justify-center transition-all shadow-lg active:scale-95 ${task.status === 'Completed' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                                                                >
                                                                    {actionLoading?.id === task.id && actionLoading?.type === 'status' ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (task.status === 'Completed' ? <UndoIcon /> : <CheckIcon />)}
                                                                </button>

                                                                {/* Purge Button */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: task.id, type: 'task', label: task.title }); }}
                                                                    disabled={actionLoading?.id === task.id}
                                                                    className="h-12 w-12 sm:h-16 sm:w-16 bg-rose-500/10 border-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 rounded-[1.5rem] transition-all shadow-lg flex items-center justify-center whitespace-nowrap disabled:opacity-50"
                                                                >
                                                                    {actionLoading?.id === task.id && actionLoading?.type === 'delete' ? <div className="h-4 w-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" /> : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {showMoreTasksLoading && <TaskSkeletonAdmin />}
                                </div>

                                {/* Pagination Console */}
                                <div className="mt-8 flex justify-center relative z-20 pb-4 border-t border-white/5 pt-8">
                                    {tasksHasMore && !showMoreTasksLoading ? (
                                        <button onClick={handleShowMoreTasks} className="px-10 py-4 rounded-2xl bg-pink-500 text-white font-black text-[13px] tracking-widest shadow-[0_15px_35px_rgba(255,45,149,0.4)] hover:bg-pink-400 active:scale-95 transition-all">Show More Nodes</button>
                                    ) : canHideTasks && !tasksHasMore && !showMoreTasksLoading && (
                                        <button onClick={handleHideTasks} className="px-10 py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-slate-400 font-black text-[13px] tracking-widest hover:border-white/20 transition-all shadow-xl">Hide Nodes</button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showUserModal && editingUser && (
                        <UserDetailsModal
                            user={editingUser}
                            onClose={() => { setShowUserModal(false); setEditingUser(null); }}
                            onSave={handleUpdateUser}
                            loading={updateLoading}
                        />
                    )}
                    {showActivityModal && selectedUserId && (
                        <UserActivityModal
                            user={users.find(u => u.id === selectedUserId)}
                            tasks={modalTasks}
                            hasMore={false}
                            canHide={false}
                            onShowMore={() => { }}
                            onHide={() => { }}
                            isLoadingMore={showMoreTasksLoading}
                            actionLoading={actionLoading}
                            onClose={handleClearFilter}
                            onToggleStatus={toggleTaskStatus}
                            onDeleteTask={(taskId) => {
                                const t = modalTasks.find(item => item.id === taskId) || tasks.find(item => item.id === taskId);
                                setPendingDelete({ id: taskId, type: 'task', label: t?.title || 'Unknown Task' });
                            }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {pendingDelete && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-[50px] bg-black/80">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#050510] border-2 border-rose-500/30 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] max-w-xl w-full text-center shadow-[0_30px_100px_rgba(225,29,72,0.2)]">
                                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-rose-500/10 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 border-2 border-rose-500/20">
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="text-rose-500 animate-pulse"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-xl sm:text-4xl font-black text-white italic tracking-tighter mb-4 uppercase">Confirm Purge</h3>
                                <p className="text-slate-400 text-sm sm:text-lg font-medium italic mb-8 sm:mb-10 leading-relaxed px-2 sm:px-4">
                                    Are you certain you wish to permanently erase <span className="text-rose-500 font-black">&quot;{pendingDelete.label}&quot;</span> from the secure ledger?
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <button onClick={() => setPendingDelete(null)} className="py-4 sm:py-5 bg-white/5 hover:bg-white/10 text-slate-300 font-black rounded-2xl sm:rounded-3xl tracking-widest transition-all text-[12px] border-2 border-white/5">Cancel</button>
                                    <button onClick={confirmDelete} className="py-4 sm:py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl sm:rounded-3xl tracking-widest transition-all shadow-xl active:scale-95 text-[12px]">Confirm Deletion</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .custom-scrollbar-blue::-webkit-scrollbar,
                .custom-scrollbar-purple::-webkit-scrollbar { 
                    width: 0;
                    height: 0;
                    background: transparent;
                    display: none;
                }
                .custom-scrollbar-blue,
                .custom-scrollbar-purple {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    );
}

function UserDetailsModal({ user, onClose, onSave, loading }) {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const isModified = formData.firstName !== (user.firstName || '') ||
        formData.lastName !== (user.lastName || '') ||
        formData.username !== (user.username || '') ||
        formData.password !== '';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/40"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#111019] border border-white/10 p-8 sm:p-10 rounded-[3rem] max-w-xl w-full shadow-[0_40px_80px_rgba(0,0,0,0.9)] relative overflow-y-auto max-h-[92vh] custom-scrollbar-purple"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Horizontal Pink Accent Tag */}
                <div className="absolute top-0 left-12 w-32 h-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-b-full shadow-[0_0_15px_rgba(236,72,153,0.4)]" />

                <div className="relative z-10 mb-10">
                    <div className="pr-16">
                        <h3 className="text-xl sm:text-4xl font-black text-white tracking-tighter leading-tight italic break-words">Identity Configuration</h3>
                        <p className="text-[10px] sm:text-[11px] font-black text-pink-500 tracking-[0.2em] uppercase italic mt-1 opacity-90 break-all">Modify Neural Operator Parameters</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'rgba(244, 63, 94, 1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="absolute top-8 right-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#1a1921]/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/[0.05] text-slate-300 transition-all cursor-pointer shadow-2xl group z-20"
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5" className="group-hover:rotate-90 transition-transform duration-300"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </motion.button>

                <div className="space-y-8 mb-12">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[12px] font-black text-white tracking-tight ml-3">First Name</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-[#1b1a23] border border-white/[0.08] focus:border-pink-500/40 rounded-[1.2rem] p-5 text-white font-bold transition-all outline-none text-base shadow-inner"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[12px] font-black text-white tracking-tight ml-3">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-[#1b1a23] border border-white/[0.08] focus:border-pink-500/40 rounded-[1.2rem] p-5 text-white font-bold transition-all outline-none text-base shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[12px] font-black text-white tracking-tight ml-3">EmailAddress</label>
                        <input
                            type="email"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-[#1b1a23] border border-white/[0.08] focus:border-pink-500/40 rounded-[1.2rem] p-5 text-white font-bold transition-all outline-none text-base shadow-inner"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[12px] font-black text-white tracking-tight ml-3">New Password <span className="opacity-40 font-medium">(leave blank to keep current)</span></label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                placeholder="Enter new password..."
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-[#1b1a23] border border-white/[0.08] focus:border-pink-500/40 rounded-[1.2rem] p-5 text-white font-bold transition-all outline-none text-base shadow-inner placeholder:text-slate-700"
                            />
                            <div
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-8 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${showPassword ? 'text-pink-500' : 'text-slate-700 hover:text-pink-500/40'}`}
                            >
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 items-center mb-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 font-black rounded-[1.2rem] tracking-widest transition-all text-xs border border-white/5 uppercase"
                    >
                        Abort
                    </button>
                    <button
                        disabled={!isModified || loading}
                        onClick={() => {
                            const updates = {};
                            if (formData.firstName !== (user.firstName || '')) updates.firstName = formData.firstName;
                            if (formData.lastName !== (user.lastName || '')) updates.lastName = formData.lastName;
                            if (formData.username !== (user.username || '')) updates.username = formData.username;
                            if (formData.password) updates.password = formData.password;
                            onSave(user.id || user.userId, updates);
                        }}
                        className={`flex-[2] py-5 font-black rounded-[1.2rem] tracking-widest transition-all shadow-2xl active:scale-95 text-xs flex items-center justify-center gap-3 uppercase ${isModified ? 'bg-gradient-to-r from-[#ed2da8] to-[#d946ef] text-white' : 'bg-white/5 text-slate-700 cursor-not-allowed'}`}
                    >
                        {loading ? 'Processing...' : (
                            <>
                                Update Protocol
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </>
                        )}
                    </button>
                </div>


            </motion.div>
        </motion.div>
    );
}

function UserActivityModal({ user, tasks, hasMore, canHide, onShowMore, onHide, isLoadingMore, actionLoading, onClose, onToggleStatus, onDeleteTask }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/60"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#0b0b1a] border-2 border-white/[0.12] rounded-[3.5rem] max-w-4xl w-full h-[85vh] sm:h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />

                <div className="p-6 sm:p-12 border-b border-white/5 relative z-20 bg-[#0b0b1a]/50 backdrop-blur-md">
                    <div className="pr-14 sm:pr-40">
                        <h3 className="text-xl sm:text-4xl font-black text-white italic tracking-tighter break-words capitalize leading-tight">Operational Stream</h3>
                        <p className="text-[10px] sm:text-[11px] font-black text-pink-500 tracking-[0.2em] uppercase italic mt-1 opacity-90 break-all">Tracing activity for {user?.username}</p>
                    </div>

                    <div className="absolute top-6 right-6 sm:top-12 sm:right-12 flex items-center gap-4 sm:gap-6">
                        <div className="hidden lg:flex px-5 py-2 bg-white/[0.03] border border-white/10 rounded-xl items-center gap-3 shadow-inner">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-white tracking-widest italic uppercase">{tasks.length} Operations</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'rgba(244, 63, 94, 1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#1a1921]/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/[0.05] text-slate-300 transition-all cursor-pointer shadow-2xl group"
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5" className="sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </motion.button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-12 pb-12 custom-scrollbar-purple relative z-10">
                    {tasks && tasks.length > 0 ? (
                        Object.entries(tasks.reduce((groups, task) => {
                            const date = task.taskDate || task.taskdate || "Unscheduled";
                            if (!groups[date]) groups[date] = [];
                            groups[date].push(task);
                            return groups;
                        }, {})).sort(([a], [b]) => new Date(b) - new Date(a)).map(([date, dateTasks]) => (
                            <div key={date} className="space-y-6 pt-10 first:pt-10">
                                <div className="sticky top-0 z-30 py-4 bg-[#0b0b1a]/95 backdrop-blur-md border-b border-white/10 text-[11px] font-black tracking-[0.2em] text-indigo-400 uppercase italic">
                                    <span className="flex items-center gap-3">
                                        <span className="h-1 w-8 bg-indigo-500/30 rounded-full" />
                                        {date}
                                    </span>
                                </div>
                                <div className="grid gap-8 justify-items-center">
                                    {dateTasks.map(task => (
                                        <div key={task.id} className="group/task relative bg-[#131325]/40 backdrop-blur-3xl border border-white/[0.08] p-8 sm:p-10 rounded-[2.5rem] hover:bg-[#1a1a35]/60 hover:border-indigo-500/30 transition-all shadow-2xl overflow-hidden w-full max-w-3xl">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover/task:bg-indigo-500/10 transition-all" />
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                                <div className="space-y-4 flex-1 min-w-0">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center">
                                                            <span className={`px-4 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-pink-500/10 text-pink-500 border-pink-500/20'}`}>
                                                                {task.status === 'Completed' ? 'Completed' : 'Pending'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg sm:text-3xl font-black text-white italic tracking-tighter leading-tight capitalize break-words">
                                                            {(task.title || '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                                        </h4>
                                                    </div>
                                                    <p className="text-[14px] sm:text-base font-medium text-slate-400 leading-relaxed italic opacity-80 border-l-2 border-indigo-500/40 pl-6 truncate">&quot;{task.description}&quot;</p>
                                                </div>

                                                <div className="flex flex-row items-center justify-center lg:justify-end gap-8 pt-6 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0">
                                                    {/* Status Toggle */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, task.status); }}
                                                        disabled={actionLoading?.id === task.id}
                                                        className={`h-12 w-12 sm:h-16 sm:w-16 rounded-[1.5rem] border-2 flex items-center justify-center transition-all shadow-lg active:scale-95 ${task.status === 'Completed' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                                                    >
                                                        {actionLoading?.id === task.id && actionLoading?.type === 'status' ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (task.status === 'Completed' ? <UndoIcon /> : <CheckIcon />)}
                                                    </button>

                                                    {/* Purge Button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                                        disabled={actionLoading?.id === task.id}
                                                        className="h-12 w-12 sm:h-16 sm:w-16 bg-rose-500/10 border-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 rounded-[1.5rem] transition-all shadow-lg flex items-center justify-center whitespace-nowrap disabled:opacity-50"
                                                    >
                                                        {actionLoading?.id === task.id && actionLoading?.type === 'delete' ? <div className="h-4 w-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" /> : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 gap-6 py-20">
                            <svg className="w-20 h-20 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-indigo-300">No operations found in stream</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
