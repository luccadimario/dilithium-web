'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';

const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Features', href: '/#features' },
  { label: 'Get Started', href: '/#get-started' },
  { label: 'Roadmap', href: '/#roadmap' },
  { label: 'Quantum-Safe', href: '/quantum-safe' },
  { label: 'Explorer', href: '/explorer' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    // Slide in after mount
    requestAnimationFrame(() => setShow(true));
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl',
        scrolled
          ? 'bg-space-950/80 border-b border-crystal-500/10'
          : 'bg-space-950/0 border-b border-transparent',
        show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <svg width="28" height="38" viewBox="0 0 200 280" fill="none" className="opacity-90">
              <polygon points="100,10 60,100 100,130 140,100" fill="#00bfef" opacity="0.9" />
              <polygon points="60,100 100,130 140,100 100,270" fill="#0891b2" opacity="0.8" />
            </svg>
            <span className="font-heading text-lg font-bold tracking-wider text-gradient-crystal">
              DILITHIUM
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-space-600 hover:text-crystal-400 transition-colors font-mono tracking-wide"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/luccadimario/dilithiumcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !py-2 !px-4 !text-xs"
            >
              GitHub
            </a>
          </div>

          <button
            className="md:hidden text-crystal-400 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-space-950/95 backdrop-blur-xl border-b border-crystal-500/10">
          <div className="px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-space-600 hover:text-crystal-400 transition-colors font-mono py-2"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/luccadimario/dilithiumcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !py-2 !px-4 !text-xs w-fit"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
