import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { truncateAddress } from "../lib/api/types";
import { decrypt } from "../lib/crypto/encryption";

interface Props {
  onBack: () => void;
}

export default function Settings({ onBack }: Props) {
  const { activeWallet, wallets, lock, deleteWallet, switchWallet } = useWallet();
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);

  const handleDelete = async () => {
    if (!activeWallet || !deletePassword) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // Verify password by attempting to decrypt the private key
      await decrypt(activeWallet.encryptedPrivateKey, deletePassword);
      // Password correct — delete the wallet
      await deleteWallet(activeWallet.id);
    } catch {
      setDeleteError("Incorrect password");
      setDeleting(false);
    }
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
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-6">
          Settings
        </h2>

        <div className="space-y-4">
          {/* Current wallet */}
          <div className="card-space p-4">
            <label className="text-[10px] font-heading tracking-widest text-space-600 uppercase mb-3 block">
              Active Wallet
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crystal-500 to-crystal-700 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
                  <polygon points="32,6 20,28 32,36 44,28" fill="#fff" opacity="0.95" />
                  <polygon points="20,28 32,36 32,58" fill="#fff" opacity="0.7" />
                  <polygon points="44,28 32,36 32,58" fill="#fff" opacity="0.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-slate-200">
                  {activeWallet?.label ?? "Wallet"}
                </p>
                <p className="text-xs font-mono text-space-600 truncate">
                  {activeWallet?.checksumAddress
                    ? truncateAddress(activeWallet.checksumAddress, 10)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Wallet list */}
          {wallets.length > 1 && (
            <div>
              <button
                onClick={() => setShowWallets(!showWallets)}
                className="card-space p-4 w-full flex items-center justify-between"
              >
                <span className="text-sm font-mono text-slate-200">
                  Switch Wallet ({wallets.length})
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-space-600 transition-transform ${showWallets ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showWallets && (
                <div className="mt-2 space-y-1">
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => switchWallet(w.id)}
                      className={`w-full card-space p-3 flex items-center gap-3 text-left ${
                        w.id === activeWallet?.id
                          ? "border-crystal-500/30"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          w.id === activeWallet?.id
                            ? "bg-crystal-400"
                            : "bg-space-700"
                        }`}
                      />
                      <span className="text-xs font-mono text-slate-200 truncate">
                        {truncateAddress(w.checksumAddress, 10)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security */}
          <div className="card-space p-4 space-y-3">
            <label className="text-[10px] font-heading tracking-widest text-space-600 uppercase block">
              Security
            </label>
            <button
              onClick={lock}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-space-800/50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-crystal-500">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-sm font-mono text-slate-200">Lock Wallet</span>
            </button>
          </div>

          {/* Danger zone */}
          <div className="card-space p-4 border-red-500/20">
            <label className="text-[10px] font-heading tracking-widest text-red-400/60 uppercase mb-3 block">
              Danger Zone
            </label>

            {!showDeleteFlow ? (
              <>
                <button
                  onClick={() => setShowDeleteFlow(true)}
                  className="w-full btn-secondary border-red-500/30 text-red-400"
                >
                  Delete This Wallet
                </button>
                <p className="text-red-400/40 text-[10px] font-mono mt-2">
                  This cannot be undone. Make sure you have your recovery phrase.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <p className="text-red-300 text-xs font-mono leading-relaxed">
                    This will permanently delete your wallet from this device.
                    Enter your password to confirm.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError(null);
                    }}
                    className="input-field border-red-500/20 focus:border-red-500/40 focus:ring-red-500/20"
                    placeholder="Enter your wallet password"
                    autoComplete="current-password"
                  />
                  {deleteError && (
                    <p className="text-red-400 text-xs font-mono mt-1.5">{deleteError}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteFlow(false);
                      setDeletePassword("");
                      setDeleteError(null);
                    }}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={!deletePassword || deleting}
                    className="btn-danger flex-1 text-xs"
                  >
                    {deleting ? "Deleting..." : "Delete Forever"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* About */}
          <div className="card-space p-4 text-center">
            <svg width="24" height="24" viewBox="0 0 64 64" className="mx-auto mb-2 opacity-30">
              <polygon points="32,6 20,28 32,36 44,28" fill="#00bfef" />
              <polygon points="20,28 32,36 32,58" fill="#0891b2" />
              <polygon points="44,28 32,36 32,58" fill="#067a8f" />
            </svg>
            <p className="text-space-600 text-xs font-mono">
              Dilithium Wallet v1.0.0
            </p>
            <p className="text-space-600/40 text-[10px] font-mono mt-0.5">
              CRYSTALS-Dilithium Mode3 | Post-Quantum Secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
