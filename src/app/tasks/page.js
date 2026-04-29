"use client";

import { useState, useEffect, useRef } from "react";
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

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ firstName: '', lastName: '', email: '', password: '', profilePic: '' });
  const router = useRouter();
  const lastRefreshTime = useRef(0);

  const handleResetSearch = () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 5000) return; // 5-second throttle to prevent spamming
    lastRefreshTime.current = now;

    setSearch("");
    setDebouncedSearch("");
    fetchTasks(true, "");
  };

  useEffect(() => {
    setMounted(true);
    fetchTasks();
    loadUserInfo();
  }, []);

  useEffect(() => {
    // Note: Automatic 10s refresh removed to prevent unexpected 'khud load' behavior 
    // and respect the manual throttle/refresh control.
  }, [debouncedSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // Re-implemented 2.5s delay for optimized searching

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (mounted) {
      fetchTasks(true, debouncedSearch);
    }
  }, [debouncedSearch]);

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

  const fetchTasks = async (silent = false, query = debouncedSearch) => {
    try {
      if (!silent && tasks.length === 0) setLoading(true);
      const res = await fetch(`/api/tasks${query ? `?search=${encodeURIComponent(query)}` : ''}`);

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

  const toggleTaskStatus = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        showToast(newStatus === "Completed" ? "Task completed!" : "Task marked as pending", "success");
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
        <Link href="/" className="group flex items-center justify-center p-3 sm:p-4 text-indigo-400 hover:text-white transition-all duration-500 bg-white/[0.05] backdrop-blur-3xl rounded-2xl border border-white/10 hover:border-indigo-500/40 shadow-2xl hover:scale-110 active:scale-95" title="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-[100] pointer-events-auto">
        {/* Profile Icon */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="group relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-black backdrop-blur-3xl border-2 border-pink-500/30 shadow-[0_0_20px_rgba(255,45,149,0.1)] hover:shadow-[0_0_30px_rgba(255,45,149,0.3)] hover:border-pink-500/60 hover:scale-110 active:scale-95 transition-all duration-700 overflow-hidden"
          title="Profile"
        >
          {userInfo.profilePic ? (
            <img src={userInfo.profilePic} alt="Profile" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="text-lg sm:text-xl font-black text-pink-500 italic uppercase drop-shadow-[0_0_10px_rgba(255,45,149,0.5)]">
              {userInfo.firstName?.[0] || userInfo.email?.[0] || 'U'}{userInfo.lastName?.[0] || ''}
            </div>
          )}
          <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </button>
      </div>

      {/* Header */}
      <div className="w-full max-w-7xl pt-16 sm:pt-24 mb-10 sm:mb-16 relative z-10 px-4 sm:px-8 text-center flex flex-col justify-center items-center mx-auto animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="flex flex-col items-center text-center">

          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter mb-4 text-gradient leading-[0.9] sm:leading-none italic uppercase">
            TaskZen
          </h1>
          <p className="text-base sm:text-xl text-slate-500 font-light max-w-2xl leading-relaxed italic pr-2">
            Interface with your objectives. A <span className="text-white font-bold">high-bandwidth system</span> for managing node life-cycles and neural-protocol execution with absolute precision.
          </p>

          {/* Absolute Overlaid Notification */}
          {toast && (
            <div className="absolute top-[105%] left-1/2 -translate-x-1/2 z-[300] w-fit">
              <div className={`px-6 py-3 rounded-2xl backdrop-blur-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 whitespace-nowrap animate-in fade-in zoom-in-95 duration-500 ${toast.type === "success"
                  ? "bg-[#05110a]/90 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
                  : "bg-[#110505]/90 border-rose-500/40 text-rose-500 shadow-rose-500/20"
                }`}>
                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${toast.type === "success" ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]"}`}></div>
                <span className="text-[10px] font-black tracking-[0.2em] italic uppercase">{toast.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Floating Bottom Nav - Mobile Only */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
        <div className="relative p-1.5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden group">
          {/* Animated background glow */}
          <div className={`absolute inset-0 bg-gradient-to-r from-pink-500/10 via-indigo-500/10 to-pink-500/10 transition-all duration-1000 ${activeTab === 'list' ? 'translate-x-[-20%]' : 'translate-x-[20%]'}`} />

          <div className="relative flex items-center">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-4 flex flex-col items-center justify-center gap-1.5 rounded-[1.5rem] transition-all duration-500 ${activeTab === 'list' ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={activeTab === 'list' ? "text-pink-500 animate-pulse" : ""}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
               <span className="text-[10px] font-black tracking-[0.15em] opacity-80">Registry</span>
            </button>

            <div className="w-[1px] h-8 bg-white/5 mx-1" />

            <button
              onClick={() => setActiveTab("form")}
              className={`flex-1 py-4 flex flex-col items-center justify-center gap-1.5 rounded-[1.5rem] transition-all duration-500 ${activeTab === 'form' ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={activeTab === 'form' ? "text-indigo-400 animate-bounce" : ""}><path d="M12 5v14M5 12h14" /></svg>
               <span className="text-[10px] font-black tracking-[0.15em] opacity-80">{editId ? "Update Node" : "Allocate Node"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12 px-4 sm:px-8 mx-auto xl:px-0">

        {/* Create/Edit Form */}
        <div className={`lg:col-span-5 w-full flex lg:sticky lg:top-24 ${activeTab !== 'form' ? 'hidden lg:flex' : 'flex animate-in fade-in slide-in-from-bottom-5 duration-700'}`}>
          <div className="w-full bg-[#050510]/95 backdrop-blur-[40px] border-2 border-indigo-500/30 rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_0_80px_rgba(79,70,229,0.1)] flex flex-col hover:border-indigo-500/50 transition-all duration-500 lg:h-[700px] h-auto animate-glow">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 text-white flex items-center justify-start gap-4 italic capitalize tracking-tighter text-left">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_15px_rgba(255,45,149,0.8)]"></span>
                {editId ? "Update Protocol" : "New Node"}
                {actionLoading && <Loader />}
              </h2>
              <form onSubmit={handleAddOrUpdate} className="space-y-6 sm:space-y-8">
                <div className="space-y-3 flex flex-col items-start text-left w-full group">
                  <label className="text-[13px] font-black tracking-wider text-slate-300 w-full flex items-center gap-2 group-focus-within:text-pink-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    Task Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Objective..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-sm placeholder:font-black placeholder:normal-case placeholder:tracking-[0.1em] placeholder:text-slate-500 placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all text-lg font-bold shadow-inner"
                    required
                    disabled={actionLoading}
                  />
                </div>
                <div className="space-y-3 flex flex-col items-start text-left w-full group">
                  <label className="text-[13px] font-black tracking-wider text-slate-300 w-full flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line x1="17" x2="3" y1="18" y2="18" /></svg>
                    Task Description
                  </label>
                  <textarea
                    placeholder="Record Additional Information..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-sm placeholder:font-black placeholder:normal-case placeholder:tracking-[0.1em] placeholder:text-slate-500 placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.08] focus:border-indigo-500/30 transition-all min-h-[120px] resize-none pb-4 text-base italic leading-relaxed shadow-inner"
                    disabled={actionLoading}
                  />
                </div>
                <div className="group space-y-3 flex flex-col items-start text-left w-full relative">
                  <label className="text-[13px] font-black tracking-wider text-slate-300 w-full flex items-center gap-2 group-focus-within:text-pink-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    Date
                  </label>
                  <div className="relative w-full">
                    <input
                      type="date"
                      min={editId ? undefined : new Date().toISOString().split('T')[0]}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all text-lg font-bold [color-scheme:dark] appearance-none cursor-pointer hover:bg-white/5 shadow-inner"
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
                className="w-full btn-premium-pink py-4 rounded-2xl sm:rounded-3xl disabled:opacity-50 text-lg animate-glow"
                disabled={actionLoading || !newTaskTitle.trim()}
              >
                {actionLoading ? "Saving..." : editId ? "Save Changes" : "Create Task"}
              </button>
              {editId && (
                <button type="button" onClick={cancelEdit} className="w-full btn-premium-glass py-4 rounded-2xl sm:rounded-3xl disabled:opacity-50 text-lg">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className={`lg:col-span-7 w-full flex flex-col mt-10 lg:mt-0 ${activeTab !== 'list' ? 'hidden lg:flex' : 'flex animate-in fade-in slide-in-from-bottom-5 duration-700'}`}>
          <div className="w-full flex flex-col bg-[#050510]/95 backdrop-blur-[40px] border-2 border-pink-500/30 rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_0_80px_rgba(255,45,149,0.1)] lg:h-[700px] h-auto overflow-hidden animate-glow">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-4 border-b border-white/5 gap-4 text-center sm:text-left shrink-0">
              <h2 className="text-2xl sm:text-3xl font-black text-white flex justify-center sm:justify-start items-center flex-wrap gap-4 italic tracking-tighter">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_15px_rgba(255,45,149,0.8)]"></span>
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
              <div className="w-fit mx-auto sm:mx-0 px-4 py-2 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/10 shadow-lg cursor-default flex justify-center items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(255,45,149,0.5)]"></span>
                <span className="text-[11px] font-black tracking-widest text-slate-300">Total: {loading ? "..." : tasks.length}</span>
              </div>
            </div>

            <div className="px-1 mb-8 w-full">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-pink-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search All Protocols..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-14 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white placeholder:text-sm placeholder:font-black placeholder:normal-case placeholder:tracking-[0.1em] placeholder:text-slate-500 placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all shadow-inner"
                />
                <button
                  onClick={handleResetSearch}
                  title="Refresh Registry"
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-pink-500 transition-all hover:scale-110 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={search ? "animate-spin-once" : ""}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                </button>
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
                  <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-white/[0.02] flex items-center justify-center border border-white/5 text-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M12 2v20" /><path d="M2 12h20" /></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-300 uppercase tracking-tighter mb-2">Registry Empty</h3>
                    <p className="text-slate-500 font-medium text-base sm:text-lg">No nodes found in the global stream.</p>
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
                        <div key={date} className="group/date relative">
                          {/* Dynamic Header */}
                          <div className="sticky top-0 z-30 mb-2 group-first/date:mt-0 mt-3">
                            <div className="absolute inset-0 bg-[#02000d]/60 backdrop-blur-xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.4)]" />
                            <div className="relative px-6 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-pink-500 blur-md opacity-40 animate-pulse" />
                                  <div className="relative h-2.5 w-2.5 rounded-full bg-pink-500 border-2 border-white/20 shadow-[0_0_10px_rgba(255,45,149,0.8)]" />
                                </div>
                                <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white italic">
                                  {date === new Date().toISOString().split('T')[0] ? "Current Cycle" :
                                    date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? "Incoming" :
                                      new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </h3>
                              </div>
                              <div className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full">
                                <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em]">{dateTasks.length} NODES</span>
                              </div>
                            </div>
                            {/* Animated accent line */}
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover/date:w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent transition-all duration-1000" />
                          </div>

                          <div className="px-1 space-y-2.5 pb-4">
                            {dateTasks.map((task, i) => (
                              <div
                                key={task.id}
                                className={`group relative overflow-hidden rounded-[2rem] transition-all duration-500
                                ${selectedTasks.includes(task.id)
                                    ? 'shadow-[0_0_40px_rgba(255,45,149,0.18)]'
                                    : 'shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_60px_rgba(255,45,149,0.12)]'}
                              `}
                              >
                                {/* Gradient border shell */}
                                <div className={`absolute inset-0 rounded-[2rem] p-[1px] pointer-events-none z-0
                                ${selectedTasks.includes(task.id)
                                    ? 'bg-gradient-to-br from-pink-500/50 via-fuchsia-500/20 to-indigo-500/30'
                                    : 'bg-gradient-to-br from-white/10 via-white/[0.03] to-white/5 group-hover:from-pink-500/30 group-hover:via-fuchsia-500/10 group-hover:to-indigo-500/20'}
                                transition-all duration-700`}>
                                  <div className="absolute inset-0 rounded-[2rem] bg-[#06030f]" />
                                </div>

                                {/* Holographic Scanline */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0">
                                  <div className="absolute inset-x-0 h-full w-full bg-gradient-to-b from-transparent via-white/[0.025] to-transparent animate-scanline"></div>
                                </div>

                                {/* Left accent bar */}
                                <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full z-10 transition-all duration-500
                                ${task.status === "Completed"
                                    ? 'bg-gradient-to-b from-emerald-400/80 to-emerald-600/20 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                    : 'bg-gradient-to-b from-pink-500/80 to-fuchsia-600/20 shadow-[0_0_12px_rgba(255,45,149,0.6)]'}`}
                                />

                                {/* Card inner */}
                                <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">

                                  {/* Top row: checkbox + status + node ID */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      {/* Checkbox */}
                                      <div className="relative h-5 w-5 flex-shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={selectedTasks.includes(task.id)}
                                          onChange={() => toggleSelection(task.id)}
                                          className="peer h-5 w-5 rounded-lg border-2 border-white/10 bg-black/40 text-pink-500 focus:ring-0 cursor-pointer appearance-none transition-all checked:bg-pink-600 checked:border-pink-600"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white opacity-0 peer-checked:opacity-100 transition-opacity scale-75">
                                          <CheckIcon />
                                        </div>
                                      </div>

                                      {/* Status pill */}
                                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 cursor-default
                                      ${task.status === "Completed"
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_14px_rgba(16,185,129,0.12)]"
                                          : "bg-pink-500/10 text-pink-400 border-pink-500/25 shadow-[0_0_14px_rgba(255,45,149,0.12)]"}`}
                                      >
                                        <span className={`h-1.5 w-1.5 rounded-full ${task.status === "Completed" ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,1)]" : "bg-pink-500 shadow-[0_0_6px_rgba(255,45,149,1)]"} animate-pulse`}></span>
                                        {task.status}
                                      </div>
                                    </div>

                                    {/* Node ID */}
                                    <span className="text-[9px] font-mono text-slate-700 tracking-widest uppercase opacity-40">
                                      #{task.id.slice(-4)}
                                    </span>
                                  </div>

                                  {/* Mobile Done Button - Absolute Corner */}
                                  <button
                                    onClick={() => toggleTaskStatus(task.id)}
                                    className={`sm:hidden absolute top-2.5 right-2.5 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-white text-[10px] font-black tracking-wider transition-all duration-300 active:scale-95 shadow-lg border ${task.status === "Completed"
                                        ? "bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400/20 shadow-amber-500/20"
                                        : "bg-gradient-to-r from-pink-600 to-fuchsia-600 border-pink-400/20 shadow-pink-500/20"
                                      }`}
                                  >
                                    <span className="scale-[0.75]">
                                      {task.status === "Completed" ? <UndoIcon /> : <CheckIcon />}
                                    </span>
                                    {task.status === "Completed" ? "Undo" : "Done"}
                                  </button>

                                  {/* Title */}
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className={`text-xl sm:text-2xl font-black tracking-tighter leading-tight uppercase italic break-words transition-all duration-700
                                    ${task.status === "Completed" ? "text-emerald-500/30 blur-[0.4px] select-none scale-95" : "text-white"}`}>
                                      {task.title}
                                    </div>
                                    {task.status === "Completed" && (
                                      <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black tracking-[0.25em] uppercase animate-in fade-in zoom-in-95 duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        Done
                                      </div>
                                    )}
                                  </div>

                                  {/* Description */}
                                  <div className={`text-[13px] sm:text-sm font-light leading-relaxed italic line-clamp-2 mb-5 transition-all duration-500
                                  ${task.status === "Completed" ? "text-slate-600" : "text-slate-400"}`}>
                                    {task.description || "No additional metadata recorded for this node."}
                                  </div>

                                  {/* ── MOBILE footer (< sm) ── */}
                                  <div className="sm:hidden flex flex-col gap-3">
                                    <div className="flex items-center justify-between pt-1">
                                      <div className="flex items-center gap-2">
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button onClick={() => setViewTask(task)} title="View" className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-indigo-500/20 border border-white/5 text-indigo-400 hover:text-white transition-all duration-300 active:scale-90 shadow-[0_0_15px_rgba(99,102,241,0.12)]">
                                          <EyeIcon />
                                        </button>
                                        <button onClick={() => startEdit(task)} title="Edit" className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-pink-500/20 border border-white/5 text-pink-500 hover:text-white transition-all duration-300 active:scale-90 shadow-[0_0_15px_rgba(255,45,149,0.12)]">
                                          <EditIcon />
                                        </button>
                                        <button onClick={() => deleteTask(task.id)} title="Delete" className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/5 text-rose-500 hover:text-white transition-all duration-300 active:scale-90 shadow-[0_0_15px_rgba(225,29,72,0.12)]">
                                          <TrashIcon />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── DESKTOP footer (sm+) ── */}
                                  <div className="hidden sm:flex items-center justify-between pt-4 border-t border-white/[0.04]">
                                    <div className="flex items-center gap-3">
                                    </div>
                                    <div className="hidden sm:flex items-center p-0.5 bg-white/[0.02] border border-white/20 rounded-2xl gap-0 transition-all hover:border-white/30">
                                      <button
                                        onClick={() => toggleTaskStatus(task.id)}
                                        title={task.status === "Completed" ? "Undo" : "Done"}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-white/[0.03] active:scale-95 whitespace-nowrap ${task.status === "Completed"
                                            ? "text-amber-500"
                                            : "text-emerald-400"
                                          }`}
                                      >
                                        <span className="scale-[0.8] block relative">
                                          {task.status === "Completed" ? <UndoIcon /> : <CheckIcon />}
                                        </span>
                                        <span className="text-[9px] font-black tracking-[0.1em]">
                                          {task.status === "Completed" ? "Undo" : "Done"}
                                        </span>
                                      </button>
                                      <div className="w-[1px] h-4 bg-white/20" />
                                      <button onClick={() => setViewTask(task)} title="View Info" className="p-2.5 hover:bg-white/[0.03] transition-all duration-300 text-indigo-400/60 hover:text-white active:scale-90">
                                        <span className="scale-[0.8] block relative"><EyeIcon /></span>
                                      </button>
                                      <div className="w-[1px] h-4 bg-white/20" />
                                      <button onClick={() => startEdit(task)} title="Edit Task" className="p-2.5 hover:bg-white/[0.03] transition-all duration-300 text-pink-500/60 hover:text-white active:scale-90">
                                        <span className="scale-[0.8] block relative"><EditIcon /></span>
                                      </button>
                                      <div className="w-[1px] h-4 bg-white/20" />
                                      <button onClick={() => deleteTask(task.id)} title="Delete Task" className="p-2.5 hover:bg-white/[0.03] transition-all duration-300 text-rose-500/60 hover:text-white active:scale-90">
                                        <span className="scale-[0.8] block relative"><TrashIcon /></span>
                                      </button>
                                    </div>
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

      {showProfileModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowProfileModal(false)}></div>
          <div className="bg-[#050510] border-2 border-pink-500/30 rounded-[3.5rem] p-12 sm:p-16 max-w-[420px] w-full text-center relative z-10 animate-in zoom-in-95 duration-500 shadow-[0_0_80px_rgba(255,45,149,0.1)]">

            <button onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all hover:rotate-90 duration-500 z-20 group">
              <div className="bg-white/5 p-3 rounded-full group-hover:bg-pink-500/10 border border-white/5 group-hover:border-pink-500/30 transition-all shadow-xl">
                <XIcon />
              </div>
            </button>

            {!isEditingProfile ? (
              <div className="flex flex-col items-center text-center space-y-10 relative z-10">
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-[2.8rem] bg-black border-2 border-pink-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(255,45,149,0.2)] relative group transition-transform duration-700 hover:scale-[1.02]">
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

                <div className="w-full pt-10 border-t border-white/5 grid grid-cols-1 gap-4">
                  <button
                    onClick={startProfileEdit}
                    className="w-full btn-premium-pink py-5 rounded-2xl text-[17px] font-bold tracking-tight flex items-center justify-center gap-3"
                  >
                    <EditIcon />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full btn-premium-glass py-5 rounded-2xl text-[17px] font-bold tracking-tight text-slate-300 border-white/10 hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center gap-3"
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
                    <label className="text-[11px] font-black tracking-wider text-slate-300 ml-1">First Name</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold text-sm"
                      value={editProfileData.firstName}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black tracking-wider text-slate-300 ml-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold text-sm"
                      value={editProfileData.lastName}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <label className="text-[11px] font-black tracking-wider text-slate-300 ml-1">Email Stream</label>
                  <input
                    type="email"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold text-sm"
                    value={editProfileData.email}
                    onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 w-full">
                  <label className="text-[11px] font-black tracking-wider text-slate-300 ml-1">Security Key (Leave blank to keep current)</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white/[0.08] focus:border-pink-500/30 transition-all font-bold text-sm"
                      value={editProfileData.password}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-500 transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4 w-full">
                  <button
                    type="submit"
                    className="btn-premium-pink py-3 rounded-xl text-xs font-black tracking-wider italic whitespace-nowrap overflow-hidden"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Syncing...' : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="btn-premium-glass py-3 rounded-xl text-xs font-black tracking-wider italic whitespace-nowrap overflow-hidden"
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
    </main>
  );
}