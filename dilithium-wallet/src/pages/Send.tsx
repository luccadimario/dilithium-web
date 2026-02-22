import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useBalanceContext } from "../hooks/useBalanceContext";
import { sendTransaction } from "../lib/api/node-client";
import {
  DLT_UNIT,
  MIN_FEE,
  NETWORK_NAME,
  formatDLT,
  parseDLT,
} from "../lib/api/types";

interface Props {
  onBack: () => void;
}

export default function Send({ onBack }: Props) {
  const { activeWallet, unlocked, signTransaction, getPublicKeyHex } = useWallet();
  const { data } = useBalanceContext();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "confirm">("form");

  const balance = data?.balance ?? 0;
  const amountBase = parseDLT(amount);
  const fee = MIN_FEE;
  const total = amountBase + fee;

  const validate = (): string | null => {
    if (!to.match(/^[a-f0-9]{40}$/i)) return "Invalid address format";
    if (amountBase <= 0) return "Enter a valid amount";
    if (total > balance) return "Insufficient balance";
    if (memo.length > 256) return "Memo too long (max 256 chars)";
    if (to.toLowerCase() === activeWallet?.address.toLowerCase()) return "Cannot send to yourself";
    return null;
  };

  const handleReview = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep("confirm");
  };

  const handleSend = async () => {
    if (!activeWallet || !unlocked) return;

    setSending(true);
    setError(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const toAddr = to.toLowerCase();

      // Build signing data matching the Go node format
      let txData = `${NETWORK_NAME}:${activeWallet.address}${toAddr}${amountBase}${fee}${timestamp}`;
      if (memo) {
        txData += `:${memo}`;
      }

      const signatureHex = signTransaction(txData);
      const publicKeyHex = getPublicKeyHex();

      await sendTransaction({
        from: activeWallet.address,
        to: toAddr,
        amount: amountBase,
        fee,
        timestamp,
        signature: signatureHex,
        public_key: publicKeyHex,
        data: memo || undefined,
      });

      // If sendTransaction didn't throw, the node accepted it
      setSuccess("Transaction submitted");
      setStep("form");
      setTo("");
      setAmount("");
      setMemo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2">
          Transaction Sent
        </h2>
        <p className="text-space-600 text-xs font-mono text-center mb-8 max-w-xs">
          Your transaction has been submitted to the network
        </p>
        <button onClick={onBack} className="btn-primary">
          Back to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-4 safe-top mb-6">
        <button
          onClick={step === "confirm" ? () => setStep("form") : onBack}
          className="flex items-center gap-1 text-space-600 hover:text-crystal-400 transition-colors -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-xs font-heading tracking-wider uppercase">
            {step === "confirm" ? "Edit" : "Back"}
          </span>
        </button>
      </div>

      <div className="px-4">
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-1">
          {step === "form" ? "Send DLT" : "Confirm Transaction"}
        </h2>
        <p className="text-space-600 text-xs font-mono mb-6">
          Available: {formatDLT(balance)} DLT
        </p>

        {step === "form" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                Recipient Address
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input-field"
                placeholder="dlt1... or raw hex address"
                spellCheck={false}
                autoCorrect="off"
              />
            </div>

            <div>
              <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                Amount (DLT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pr-16"
                  placeholder="0.00"
                  step="any"
                  min="0"
                />
                <button
                  onClick={() => setAmount(((balance - fee) / DLT_UNIT).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-crystal-500/70 text-xs font-heading tracking-wider uppercase
                    hover:text-crystal-400 transition-colors"
                >
                  Max
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                Memo <span className="text-space-600/40">(optional)</span>
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="input-field"
                placeholder="Add a note..."
                maxLength={256}
              />
            </div>

            <div className="card-space p-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-space-600">Network Fee</span>
                <span className="text-slate-200">{formatDLT(fee)} DLT</span>
              </div>
              {amountBase > 0 && (
                <div className="flex justify-between text-xs font-mono mt-2 pt-2 border-t border-space-700/30">
                  <span className="text-space-600">Total</span>
                  <span className="text-crystal-400 font-semibold">
                    {formatDLT(total)} DLT
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
            )}

            <button onClick={handleReview} className="btn-primary w-full">
              Review Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card-space p-4 space-y-3">
              <Row label="To" value={to} truncate />
              <Row label="Amount" value={`${formatDLT(amountBase)} DLT`} />
              <Row label="Fee" value={`${formatDLT(fee)} DLT`} />
              <Row label="Total" value={`${formatDLT(total)} DLT`} highlight />
              {memo && <Row label="Memo" value={memo} />}
            </div>

            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary w-full"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing & Sending...
                </span>
              ) : (
                "Confirm & Send"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  truncate,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-mono text-space-600 shrink-0">{label}</span>
      <span
        className={`text-xs font-mono text-right break-all ${
          highlight ? "text-crystal-400 font-semibold" : "text-slate-200"
        } ${truncate ? "truncate max-w-[200px]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
