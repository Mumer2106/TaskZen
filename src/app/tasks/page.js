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
  const [toast, setToast] = useState(null); // { message, type }
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'specific'
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', profilePic: '', email: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ firstName: '', lastName: '', email: '', password: '', profilePic: '' });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchTasks();
    loadUserInfo();

    // Auto-refresh tasks every 10 seconds to keep in sync with admin actions
    const timer = setInterval(() => {
      fetchTasks(true);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const loadUserInfo = () => {
    try {
      const cookies = document.cookie.split('; ');
      const userInfoCookie = cookies.find(row => row.startsWith('user_info='));
      if (userInfoCookie) {
        try {
          const data = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]));
          setUserInfo(data);
          
          // Fetch full profile (including picture) separately since it's too big for cookie
          fetch("/api/user/me")
            .then(res => {
              if (res.status === 404 || res.status === 401) {
                handleLogout();
                return null;
              }
              return res.json();
            })
            .then(fullData => {
              if (fullData && !fullData.error) setUserInfo(fullData);
            }).catch(console.error);
            
        } catch (e) {
          console.error("Session corrupt:", e);
        }
      }
    } catch (e) {
      console.error("Failed to load user info:", e);
    }
  };

  const fetchTasks = async (silent = false) => {
    try {
      if (!silent && tasks.length === 0) setLoading(true);
      const res = await fetch('/api/tasks');

      if (res.status === 401) {
        handleLogout();
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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setMounted(false);
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const startProfileEdit = () => {
    setIsEditingProfile(true);
    setEditProfileData({
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      password: '',
      profilePic: userInfo.profilePic || ''
    });
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image too large (max 2MB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfileData(prev => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editProfileData.firstName,
          lastName: editProfileData.lastName,
          username: editProfileData.email,
          password: editProfileData.password || undefined,
          profilePic: editProfileData.profilePic
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.user);
        setIsEditingProfile(false);
        showToast("Profile updated successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Update failed", "error");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      showToast("Critical update failure", "error");
    } finally {
      setActionLoading(false);
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
          showToast("Protocol updated successfully", "success");
          if (activeTab === 'form') setActiveTab('list');
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
          showToast("New node allocated", "success");
        } else {
          let errorMsg = "System: Allocation failure.";
          try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } catch (e) {
            // Not JSON or empty body
          }
          setError(errorMsg);
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
    setNewTaskDate(task.taskDate || task.taskdate || new Date().toISOString().split('T')[0]);
    setActiveTab('form');
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
        showToast("Node purged", "error");
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
        showToast("Multiple nodes purged", "error");
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

      <div className="fixed top-6 left-6 z-[100] pointer-events-auto">
        {/* Home Link */}
        <Link href="/" className="group flex items-center justify-center p-3 sm:p-4 text-slate-500 hover:text-white transition-all duration-500 bg-[#02000d]/60 backdrop-blur-3xl rounded-2xl border border-white/5 shadow-2xl hover:border-indigo-500/30 hover:scale-110 active:scale-95" title="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100 transition-all"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-[100] pointer-events-auto">
        {/* Profile Icon */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="group relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl hover:border-pink-500/30 hover:scale-110 active:scale-95 transition-all duration-500 overflow-hidden"
          title="Profile"
        >
          {userInfo.profilePic ? (
            <img src={userInfo.profilePic} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="text-lg sm:text-xl font-black text-pink-500 italic uppercase">
              {userInfo.firstName?.[0] || userInfo.email?.[0] || 'U'}{userInfo.lastName?.[0] || ''}
            </div>
          )}
          <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      {/* Header */}
      <div className="w-full max-w-7xl pt-16 sm:pt-24 mb-10 sm:mb-16 relative z-10 px-4 sm:px-8 text-center flex flex-col justify-center items-center mx-auto animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 animate-pulse-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(255,45,149,0.8)]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Node_Feed v4.0.2 // Stable</span>
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter mb-4 text-gradient leading-[0.9] sm:leading-none italic uppercase">
            TaskZen
          </h1>
          <p className="text-base sm:text-xl text-slate-500 font-light max-w-2xl leading-relaxed italic pr-2">
            Interface with your objectives. A <span className="text-white font-bold">high-bandwidth system</span> for managing node life-cycles and neural-protocol execution with absolute precision.
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
        <div className={`lg:col-span-5 w-full flex lg:sticky lg:top-24 ${activeTab !== 'form' ? 'hidden lg:flex' : 'flex animate-in fade-in slide-in-from-bottom-5 duration-700'}`}>
          <div className="w-full bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 lg:h-[700px] h-auto animate-glow">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 text-white flex items-center justify-start gap-4 italic uppercase tracking-tighter text-left">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_15px_rgba(255,45,149,0.8)]"></span>
                {editId ? "Update Protocol" : "New Node"}
                {actionLoading && <Loader />}
              </h2>
              <form onSubmit={handleAddOrUpdate} className="space-y-6 sm:space-y-8">
                <div className="space-y-3 flex flex-col items-start text-left w-full group">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 w-full group-focus-within:text-pink-500 transition-colors">Node_Title</label>
                  <input
                    type="text"
                    placeholder="Enter objective..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/30 transition-all text-lg font-bold shadow-inner"
                    required
                    disabled={actionLoading}
                  />
                </div>
                <div className="space-y-3 flex flex-col items-start text-left w-full group">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 w-full group-focus-within:text-indigo-400 transition-colors">Metadata_Stream</label>
                  <textarea
                    placeholder="Record additional information..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all min-h-[120px] resize-none pb-4 text-base italic leading-relaxed shadow-inner"
                    disabled={actionLoading}
                  />
                </div>
                <div className="group space-y-3 flex flex-col items-start text-left w-full relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 w-full flex items-center gap-2 group-focus-within:text-pink-500 transition-colors uppercase">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    Temporal_Target
                  </label>
                  <div className="relative w-full">
                    <input
                      type="date"
                      min={editId ? undefined : new Date().toISOString().split('T')[0]}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
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
        <div className={`lg:col-span-7 w-full flex flex-col mt-10 lg:mt-0 bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] lg:h-[700px] h-auto overflow-hidden animate-glow ${activeTab !== 'list' ? 'hidden lg:flex' : 'flex animate-in fade-in slide-in-from-bottom-5 duration-700'}`}>

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
 
          <div className="px-1 mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Protocol_Stream // All active nodes</p>
          </div>

          <div className="flex-1 bg-transparent overflow-hidden flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 sm:p-20 text-center space-y-4">
                <Loader />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 sm:p-20 text-center space-y-6 sm:space-y-8">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-white/[0.02] flex items-center justify-center border border-white/5 text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M12 2v20" /><path d="M2 12h20" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-500 uppercase tracking-tighter mb-2">Registry Empty</h3>
                  <p className="text-slate-700 font-medium text-base sm:text-lg">No nodes found in the global stream.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 sm:pr-2">
                <div className="flex flex-col gap-8">
                  {Object.entries(
                    [...tasks].reduce((groups, task) => {
                      const date = task.taskDate || task.taskdate || "No Date";
                      if (!groups[date]) groups[date] = [];
                      groups[date].push(task);
                      return groups;
                    }, {})
                  )
                    .sort(([dateA], [dateB]) => {
                      if (dateA === "No Date") return 1;
                      if (dateB === "No Date") return -1;
                      return new Date(dateB) - new Date(dateA);
                    })
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
                        <div className="flex flex-col gap-4">
                          {dateTasks.map((task, i) => (
                            <div
                              key={task.id}
                              className={`group relative bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] overflow-hidden hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.02] hover:border-white/10 shadow-2xl ${selectedTasks.includes(task.id) ? 'bg-pink-500/5 border-pink-500/20 shadow-[0_0_40px_rgba(255,45,149,0.1)]' : ''}`}
                            >
                              {/* Holographic Scanline */}
                              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                <div className="absolute inset-x-0 h-full w-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent animate-scanline"></div>
                              </div>

                              <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                  {/* Selection Checkbox */}
                                  <div className="relative h-6 w-6 flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={selectedTasks.includes(task.id)}
                                      onChange={() => toggleSelection(task.id)}
                                      className="peer h-6 w-6 rounded-xl border-2 border-white/10 bg-black/40 text-pink-500 focus:ring-0 cursor-pointer appearance-none transition-all checked:bg-pink-600 checked:border-pink-600"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                                      <CheckIcon />
                                    </div>
                                  </div>

                                  {/* Status Node */}
                                  <button
                                    onClick={() => toggleStatus(task.id)}
                                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 flex items-center gap-2 ${task.status === "Completed"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                      : "bg-pink-500/10 text-pink-500 border-pink-500/20 shadow-[0_0_20px_rgba(255,45,149,0.1)]"
                                      }`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full animate-pulse-subtle ${task.status === "Completed" ? "bg-emerald-400" : "bg-pink-500"}`}></span>
                                    {task.status}
                                  </button>
                                </div>

                                <div className="text-[11px] font-mono text-slate-700 tracking-widest uppercase opacity-50">
                                  NODE_{task.id.slice(-4)}
                                </div>
                              </div>

                              <div className="flex flex-col mb-8 relative z-10">
                                <div className={`text-2xl font-black transition-all duration-700 break-words tracking-tighter mb-2 leading-[0.9] uppercase italic ${task.status === "Completed" ? "text-slate-600 line-through" : "text-white"}`}>
                                  {task.title}
                                </div>
                                <div className={`text-sm transition-all duration-700 break-words font-light leading-relaxed italic line-clamp-2 pr-4 ${task.status === "Completed" ? "text-slate-800" : "text-slate-400"}`}>
                                  {task.description || "System: Default protocol active. No additional metadata recorded."}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-6 border-t border-white/[0.03] bg-transparent relative z-10">
                                <div className="flex items-center gap-3">
                                  <div className="flex -space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-pink-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-indigo-500/40"></div>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">P_v2</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setViewTask(task)} title="View Info" className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl transition-all duration-300 text-slate-600 hover:text-white border border-white/5 hover:scale-110 active:scale-95">
                                    <span className="scale-[0.85] block relative"><EyeIcon /></span>
                                  </button>
                                  <button onClick={() => startEdit(task)} title="Edit Task" className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl transition-all duration-300 text-slate-600 hover:text-indigo-400 border border-white/5 hover:scale-110 active:scale-95">
                                    <span className="scale-[0.85] block relative"><EditIcon /></span>
                                  </button>
                                  <button onClick={() => deleteTask(task.id)} title="Delete Task" className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl transition-all duration-300 text-slate-600 hover:text-rose-500 border border-white/5 hover:scale-110 active:scale-95">
                                    <span className="scale-[0.85] block relative"><TrashIcon /></span>
                                  </button>
                                </div>
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
      </div>

      {/* View Modal */}
      {
        viewTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 backdrop-blur-3xl">
            <div className="absolute inset-0 bg-black/60" onClick={() => setViewTask(null)}></div>
            <div className="bg-[#050510] border border-white/10 rounded-3xl sm:rounded-[5rem] p-8 sm:p-16 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_100px_200px_rgba(0,0,0,1)] relative z-10 animate-in zoom-in-95 duration-700 custom-scrollbar">
              <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none text-center"></div>

              {/* Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute inset-x-0 h-full w-full bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-scanline"></div>
              </div>

              <button onClick={() => setViewTask(null)} className="absolute top-6 right-6 sm:top-12 sm:right-12 p-3 sm:p-5 text-slate-600 hover:text-white bg-white/5 rounded-full hover:rotate-90 hover:scale-110 transition-all duration-500 shadow-2xl z-20">
                <XIcon />
              </button>

              <div className="mb-10 relative z-10 text-center">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.4em] rounded-full border ${viewTask.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-pink-500/10 text-pink-400 border-pink-500/20"}`}>
                    NODE_STATUS: {viewTask.status}
                  </span>
                  <div className="text-[10px] font-mono text-slate-700 tracking-[0.5em] uppercase">SYSTEM_IDENTIFIER: {viewTask.id}</div>
                </div>

                <h3 className="text-4xl sm:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-tight sm:leading-none italic uppercase break-words px-2">{viewTask.title}</h3>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-500 font-bold uppercase text-[9px] sm:text-xs">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-xl border border-white/5">
                    TEMPORAL_TARGET: <span className="text-pink-500 tracking-widest">{viewTask.taskdate || viewTask.taskDate || "UNDEFINED"}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-xl border border-white/5">
                    LEDGER_ENTRY: <span className="text-slate-400">{viewTask.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-2xl sm:rounded-[3.5rem] p-8 sm:p-14 border border-white/5 mb-10 min-h-[160px] shadow-inner relative z-10">
                <div className="absolute top-6 left-10 text-[8px] font-black text-slate-800 uppercase tracking-[0.5em]">METADATA_STREAM</div>
                <p className="text-slate-300 text-xl sm:text-3xl leading-relaxed font-light italic text-center sm:text-left">
                  {viewTask.description || "System: Default protocol active. No additional metadata recorded for this node."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                <button
                  onClick={() => { startEdit(viewTask); setViewTask(null); }}
                  className="btn-premium-pink py-5 sm:py-8 rounded-xl sm:rounded-[2.5rem] text-lg uppercase italic tracking-[0.1em]"
                >
                  MODIFY PROTOCOL
                </button>
                <button
                  onClick={() => setViewTask(null)}
                  className="btn-premium-glass py-5 sm:py-8 rounded-xl sm:rounded-[2.5rem] text-lg uppercase italic tracking-[0.1em]"
                >
                  DEACTIVATE VIEW
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowProfileModal(false)}></div>
          <div className="bg-[#050510] border border-white/10 rounded-3xl sm:rounded-[4rem] p-8 sm:p-12 max-w-lg w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative z-10 animate-in zoom-in-95 duration-500 overflow-hidden custom-scrollbar max-h-[90vh] overflow-y-auto">
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <button onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }} className="absolute top-6 right-6 p-2 text-slate-600 hover:text-white transition-colors z-20">
              <XIcon />
            </button>

            {!isEditingProfile ? (
              <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-[2.5rem] bg-white/[0.03] border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative group">
                  {userInfo.profilePic ? (
                    <img src={userInfo.profilePic} alt="Profile Big" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-pink-500 italic uppercase">
                      {userInfo.firstName?.[0] || 'U'}{userInfo.lastName?.[0] || ''}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                    {userInfo.firstName} {userInfo.lastName}
                  </h3>
                  <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px]">
                    {userInfo.email}
                  </p>
                </div>

                <div className="w-full pt-8 border-t border-white/5 grid grid-cols-1 gap-4">
                  <button
                    onClick={startProfileEdit}
                    className="w-full btn-premium-pink py-5 rounded-2xl text-base uppercase font-black tracking-widest flex items-center justify-center gap-3"
                  >
                    <EditIcon />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full btn-premium-glass py-5 rounded-2xl text-base uppercase font-black tracking-widest text-rose-500 border-rose-500/20 hover:bg-rose-500/10 flex items-center justify-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="flex flex-col items-center space-y-6 relative z-10 w-full animate-in slide-in-from-right-10 duration-500">
                <div className="relative group mb-4">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-[2rem] bg-white/[0.03] border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative">
                    {editProfileData.profilePic ? (
                      <img src={editProfileData.profilePic} alt="Editing Profite" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-pink-500 italic uppercase">
                        {editProfileData.firstName?.[0] || 'U'}{editProfileData.lastName?.[0] || ''}
                      </span>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                    </label>
                  </div>
                  {editProfileData.profilePic && (
                    <button
                      type="button"
                      onClick={() => setEditProfileData(prev => ({ ...prev, profilePic: '' }))}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-rose-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">First Name</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all font-bold text-sm"
                      value={editProfileData.firstName}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all font-bold text-sm"
                      value={editProfileData.lastName}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Stream</label>
                  <input
                    type="email"
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all font-bold text-sm"
                    value={editProfileData.email}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Security Key (Leave blank to keep current)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all font-bold text-sm"
                    value={editProfileData.password}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4 w-full">
                  <button
                    type="submit"
                    className="btn-premium-pink py-4 rounded-xl text-sm font-black tracking-widest uppercase italic"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Syncing...' : 'Update Node'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="btn-premium-glass py-4 rounded-xl text-sm font-black tracking-widest uppercase italic"
                  >
                    Abort
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-[#050510] border border-rose-500/20 rounded-[3rem] p-10 sm:p-14 max-w-sm w-full text-center relative z-10 animate-in zoom-in-95 duration-500 shadow-[0_0_100px_rgba(244,63,94,0.2)]">
            <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
              <TrashIcon />
            </div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Purge Nodes?</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
              This action will permanently delete {selectedTasks.length} allocated tasks from the system registry.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={deleteMultiple} className="btn-premium-rose py-4 rounded-2xl text-sm font-black tracking-widest">
                CONFIRM PURGE
              </button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-premium-glass py-4 rounded-2xl text-sm font-black tracking-widest">
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-2xl backdrop-blur-3xl border shadow-2xl animate-in slide-in-from-bottom-10 duration-500 flex items-center gap-4 ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
          <div className={`h-2 w-2 rounded-full animate-pulse ${toast.type === "success" ? "bg-emerald-400" : "bg-rose-400"}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] italic pr-2">{toast.message}</span>
        </div>
      )}
    </main>
  );
}