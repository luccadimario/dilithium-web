import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Block Explorer — Dilithium (DLT) Cryptocurrency',
  description:
    'Explore the Dilithium blockchain. View blocks, transactions, addresses, and network stats in real time.',
  keywords: [
    'dilithium block explorer',
    'DLT explorer',
    'dilithium blockchain explorer',
    'dilithium transactions',
    'dilithium network stats',
  ],
};

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
