'use client';

import { useReveal } from './useReveal';

const highlights = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="#00bfef" strokeWidth="1.5" opacity="0.3" />
        <path d="M20 8L14 20l6 4 6-4L20 8z" fill="#00bfef" opacity="0.6" />
        <path d="M14 20l6 4 6-4L20 34z" fill="#0891b2" opacity="0.5" />
      </svg>
    ),
    title: 'Proof of Work',
    description:
      'Pure SHA-256 proof-of-work consensus. No staking, no delegation — security through computational energy.',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="4" width="32" height="32" rx="4" stroke="#00bfef" strokeWidth="1.5" opacity="0.3" />
        <text x="20" y="25" textAnchor="middle" fill="#00bfef" fontSize="14" fontFamily="monospace">25M</text>
      </svg>
    ),
    title: 'Fixed Supply',
    description:
      'Hard-capped at 25 million DLT. No inflation, no minting beyond the cap. Scarcity by design.',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="#00bfef" strokeWidth="1.5" opacity="0.3" />
        <path d="M12 20h5l3-8 4 16 3-8h5" stroke="#00bfef" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    title: 'Quantum-Safe Signatures',
    description:
      'Every transaction signed with CRYSTALS-Dilithium Mode3 — the NIST post-quantum standard. 192-bit quantum-safe security.',
  },
];

export default function AboutSection() {
  const heading = useReveal();
  const cards = useReveal();

  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={heading.ref} className={`text-center mb-16 reveal ${heading.visible ? 'visible' : ''}`}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            What is <span className="text-gradient-crystal">Dilithium</span>?
          </h2>
          <p className="text-space-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Inspired by the crystalline power source from Star Trek, Dilithium (DLT) is a
            proof-of-work cryptocurrency built entirely from scratch in Go. No forks, no
            copy-paste — a blockchain engineered from first principles.
          </p>
        </div>

        <div
          ref={cards.ref}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger ${cards.visible ? 'visible' : ''}`}
        >
          {highlights.map((item) => (
            <div key={item.title} className="card-space p-8 text-center">
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="font-heading text-lg font-semibold text-crystal-400 mb-3 tracking-wide">
                {item.title}
              </h3>
              <p className="text-space-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
