import { useState } from "react";
import { useWallet } from "../hooks/useWallet";

interface Props {
  onComplete: (mnemonic: string) => void;
  onBack: () => void;
}

export default function CreateWallet({ onComplete, onBack }: Props) {
  const { createWallet } = useWallet();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const result = await createWallet(password);
      // Pass the mnemonic to the parent — it will show the mandatory backup screen
      onComplete(result.mnemonic);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pb-10 safe-top">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-space-600 hover:text-crystal-400 transition-colors mb-6 -ml-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="text-xs font-heading tracking-wider uppercase">Back</span>
      </button>

      <div className="flex-1 flex flex-col">
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2">
          Secure Your Wallet
        </h2>
        <p className="text-space-600 text-xs font-mono mb-8">
          Create a strong password to encrypt your private key on this device
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating keys...
                </span>
              ) : (
                "Create Wallet"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 card-space p-4 border-crystal-500/10">
          <p className="text-space-600 text-xs font-mono leading-relaxed">
            <span className="text-crystal-500">AES-256-GCM</span> encryption with{" "}
            <span className="text-crystal-500">PBKDF2</span> key stretching (600K iterations).
            Your password encrypts the private key locally — it never leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}
