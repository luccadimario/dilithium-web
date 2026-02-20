import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical Whitepaper — Dilithium (DLT) Cryptocurrency',
  description:
    'The Dilithium technical whitepaper. Post-quantum CRYSTALS-Dilithium signatures, SHA-256 proof-of-work, Merkle tree block hashing, and 25M fixed supply.',
  keywords: [
    'dilithium whitepaper',
    'dilithium crypto whitepaper',
    'quantum-safe cryptocurrency whitepaper',
    'CRYSTALS-Dilithium blockchain',
    'post-quantum proof of work',
    'DLT whitepaper',
  ],
};

export default function WhitepaperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
