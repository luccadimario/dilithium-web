import { useState } from "react";
import type { NodeTransaction } from "../lib/api/types";
import { formatDLT, truncateAddress } from "../lib/api/types";
import { copyToClipboard, formatDate, vibrate } from "../lib/utils";

interface Props {
  tx: NodeTransaction;
  myAddress: string;
  onBack: () => void;
}

export default function TransactionDetail({ tx, myAddress, onBack }: Props) {
  const isSent = tx.from.toLowerCase() === myAddress.toLowerCase();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, field: string) => {
    await copyToClipboard(value);
    vibrate();
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
        {/* Status header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isSent
                ? "bg-red-500/10 text-red-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isSent ? (
                <path d="M12 19V5M5 12l7-7 7 7" />
              ) : (
                <path d="M12 5v14M5 12l7 7 7-7" />
              )}
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200">
              {isSent ? "Sent" : "Received"}
            </h2>
            <p className="text-space-600 text-xs font-mono">
              {formatDate(tx.timestamp)}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="card-space p-5 mb-4 text-center">
          <p
            className={`text-3xl font-heading font-bold tracking-wider ${
              isSent ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {isSent ? "-" : "+"}{formatDLT(tx.amount)} DLT
          </p>
          {tx.fee != null && (
            <p className="text-space-600 text-xs font-mono mt-1">
              Fee: {formatDLT(tx.fee)} DLT
            </p>
          )}
        </div>

        {/* Details */}
        <div className="card-space p-4 space-y-0 divide-y divide-space-700/30">
          <DetailRow
            label="From"
            value={tx.from}
            displayValue={truncateAddress(tx.from, 10)}
            onCopy={() => handleCopy(tx.from, "from")}
            copied={copiedField === "from"}
          />
          <DetailRow
            label="To"
            value={tx.to}
            displayValue={truncateAddress(tx.to, 10)}
            onCopy={() => handleCopy(tx.to, "to")}
            copied={copiedField === "to"}
          />
          <DetailRow
            label="Signature"
            value={tx.signature}
            displayValue={truncateAddress(tx.signature, 12)}
            onCopy={() => handleCopy(tx.signature, "sig")}
            copied={copiedField === "sig"}
          />
          {tx.block_index !== undefined && (
            <DetailRow
              label="Block"
              value={tx.block_index.toString()}
              displayValue={`#${tx.block_index.toLocaleString()}`}
            />
          )}
        </div>

        {/* Memo */}
        {tx.data && (
          <div className="card-space p-4 mt-4">
            <label className="text-[10px] font-heading tracking-widest text-space-600 uppercase mb-2 block">
              Memo
            </label>
            <p className="text-sm font-mono text-slate-200 leading-relaxed">
              {tx.data}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  displayValue,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  displayValue: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <span className="text-xs font-mono text-space-600 shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-200 truncate">
          {displayValue}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-space-600 hover:text-crystal-400 transition-colors p-1"
          >
            {copied ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
