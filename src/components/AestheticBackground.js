"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

export default function AestheticBackground() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });
  const background = useMotionTemplate`radial-gradient(circle at ${springX}px ${springY}px, rgba(255, 45, 149, 0.15) 0%, transparent 60%)`;

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 z-0 bg-[#02000d] overflow-hidden pointer-events-none">
      {/* Interactive Spotlight */}
      <motion.div
        className="absolute inset-0 z-10 opacity-40 transition-opacity duration-1000"
        style={{
          background: background
        }}
      />

      {/* Deep Aurora Blobs - Intentionally Static to prevent GPU bottlenecking */}
      <div className="absolute top-[-15%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-pink-600/10 blur-[120px] mix-blend-screen" />

      <div className="absolute bottom-[-15%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-indigo-600/10 blur-[140px] mix-blend-screen" />

      <div className="absolute top-[25%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-500/5 blur-[100px] mix-blend-overlay" />

      {/* Realistic Soft Stars / Particles removed to prevent heavy DOM rendering lag, gracefully handled by GalaxyBackground now */}

      {/* Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,0,13,0.4)_70%,rgba(2,0,13,0.8)_100%)]"></div>

      {/* Subtle Grain Texture for realism */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Horizontal Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.01)_50%,transparent_100%)] bg-[size:100%_4px] pointer-events-none"></div>
    </div>
  );
}
