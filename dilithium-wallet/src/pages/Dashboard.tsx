import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import InstallBanner from "../components/InstallBanner";
import { useWallet } from "../hooks/useWallet";
import { useBalanceContext } from "../hooks/useBalanceContext";
import type { NodeTransaction } from "../lib/api/types";

interface Props {
  onNavigate: (page: string) => void;
  onSelectTx: (tx: NodeTransaction) => void;
}

export default function Dashboard({ onNavigate, onSelectTx }: Props) {
  const { activeWallet } = useWallet();
  const { data, loading, error, refresh } = useBalanceContext();

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 safe-top mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 64 64">
              <polygon points="32,6 20,28 32,36 44,28" fill="#00bfef" opacity="0.95" />
              <polygon points="20,28 32,36 32,58" fill="#0891b2" opacity="0.85" />
              <polygon points="44,28 32,36 32,58" fill="#067a8f" opacity="0.75" />
            </svg>
            <span className="font-heading text-sm font-bold tracking-widest text-gradient-crystal">
              DILITHIUM
            </span>
          </div>
          <button
            onClick={() => onNavigate("settings")}
            className="p-2 rounded-lg text-space-600 hover:text-crystal-400 hover:bg-crystal-500/10 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
            </svg>
          </button>
        </div>
      </div>

      <InstallBanner />

      {/* Balance */}
      <div className="px-4 mb-6">
        <BalanceCard
          address={activeWallet?.address ?? ""}
          checksumAddress={activeWallet?.checksumAddress ?? ""}
          balance={balance}
          loading={loading}
          error={error}
          onRefresh={refresh}
        />
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("send")}
            className="card-space p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-crystal-500/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-crystal-400">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <span className="font-heading text-xs font-semibold tracking-wider uppercase text-slate-200">
              Send
            </span>
          </button>
          <button
            onClick={() => onNavigate("receive")}
            className="card-space p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-emerald-400">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
            <span className="font-heading text-xs font-semibold tracking-wider uppercase text-slate-200">
              Receive
            </span>
          </button>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-xs font-semibold tracking-wider uppercase text-space-600">
            Recent Activity
          </h3>
          {transactions.length > 3 && (
            <button
              onClick={() => onNavigate("history")}
              className="text-crystal-500/70 text-xs font-heading tracking-wider uppercase hover:text-crystal-400 transition-colors"
            >
              View All
            </button>
          )}
        </div>
        <TransactionList
          transactions={transactions.slice(0, 5)}
          myAddress={activeWallet?.address ?? ""}
          onSelect={onSelectTx}
          loading={loading}
        />
      </div>
    </div>
  );
}
