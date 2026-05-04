"use client";

import { useEffect, useRef } from "react";

export default function GalaxyBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let stars = [];
    let planets = [];
    const numStars = 250;
    const numPlanets = 3;

    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height / 2;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initUniverse();
    };

    window.addEventListener("resize", resize);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Star {
      constructor() {
        this.reset();
        // Randomize initial position
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.size = Math.random() * 1.2 + 0.1;
        this.opacity = Math.random() * 0.6 + 0.1;
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
        this.twinkleSpeed = Math.random() * 0.005 + 0.002;
        
        // Realistic star temperatures
        const colors = [
          "rgba(255, 255, 255, ", // White
          "rgba(200, 230, 255, ", // Light Blue (Hot)
          "rgba(255, 240, 200, ", // Pale Yellow (Sun-like)
          "rgba(255, 200, 180, ", // Light Red (Cool)
          "rgba(255, 45, 149, ",  // TaskZen Branded Pink
        ];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.opacity += this.twinkleDir * this.twinkleSpeed;
        if (this.opacity > 0.8 || this.opacity < 0.1) {
          this.twinkleDir *= -1;
        }

        // Very slow parallax drift
        this.x += 0.01;
        if (this.x > canvas.width) this.x = 0;
      }

      draw() {
        ctx.fillStyle = `${this.colorBase}${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    class Planet {
      constructor(index) {
        this.radius = Math.random() * 40 + 15;
        // Positioned in different "zones"
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speedX = (Math.random() - 0.5) * 0.04;
        this.speedY = (Math.random() - 0.5) * 0.04;
        
        // Variety of planetary looks
        const varieties = [
          { color: "#ff2d95", type: "gas" },     // Pink Giant
          { color: "#6b5bff", type: "ice" },     // Purple Ice
          { color: "#4f46e5", type: "terrestrial" }, // Deep Blue 
          { color: "#be185d", type: "rock" }      // Dark Rose
        ];
        const v = varieties[index % varieties.length];
        this.color = v.color;
        this.type = v.type;
        this.hasRings = Math.random() > 0.6;
        this.ringAngle = (Math.random() - 0.5) * 0.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < -200) this.x = canvas.width + 200;
        if (this.x > canvas.width + 200) this.x = -200;
        if (this.y < -200) this.y = canvas.height + 200;
        if (this.y > canvas.height + 200) this.y = -200;
      }

      draw() {
        // Draw Rings (Behind)
        if (this.hasRings) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, this.radius * 2.4, this.radius * 0.7, this.ringAngle, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Realistic 3D Gradient Sphere
        const grad = ctx.createRadialGradient(
          this.x - this.radius * 0.3,
          this.y - this.radius * 0.3,
          this.radius * 0.1,
          this.x,
          this.y,
          this.radius
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        grad.addColorStop(0.4, this.color);
        grad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Atmospheric Halo
        const halo = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.radius * 1.4);
        halo.addColorStop(0, `${this.color}1a`);
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Rings (Front part to create depth)
        if (this.hasRings) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, this.radius * 2.2, this.radius * 0.6, this.ringAngle, 0, Math.PI);
          ctx.stroke();
        }
      }
    }

    const initUniverse = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
      }
      planets = [];
      for (let i = 0; i < numPlanets; i++) {
        planets.push(new Planet(i));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Cosmic Dust (Nebulae)
      const drawNebula = (x, y, radius, color) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(2, 0, 13, 0)");
        ctx.fillStyle = g;
        ctx.globalCompositeOperation = "screen";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
      };

      drawNebula(centerX(), centerY(), 1000, "rgba(107, 91, 255, 0.03)");

      stars.forEach(s => {
        s.update();
        s.draw();
      });

      planets.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    initUniverse();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] opacity-70"
    />
  );
}
