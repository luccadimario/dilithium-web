import TransactionList from "../components/TransactionList";
import { useWallet } from "../hooks/useWallet";
import { useBalanceContext } from "../hooks/useBalanceContext";
import type { NodeTransaction } from "../lib/api/types";

interface Props {
  onBack: () => void;
  onSelectTx: (tx: NodeTransaction) => void;
}

export default function History({ onBack, onSelectTx }: Props) {
  const { activeWallet } = useWallet();
  const { data, loading } = useBalanceContext();

  const transactions = data?.transactions ?? [];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-4 safe-top mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-space-600 hover:text-crystal-400 transition-colors -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-xs font-heading tracking-wider uppercase">Back</span>
        </button>
      </div>

      <div className="px-4">
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-1">
          Transaction History
        </h2>
        <p className="text-space-600 text-xs font-mono mb-6">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </p>

        <TransactionList
          transactions={transactions}
          myAddress={activeWallet?.address ?? ""}
          onSelect={onSelectTx}
          loading={loading}
        />
      </div>
    </div>
  );
}
