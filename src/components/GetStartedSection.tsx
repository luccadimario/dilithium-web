'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReveal } from './useReveal';

const RELEASES_URL = 'https://github.com/luccadimario/dilithiumcoin/releases/latest';

const platforms = [
  { label: 'macOS (Apple Silicon)', suffix: 'darwin-arm64' },
  { label: 'macOS (Intel)', suffix: 'darwin-amd64' },
  { label: 'Linux x86_64', suffix: 'linux-amd64' },
  { label: 'Linux ARM64', suffix: 'linux-arm64' },
  { label: 'Windows x86_64', suffix: 'windows-amd64', ext: '.exe' },
];

const steps = [
  {
    number: '01',
    title: 'Download',
    description: 'Download pre-built binaries for your platform from GitHub Releases.',
    hasDownload: true,
    commands: [] as string[],
  },
  {
    number: '02',
    title: 'Create Wallet',
    description: 'Generate a CRYSTALS-Dilithium keypair for your wallet.',
    commands: ['./dilithium-cli wallet create'],
  },
  {
    number: '03',
    title: 'Run a Node or Start Mining',
    description: 'Run a standalone node to support the network, or use the miner which automatically launches an embedded node.',
    commands: [
      './dilithium --port 1701 --api-port 8001',
      './dilithium-miner --miner <your-address>',
    ],
  },
  {
    number: '04',
    title: 'Send DLT',
    description: 'Transfer Dilithium to any address on the network.',
    commands: ['./dilithium-cli send --to <address> --amount 10'],
  },
];

export default function GetStartedSection() {
  const heading = useReveal();
  const list = useReveal();
  const [showSource, setShowSource] = useState(false);

  return (
    <section id="get-started" className="relative py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={heading.ref} className={`text-center mb-16 reveal ${heading.visible ? 'visible' : ''}`}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            Get <span className="text-gradient-crystal">Started</span>
          </h2>
          <p className="text-space-600 max-w-2xl mx-auto">
            From zero to mining in four steps. Download the binaries and go.
          </p>
        </div>

        <div
          ref={list.ref}
          className={`space-y-6 reveal-stagger ${list.visible ? 'visible' : ''}`}
        >
          {steps.map((step) => (
            <div key={step.number} className="card-space p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center font-heading text-lg font-bold text-crystal-400">
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold text-white mb-2 tracking-wide">
                  {step.title}
                </h3>
                <p className="text-space-600 text-sm mb-3">{step.description}</p>

                {'hasDownload' in step && step.hasDownload ? (
                  <div className="space-y-4">
                    <a
                      href={RELEASES_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 hover:border-crystal-500/50 transition-all text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                      </svg>
                      Download from GitHub Releases
                    </a>

                    <div className="flex flex-wrap gap-2">
                      {platforms.map((p) => (
                        <span
                          key={p.suffix}
                          className="inline-block px-2.5 py-1 rounded text-xs font-mono bg-space-800 border border-space-700 text-space-500"
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>

                    <div>
                      <button
                        onClick={() => setShowSource(!showSource)}
                        className="text-space-500 hover:text-space-400 text-xs flex items-center gap-1 transition-colors"
                      >
                        <svg
                          className={`w-3 h-3 transition-transform ${showSource ? 'rotate-90' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        Or build from source
                      </button>
                      <AnimatePresence>
                        {showSource && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-2">
                              {[
                                'git clone https://github.com/luccadimario/dilithiumcoin.git',
                                'cd Dilithium && ./build.sh',
                              ].map((cmd, i) => (
                                <div
                                  key={i}
                                  className="bg-space-950 border border-space-700 rounded-lg px-4 py-2 font-mono text-sm text-crystal-400 overflow-x-auto"
                                >
                                  <span className="text-nebula-500 mr-2">$</span>
                                  {cmd}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {step.commands.map((cmd, i) => (
                      <div
                        key={i}
                        className="bg-space-950 border border-space-700 rounded-lg px-4 py-2 font-mono text-sm text-crystal-400 overflow-x-auto"
                      >
                        <span className="text-nebula-500 mr-2">$</span>
                        {cmd}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
