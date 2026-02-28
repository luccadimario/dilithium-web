'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StarfieldBackground from '@/components/StarfieldBackground';
import { useReveal } from '@/components/useReveal';

const comparisonRows = [
  { label: 'Security Basis', rsa: 'Integer factorization', dilithium: 'Lattice problems (Module-LWE)' },
  { label: 'Quantum Resistant', rsa: 'No — broken by Shor\'s algorithm', dilithium: 'Yes — NIST PQC standard (2024)' },
  { label: 'Key Generation', rsa: '~150 ms (2048-bit)', dilithium: '~0.1 ms (Mode3)' },
  { label: 'Sign Speed', rsa: '~1 ms', dilithium: '~0.3 ms' },
  { label: 'Verify Speed', rsa: '~0.05 ms', dilithium: '~0.1 ms' },
  { label: 'Signature Size', rsa: '256 bytes', dilithium: '3,293 bytes' },
  { label: 'Public Key Size', rsa: '294 bytes', dilithium: '1,952 bytes' },
  { label: 'Security Level', rsa: '112-bit classical', dilithium: '192-bit quantum-safe (NIST Level 3)' },
  { label: 'Standardization', rsa: 'PKCS #1 (1998)', dilithium: 'FIPS 204 (2024)' },
];

const timelineEvents = [
  { year: '1994', title: 'Shor\'s Algorithm Published', description: 'Peter Shor proves that a sufficiently powerful quantum computer can factor large integers in polynomial time, theoretically breaking RSA.' },
  { year: '2016', title: 'NIST PQC Competition Begins', description: 'NIST launches a multi-year process to evaluate and standardize post-quantum cryptographic algorithms.' },
  { year: '2022', title: 'CRYSTALS-Dilithium Selected', description: 'After three rounds of evaluation, NIST selects CRYSTALS-Dilithium as the primary standard for digital signatures.' },
  { year: '2024', title: 'FIPS 204 Published', description: 'CRYSTALS-Dilithium is formally standardized as FIPS 204 (ML-DSA), ready for production deployment worldwide.' },
  { year: '2025', title: 'Dilithium Coin Launches', description: 'DLT launches with CRYSTALS-Dilithium Mode3 signatures from day one — quantum-safe before quantum computers arrive.' },
];

export default function QuantumSafePage() {
  const problem = useReveal();
  const comparison = useReveal();
  const timeline = useReveal();
  const why = useReveal();
  const cta = useReveal();

  return (
    <>
      <StarfieldBackground />
      <Navigation />

      <main className="relative z-10">
        {/* Hero */}
        <section className="min-h-[70vh] flex items-center justify-center pt-24 pb-16">
          <div
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-crystal-500/30 bg-crystal-500/5 text-crystal-400 text-xs font-mono tracking-widest uppercase mb-8">
              Post-Quantum Cryptography
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-wider mb-6">
              Why <span className="text-gradient-crystal">Dilithium</span> Over RSA
            </h1>
            <p className="text-space-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              RSA has secured the internet for decades. But quantum computers will break it.
              CRYSTALS-Dilithium is the NIST-standardized replacement — and DLT uses it from the start.
            </p>
          </div>
        </section>

        {/* The Problem with RSA */}
        <section className="py-20 sm:py-28">
          <div
            ref={problem.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${problem.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-6">
              The <span className="text-gradient-nebula">Quantum Threat</span>
            </h2>
            <div className="space-y-6 text-space-600 leading-relaxed">
              <p>
                RSA-2048 relies on one assumption: factoring large numbers is computationally infeasible.
                Classical computers would need billions of years. But a quantum computer running{' '}
                <span className="text-crystal-400">Shor&apos;s algorithm</span> could do it in hours.
              </p>
              <p>
                This isn&apos;t science fiction. IBM, Google, and nation-states are racing to build fault-tolerant
                quantum computers. Estimates place cryptographically-relevant quantum computers within{' '}
                <span className="text-crystal-400">10 to 15 years</span>.
              </p>
              <p>
                Worse, adversaries are already running{' '}
                <span className="text-crystal-400">&ldquo;harvest now, decrypt later&rdquo;</span>{' '}
                attacks — recording encrypted traffic today to break it when quantum hardware is ready.
                For a blockchain, where transaction signatures live on-chain permanently, this is an existential risk.
              </p>

              <div className="card-space p-6 mt-8 border-nebula-500/30">
                <p className="text-sm font-mono text-nebula-400 uppercase tracking-widest mb-3">The bottom line</p>
                <p className="text-white text-lg">
                  Every cryptocurrency using RSA or ECDSA signatures will need to migrate before quantum
                  computers arrive — or risk total loss of funds. DLT is built quantum-safe from block zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 sm:py-28">
          <div
            ref={comparison.ref}
            className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${comparison.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4 text-center">
              RSA vs <span className="text-gradient-crystal">CRYSTALS-Dilithium</span>
            </h2>
            <p className="text-space-600 text-center max-w-2xl mx-auto mb-12">
              A head-to-head comparison of the signature schemes. Dilithium trades larger signatures
              for quantum resistance and faster key generation.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-mono text-space-600 uppercase tracking-widest py-3 px-4 border-b border-space-700">
                      Property
                    </th>
                    <th className="text-left text-xs font-mono text-nebula-400 uppercase tracking-widest py-3 px-4 border-b border-space-700">
                      RSA-2048
                    </th>
                    <th className="text-left text-xs font-mono text-crystal-400 uppercase tracking-widest py-3 px-4 border-b border-space-700">
                      Dilithium Mode3
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? 'bg-space-900/30' : ''}
                    >
                      <td className="py-3 px-4 text-sm text-white font-medium border-b border-space-800">
                        {row.label}
                      </td>
                      <td className="py-3 px-4 text-sm text-space-600 border-b border-space-800">
                        {row.rsa}
                      </td>
                      <td className="py-3 px-4 text-sm text-crystal-400 border-b border-space-800">
                        {row.dilithium}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 sm:py-28">
          <div
            ref={timeline.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${timeline.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-12 text-center">
              The Road to <span className="text-gradient-crystal">Post-Quantum</span>
            </h2>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-nebula-500/50 via-crystal-500/50 to-crystal-500/20" />

              <div className="space-y-10">
                {timelineEvents.map((event) => (
                  <div key={event.year} className="relative pl-14 sm:pl-20">
                    <div className="absolute left-2.5 sm:left-6.5 top-1 w-3 h-3 rounded-full bg-crystal-500 border-2 border-space-950 shadow-[0_0_8px_rgba(0,191,239,0.5)]" />
                    <div className="font-mono text-xs text-crystal-600 tracking-widest mb-1">{event.year}</div>
                    <h3 className="font-heading text-lg font-bold text-white mb-2">{event.title}</h3>
                    <p className="text-space-600 text-sm leading-relaxed">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why DLT Chose Dilithium */}
        <section className="py-20 sm:py-28">
          <div
            ref={why.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${why.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-12 text-center">
              Why DLT Chose <span className="text-gradient-crystal">Dilithium Mode3</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'NIST Standardized',
                  description: 'Not experimental. CRYSTALS-Dilithium is FIPS 204, the U.S. federal standard for post-quantum digital signatures. Vetted by the global cryptographic community over 8 years.',
                },
                {
                  title: 'Faster Key Generation',
                  description: 'Dilithium key generation is ~1,500x faster than RSA-2048. Wallet creation is instant instead of waiting for large prime generation.',
                },
                {
                  title: 'NIST Level 3 Security',
                  description: 'Mode3 provides 192-bit quantum-safe security — equivalent to AES-192 against quantum adversaries. This exceeds the security margin of RSA-2048 against classical attacks.',
                },
                {
                  title: 'Battle-Tested Implementation',
                  description: 'DLT uses the Cloudflare CIRCL library, a production-grade Go implementation of Dilithium with constant-time operations to prevent side-channel attacks.',
                },
                {
                  title: 'Future-Proof by Default',
                  description: 'Every transaction signature on the DLT blockchain is quantum-safe from genesis. No migration needed, no legacy signatures to worry about.',
                },
                {
                  title: 'The Tradeoff',
                  description: 'Dilithium signatures are larger (3.3 KB vs 256 bytes). For a blockchain with one-minute blocks, this is a non-issue — security is worth the extra bytes.',
                },
              ].map((item) => (
                <div key={item.title} className="card-space p-6">
                  <h3 className="font-heading text-base font-bold text-white mb-2 tracking-wide">{item.title}</h3>
                  <p className="text-space-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28">
          <div
            ref={cta.ref}
            className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal ${cta.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-6">
              Ready for the <span className="text-gradient-crystal">Quantum Era</span>?
            </h2>
            <p className="text-space-600 text-lg mb-10 max-w-xl mx-auto">
              Start mining DLT today. Every block you mine is secured by post-quantum cryptography.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/#get-started" className="btn-primary">
                Get Started
              </a>
              <a
                href="https://github.com/luccadimario/dilithiumcoin"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                View Source
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
