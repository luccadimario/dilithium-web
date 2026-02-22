import { formatDLT, truncateAddress, type NodeTransaction } from "../lib/api/types";
import { timeAgo } from "../lib/utils";

interface Props {
  transactions: NodeTransaction[];
  myAddress: string;
  onSelect: (tx: NodeTransaction) => void;
  loading: boolean;
}

export default function TransactionList({ transactions, myAddress, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-space p-4 animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-space-700/50 rounded" />
              <div className="h-4 w-20 bg-space-700/50 rounded" />
            </div>
            <div className="h-3 w-40 bg-space-700/30 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card-space p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-space-800 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-space-600">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <p className="text-space-600 text-sm font-mono">No transactions yet</p>
        <p className="text-space-600/60 text-xs font-mono mt-1">
          Your transaction history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isSent = tx.from.toLowerCase() === myAddress.toLowerCase();
        const amount = tx.amount;

        return (
          <button
            key={tx.signature}
            onClick={() => onSelect(tx)}
            className="card-space p-4 w-full text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isSent
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    {isSent ? (
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    ) : (
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-mono text-slate-200">
                    {isSent ? "Sent" : "Received"}
                  </p>
                  <p className="text-xs font-mono text-space-600">
                    {isSent
                      ? truncateAddress(tx.to, 6)
                      : truncateAddress(tx.from, 6)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-heading font-semibold ${
                    isSent ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {isSent ? "-" : "+"}{formatDLT(amount)} DLT
                </p>
                <p className="text-xs font-mono text-space-600">
                  {timeAgo(tx.timestamp)}
                </p>
              </div>
            </div>
            {tx.data && (
              <div className="mt-2 pt-2 border-t border-space-700/30">
                <p className="text-xs font-mono text-space-600 truncate">
                  <span className="text-crystal-500/60">Memo:</span> {tx.data}
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
