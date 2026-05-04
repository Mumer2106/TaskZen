"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AestheticBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#02000d] overflow-hidden pointer-events-none">
      {/* Interactive Spotlight */}
      <div 
        className="absolute inset-0 z-10 opacity-40 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 45, 149, 0.15) 0%, transparent 60%)`
        }}
      />

      {/* Deep Aurora Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, 20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-15%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-pink-600/10 blur-[120px] mix-blend-screen"
      />
      
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -40, 0],
          y: [0, -30, 0],
          rotate: [0, -8, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-15%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-indigo-600/10 blur-[140px] mix-blend-screen"
      />

      <motion.div
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[25%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-500/5 blur-[100px] mix-blend-overlay"
      />

      {/* Realistic Soft Stars / Particles */}
      <div className="absolute inset-0 z-0">
        {mounted && [...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white shadow-[0_0_15px_white]"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.4 + 0.1,
            }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

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
