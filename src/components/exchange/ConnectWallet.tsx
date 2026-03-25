'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useExchangeAuth } from '@/hooks/useExchangeAuth';

export default function ConnectWallet() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isAuthenticating, authenticate, signOut } = useExchangeAuth();

  return (
    <div className="flex items-center gap-3">
      <ConnectButton
        accountStatus="address"
        chainStatus="none"
        showBalance={false}
      />
      {isConnected && !isAuthenticated && (
        <button
          onClick={authenticate}
          disabled={isAuthenticating}
          className="px-4 py-2 rounded-lg bg-crystal-500/20 border border-crystal-500/40 text-crystal-400
                     hover:bg-crystal-500/30 transition-all text-sm font-mono disabled:opacity-50"
        >
          {isAuthenticating ? 'Signing...' : 'Sign In'}
        </button>
      )}
      {isAuthenticated && (
        <button
          onClick={signOut}
          className="px-3 py-1.5 rounded-lg bg-space-800 border border-space-700 text-space-500
                     hover:text-crystal-400 transition-all text-xs font-mono"
        >
          Sign Out
        </button>
      )}
    </div>
  );
}
