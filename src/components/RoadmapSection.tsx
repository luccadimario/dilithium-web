'use client';

import clsx from 'clsx';
import { useReveal } from './useReveal';

type PhaseItem = { label: string; done?: boolean };

const phases = [
  {
    phase: 'Phase 1',
    title: 'Genesis',
    status: 'done' as const,
    items: [
      { label: 'Core blockchain implementation in Go' },
      { label: 'SHA-256 proof-of-work consensus' },
      { label: 'CRYSTALS-Dilithium post-quantum signing' },
      { label: 'P2P networking with UPnP' },
      { label: 'CLI wallet and miner tools' },
    ] as PhaseItem[],
  },
  {
    phase: 'Phase 2',
    title: 'Network Growth',
    status: 'done' as const,
    items: [
      { label: 'Seed node infrastructure' },
      { label: 'Block explorer' },
      { label: 'Improved peer discovery' },
      { label: 'Network stability hardening' },
      { label: 'REST API for integrations' },
      { label: 'Transaction fee system' },
      { label: 'Bitcoin-style peer scoring' },
      { label: 'Chain reorganization support' },
      { label: 'Mining pool support' },
    ] as PhaseItem[],
  },
  {
    phase: 'Phase 3',
    title: 'Ecosystem',
    status: 'in-progress' as const,
    items: [
      { label: 'Desktop wallet application', done: true },
      { label: 'Developer documentation' },
      { label: 'Smart contract exploration' },
      { label: 'Community governance framework' },
    ] as PhaseItem[],
  },
  {
    phase: 'Phase 4',
    title: 'Warp Speed',
    status: 'upcoming' as const,
    items: [
      { label: 'Cross-chain bridges' },
      { label: 'Mobile wallet' },
      { label: 'DApp platform' },
      { label: 'Exchange listings' },
      { label: 'Global node network' },
    ] as PhaseItem[],
  },
];

export default function RoadmapSection() {
  const heading = useReveal();
  const grid = useReveal();

  return (
    <section id="roadmap" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={heading.ref} className={`text-center mb-16 reveal ${heading.visible ? 'visible' : ''}`}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            <span className="text-gradient-crystal">Roadmap</span>
          </h2>
          <p className="text-space-600 max-w-2xl mx-auto">
            Our journey from genesis block to galactic-scale infrastructure.
          </p>
        </div>

        <div
          ref={grid.ref}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 reveal-stagger ${grid.visible ? 'visible' : ''}`}
        >
          {phases.map((phase) => (
            <div
              key={phase.phase}
              className={clsx(
                'card-space p-6 relative overflow-hidden',
                phase.status === 'done' && 'border-crystal-500/30',
                phase.status === 'in-progress' && 'border-nebula-500/30'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    phase.status === 'done' && 'bg-crystal-400',
                    phase.status === 'in-progress' && 'bg-nebula-400 animate-pulse',
                    phase.status === 'upcoming' && 'bg-space-600'
                  )}
                />
                <span
                  className={clsx(
                    'text-xs font-mono uppercase tracking-widest',
                    phase.status === 'done' && 'text-crystal-400',
                    phase.status === 'in-progress' && 'text-nebula-400',
                    phase.status === 'upcoming' && 'text-space-600'
                  )}
                >
                  {phase.status === 'done'
                    ? 'Complete'
                    : phase.status === 'in-progress'
                    ? 'In Progress'
                    : 'Upcoming'}
                </span>
              </div>

              <div className="text-xs font-mono text-crystal-600 uppercase tracking-widest mb-1">
                {phase.phase}
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4 tracking-wide">
                {phase.title}
              </h3>

              <ul className="space-y-2">
                {phase.items.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-sm text-space-600">
                    <span
                      className={clsx(
                        'mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0',
                        (phase.status === 'done' || item.done) ? 'bg-crystal-500' : 'bg-space-700'
                      )}
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
