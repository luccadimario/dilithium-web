import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — Dilithium (DLT) Cryptocurrency',
  description:
    'Get started with Dilithium cryptocurrency. Download the node, wallet, and miner. Learn how to mine DLT, send transactions, and run a full node.',
  keywords: [
    'dilithium docs',
    'dilithium cryptocurrency download',
    'DLT mining guide',
    'how to mine dilithium',
    'dilithium wallet',
    'dilithium node setup',
    'quantum-safe crypto mining',
  ],
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
