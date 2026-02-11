'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
  size: number;
  brightness: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: Star[] = [];
    const STAR_COUNT = 400;
    const SPEED = 0.1;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = (Math.random() - 0.5) * canvas.width * 3;
        const y = (Math.random() - 0.5) * canvas.height * 3;
        const z = Math.random() * 1000;
        stars.push({
          x,
          y,
          z,
          prevX: x,
          prevY: y,
          size: Math.random() * 1.5 + 0.5,
          brightness: Math.random() * 0.5 + 0.5,
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (const star of stars) {
        star.prevX = (star.x / star.z) * 200 + cx;
        star.prevY = (star.y / star.z) * 200 + cy;

        star.z -= SPEED;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 3;
          star.y = (Math.random() - 0.5) * canvas.height * 3;
          star.z = 1000;
          star.prevX = (star.x / star.z) * 200 + cx;
          star.prevY = (star.y / star.z) * 200 + cy;
        }

        const sx = (star.x / star.z) * 200 + cx;
        const sy = (star.y / star.z) * 200 + cy;
        const depth = 1 - star.z / 1000;
        // Cap alpha so stars stay subtle behind text
        const alpha = Math.min(depth * star.brightness, 0.25);
        const size = star.size * depth * 1.2;

        // Slight blue tint for closer stars
        const blue = Math.floor(200 + depth * 55);
        ctx.strokeStyle = `rgba(${180 + depth * 40}, ${200 + depth * 30}, ${blue}, ${alpha * 0.2})`;
        ctx.lineWidth = size * 0.4;
        ctx.beginPath();
        ctx.moveTo(star.prevX, star.prevY);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.fillStyle = `rgba(${180 + depth * 40}, ${200 + depth * 30}, ${blue}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    initStars();
    // Clear fully on first frame
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    animate();

    window.addEventListener('resize', () => {
      resize();
      initStars();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
