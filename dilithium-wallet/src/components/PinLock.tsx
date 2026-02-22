import { useState } from "react";
import { cn } from "../lib/utils";

interface Props {
  onUnlock: (password: string) => Promise<void>;
  walletLabel?: string;
}

export default function PinLock({ onUnlock, walletLabel }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;

    setLoading(true);
    setError(null);
    try {
      await onUnlock(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Crystal logo */}
      <div className="mb-8 animate-float">
        <svg width="64" height="64" viewBox="0 0 64 64" className="animate-pulse-glow">
          <polygon points="32,6 20,28 32,36 44,28" fill="#00bfef" opacity="0.95" />
          <polygon points="20,28 32,36 32,58" fill="#0891b2" opacity="0.85" />
          <polygon points="44,28 32,36 32,58" fill="#067a8f" opacity="0.75" />
        </svg>
      </div>

      <h1 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-1">
        Welcome Back
      </h1>
      {walletLabel && (
        <p className="text-space-600 text-xs font-mono mb-6">{walletLabel}</p>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={cn(
              "input-field text-center text-lg tracking-widest",
              error && "border-red-500/50 focus:border-red-500/50"
            )}
            autoFocus
            autoComplete="current-password"
          />
          {error && (
            <p className="text-red-400 text-xs font-mono mt-2 text-center">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!password || loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Unlocking...
            </span>
          ) : (
            "Unlock"
          )}
        </button>
      </form>
    </div>
  );
}
