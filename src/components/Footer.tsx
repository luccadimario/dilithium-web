'use client';

const resourceLinks = [
  { label: 'GitHub', href: 'https://github.com/luccadimario/dilithiumcoin' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Block Explorer', href: '/explorer' },
  { label: 'Whitepaper', href: '/whitepaper' },
  { label: 'Wallet App', href: 'https://wallet.dilithiumcoin.com' },
];

const communityLinks = [
  { label: 'Discord', href: '#' },
  { label: 'Twitter / X', href: '#' },
  { label: 'Reddit', href: '#' },
  { label: 'Telegram', href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-crystal-500/10 bg-space-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="34" viewBox="0 0 200 280" fill="none">
                <polygon points="100,10 60,100 100,130 140,100" fill="#00bfef" opacity="0.9" />
                <polygon points="60,100 100,130 140,100 100,270" fill="#0891b2" opacity="0.8" />
              </svg>
              <span className="font-heading text-lg font-bold tracking-wider text-gradient-crystal">
                DILITHIUM
              </span>
            </div>
            <p className="text-space-600 text-sm leading-relaxed max-w-xs mb-4">
              A quantum-safe, proof-of-work cryptocurrency built from scratch in Go.
              Powering the next frontier of decentralized computing.
            </p>
            <a
              href="mailto:dev@dilithiumcoin.com"
              className="text-crystal-400 hover:text-crystal-300 transition-colors text-sm font-mono"
            >
              dev@dilithiumcoin.com
            </a>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-space-600 hover:text-crystal-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Community
            </h4>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-space-600 hover:text-crystal-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Get Involved
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/#contact" className="text-space-600 hover:text-crystal-400 transition-colors text-sm">
                  Work With Us
                </a>
              </li>
              <li>
                <a href="/#get-started" className="text-space-600 hover:text-crystal-400 transition-colors text-sm">
                  Start Mining
                </a>
              </li>
              <li>
                <a href="https://wallet.dilithiumcoin.com" className="text-space-600 hover:text-crystal-400 transition-colors text-sm">
                  Wallet App (PWA)
                </a>
              </li>
              <li>
                <a
                  href="mailto:dev@dilithiumcoin.com"
                  className="text-space-600 hover:text-crystal-400 transition-colors text-sm"
                >
                  dev@dilithiumcoin.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-space-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-space-600 text-xs font-mono">
            &copy; 2026 Dilithium Network. All rights reserved.
          </p>
          <p className="text-space-700 text-xs font-mono">
            Built with crystalline precision
          </p>
        </div>
      </div>
    </footer>
  );
}
