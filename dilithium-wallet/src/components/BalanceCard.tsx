import { useState } from "react";
import { formatDLT, truncateAddress } from "../lib/api/types";
import { copyToClipboard, vibrate } from "../lib/utils";

interface Props {
  address: string;
  checksumAddress: string;
  balance: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function BalanceCard({
  checksumAddress,
  balance,
  loading,
  error,
  onRefresh,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(checksumAddress);
    vibrate();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-space p-6 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-crystal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-nebula-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crystal-500 to-crystal-700 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 64 64" fill="none">
              <polygon points="32,6 20,28 32,36 44,28" fill="#fff" opacity="0.95" />
              <polygon points="20,28 32,36 32,58" fill="#fff" opacity="0.7" />
              <polygon points="44,28 32,36 32,58" fill="#fff" opacity="0.5" />
            </svg>
          </div>
          <span className="font-heading text-xs tracking-widest uppercase text-space-600">
            Dilithium
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg text-space-600 hover:text-crystal-400 hover:bg-crystal-500/10 transition-all"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? "animate-spin" : ""}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            <path d="M21 3v9h-9" />
          </svg>
        </button>
      </div>

      {/* Balance */}
      <div className="mb-6">
        <p className="text-space-600 text-xs font-heading tracking-wider uppercase mb-1">
          Balance
        </p>
        <button
          onClick={() => setHideBalance(!hideBalance)}
          className="text-left w-full"
        >
          {loading && balance === null ? (
            <div className="h-10 w-48 bg-space-700/50 rounded-lg animate-pulse" />
          ) : hideBalance ? (
            <p className="text-3xl font-heading font-bold tracking-wider text-slate-200">
              *** *** DLT
            </p>
          ) : (
            <p className="text-3xl font-heading font-bold tracking-wider text-gradient-crystal">
              {formatDLT(balance)}{" "}
              <span className="text-lg text-crystal-600">DLT</span>
            </p>
          )}
        </button>
      </div>

      {/* Node status */}
      {error && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <p className="text-amber-400/70 text-[10px] font-mono">
            Node unreachable — showing cached balance
          </p>
        </div>
      )}

      {/* Address */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2 -mx-1 rounded-lg
          bg-space-900/50 border border-space-700/30 hover:border-crystal-500/30
          transition-all group w-full"
      >
        <span className="text-xs font-mono text-space-600 group-hover:text-crystal-500/80 truncate flex-1 text-left">
          {truncateAddress(checksumAddress, 12)}
        </span>
        <span className="text-[10px] font-heading tracking-wider uppercase text-crystal-500/60 shrink-0">
          {copied ? "Copied!" : "Copy"}
        </span>
      </button>
    </div>
  );
}
