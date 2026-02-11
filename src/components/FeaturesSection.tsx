'use client';

import { useReveal } from './useReveal';

const features = [
  {
    label: 'Max Supply',
    value: '25,000,000',
    unit: 'DLT',
    description: 'Hard-capped total supply. No inflation after all coins are mined.',
  },
  {
    label: 'Block Reward',
    value: '50',
    unit: 'DLT',
    description: 'Initial mining reward per block, with halving schedule.',
  },
  {
    label: 'Block Time',
    value: '~60',
    unit: 'seconds',
    description: 'Dynamic difficulty adjustment targets one-minute block intervals.',
  },
  {
    label: 'Consensus',
    value: 'SHA-256',
    unit: 'PoW',
    description: 'Proof-of-work mining using the SHA-256 hashing algorithm.',
  },
  {
    label: 'Signing',
    value: 'Dilithium',
    unit: 'Mode3',
    description: 'CRYSTALS-Dilithium post-quantum signatures — NIST standard, 192-bit quantum-safe security.',
  },
  {
    label: 'Network',
    value: 'P2P',
    unit: 'TCP',
    description: 'Decentralized peer-to-peer network with UPnP port mapping on port 9090.',
  },
];

export default function FeaturesSection() {
  const heading = useReveal();
  const grid = useReveal();

  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={heading.ref} className={`text-center mb-16 reveal ${heading.visible ? 'visible' : ''}`}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            Technical <span className="text-gradient-crystal">Specifications</span>
          </h2>
          <p className="text-space-600 max-w-2xl mx-auto">
            Every parameter carefully chosen. No bloat, no unnecessary complexity.
          </p>
        </div>

        <div
          ref={grid.ref}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger ${grid.visible ? 'visible' : ''}`}
        >
          {features.map((feat) => (
            <div key={feat.label} className="card-space p-6 group">
              <div className="text-xs font-mono text-crystal-600 uppercase tracking-widest mb-2">
                {feat.label}
              </div>
              <div className="font-heading text-2xl font-bold text-white mb-1">
                {feat.value}
                <span className="text-sm text-crystal-400 ml-2 font-normal">{feat.unit}</span>
              </div>
              <p className="text-space-600 text-sm leading-relaxed mt-2">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
