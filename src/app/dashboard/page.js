"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Overview from "@/components/dashboard/Overview";
import AddTask from "@/components/dashboard/AddTask";
import TaskList from "@/components/dashboard/TaskList";
import TaskViewModal from "@/components/dashboard/TaskViewModal";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";
import ProfileModal from "@/components/dashboard/ProfileModal";
import EditTaskModal from "@/components/dashboard/EditTaskModal";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userInfo, setUserInfo] = useState({ firstName: "", lastName: "", email: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Search & Refresh States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshTime = useRef(0);

  // Focus/UI States
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchTasks();
    const savedActivities = localStorage.getItem("taskzen_activities");
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities));
      } catch (e) {
        console.error("Failed to parse activities");
      }
    }
  }, []);

  // Debouncing Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Trigger fetch when debounced search changes
  useEffect(() => {
    if (loading && tasks.length === 0) return;
    fetchTasks(debouncedSearch);
  }, [debouncedSearch]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logActivity = (type, title) => {
    const newActivity = {
      id: Date.now(),
      type, // 'Added', 'Updated', 'Decommissioned', 'Synchronized'
      title,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, 10);
      localStorage.setItem("taskzen_activities", JSON.stringify(updated));
      return updated;
    });
  };


  const checkAuth = () => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split("; ");
      const userInfoCookie = cookies.find(row => row.startsWith("user_info="));
      if (!userInfoCookie) {
        router.push("/login");
        return;
      }
      try {
        const data = JSON.parse(decodeURIComponent(userInfoCookie.split("=")[1]));
        setUserInfo(data);
      } catch (e) {
        console.error("Session corrupt:", e);
        router.push("/login");
      }
    }
  };

  const fetchTasks = async (query = "") => {
    try {
      if (!isRefreshing && query === "" && tasks.length === 0) setLoading(true);
      const res = await fetch(`/api/tasks${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTasks(data || []);
      }
    } catch (err) {
      console.error("Failed to load registry:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 3000) return; 
    lastRefreshTime.current = now;
    
    setIsRefreshing(true);
    setSearch("");
    setDebouncedSearch("");
    fetchTasks();
    showToast("Registry Synchronized", "success");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      setActionLoading(true);
      setError("");
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        logActivity("Added", newTask.title);
        setActiveTab("list");
        showToast("Node Allocated Successfully", "success");
        return true;
      } else {
        const err = await res.json();
        setError(err.error || "Allocation failed");
        return false;
      }
    } catch (err) {
      setError("Connection failure");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      setActionLoading(true);
      setError("");
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...taskData } : t)));
        logActivity("Updated", taskData.title);
        setEditingTask(null);
        setActiveTab("list");
        showToast("Protocol Refined", "success");
        return true;
      } else {
        const err = await res.json();
        setError(err.error || "Update failed");
        return false;
      }
    } catch (err) {
      setError("Connection failure");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
        logActivity("Synchronized", task.title);
        showToast(`Node marked as ${newStatus}`, "success");
      }
    } catch (err) {
      console.error("Status update sync failed:", err);
    }
  };

  const requestDelete = (id) => {
    setTaskToDelete(id);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const taskTitle = tasks.find(t => t.id === taskToDelete)?.title || "Unknown Node";
    try {
      const res = await fetch(`/api/tasks/${taskToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete));
        logActivity("Purged", taskTitle);
        showToast("Node Decommissioned", "error");
      }
    } catch (err) {
      console.error("Node purge failed:", err);
    } finally {
      setTaskToDelete(null);
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
  };

  const stopEditing = () => {
    setEditingTask(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUserInfo(updatedUser);
    showToast("Profile Synced", "success");
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      userInfo={userInfo}
      onLogout={handleLogout}
      onProfileClick={() => setIsProfileModalOpen(true)}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%' }}
            className={`fixed bottom-12 left-1/2 z-[200] px-8 py-4 rounded-[2rem] backdrop-blur-[20px] border shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center gap-4 ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-500"}`}
          >
            <div className={`h-2 w-2 rounded-full animate-pulse ${toast.type === "success" ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"}`} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual Search & Tools */}
      {activeTab === "list" && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mb-12 flex gap-4"
        >
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-pink-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search neural registry sequences..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] backdrop-blur-[10px] border-2 border-white/10 rounded-[2.5rem] pl-16 pr-8 py-6 text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/40 transition-all font-bold italic text-lg shadow-inner"
            />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-8 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-[10px] border-2 border-white/10 transition-all shadow-lg active:scale-95 ${isRefreshing ? "text-pink-500 border-pink-500/30 bg-pink-500/10" : "text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.06]"}`}
            title="Refresh Sequence"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin" : "transition-transform group-hover:rotate-180"}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-4.4 3.6-8 8-8 3.3 0 6.2 2 7.4 4.9M22 12c0 4.4-3.6 8-8 8-3.3 0-6.2-2-7.4-4.9"></path></svg>
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative h-16 w-16 mb-4">
            <svg className="w-full h-full animate-spin" viewBox="0 0 224 224">
              <circle cx="112" cy="112" r="85" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="16" fill="transparent" />
              <circle cx="112" cy="112" r="85" stroke="url(#loader-grad)" strokeWidth="16" strokeDasharray="400" strokeDashoffset="150" fill="transparent" strokeLinecap="round" />
              <defs>
                <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff2d95" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Synchronizing Neural Pathway...</p>
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && <motion.div className="w-full" key="ov" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Overview tasks={tasks} activities={activities} /></motion.div>}
            {activeTab === "add" && <motion.div className="w-full flex justify-center" key="ad" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AddTask onTaskAdded={handleAddTask} onTaskUpdated={handleUpdateTask} initialData={editingTask} onCancel={stopEditing} actionLoading={actionLoading} error={error} /></motion.div>}
            {activeTab === "list" && <motion.div className="w-full" key="li" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><TaskList tasks={tasks} onToggleStatus={handleToggleStatus} onDeleteTask={requestDelete} onEditTask={startEditing} onViewTask={setViewingTask}/></motion.div>}
          </AnimatePresence>
        </div>
      )}

      {/* Overlays */}
      <TaskViewModal task={viewingTask} onClose={() => setViewingTask(null)} />
      <EditTaskModal
        task={editingTask}
        onClose={stopEditing}
        onTaskUpdated={handleUpdateTask}
        actionLoading={actionLoading}
        error={error}
      />
      <DeleteConfirmModal 
        isOpen={!!taskToDelete} 
        onConfirm={confirmDelete} 
        onCancel={() => setTaskToDelete(null)} 
      />
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        userInfo={userInfo}
        onUpdate={handleProfileUpdate}
      />
    </DashboardLayout>
  );
}
