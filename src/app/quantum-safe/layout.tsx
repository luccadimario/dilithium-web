import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quantum-Safe Cryptography — Dilithium (DLT) Cryptocurrency',
  description:
    'Why Dilithium is quantum-safe. CRYSTALS-Dilithium post-quantum signatures protect against quantum computing attacks on cryptocurrency.',
  keywords: [
    'quantum-safe cryptocurrency',
    'quantum resistant crypto',
    'post-quantum blockchain',
    'CRYSTALS-Dilithium signatures',
    'quantum computing cryptocurrency threat',
    'quantum proof crypto',
  ],
};

export default function QuantumSafeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
