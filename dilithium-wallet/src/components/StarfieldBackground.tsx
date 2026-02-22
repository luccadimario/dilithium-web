import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const stars: Star[] = [];
    const COUNT = 300;
    const SPEED = 0.08;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < COUNT; i++) {
        const z = Math.random() * 1000;
        stars.push({
          x: (Math.random() - 0.5) * canvas!.width * 2,
          y: (Math.random() - 0.5) * canvas!.height * 2,
          z,
          pz: z,
        });
      }
    }

    function draw() {
      ctx!.fillStyle = "rgba(3, 7, 18, 0.15)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      const cx = canvas!.width / 2;
      const cy = canvas!.height / 2;

      for (const star of stars) {
        star.pz = star.z;
        star.z -= SPEED;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas!.width * 2;
          star.y = (Math.random() - 0.5) * canvas!.height * 2;
          star.z = 1000;
          star.pz = 1000;
          continue;
        }

        const sx = (star.x / star.z) * 100 + cx;
        const sy = (star.y / star.z) * 100 + cy;
        const px = (star.x / star.pz) * 100 + cx;
        const py = (star.y / star.pz) * 100 + cy;

        const depth = 1 - star.z / 1000;
        const alpha = Math.min(depth * 0.25, 0.25);
        const blue = Math.floor(100 + depth * 155);

        ctx!.strokeStyle = `rgba(${Math.floor(blue * 0.5)}, ${Math.floor(blue * 0.8)}, ${blue}, ${alpha * 0.5})`;
        ctx!.lineWidth = depth * 1.5;
        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.stroke();

        const size = depth * 2;
        ctx!.fillStyle = `rgba(${Math.floor(blue * 0.7)}, ${Math.floor(blue * 0.9)}, ${blue}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(sx, sy, size, 0, Math.PI * 2);
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();

    window.addEventListener("resize", () => {
      resize();
      initStars();
    });

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
