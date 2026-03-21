"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPortal() {
    const [secret, setSecret] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null); // { id, type, label }
    const [activeTab, setActiveTab] = useState("users"); // 'users' or 'tasks' for mobile view

    const handleLogin = async (e) => {
        e.preventDefault();
        fetchData(secret);
    };

    const fetchData = async (adminSecret) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/data?secret=${adminSecret}`);
            const result = await res.json();

            if (res.ok) {
                setData(result);
                setIsAuthenticated(true);
            } else {
                setError(result.error || "Access Denied");
            }
        } catch (err) {
            setError("Connection failed");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const { id, type } = pendingDelete;

        setActionLoading(id);
        setPendingDelete(null);
        try {
            const res = await fetch(`/api/admin/data?secret=${secret}&id=${id}&type=${type}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchData(secret);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

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
                    <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter text-white uppercase italic drop-shadow-2xl">
                        Vault <span className="text-rose-500">Access</span>
                    </h1>
                    <p className="text-slate-500 mb-10 font-black uppercase tracking-[0.4em] text-[10px]">Secure Gateway Protocol — v4.0</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600/50 to-indigo-600/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <input
                                type="password"
                                placeholder="ENTER SECURITY KEY"
                                className="relative w-full bg-black/80 border border-white/10 rounded-2xl px-6 py-5 text-center text-white placeholder-slate-700 focus:outline-none focus:border-rose-500/50 transition-all font-black text-lg sm:text-xl tracking-widest uppercase"
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
                            className="w-full py-5 bg-white text-black font-black rounded-2xl tracking-widest transition-all disabled:opacity-50 hover:bg-rose-500 hover:text-white transform hover:scale-[1.02] active:scale-95 shadow-2xl uppercase group relative overflow-hidden"
                        >
                            <span className="relative z-10">{loading ? "DECRYPTING..." : "AUTHORIZE ACCESS"}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </form>
                    <Link href="/" className="inline-block mt-12 text-slate-700 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors border-b border-transparent hover:border-white/20 pb-1">
                        Return to Signal
                    </Link>
                </div>
            </main>
        );
    }

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
                        <h1 className="text-4xl lg:text-7xl font-black tracking-tighter text-white italic mb-2 uppercase leading-none">
                            Platform <span className="text-gradient">Control</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Live Feed — v2.4.0</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => fetchData(secret)} className="flex-1 sm:flex-none px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-xl flex items-center justify-center gap-2 group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-active:rotate-180 transition-transform duration-500 tracking-tighter"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                            Refresh
                        </button>
                        <button onClick={() => setIsAuthenticated(false)} className="flex-1 sm:flex-none px-6 py-3 bg-rose-600/10 border border-rose-600/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all hover:text-white shadow-lg flex items-center justify-center gap-2 group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Lock
                        </button>
                    </div>
                </header>

                {/* Cyberpunk Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-16">
                    {[
                        { label: "Active Nodes", value: data.stats.totalUsers, color: "text-blue-500", glow: "shadow-blue-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m23 21-2-2 2-2" /><path d="m19 21 2-2-2-2" /></svg> },
                        { label: "Data Tasks", value: data.stats.totalTasks, color: "text-purple-500", glow: "shadow-purple-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg> },
                        { label: "Processing", value: data.stats.pendingTasks, color: "text-amber-500", glow: "shadow-amber-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></svg> },
                        { label: "Finalized", value: data.stats.completedTasks, color: "text-emerald-500", glow: "shadow-emerald-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
                    ].map((stat, i) => (
                        <div key={i} className={`relative group bg-white/[0.03] border border-white/10 rounded-2xl lg:rounded-[2rem] p-5 lg:p-8 transition-all hover:bg-white/[0.05] hover:-translate-y-1 shadow-2xl ${stat.glow}`}>
                            <div className={`mb-3 ${stat.color} opacity-50`}>{stat.icon}</div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{stat.label}</p>
                            <p className={`text-3xl lg:text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Mobile Tab Toggle */}
                <div className="flex lg:hidden mb-6 p-1 bg-black/40 border border-white/5 rounded-xl">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'users' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-slate-500'}`}
                    >
                        User Registry
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'tasks' ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'text-slate-500'}`}
                    >
                        Global Stream
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 pb-12">
                    {/* Glowing Column: Users */}
                    <section className={`lg:col-span-4 relative group ${activeTab !== 'users' ? 'hidden lg:block' : 'block'}`}>
                        <div className="absolute -inset-1 bg-blue-500/40 rounded-[2.5rem] sm:rounded-[3.2rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-700 animate-pulse"></div>
                        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-3xl border border-blue-500/20 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.1)] h-full lg:max-h-[850px] flex flex-col">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center justify-between italic uppercase">
                                <span className="flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></span>
                                    Registry
                                </span>
                                <span className="text-[9px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 tracking-widest">{data.users.length}</span>
                            </h2>

                            <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 custom-scrollbar-blue flex-1 min-h-[300px]">
                                {data.users.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-blue-500/5 transition-all group/item">
                                        <div className="min-w-0 flex-1 mr-3">
                                            <p className="font-bold text-slate-200 truncate text-base tracking-tight">{user.username}</p>
                                            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">#{user.id.slice(-6)}</p>
                                        </div>
                                        <button
                                            onClick={() => setPendingDelete({ id: user.id, type: 'user', label: user.username })}
                                            disabled={actionLoading === user.id}
                                            className="px-3 py-1.5 bg-rose-600/10 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-transparent hover:bg-rose-600 hover:text-white transition-all opacity-100 lg:opacity-0 group-hover/item:opacity-100"
                                        >
                                            {actionLoading === user.id ? "WAIT" : "BAN"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Glowing Column: Global Tasks */}
                    <section className={`lg:col-span-8 relative group ${activeTab !== 'tasks' ? 'hidden lg:block' : 'block'}`}>
                        <div className="absolute -inset-1 bg-purple-500/40 rounded-[2.5rem] sm:rounded-[3.2rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-700 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-3xl border border-purple-500/20 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.1)] h-full lg:max-h-[850px] flex flex-col">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center justify-between italic uppercase">
                                <span className="flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]"></span>
                                    Data Stream
                                </span>
                                <span className="text-[9px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 tracking-widest">{data.tasks.length}</span>
                            </h2>

                            <div className="space-y-10 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar-purple flex-1 min-h-[400px]">
                                {data.tasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-700 min-h-[200px]">
                                        <p className="text-[10px] uppercase font-black tracking-[0.3em]">No operational data</p>
                                    </div>
                                ) : (
                                    Object.entries(
                                        data.tasks.reduce((groups, task) => {
                                            const date = task.taskdate || task.taskDate || "Unscheduled";
                                            if (!groups[date]) groups[date] = [];
                                            groups[date].push(task);
                                            return groups;
                                        }, {})
                                    )
                                        .sort(([dateA], [dateB]) => {
                                            if (dateA === "Unscheduled") return 1;
                                            if (dateB === "Unscheduled") return -1;
                                            return new Date(dateB) - new Date(dateA); // Newest first
                                        })
                                        .map(([date, dateTasks]) => (
                                            <div key={date} className="space-y-4">
                                                <div className="sticky top-0 z-20 bg-[#0a0a1a]/95 backdrop-blur-sm py-3 border-b border-white/5 flex items-center justify-between translate-y-[-1px]">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-500/80">
                                                        {date === new Date().toISOString().split('T')[0] ? "Current Cycle" :
                                                            date === "Unscheduled" ? "Buffer" : date}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-slate-600">{dateTasks.length} NODES</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {dateTasks.map((task) => (
                                                        <div key={task.id} className="relative bg-white/[0.02] border border-white/5 p-4 sm:p-5 rounded-2xl hover:bg-white/[0.04] transition-all group/task">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="min-w-0 flex-1">
                                                                    <h3 className="text-base sm:text-lg font-black text-white tracking-tighter mb-1 uppercase italic leading-none truncate">{task.title}</h3>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                            {task.status}
                                                                        </span>
                                                                        <span className="text-[7px] font-bold text-slate-700 uppercase">{task.owner}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => setPendingDelete({ id: task.id, type: 'task', label: task.title })}
                                                                    className="p-1.5 text-slate-700 hover:text-rose-500 transition-colors bg-white/5 rounded-lg opacity-100 lg:opacity-0 group-hover/task:opacity-100"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                </button>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 italic">"{task.description || "No metadata recorded."}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
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
                        <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">Confirm Purge</h3>
                        <p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium italic">
                            Deleting <span className="text-rose-500">"{pendingDelete.label}"</span> will permanently remove it from the secure ledger.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={confirmDelete} className="py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl tracking-widest transition-all shadow-lg active:scale-95 uppercase text-xs">Execute</button>
                            <button onClick={() => setPendingDelete(null)} className="py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black rounded-xl tracking-widest transition-all border border-white/10 uppercase text-xs">Abort</button>
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

                input::placeholder {
                    color: rgba(100, 116, 139, 0.5);
                }
            `}</style>
        </main>
    );
}
