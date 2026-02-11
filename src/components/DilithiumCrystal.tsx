'use client';

import { motion } from 'framer-motion';

interface DilithiumCrystalProps {
  size?: number;
  className?: string;
}

export default function DilithiumCrystal({ size = 200, className = '' }: DilithiumCrystalProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 200 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-pulse-glow"
      >
        <defs>
          <linearGradient id="crystalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00bfef" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="crystalGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0e7490" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="crystalGrad3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00bfef" stopOpacity="0.8" />
          </linearGradient>
          <filter id="crystalGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow */}
        <ellipse cx="100" cy="140" rx="60" ry="80" fill="#00bfef" opacity="0.08" filter="url(#crystalGlow)" />

        {/* Main crystal body — top half */}
        <polygon
          points="100,10 60,100 100,130 140,100"
          fill="url(#crystalGrad1)"
          stroke="#22d3ee"
          strokeWidth="0.5"
          strokeOpacity="0.5"
        />

        {/* Main crystal body — bottom half */}
        <polygon
          points="60,100 100,130 140,100 100,270"
          fill="url(#crystalGrad2)"
          stroke="#22d3ee"
          strokeWidth="0.5"
          strokeOpacity="0.5"
        />

        {/* Left facet */}
        <polygon
          points="100,10 60,100 100,130"
          fill="url(#crystalGrad3)"
          opacity="0.4"
        />

        {/* Right facet highlight */}
        <polygon
          points="100,10 140,100 100,130"
          fill="#22d3ee"
          opacity="0.15"
        />

        {/* Center line */}
        <line x1="100" y1="10" x2="100" y2="270" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />

        {/* Internal refraction lines */}
        <line x1="75" y1="60" x2="125" y2="120" stroke="#22d3ee" strokeWidth="0.3" opacity="0.4" />
        <line x1="125" y1="60" x2="75" y2="120" stroke="#22d3ee" strokeWidth="0.3" opacity="0.3" />
        <line x1="80" y1="140" x2="120" y2="200" stroke="#00bfef" strokeWidth="0.3" opacity="0.3" />

        {/* Sparkle highlights */}
        <circle cx="90" cy="50" r="2" fill="white" opacity="0.8" filter="url(#innerGlow)" />
        <circle cx="110" cy="80" r="1.5" fill="white" opacity="0.6" />
        <circle cx="95" cy="110" r="1" fill="white" opacity="0.5" />
      </svg>
    </motion.div>
  );
}
