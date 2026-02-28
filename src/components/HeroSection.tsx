'use client';

import DilithiumCrystal from './DilithiumCrystal';
import WarpSpeedLines from './WarpSpeedLines';
import { useReveal } from './useReveal';

const stats = [
  { label: 'Max Supply', value: '25M', unit: 'DLT' },
  { label: 'Block Time', value: '~1', unit: 'MIN' },
  { label: 'Algorithm', value: 'SHA', unit: '256' },
];

export default function HeroSection() {
  const crystal = useReveal(0.1, { initiallyVisible: true });
  const text = useReveal(0.1, { initiallyVisible: true });
  const buttons = useReveal(0.1, { initiallyVisible: true });
  const statCards = useReveal(0.1, { initiallyVisible: true });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <WarpSpeedLines />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div ref={crystal.ref} className={`flex-shrink-0 reveal ${crystal.visible ? 'visible' : ''}`}>
            <DilithiumCrystal size={180} />
          </div>

          <div className="text-center lg:text-left flex-1">
            <div ref={text.ref} className={`reveal ${text.visible ? 'visible' : ''}`}>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black tracking-wider mb-4">
                <span className="text-gradient-crystal">DILITHIUM</span>
              </h1>
              <p className="font-heading text-lg sm:text-xl text-crystal-600 tracking-widest uppercase mb-6">
                Power the Next Frontier
              </p>
              <p className="text-space-600 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
                A proof-of-work cryptocurrency built from the ground up in Go.
                Fixed supply. SHA-256 mining. <a href="/quantum-safe" className="text-crystal-400 hover:text-crystal-300 transition-colors">Post-quantum Dilithium signatures</a>.
                No shortcuts, no compromise.
              </p>
            </div>

            <div
              ref={buttons.ref}
              className={`flex flex-wrap gap-4 justify-center lg:justify-start mb-12 reveal ${buttons.visible ? 'visible' : ''}`}
            >
              <a href="#get-started" className="btn-primary">
                Start Mining
              </a>
              <a href="/whitepaper" className="btn-secondary">
                Whitepaper
              </a>
            </div>

            <div
              ref={statCards.ref}
              className={`flex flex-wrap gap-4 justify-center lg:justify-start reveal ${statCards.visible ? 'visible' : ''}`}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="card-space px-6 py-4 text-center min-w-[120px]"
                >
                  <div className="font-heading text-2xl font-bold text-crystal-400">
                    {stat.value}
                    <span className="text-sm text-crystal-600 ml-1">{stat.unit}</span>
                  </div>
                  <div className="text-xs text-space-600 font-mono mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-space-950 to-transparent" />
    </section>
  );
}
