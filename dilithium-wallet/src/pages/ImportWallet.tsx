import { useState } from "react";
import { MnemonicInput } from "../components/MnemonicGrid";
import { useWallet } from "../hooks/useWallet";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function ImportWallet({ onComplete, onBack }: Props) {
  const { importWallet } = useWallet();
  const [step, setStep] = useState<"mnemonic" | "password">("mnemonic");
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMnemonicSubmit = (m: string) => {
    setMnemonic(m);
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await importWallet(mnemonic, password);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pb-10 safe-top">
      <button
        onClick={step === "password" ? () => setStep("mnemonic") : onBack}
        className="flex items-center gap-1 text-space-600 hover:text-crystal-400 transition-colors mb-6 -ml-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="text-xs font-heading tracking-wider uppercase">Back</span>
      </button>

      {step === "mnemonic" && (
        <div className="flex-1">
          <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2">
            Import Wallet
          </h2>
          <p className="text-space-600 text-xs font-mono mb-6">
            Enter your 24-word recovery phrase
          </p>
          <MnemonicInput onSubmit={handleMnemonicSubmit} />
        </div>
      )}

      {step === "password" && (
        <div className="flex-1">
          <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2">
            Set Password
          </h2>
          <p className="text-space-600 text-xs font-mono mb-8">
            Create a password to encrypt this wallet on your device
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 8 characters"
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="input-field"
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Importing..." : "Encrypt & Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
