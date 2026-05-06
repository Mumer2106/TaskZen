"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const USERS_PAGE  = 5;
const TASKS_PAGE  = 5;

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
);

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function UserSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/[0.02] animate-pulse">
            <div className="min-w-0 flex-1 mr-3 space-y-2">
                <div className="h-3 w-32 bg-white/[0.07] rounded-full" />
                <div className="h-2.5 w-24 bg-white/[0.04] rounded-full" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-white/[0.04]" />
        </div>
    );
}

function TaskSkeletonAdmin() {
    return (
        <div className="relative bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2rem] animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-6 w-3/4 bg-white/[0.07] rounded-xl" />
                    <div className="flex gap-3">
                        <div className="h-4 w-20 bg-white/[0.05] rounded-full" />
                        <div className="h-4 w-16 bg-white/[0.04] rounded-full" />
                    </div>
                </div>
                <div className="hidden lg:flex gap-3">
                    <div className="h-9 w-16 rounded-xl bg-white/[0.04]" />
                    <div className="h-9 w-9 rounded-xl bg-white/[0.04]" />
                </div>
            </div>
            <div className="h-4 w-full bg-white/[0.04] rounded-lg" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPortal() {
    const [secret,          setSecret]          = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Stats — from /api/admin/data
    const [stats, setStats] = useState(null);

    // Visible slices driven by pagination state
    const [users,        setUsers]       = useState([]);
    const [tasks,        setTasks]       = useState([]);
    const [usersHasMore, setUsersHasMore] = useState(false);
    const [tasksHasMore, setTasksHasMore] = useState(false);
    const [usersTotal,   setUsersTotal]   = useState(0);
    const [tasksTotal,   setTasksTotal]   = useState(0);

    // Pagination offsets
    const [usersOffset, setUsersOffset] = useState(0);
    const [tasksOffset, setTasksOffset] = useState(0);

    // Loading states
    const [loading,            setLoading]           = useState(false);
    const [showMoreUsersLoading, setShowMoreUsersLoading] = useState(false);
    const [showMoreTasksLoading, setShowMoreTasksLoading] = useState(false);
    const [actionLoading,      setActionLoading]     = useState(null);

    const [error,        setError]       = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [activeTab,    setActiveTab]   = useState("users");
    const [selectedUserId, setSelectedUserId] = useState(null);

    const usersListRef = useRef(null);
    const tasksListRef = useRef(null);

    // ── Auth helpers ─────────────────────────────────────────────────────────
    const handleLogin  = async (e) => { e.preventDefault(); fetchData(secret); };
    const handleLock   = () => { setIsAuthenticated(false); setSecret(""); resetState(); };

    const resetState = () => {
        setStats(null);
        setUsers([]); setTasks([]);
        setUsersOffset(0); setTasksOffset(0);
        setUsersHasMore(false); setTasksHasMore(false);
        setSelectedUserId(null);
    };

    // ── /api/admin/data  →  stats block only ─────────────────────────────────
    const fetchStats = useCallback(async (adminSecret) => {
        try {
            const res    = await fetch(`/api/admin/data?secret=${encodeURIComponent(adminSecret)}`);
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
                limit:  USERS_PAGE,
                offset,
            });
            const res    = await fetch(`/api/admin/users?${params}`);
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
                limit:  TASKS_PAGE,
                offset,
            });
            if (userId) params.set('userId', userId);
            const res    = await fetch(`/api/admin/tasks?${params}`);
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

    // ── Initial data fetch — fires all three APIs in parallel ─────────────────
    const fetchData = useCallback(async (adminSecret, silent = false) => {
        if (!silent) setLoading(true);
        setError("");
        setUsersOffset(0);
        setTasksOffset(0);

        try {
            const statsOk = await fetchStats(adminSecret);
            if (!statsOk && !silent) { setError("Access Denied"); return; }
            setIsAuthenticated(true);
            await Promise.all([
                fetchUsers(adminSecret, 0, false),
                fetchTasks(adminSecret, 0, selectedUserId, false),
            ]);
        } catch (err) {
            if (!silent) setError("Connection failed");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [fetchStats, fetchUsers, fetchTasks, selectedUserId]);

    // ── Show More: Users  →  /api/admin/users ────────────────────────────────
    const handleShowMoreUsers = async () => {
        if (showMoreUsersLoading) return;
        setShowMoreUsersLoading(true);
        const nextOffset = usersOffset + USERS_PAGE;
        await fetchUsers(secret, nextOffset, true);   // append = true
        setUsersOffset(nextOffset);
        setShowMoreUsersLoading(false);
    };

    // ── Hide: Users  →  re-fetch first page from /api/admin/users ────────────
    const handleHideUsers = () => {
        setUsers(prev => prev.slice(0, USERS_PAGE));
        setUsersOffset(0);
        setUsersHasMore(true);
        if (usersListRef.current) usersListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Show More: Tasks  →  /api/admin/tasks ────────────────────────────────
    const handleShowMoreTasks = async () => {
        if (showMoreTasksLoading) return;
        setShowMoreTasksLoading(true);
        const nextOffset = tasksOffset + TASKS_PAGE;
        await fetchTasks(secret, nextOffset, selectedUserId, true);  // append
        setTasksOffset(nextOffset);
        setShowMoreTasksLoading(false);
    };

    // ── Hide: Tasks  →  re-fetch first page from /api/admin/tasks ────────────
    const handleHideTasks = () => {
        setTasks(prev => prev.slice(0, TASKS_PAGE));
        setTasksOffset(0);
        setTasksHasMore(true);
        if (tasksListRef.current) tasksListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── User filter: reset task pagination & re-fetch from /api/admin/tasks ──
    const handleSelectUser = async (userId) => {
        const newId = selectedUserId === userId ? null : userId;
        setSelectedUserId(newId);
        setTasksOffset(0);
        setShowMoreTasksLoading(true);
        await fetchTasks(secret, 0, newId, false);
        setShowMoreTasksLoading(false);
    };

    const handleClearFilter = async () => {
        setSelectedUserId(null);
        setTasksOffset(0);
        setShowMoreTasksLoading(true);
        await fetchTasks(secret, 0, null, false);
        setShowMoreTasksLoading(false);
    };

    // ── Cross-tab & focus sync ────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !secret) return;

        const handleStorageChange = (e) => {
            if (e.key === 'taskzen_registry_sync') fetchData(secret, true);
        };
        const handleFocus = () => {
            if (!actionLoading && !pendingDelete) fetchData(secret, true);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isAuthenticated, secret, actionLoading, pendingDelete, fetchData]);

    // ── Task status toggle ────────────────────────────────────────────────────
    const toggleTaskStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";

        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        setStats(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                pendingTasks:   prev.pendingTasks   + (newStatus === 'Pending'   ? 1 : -1),
                completedTasks: prev.completedTasks + (newStatus === 'Completed' ? 1 : -1),
            };
        });

        setActionLoading(id);
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

    // ── Delete ────────────────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const { id, type } = pendingDelete;

        setActionLoading(id);
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
                    setStats(prev => prev ? { ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) } : prev);
                } else if (type === 'task') {
                    const removed = tasks.find(t => t.id === id);
                    setTasks(prev => prev.filter(t => t.id !== id));
                    setTasksTotal(prev => Math.max(0, prev - 1));
                    setStats(prev => {
                        if (!prev || !removed) return prev;
                        return {
                            ...prev,
                            totalTasks:     Math.max(0, prev.totalTasks - 1),
                            pendingTasks:   prev.pendingTasks   - (removed.status === 'Pending'   ? 1 : 0),
                            completedTasks: prev.completedTasks - (removed.status === 'Completed' ? 1 : 0),
                        };
                    });
                }

                localStorage.setItem('taskzen_registry_sync', Date.now());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
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
                    <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter text-white italic drop-shadow-2xl">
                        VAULT <span className="text-rose-500">ACCESS</span>
                    </h1>
                    <p className="text-slate-300 mb-10 font-black tracking-[0.4em] text-[10px]">Secure Gateway Protocol — v4.0</p>

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
                            className="w-full py-5 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-black rounded-2xl tracking-widest transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-[0_20px_50px_rgba(225,29,72,0.3)] relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative z-10">{loading ? "Decrypting..." : "AuthorizeAccess"}</span>
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
        <main className="min-h-screen bg-[#02000d] text-white p-4 sm:p-8 lg:p-12 relative overflow-hidden selection:bg-rose-500/30">
            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-16 gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <h1 className="text-4xl lg:text-7xl font-black tracking-tighter text-white italic mb-2 leading-none">
                            Platform<span className="text-gradient">Control</span>
                        </h1>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => fetchData(secret)} disabled={loading} className="flex-1 sm:flex-none px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-xl flex items-center justify-center gap-2 group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 tracking-tighter`}>
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                            </svg>
                            {loading ? "Decrypting..." : "Refresh"}
                        </button>
                        <button onClick={handleLock} className="flex-1 sm:flex-none px-6 py-3 bg-rose-600/10 border border-rose-600/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all hover:text-white shadow-lg flex items-center justify-center gap-2 group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Lock
                        </button>
                    </div>
                </header>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-16">
                        {[
                            { label: "Total Users",     value: stats.totalUsers,     color: "text-blue-500",   glow: "shadow-blue-500/20",   icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m23 21-2-2 2-2" /><path d="m19 21 2-2-2-2" /></svg> },
                            { label: "Data Pipeline",   value: stats.totalTasks,     color: "text-purple-500", glow: "shadow-purple-500/20", icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg> },
                            { label: "Pending Tasks",   value: stats.pendingTasks,   color: "text-rose-500",   glow: "shadow-rose-500/20",   icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
                            { label: "Completed Tasks", value: stats.completedTasks, color: "text-emerald-500", glow: "shadow-emerald-500/20", icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
                        ].map((stat) => (
                            <div key={stat.label} className={`relative group bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 lg:p-10 transition-all hover:bg-white/[0.05] hover:-translate-y-1 shadow-2xl ${stat.glow}`}>
                                <div className="flex justify-between items-start mb-10">
                                    <p className="text-[13px] font-black tracking-[0.2em] text-slate-400 italic">{stat.label}</p>
                                    <div className={`${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`}>{stat.icon}</div>
                                </div>
                                <div className="mb-2">
                                    <p className={`text-5xl lg:text-7xl font-black tracking-tighter ${stat.color} drop-shadow-2xl italic`}>{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mobile Tab Toggle */}
                <div className="flex lg:hidden mb-6 p-1 bg-black/40 border border-white/5 rounded-xl">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`flex-1 py-3 text-[10px] font-black tracking-widest rounded-lg transition-all ${activeTab === 'users' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-slate-50'}`}
                    >
                        UserRegistry
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-1 py-3 text-[10px] font-black tracking-widest rounded-lg transition-all ${activeTab === 'tasks' ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'text-slate-50'}`}
                    >
                        GlobalStream
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 pb-12">

                    {/* ── User Registry ─────────────────────────────────────────── */}
                    <section className={`lg:col-span-4 relative group ${activeTab !== 'users' ? 'hidden lg:block' : 'block'}`}>
                        <div className="absolute -inset-1 bg-blue-500/40 rounded-[2.5rem] sm:rounded-[3.2rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-700 animate-pulse"></div>
                        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-3xl border border-blue-500/40 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.35)] flex flex-col h-[600px]">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center justify-between italic flex-shrink-0">
                                <span className="flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></span>
                                    User Registry
                                </span>
                                <div className="flex items-center gap-2">
                                    {selectedUserId && (
                                        <button onClick={handleClearFilter} className="text-[8px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest border border-rose-500/20 px-2 py-1 rounded-md bg-rose-500/5 transition-all">Clear Filter</button>
                                    )}
                                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 tracking-widest">{usersTotal}</span>
                                </div>
                            </h2>

                            <div ref={usersListRef} className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 custom-scrollbar-blue flex-1 min-h-0">
                                {/* Loaded user rows */}
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleSelectUser(user.id)}
                                        className={`flex items-center justify-between p-4 border rounded-2xl transition-all group/item cursor-pointer ${selectedUserId === user.id ? 'bg-blue-600/10 border-blue-500/40 shadow-inner' : 'bg-white/[0.02] border-white/5 hover:bg-blue-500/5 hover:border-blue-500/20'}`}
                                    >
                                        <div className="min-w-0 flex-1 mr-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`font-black truncate text-sm tracking-tighter uppercase italic transition-colors ${selectedUserId === user.id ? 'text-blue-400' : 'text-slate-200 group-hover/item:text-blue-300'}`}>
                                                    {user.firstName || 'User'} {user.lastName || ''}
                                                </p>
                                                <span className="text-[7px] text-slate-700 font-bold px-1.5 py-0.5 rounded-full bg-white/5 lowercase border border-white/5 opacity-40">#{user.id.slice(-4)}</span>
                                            </div>
                                            <p className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">{user.username}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: user.id, type: 'user', label: user.username }); }}
                                            disabled={actionLoading === user.id}
                                            className="px-3 py-1.5 bg-rose-600/10 text-rose-500 text-[9px] font-black tracking-widest rounded-lg border border-transparent hover:bg-rose-600 hover:text-white transition-all opacity-100 lg:opacity-0 group-hover/item:opacity-100"
                                        >
                                            {actionLoading === user.id ? "Wait" : "Remove User"}
                                        </button>
                                    </div>
                                ))}

                                {/* Show More skeletons for users */}
                                {showMoreUsersLoading && Array.from({ length: 3 }).map((_, i) => <UserSkeleton key={`usk-${i}`} />)}

                                {/* Users pagination controls */}
                                <motion.div layout transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex justify-center mt-8 mb-8 z-10 relative min-h-[48px]">
                                    {usersHasMore && !showMoreUsersLoading ? (
                                        <button
                                            onClick={handleShowMoreUsers}
                                            className="px-8 py-3 rounded-[2.5rem] bg-[#050510]/80 backdrop-blur-[10px] border-2 border-blue-500/60 transition-all hover:border-blue-500 text-blue-400 font-bold text-[14px] tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 flex items-center gap-2 group"
                                        >
                                            Show More Users
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-1 transition-transform"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </button>
                                    ) : canHideUsers && !usersHasMore && !showMoreUsersLoading ? (
                                        <button
                                            onClick={handleHideUsers}
                                            className="px-8 py-3 rounded-[2.5rem] bg-[#050510]/80 backdrop-blur-[10px] border-2 border-cyan-500/60 transition-all hover:border-cyan-500 text-cyan-400 font-bold text-[14px] tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 flex items-center gap-2 group"
                                        >
                                            Hide Users
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-1 transition-transform"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                        </button>
                                    ) : null}
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* ── Data Stream (Tasks) ────────────────────────────────────── */}
                    <section className={`lg:col-span-8 relative group ${activeTab !== 'tasks' ? 'hidden lg:block' : 'block'}`}>
                        <div className="absolute -inset-1 bg-purple-500/40 rounded-[2.5rem] sm:rounded-[3.2rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-700 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-3xl border border-purple-500/40 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.35)] flex flex-col h-[600px]">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center justify-between italic flex-shrink-0">
                                <span className="flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]"></span>
                                    Data Stream
                                    {selectedUserId && (
                                        <span className="text-[9px] font-normal text-purple-300/70 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Filtered</span>
                                    )}
                                </span>
                                <span className="text-[9px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 tracking-widest">{tasksTotal}</span>
                            </h2>

                            <div ref={tasksListRef} className="space-y-10 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar-purple flex-1 min-h-0 relative">
                                {/* Loading state when filter changes */}
                                {showMoreTasksLoading && tasks.length === 0 ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => <TaskSkeletonAdmin key={`tsk-init-${i}`} />)}
                                    </div>
                                ) : tasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 bg-purple-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-purple-500/20 text-purple-500 opacity-40">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        </div>
                                        <h3 className="text-xl font-black italic tracking-tighter text-slate-200">No Stream Data</h3>
                                        <p className="text-slate-400 text-xs font-bold tracking-widest mt-2 italic">Zero Packets Detected For This Node</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Group tasks by date */}
                                        {Object.entries(
                                            tasks.reduce((groups, task) => {
                                                const date = task.taskDate || task.taskdate || "Unscheduled";
                                                if (!groups[date]) groups[date] = [];
                                                groups[date].push(task);
                                                return groups;
                                            }, {})
                                        )
                                            .sort(([dateA], [dateB]) => {
                                                if (dateA === "Unscheduled") return 1;
                                                if (dateB === "Unscheduled") return -1;
                                                return new Date(dateB) - new Date(dateA);
                                            })
                                            .map(([date, dateTasks]) => (
                                                <div key={date} className="space-y-4">
                                                    <div className="sticky top-0 z-20 bg-[#0a0a1a]/95 backdrop-blur-sm py-3 border-b border-white/5 flex items-center justify-between translate-y-[-1px]">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-500/80">
                                                            {date === new Date().toISOString().split('T')[0] ? "Current Cycle" :
                                                                date === "Unscheduled" ? "Buffer" : date}
                                                        </span>
                                                        <span className="text-[8px] font-mono text-slate-400">{dateTasks.length} NODES</span>
                                                    </div>
                                                    <div className="flex flex-col space-y-4">
                                                        {dateTasks.map((task) => (
                                                            <div key={task.id} className="relative bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2rem] hover:bg-white/[0.04] transition-all group/task">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter mb-2 uppercase italic leading-none truncate">{task.title}</h3>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                                {task.status}
                                                                            </span>
                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{task.owner || 'Unknown'}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Mobile Done Toggle */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id, task.status); }}
                                                                        disabled={actionLoading === task.id}
                                                                        className={`lg:hidden absolute top-2 right-2 p-2 flex items-center gap-1 rounded-lg transition-all z-20 ${task.status === 'Completed'
                                                                            ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20'
                                                                            : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20'
                                                                            }`}
                                                                    >
                                                                        {task.status === 'Completed' ? <UndoIcon /> : <CheckIcon />}
                                                                        <span className="text-[9px] font-black tracking-widest">{task.status === 'Completed' ? "Undo" : "Done"}</span>
                                                                    </button>

                                                                    <div className="hidden lg:flex items-center gap-3">
                                                                        <button
                                                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                                                            disabled={actionLoading === task.id}
                                                                            title={task.status === 'Completed' ? "Undo" : "Done"}
                                                                            className={`p-2.5 flex items-center gap-2 rounded-xl transition-all opacity-0 group-hover/task:opacity-100 ${task.status === 'Completed'
                                                                                ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20 hover:bg-amber-600 hover:text-white'
                                                                                : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                                                                                }`}
                                                                        >
                                                                            {actionLoading === task.id ? (
                                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                                                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                                                </svg>
                                                                            ) : task.status === 'Completed' ? <UndoIcon /> : <CheckIcon />}
                                                                            <span className="text-[10px] font-black tracking-widest">{task.status === 'Completed' ? "Undo" : "Done"}</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setPendingDelete({ id: task.id, type: 'task', label: task.title })}
                                                                            className="p-2.5 text-slate-500 hover:text-rose-500 transition-colors bg-white/5 rounded-xl border border-white/5 opacity-0 group-hover/task:opacity-100"
                                                                        >
                                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                        </button>
                                                                    </div>

                                                                    {/* Mobile Delete */}
                                                                    <button
                                                                        onClick={() => setPendingDelete({ id: task.id, type: 'task', label: task.title })}
                                                                        className="lg:hidden p-2 text-slate-500 hover:text-rose-500 transition-colors bg-white/5 rounded-xl border border-white/5"
                                                                    >
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                    </button>
                                                                </div>
                                                                <p className="text-sm text-slate-300 font-medium line-clamp-3 italic">&quot;{task.description || "No metadata recorded."}&quot;</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Show More skeletons for tasks */}
                                        {showMoreTasksLoading && (
                                            <div className="space-y-4">
                                                {Array.from({ length: 3 }).map((_, i) => <TaskSkeletonAdmin key={`tsk-${i}`} />)}
                                            </div>
                                        )}

                                        {/* Tasks pagination controls */}
                                        <motion.div layout transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex justify-center mt-8 mb-8 z-10 relative min-h-[48px]">
                                            {tasksHasMore && !showMoreTasksLoading ? (
                                                <button
                                                    onClick={handleShowMoreTasks}
                                                    className="px-8 py-3 rounded-[2.5rem] bg-[#050510]/80 backdrop-blur-[10px] border-2 border-purple-500/60 transition-all hover:border-purple-500 text-purple-400 font-bold text-[14px] tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 flex items-center gap-2 group"
                                                >
                                                    Show More Nodes
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-1 transition-transform"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                </button>
                                            ) : canHideTasks && !tasksHasMore && !showMoreTasksLoading ? (
                                                <button
                                                    onClick={handleHideTasks}
                                                    className="px-8 py-3 rounded-[2.5rem] bg-[#050510]/80 backdrop-blur-[10px] border-2 border-cyan-500/60 transition-all hover:border-cyan-500 text-cyan-400 font-bold text-[14px] tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 flex items-center gap-2 group"
                                                >
                                                    Hide Nodes
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-1 transition-transform"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                                </button>
                                            ) : null}
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {pendingDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setPendingDelete(null)}></div>
                    <div className="relative bg-[#0a0a1a] border border-rose-500/40 p-8 sm:p-12 rounded-[2.5rem] max-w-md w-full shadow-[0_0_100px_rgba(225,29,72,0.1)] text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="m4.93 4.93 14.14 14.14" /></svg>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3 tracking-tighter italic">Confirm Deletion?</h3>
                        <p className="text-slate-300 mb-8 text-sm leading-relaxed font-bold italic">
                            Deleting <span className="text-rose-500">&quot;{pendingDelete.label}&quot;</span> will permanently remove it from the secure ledger.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setPendingDelete(null)} className="py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black rounded-xl tracking-widest transition-all border border-white/10 text-xs">Abort</button>
                            <button onClick={confirmDelete} className="py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl tracking-widest transition-all shadow-lg active:scale-95 text-xs">Execute Purge</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .text-gradient {
                    background: linear-gradient(to right, #3b82f6, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .custom-scrollbar-blue::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-blue::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 10px; }

                .custom-scrollbar-purple::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-purple::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 10px; }

                @media (max-width: 640px) {
                    .custom-scrollbar-blue::-webkit-scrollbar,
                    .custom-scrollbar-purple::-webkit-scrollbar { width: 2px; }
                }
            `}</style>
        </main>
    );
}
