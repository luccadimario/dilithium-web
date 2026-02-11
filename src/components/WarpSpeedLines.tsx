'use client';

import { useState, useEffect } from 'react';

interface WarpLine {
  id: number;
  top: string;
  left: string;
  width: string;
  height: string;
  delay: string;
  duration: string;
  opacity: number;
}

// Deterministic pseudo-random using a seed
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateLines(): WarpLine[] {
  const rand = seededRandom(42);
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: `${rand() * 100}%`,
    left: `${rand() * 20 - 10}%`,
    width: `${rand() * 150 + 50}px`,
    height: `${rand() * 1.5 + 0.5}px`,
    delay: `${rand() * 4}s`,
    duration: `${rand() * 2 + 1}s`,
    opacity: rand() * 0.3 + 0.05,
  }));
}

const lines = generateLines();

export default function WarpSpeedLines() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((line) => (
        <div
          key={line.id}
          className="absolute rounded-full"
          style={{
            top: line.top,
            left: line.left,
            width: line.width,
            height: line.height,
            background: `linear-gradient(90deg, transparent, rgba(0, 191, 239, ${line.opacity}), transparent)`,
            animation: `warp-speed ${line.duration} linear ${line.delay} infinite`,
            animationFillMode: 'backwards',
          }}
        />
      ))}
    </div>
  );
}
