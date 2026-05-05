"use client";

import { useEffect, useRef } from "react";

/**
 * Enhanced NexusBackground - A high-fidelity, interactive background animation
 * Features dynamic aurora color blobs, a neural connection network, 
 * cursor spotlight interaction, and high-performance cinematic overlays.
 */
export default function NexusBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    let animationFrameId;
    
    // Configuration
    const particleCount = 65;
    const connectionDistance = 180;
    const blobCount = 4;
    
    let particles = [];
    let blobs = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    resize();

    class Blob {
      constructor() {
        this.init();
      }
      init() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.radius = Math.random() * 400 + 300;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.color = Math.random() > 0.5 ? "rgba(255, 45, 149, 0.07)" : "rgba(107, 91, 255, 0.07)";
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.radius) this.x = window.innerWidth + this.radius;
        if (this.x > window.innerWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = window.innerHeight + this.radius;
        if (this.y > window.innerHeight + this.radius) this.y = -this.radius;
      }
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, "rgba(2, 0, 13, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class Particle {
      constructor() {
        this.init();
      }
      init() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.color = Math.random() > 0.7 ? "#ff2d95" : "#6b5bff";
        this.pulse = Math.random() * Math.PI;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;
        if (this.x > window.innerWidth) this.x = 0;
        else if (this.x < 0) this.x = window.innerWidth;
        if (this.y > window.innerHeight) this.y = 0;
        else if (this.y < 0) this.y = window.innerHeight;
      }
      draw() {
        const opacity = 0.1 + Math.abs(Math.sin(this.pulse)) * 0.4;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
      blobs = [];
      for (let i = 0; i < blobCount; i++) blobs.push(new Blob());
    };

    const animate = () => {
      // Clear background
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#02000d";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw aurora blobs for depth
      blobs.forEach(b => {
        b.update();
        b.draw();
      });

      // Interactive Spotlight
      const mouse = mouseRef.current;
      const spotlightGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 500);
      spotlightGrad.addColorStop(0, "rgba(255, 45, 149, 0.06)");
      spotlightGrad.addColorStop(0.5, "rgba(107, 91, 255, 0.02)");
      spotlightGrad.addColorStop(1, "rgba(2, 0, 13, 0)");
      ctx.fillStyle = spotlightGrad;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw neural connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.2;
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw local reactive connections (mouse to particles)
      particles.forEach(p => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
            ctx.globalAlpha = (1 - dist / 180) * 0.25;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#02000d]">
      <canvas ref={canvasRef} className="block" />
      
      {/* Texture Layer - Cinematic Noise */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
      
      {/* Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,0,13,0.4)_100%)] pointer-events-none" />
      
      {/* Horizontal Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.01)_50%,transparent_100%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />
    </div>
  );
}
