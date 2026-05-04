"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileModal({ isOpen, onClose, userInfo, onUpdate }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync with userInfo when modal opens and handle scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (userInfo) {
        setFormData({
          firstName: userInfo.firstName || "",
          lastName: userInfo.lastName || "",
          email: userInfo.email || "",
          currentPassword: userInfo.password || "",
          newPassword: ""
        });
        
        // Fetch full profile dynamically to ensure live password is shown
        fetch('/api/user/me')
          .then(res => res.json())
          .then(data => {
            if (data?.user?.password) {
              setFormData(prev => ({ ...prev, currentPassword: data.user.password }));
            }
          })
          .catch(err => console.error("Failed to sync profile:", err));
          
        setShowCurrentPassword(false);
        setShowNewPassword(false);
      }
      setError("");
      setSuccess("");
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, userInfo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.email, // API uses username as email
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Neural parameters updated successfully");
        onUpdate(data.user);
        setTimeout(() => {
          onClose();
          setSuccess("");
          setFormData(prev => ({ ...prev, currentPassword: data.user.password || formData.newPassword || prev.currentPassword, newPassword: "" }));
        }, 1500);
      } else {
        setError(data.error || "Update sequence failed");
      }
    } catch (err) {
      setError("Connection to neural core lost");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] overflow-y-auto custom-scrollbar">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#02000d]/80 backdrop-blur-xl"
        />

        {/* Modal Content Wrapper */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-visible"
          >
            {/* Header */}
            <div className="px-8 py-10 border-b border-white/5 relative bg-white/[0.02] rounded-t-[2.5rem] overflow-visible">
            <div className="absolute top-0 left-12 w-32 h-1.5 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full shadow-[0_0_15px_rgba(255,45,149,0.5)]" />
            <h2 className="text-3xl font-black text-white tracking-[0.1em] leading-normal pr-[0.3em] -mr-[0.3em] overflow-visible">Identity Configuration</h2>
            <p className="text-pink-500/80 text-[11px] font-black tracking-[0.4em] mt-3 drop-shadow-[0_0_8px_rgba(255,45,149,0.3)]">Modify Neural Operator Parameters</p>
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-10 right-8 h-12 w-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-slate-500 transition-colors shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-4 rounded-2xl text-[11px] font-black tracking-widest text-center shadow-[0_0_20px_rgba(244,63,94,0.1)]"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-4 rounded-2xl text-[11px] font-black tracking-widest text-center shadow-[0_0_20_rgba(52,211,153,0.1)]"
              >
                {success}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-300 tracking-[0.3em] ml-4 block drop-shadow-sm">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name"
                  className="w-full bg-white/[0.04] border-2 border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/40 transition-all font-normal placeholder:text-slate-700 text-lg shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-300 tracking-[0.3em] ml-4 block drop-shadow-sm">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last Name"
                  className="w-full bg-white/[0.04] border-2 border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/40 transition-all font-normal placeholder:text-slate-700 text-lg shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black text-slate-300 tracking-[0.3em] ml-4 block drop-shadow-sm">EmailAddress</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@neural-link.com"
                className="w-full bg-white/[0.04] border-2 border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/40 transition-all font-normal placeholder:text-slate-700 text-lg shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 relative group">
                <label className="text-[12px] font-black text-slate-300 tracking-[0.3em] ml-4 block drop-shadow-sm">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    readOnly
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border-2 border-white/5 rounded-2xl pl-6 pr-14 py-5 text-zinc-400 focus:outline-none transition-all font-normal placeholder:text-slate-700 text-lg shadow-inner cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-4 flex items-center justify-center h-full text-slate-500 hover:text-pink-500 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3 relative group">
                <label className="text-[12px] font-black text-slate-300 tracking-[0.3em] ml-4 block drop-shadow-sm">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full bg-white/[0.04] border-2 border-white/5 rounded-2xl pl-6 pr-14 py-5 text-white focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/40 transition-all font-normal placeholder:text-slate-700 text-lg shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-4 flex items-center justify-center h-full text-slate-500 hover:text-pink-500 transition-colors"
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-5 rounded-2xl bg-white/5 border-2 border-white/5 text-slate-500 font-black hover:bg-white/10 hover:text-white transition-all tracking-[0.1em] text-[13px] active:scale-95"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-black hover:scale-[1.02] active:scale-95 shadow-[0_15px_40px_rgba(255,45,149,0.3)] transition-all tracking-[0.1em] text-[13px] flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    Update Protocol
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Decorative Footer */}
          <div className="px-8 py-5 bg-white/[0.01] border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-600 tracking-[0.2em] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Neural Protocol: Active
            </span>
            <span className="text-[10px] font-black text-slate-600 tracking-[0.2em] opacity-40">SysRef: {new Date().getTime().toString().slice(-8)}</span>
          </div>
        </motion.div>
      </div>
    </div>
  </AnimatePresence>
  );
}
