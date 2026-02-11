import type { Metadata } from 'next';
import { Orbitron, Space_Mono } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Dilithium (DLT) — Quantum-Safe Proof-of-Work Cryptocurrency',
  description:
    'Dilithium is a quantum-safe proof-of-work cryptocurrency built from scratch in Go. Post-quantum CRYSTALS-Dilithium signatures, fixed supply of 25M DLT, SHA-256 mining. Power the next frontier.',
  keywords: [
    'dilithium',
    'DLT',
    'cryptocurrency',
    'quantum-safe',
    'post-quantum',
    'CRYSTALS-Dilithium',
    'proof of work',
    'blockchain',
    'SHA-256',
    'mining',
    'Go',
    'decentralized',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Dilithium (DLT) — Quantum-Safe. Power the Next Frontier.',
    description:
      'A quantum-safe proof-of-work cryptocurrency built from the ground up in Go. Post-quantum signatures. Fixed supply. SHA-256 mining.',
    siteName: 'Dilithium',
    type: 'website',
    url: 'https://dilithiumcoin.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dilithium — Quantum-Safe Proof-of-Work Cryptocurrency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dilithium (DLT) — Quantum-Safe Proof-of-Work Cryptocurrency',
    description:
      'Built from scratch in Go. Post-quantum CRYSTALS-Dilithium signatures, 25M fixed supply, SHA-256 PoW.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${orbitron.variable} ${spaceMono.variable} antialiased bg-space-950 text-slate-200`}
        style={{
          fontFamily: "'Space Mono', monospace, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
