"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

const Loader = () => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce"></div>
  </div>
);

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [editId, setEditId] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // 'form' or 'list'
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setTasks(data || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setActionLoading(true);
      setError("");
      if (editId) {
        const res = await fetch(`/api/tasks/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTaskTitle, description: newTaskDesc, taskDate: newTaskDate })
        });
        if (res.ok) {
          setTasks(prev => prev.map(t => t.id === editId ? { ...t, title: newTaskTitle, description: newTaskDesc, taskDate: newTaskDate } : t));
          setEditId(null);
        } else {
          const errData = await res.json();
          setError(errData.error || "System: Protocol update failed.");
          return;
        }
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTaskTitle, description: newTaskDesc, taskDate: newTaskDate })
        });
        if (res.ok) {
          const newTask = await res.json();
          setTasks(prev => [newTask, ...prev]);
        } else {
          const errData = await res.json();
          setError(errData.error || "System: Allocation failure.");
          return;
        }
      }
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDate(new Date().toISOString().split('T')[0]);
      setError("");
    } catch (error) {
      console.error("Failed to sync task:", error);
      setError("System: Critical connection failure.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setError(""), 5000);
    }
  };

  const startEdit = (task) => {
    setEditId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || "");
    setNewTaskDate(task.taskdate || task.taskDate || new Date().toISOString().split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskDate(new Date().toISOString().split('T')[0]);
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
        setSelectedTasks(prev => prev.filter(taskId => taskId !== id));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const toggleStatus = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === "Pending" ? "Completed" : "Pending";

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const toggleSelection = (id) => {
    setSelectedTasks(prev =>
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const deleteMultiple = async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTasks })
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => !selectedTasks.includes(t.id)));
        setSelectedTasks([]);
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete tasks:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#02000d] text-white selection:bg-pink-500/30 relative overflow-hidden flex flex-col items-center">

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-fuchsia-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-float-slow"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 's',
              animationDuration: (Math.random() * 10 + 10) + 's',
              opacity: Math.random() * 0.5
            }}
          />
        ))}
      </div>

      {/* Top Floating Buttons */}
      <div className="fixed top-6 left-6 z-[100] pointer-events-auto">
        <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 bg-[#02000d]/80 backdrop-blur-2xl px-4 py-2 sm:px-5 sm:py-3 rounded-2xl border border-white/10 shadow-2xl hover:border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
          <span className="font-black tracking-tight text-xs sm:text-sm hidden xs:inline uppercase">Home</span>
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-[100] pointer-events-auto">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 text-rose-500/80 hover:text-rose-500 transition-all duration-300 bg-[#02000d]/80 backdrop-blur-2xl px-4 py-2 sm:px-5 sm:py-3 rounded-2xl border border-white/10 shadow-2xl hover:border-rose-500/30"
        >
          <span className="font-black tracking-tight text-xs sm:text-sm hidden xs:inline uppercase">Exit</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        </button>
      </div>

      {/* Header */}
      <div className="w-full max-w-7xl pt-16 sm:pt-20 mb-8 sm:mb-12 relative z-10 px-4 sm:px-8 text-center flex flex-col justify-center items-center mx-auto">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-2 sm:mb-4 text-gradient leading-[0.9] sm:leading-none">
            TaskZen
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-light max-w-xl leading-relaxed">
            Stay organized and productive. A <span className="text-white">simple yet powerful</span> way to track your daily goals and projects.
          </p>
        </div>
      </div>

      {/* Tab Switcher - Mobile Only */}
      <div className="w-full max-w-7xl px-4 sm:px-8 mb-6 lg:hidden relative z-20">
        <div className="flex p-1 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 ${activeTab === 'list' ? 'bg-pink-600/20 text-pink-500 shadow-[0_0_20px_rgba(255,45,149,0.2)] border border-pink-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Your Tasks
          </button>
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 ${activeTab === 'form' ? 'bg-indigo-600/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Plan {editId ? "(Edit)" : "New"}
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12 px-4 sm:px-8 mx-auto xl:px-0">

        {/* Create/Edit Form */}
        <div className={`lg:col-span-5 w-full flex justify-center lg:sticky lg:top-24 ${activeTab !== 'form' ? 'hidden lg:flex' : 'flex animate-in fade-in slide-in-from-bottom-5 duration-700'}`}>
          <div className="w-full bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-center text-center hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 lg:h-[620px] animate-glow">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 text-white flex justify-center items-center gap-4">
                <div className="h-8 sm:h-10 w-1.5 rounded-full bg-gradient-to-b from-pink-500 to-indigo-600 shadow-[0_0_15px_rgba(255,45,149,0.5)]"></div>
                {editId ? "Edit Task" : "Add Task"}
                {actionLoading && <Loader />}
              </h2>
              <form onSubmit={handleAddOrUpdate} className="space-y-6 sm:space-y-8">
                <div className="space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-full">Task Name</label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all text-lg font-bold"
                    required
                    disabled={actionLoading}
                  />
                </div>
                <div className="space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-full">Task Details</label>
                  <textarea
                    placeholder="Add more information here..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-5 py-4 text-white placeholder-slate-700/80 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all min-h-[120px] resize-none pb-4 text-base leading-relaxed"
                    disabled={actionLoading}
                  />
                </div>
                <div className="group space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left w-full relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 w-full flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    Target Date
                  </label>
                  <div className="relative w-full">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all text-lg font-bold [color-scheme:dark] appearance-none cursor-pointer hover:bg-black/60 hover:border-white/10"
                      disabled={actionLoading}
                      required
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-pink-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-6 sm:pt-8 space-y-4 flex flex-col items-center w-full">
              {error && (
                <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl animate-bounce">
                  {error}
                </div>
              )}
              <button
                onClick={handleAddOrUpdate}
                type="button"
                className="w-full btn-premium-pink py-4 rounded-2xl sm:rounded-3xl disabled:opacity-50 text-sm sm:text-base animate-glow"
                disabled={actionLoading || !newTaskTitle.trim()}
              >
                {actionLoading ? "SAVING..." : editId ? "SAVE CHANGES" : "CREATE TASK"}
              </button>
              {editId && (
                <button type="button" onClick={cancelEdit} className="w-full btn-premium-glass py-4 rounded-2xl sm:rounded-3xl disabled:opacity-50 text-sm sm:text-base">
                  CANCEL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className={`lg:col-span-7 w-full flex flex-col mt-10 lg:mt-0 bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] lg:h-[620px] overflow-hidden animate-glow ${activeTab !== 'list' ? 'hidden lg:flex' : 'flex animate-in fade-in slide-in-from-bottom-5 duration-700'}`}>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-4 border-b border-white/5 gap-4 text-center sm:text-left shrink-0">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex justify-center sm:justify-start items-center flex-wrap gap-4 italic tracking-tighter">
              Your Tasks
              {selectedTasks.length > 1 && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-4 sm:px-6 py-2 sm:py-2.5 btn-premium-rose rounded-full animate-bounce"
                >
                  Delete Selected ({selectedTasks.length})
                </button>
              )}
            </h2>
            <div className="w-fit mx-auto sm:mx-0 px-4 py-2 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-slate-500 cursor-default flex justify-center items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
              Total: {loading ? "..." : tasks.length}
            </div>
          </div>

          <div className="flex-1 bg-transparent overflow-hidden flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 sm:p-20 text-center space-y-4">
                <Loader />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 sm:p-20 text-center space-y-6 sm:space-y-8">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl sm:rounded-[2.5rem] bg-white/[0.02] flex items-center justify-center border border-white/5 text-slate-700 hover:scale-110 hover:border-white/20 transition-all duration-700 group cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-700 opacity-20 sm:w-12 sm:h-12"><path d="M12 2v20" /><path d="M2 12h20" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-500 uppercase tracking-tighter mb-2">No Tasks Found</h3>
                  <p className="text-slate-700 font-medium text-base sm:text-lg">Add your first task to get started!</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 sm:pr-2">
                <div className="flex flex-col gap-8">
                  {Object.entries(
                    tasks.reduce((groups, task) => {
                      const date = task.taskdate || task.taskDate || "No Date";
                      if (!groups[date]) groups[date] = [];
                      groups[date].push(task);
                      return groups;
                    }, {})
                  )
                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                    .map(([date, dateTasks]) => (
                      <div key={date} className="space-y-4">
                        <div className="sticky top-0 z-20 bg-[#02000d]/80 backdrop-blur-md py-2 border-b border-pink-500/20 flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(255,45,149,0.5)]"></span>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500/80">
                            {date === new Date().toISOString().split('T')[0] ? "Today" :
                              date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? "Tomorrow" :
                                new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="divide-y divide-white/[0.05] flex flex-col gap-3">
                          {dateTasks.map((task, i) => (
                            <div
                              key={task.id}
                              className={`group relative flex flex-col sm:flex-row items-center justify-between gap-4 py-4 sm:py-5 transition-all duration-700 hover:bg-white/[0.04] px-4 sm:px-6 rounded-2xl border border-transparent hover:border-white/5 w-full ${selectedTasks.includes(task.id) ? 'bg-white/[0.04] border-white/10' : ''}`}
                            >
                              <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                                <div className="relative h-6 w-6 flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={selectedTasks.includes(task.id)}
                                    onChange={() => toggleSelection(task.id)}
                                    className="peer h-6 w-6 rounded-md sm:rounded-lg border-2 border-white/10 bg-black/40 text-pink-500 focus:ring-0 cursor-pointer appearance-none transition-all checked:bg-pink-600 checked:border-pink-600"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                                    <CheckIcon />
                                  </div>
                                </div>

                                <button
                                  onClick={() => toggleStatus(task.id)}
                                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-700 ${task.status === "Completed"
                                    ? "bg-pink-600 border-pink-600 text-white shadow-[0_0_15px_rgba(255,45,149,0.5)]"
                                    : "bg-transparent border-slate-700 text-transparent hover:border-pink-500/50 hover:text-pink-500/30"
                                    }`}
                                >
                                  <span className="scale-[0.85]"><CheckIcon /></span>
                                </button>
                              </div>

                              <div className="flex flex-col flex-1 min-w-0 justify-center items-center text-center px-4">
                                <div className={`text-lg sm:text-xl font-black transition-all duration-700 break-words tracking-tight mb-0.5 ${task.status === "Completed" ? "text-slate-700 line-through italic" : "text-white"}`}>
                                  {task.title}
                                </div>
                                <div className={`text-xs transition-all duration-700 break-words font-light leading-snug w-full max-w-sm ${task.status === "Completed" ? "text-slate-800" : "text-slate-500"}`}>
                                  {task.description || "No description provided."}
                                </div>
                              </div>

                              <div className="flex items-center justify-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 w-full sm:w-auto border-t border-white/5 sm:border-t-0 flex-shrink-0 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                                <button onClick={() => setViewTask(task)} title="View Info" className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all text-slate-500 hover:text-white border border-white/5 shadow-lg flex justify-center items-center cursor-pointer">
                                  <span className="scale-[0.85]"><EyeIcon /></span>
                                </button>
                                <button onClick={() => startEdit(task)} title="Edit Task" className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all text-slate-500 hover:text-amber-500 border border-white/5 shadow-lg flex justify-center items-center cursor-pointer">
                                  <span className="scale-[0.85]"><EditIcon /></span>
                                </button>
                                <button onClick={() => deleteTask(task.id)} title="Delete Task" className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all text-slate-500 hover:text-rose-500 border border-white/5 shadow-lg flex justify-center items-center cursor-pointer">
                                  <span className="scale-[0.85]"><TrashIcon /></span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div >

      {/* View Modal */}
      {
        viewTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 backdrop-blur-3xl">
            <div className="absolute inset-0 bg-black/60" onClick={() => setViewTask(null)}></div>
            <div className="bg-[#050510] border border-white/10 rounded-3xl sm:rounded-[5rem] p-8 sm:p-16 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_100px_200px_rgba(0,0,0,1)] relative z-10 animate-in zoom-in-95 duration-700 custom-scrollbar">
              <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

              <button onClick={() => setViewTask(null)} className="absolute top-6 right-6 sm:top-12 sm:right-12 p-3 sm:p-5 text-slate-600 hover:text-white bg-white/5 rounded-full hover:rotate-90 hover:scale-110 transition-all duration-500 shadow-2xl">
                <XIcon />
              </button>
              <div className="mb-8 ">
                <span className={`inline-block px-4 sm:px-8 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6 border ${viewTask.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-pink-500/10 text-pink-400 border-pink-500/20"}`}>
                  {viewTask.status}
                </span>
                <h3 className="text-4xl sm:text-7xl lg:text-8xl font-black text-white mb-4 tracking-tighter leading-tight sm:leading-none italic uppercase break-words">{viewTask.title}</h3>
                <p className="text-slate-600 font-bold uppercase text-[9px] sm:text-xs px-2">
                  Target Date: <span className="text-pink-500">{viewTask.taskdate || viewTask.taskDate || "Not set"}</span>
                </p>
                <p className="text-slate-700 font-bold uppercase text-[8px] sm:text-[10px] px-2 mt-1">Created on {viewTask.createdAt}</p>
              </div>
              <div className="bg-white/[0.02] rounded-2xl sm:rounded-[3.5rem] p-6 sm:p-12 border border-white/5 mb-8 min-h-[140px] shadow-inner">
                <p className="text-slate-300 text-lg sm:text-3xl leading-snug font-light italic">
                  {viewTask.description || "No detailed information for this task."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { startEdit(viewTask); setViewTask(null); }}
                  className="btn-premium-pink py-5 sm:py-8 rounded-xl sm:rounded-[2rem] text-lg"
                >
                  EDIT TASK
                </button>
                <button
                  onClick={() => setViewTask(null)}
                  className="btn-premium-glass py-5 sm:py-8 rounded-xl sm:rounded-[2rem] text-lg"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Modal */}
      {
        isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className="bg-[#050510] border border-white/10 rounded-3xl sm:rounded-[4rem] p-8 sm:p-16 max-w-lg w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative z-10 animate-in zoom-in-95 text-center">
              <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-2xl sm:rounded-[3.5rem] bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20 text-rose-500">
                <TrashIcon />
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">Confirm Delete</h3>
              <p className="text-slate-500 mb-8 text-lg font-light leading-relaxed px-2">
                Are you sure you want to delete <span className="text-rose-500 font-black">{selectedTasks.length} tasks</span>? This cannot be undone.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={deleteMultiple} className="btn-premium-rose py-4 sm:py-6 rounded-xl sm:rounded-[1.5rem] text-lg">YES, DELETE</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-500 font-bold tracking-widest text-[10px] sm:text-xs uppercase hover:text-white transition-colors py-2">CANCEL</button>
              </div>
            </div>
          </div>
        )
      }

      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -50px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @media (max-width: 480px) {
          .xs\:inline { display: inline; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
        .animate-glow {
          box-shadow: 0 0 20px rgba(255, 45, 149, 0.1);
          transition: box-shadow 0.3s ease;
        }
        .animate-glow:focus-within {
          box-shadow: 0 0 30px rgba(255, 45, 149, 0.3);
        }
      `}</style>
    </main >
  );
}