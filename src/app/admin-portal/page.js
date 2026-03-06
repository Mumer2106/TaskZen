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

                <div className="relative z-10 w-full max-w-md text-center">
                    <div className="inline-block p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl mb-8 shadow-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <h1 className="text-5xl font-black mb-2 tracking-tighter text-white uppercase italic drop-shadow-2xl">
                        Admin <span className="text-rose-500">Portal</span>
                    </h1>
                    <p className="text-slate-500 mb-10 font-black uppercase tracking-[0.4em] text-[10px]">Security Clearance Required</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600/50 to-indigo-600/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <input
                                type="password"
                                placeholder="Enter Admin Secret Key"
                                className="relative w-full bg-black/80 border border-white/10 rounded-2xl px-6 py-5 text-center text-white placeholder-slate-700 focus:outline-none focus:border-rose-500/50 transition-all font-black text-lg"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-rose-500 text-xs font-bold uppercase tracking-widest animate-bounce">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-white text-black font-black rounded-2xl tracking-widest transition-all disabled:opacity-50 hover:bg-rose-500 hover:text-white transform hover:scale-[1.02] active:scale-95 shadow-2xl"
                        >
                            {loading ? "AUTHENTICATING..." : "BYPASS SECURITY"}
                        </button>
                    </form>
                    <Link href="/" className="inline-block mt-12 text-slate-700 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors border-b border-transparent hover:border-white/20 pb-1">
                        Exit to Public Site
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#02000d] text-white p-6 sm:p-12 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white italic mb-2 uppercase leading-none">
                            Platform <span className="text-gradient">Control</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Live System Feed — v2.4.0</p>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <button onClick={() => fetchData(secret)} className="flex-1 lg:flex-none px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-xl">Sync Data</button>
                        <button onClick={() => setIsAuthenticated(false)} className="flex-1 lg:flex-none px-8 py-4 bg-rose-600/10 border border-rose-600/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all hover:text-white shadow-lg">Lock Terminal</button>
                    </div>
                </header>

                {/* Cyberpunk Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { label: "Active Nodes", value: data.stats.totalUsers, color: "text-blue-500", glow: "shadow-blue-500/20" },
                        { label: "Data Tasks", value: data.stats.totalTasks, color: "text-purple-500", glow: "shadow-purple-500/20" },
                        { label: "Processing", value: data.stats.pendingTasks, color: "text-amber-500", glow: "shadow-amber-500/20" },
                        { label: "Finalized", value: data.stats.completedTasks, color: "text-emerald-500", glow: "shadow-emerald-500/20" },
                    ].map((stat, i) => (
                        <div key={i} className={`relative group bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 transition-all hover:bg-white/[0.05] hover:-translate-y-2 shadow-2xl ${stat.glow}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{stat.label}</p>
                            <p className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Glowing Column: Users */}
                    <section className="lg:col-span-5 relative group">
                        <div className="absolute -inset-1 bg-blue-500/40 rounded-[3.2rem] blur-2xl opacity-40 group-hover:opacity-70 transition duration-700 animate-pulse"></div>
                        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-3xl border-2 border-blue-500/30 rounded-[3rem] p-8 lg:p-10 shadow-[0_0_50px_rgba(59,130,246,0.3)] h-full">
                            <h2 className="text-2xl font-black mb-8 flex items-center justify-between italic uppercase">
                                <span className="flex items-center gap-4">
                                    <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)]"></span>
                                    User Registry
                                </span>
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 tracking-widest">{data.users.length}</span>
                            </h2>

                            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar-blue">
                                {data.users.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-blue-500/10 transition-all border-l-4 border-l-transparent hover:border-l-blue-500">
                                        <div className="min-w-0 flex-1 mr-4">
                                            <p className="font-black text-slate-200 truncate text-lg tracking-tight">{user.username}</p>
                                            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">UID: {user.id}</p>
                                        </div>
                                        <button
                                            onClick={() => setPendingDelete({ id: user.id, type: 'user', label: user.username })}
                                            disabled={actionLoading === user.id}
                                            className="px-4 py-2 bg-rose-600/10 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-transparent hover:bg-rose-600 hover:text-white transition-all shadow-lg hover:shadow-rose-500/30"
                                        >
                                            {actionLoading === user.id ? "..." : "BAN"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Glowing Column: Global Tasks */}
                    <section className="lg:col-span-7 relative group">
                        <div className="absolute -inset-1 bg-purple-500/40 rounded-[3.2rem] blur-2xl opacity-40 group-hover:opacity-70 transition duration-700 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-3xl border-2 border-purple-500/30 rounded-[3rem] p-8 lg:p-10 shadow-[0_0_50px_rgba(168,85,247,0.3)] h-full">
                            <h2 className="text-2xl font-black mb-8 flex items-center justify-between italic uppercase">
                                <span className="flex items-center gap-4">
                                    <span className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)]"></span>
                                    Global Data Stream
                                </span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 tracking-widest">{data.tasks.length}</span>
                            </h2>

                            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar-purple">
                                {data.tasks.map((task) => (
                                    <div key={task.id} className="relative bg-white/[0.02] border border-white/5 p-6 rounded-3xl hover:bg-purple-500/10 transition-all border-l-4 border-l-transparent hover:border-l-purple-500 group/task">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xl font-black text-white tracking-tighter mb-1 uppercase italic leading-none">{task.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/20 text-amber-500 border-amber-500/20'}`}>
                                                        {task.status}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{task.createdAt}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setPendingDelete({ id: task.id, type: 'task', label: task.title })}
                                                disabled={actionLoading === task.id}
                                                className="p-2 text-slate-700 hover:text-rose-500 transition-colors bg-white/5 rounded-lg hover:bg-rose-500/10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-400 font-light leading-relaxed mb-6 italic">"{task.description || "System: No additional metadata recorded."}"</p>
                                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operator: <span className="text-blue-400">{task.owner}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Premium Delete Confirmation Modal */}
            {pendingDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setPendingDelete(null)}></div>
                    <div className="relative bg-[#0a0a1a] border-2 border-rose-500/40 p-10 rounded-[3rem] max-w-lg w-full shadow-[0_0_100px_rgba(225,29,72,0.2)] text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Confirm Destruction</h3>
                        <p className="text-slate-500 mb-10 text-lg leading-relaxed font-light italic px-4">
                            You are about to permanently purge <span className="text-rose-500 font-black">"{pendingDelete.label}"</span> from the database. This protocol cannot be reversed.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={confirmDelete}
                                className="py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl tracking-widest transition-all shadow-xl hover:shadow-rose-500/30"
                            >
                                EXECUTE
                            </button>
                            <button
                                onClick={() => setPendingDelete(null)}
                                className="py-5 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white font-black rounded-2xl tracking-widest transition-all border border-white/10"
                            >
                                ABORT
                            </button>
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
                .custom-scrollbar-blue::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-blue::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 10px; }
                
                .custom-scrollbar-purple::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-purple::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-purple::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 10px; }
            `}</style>
        </main>
    );
}
