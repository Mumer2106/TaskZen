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
  const [userInfo, setUserInfo] = useState({ id: "", firstName: "", lastName: "", email: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalNodes, setTotalNodes] = useState(0);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const PAGE_SIZE = 5;

  // Refs for state tracking and avoiding race conditions
  const isInitialMount = useRef(true);
  const fetchedSearch = useRef("");
  const lastRefreshTime = useRef(0);

  // Search & Refresh States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Focus/UI States
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  // Multi-select States
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const router = useRouter();

  // Load activities when userInfo is available
  useEffect(() => {
    if (userInfo?.id) {
      const savedActivities = localStorage.getItem(`taskzen_activities_${userInfo.id}`);
      if (savedActivities) {
        try {
          setActivities(JSON.parse(savedActivities));
        } catch (e) {
          console.error("Failed to parse activities");
        }
      } else {
        setActivities([]); // Clear activities if none found for this user
      }
    }
  }, [userInfo]);

  useEffect(() => {
    checkAuth();
    // Initial fetch handled by debouncedSearch effect or manually here if needed
    // But since debouncedSearch starts empty, we can just call it once.
    if (debouncedSearch === "") {
        fetchTasks("", 0, false);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'taskzen_registry_sync') {
        fetchTasks(debouncedSearch, 0, false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Only run once on mount

  // ── Heartbeat: keep user marked as "online" in the system ──────────────────
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch('/api/user/heartbeat', { method: 'POST' }).catch(() => {});
    };
    sendHeartbeat(); // fire immediately on mount
    const interval = setInterval(sendHeartbeat, 15000); // then every 15s
    return () => clearInterval(interval);
  }, []);

  // Debouncing Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to page 1 when search changes (skipping initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (loading || fetchedSearch.current === debouncedSearch || debouncedSearch === "") return;

    fetchedSearch.current = debouncedSearch;
    setOffset(0);
    fetchTasks(debouncedSearch, 0, false);
  }, [debouncedSearch]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

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
      if (userInfo?.id) {
        localStorage.setItem(`taskzen_activities_${userInfo.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };


  const checkAuth = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUserInfo({
        id: data.user.id || '',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        email: data.user.email || '',
        role: data.user.role || 'user',
        profilePic: data.user.profilePic || null,
      });
    } catch (e) {
      console.error("Auth check failed:", e);
      router.push('/login');
    }
  };

  const fetchTasks = async (query = "", currentOffset = 0, append = false) => {
    try {
      if (!isRefreshing && query === "" && tasks.length === 0 && !append) setLoading(true);
      if (append) setActionLoading(true);

      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: String(currentOffset),
      });
      if (query) params.set('search', query);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => append ? [...prev, ...data.tasks] : data.tasks);
        setHasMore(data.hasMore);
        setTotalNodes(data.total);
        setStats(data.stats || { total: 0, completed: 0, pending: 0 });
        setOffset(currentOffset);
        // Sync ref with current search if successful
        fetchedSearch.current = query;
      }
    } catch (err) {
      console.error("Failed to load registry:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setActionLoading(false);
    }
  };

  const handleShowMore = async () => {
    const nextOffset = offset + PAGE_SIZE;
    await fetchTasks(debouncedSearch, nextOffset, true);
  };

  const handleHide = () => {
    setTasks(prev => prev.slice(0, PAGE_SIZE));
    setOffset(0);
    setHasMore(true); // If we could show more before, we can show more now
  };

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 3000) return;
    lastRefreshTime.current = now;

    setIsRefreshing(true);
    setSearch("");
    setDebouncedSearch("");
    setSelectedIds(new Set());
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
        // Broadcast change to other tabs
        localStorage.setItem('taskzen_registry_sync', Date.now());
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
      const res = await fetch(`/api/tasks?id=${id}`, {
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
        // Broadcast change to other tabs
        localStorage.setItem('taskzen_registry_sync', Date.now());
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
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const newStatus = task.status === "Completed" ? "Pending" : "Completed";

      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
        logActivity(newStatus === "Completed" ? "Completed" : "Reactivated", task.title);
        localStorage.setItem('taskzen_registry_sync', Date.now());
      }
    } catch (err) {
      console.error("Toggle status failed:", err);
    }
  };

  const requestDelete = (id) => {
    setTaskToDelete(id);
  };

  const confirmDelete = async () => {
    const id = taskToDelete;
    if (!id) return;

    if (id === "BULK") {
      if (selectedIds.size === 0) return;
      try {
        setBulkDeleting(true);
        const res = await fetch("/api/tasks?id=BULK", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });

        if (res.ok) {
          setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)));
          setSelectedIds(new Set());
          logActivity("Decommissioned", "Bulk Operation");
          showToast("Nodes Purged Successfully");
          localStorage.setItem('taskzen_registry_sync', Date.now());
        }
      } catch (err) {
        console.error("Bulk delete failed:", err);
      } finally {
        setBulkDeleting(false);
      }
      return;
    }

    try {
      const task = tasks.find((t) => t.id === id);
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (task) logActivity("Decommissioned", task.title);
        showToast("Node Purged Successfully");
        localStorage.setItem('taskzen_registry_sync', Date.now());
      }
    } catch (err) {
      console.error("Delete failed:", err);
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

  const toggleSelectId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(tasks.map(t => t.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || bulkDeleting) return;
    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      const res = await fetch('/api/tasks?id=BULK', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
        ids.forEach(id => {
          const title = tasks.find(t => t.id === id)?.title || 'Node';
          logActivity('Purged', title);
        });
        showToast(`${ids.length} Node${ids.length > 1 ? 's' : ''} Decommissioned`, 'error');
        setSelectedIds(new Set());
        // Broadcast change to other tabs
        localStorage.setItem('taskzen_registry_sync', Date.now());
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setBulkDeleting(false);
    }
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
            {activeTab === "overview" && <motion.div className="w-full" key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Overview tasks={tasks} stats={stats} activities={activities} /></motion.div>}
            {activeTab === "add" && <motion.div className="w-full flex justify-center" key="ad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AddTask onTaskAdded={handleAddTask} onTaskUpdated={handleUpdateTask} initialData={editingTask} onCancel={stopEditing} actionLoading={actionLoading} error={error} /></motion.div>}
            {activeTab === "list" && (
              <motion.div className="w-full" key="li" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TaskList
                  tasks={tasks}
                  onToggleStatus={handleToggleStatus}
                  onDeleteTask={requestDelete}
                  onEditTask={startEditing}
                  onViewTask={setViewingTask}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelectId}
                  hasMore={hasMore}
                  onShowMore={handleShowMore}
                  onHide={handleHide}
                  isLoadingMore={actionLoading}
                  search={search}
                  onSearchChange={setSearch}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                />
              </motion.div>
            )}
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
        count={taskToDelete === "BULK" ? selectedIds.size : 1}
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
