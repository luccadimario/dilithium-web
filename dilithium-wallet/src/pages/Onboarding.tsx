import { useState } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

interface Props {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

export default function Onboarding({ onCreateWallet, onImportWallet }: Props) {
  const [step, setStep] = useState<"welcome" | "install" | "choose">("welcome");
  const { canInstall, isIOS, install } = useInstallPrompt();
  const standalone = isStandalone();

  // ── Welcome screen ──
  if (step === "welcome") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="mb-10 animate-float">
          <svg width="96" height="96" viewBox="0 0 64 64" className="animate-pulse-glow">
            <defs>
              <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#00bfef" />
              </linearGradient>
              <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
            </defs>
            <polygon points="32,4 18,28 32,38 46,28" fill="url(#cg1)" />
            <polygon points="18,28 32,38 32,60" fill="url(#cg2)" opacity="0.9" />
            <polygon points="46,28 32,38 32,60" fill="#067a8f" opacity="0.8" />
            <polygon points="32,4 25,16 32,20 39,16" fill="#fff" opacity="0.15" />
          </svg>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-wider text-gradient-crystal mb-3 text-center">
          DILITHIUM
        </h1>
        <p className="font-heading text-sm tracking-widest text-space-600 uppercase mb-2">
          Wallet
        </p>
        <p className="text-space-600 text-xs font-mono text-center max-w-xs mb-12 leading-relaxed">
          Post-quantum secure cryptocurrency wallet.
          Your keys never leave this device.
        </p>

        <button
          onClick={() => {
            // If already running as PWA, skip install step
            if (standalone) {
              setStep("choose");
            } else {
              setStep("install");
            }
          }}
          className="btn-primary w-full max-w-xs"
        >
          Get Started
        </button>

        <div className="mt-8 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-emerald-500/70 text-[10px] font-mono tracking-wider uppercase">
            CRYSTALS-Dilithium Mode3 Secured
          </span>
        </div>
      </div>
    );
  }

  // ── Install to Home Screen step ──
  if (step === "install" && !standalone) {
    return (
      <div className="min-h-screen flex flex-col px-6 pb-10 safe-top">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crystal-500 to-crystal-700 flex items-center justify-center mb-6 glow-crystal">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <polygon points="32,6 20,28 32,36 44,28" fill="#fff" opacity="0.95" />
              <polygon points="20,28 32,36 32,58" fill="#fff" opacity="0.7" />
              <polygon points="44,28 32,36 32,58" fill="#fff" opacity="0.5" />
            </svg>
          </div>

          <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2 text-center">
            Install the App First
          </h2>
          <p className="text-space-600 text-xs font-mono text-center max-w-xs mb-8 leading-relaxed">
            For security, install this app to your home screen before creating a wallet.
            This ensures your wallet data persists safely.
          </p>

          {/* iOS instructions */}
          {isIOS && (
            <div className="w-full max-w-sm card-space p-5 mb-6">
              <p className="font-heading text-xs tracking-wider text-crystal-400 uppercase mb-4">
                How to install on iOS
              </p>
              <div className="space-y-4">
                <Step
                  num={1}
                  text={
                    <>
                      Tap the <span className="text-crystal-400">Share</span> button{" "}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline text-crystal-400 -mt-0.5">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>{" "}
                      at the bottom of Safari
                    </>
                  }
                />
                <Step
                  num={2}
                  text={
                    <>
                      Scroll down and tap{" "}
                      <span className="text-crystal-400">"Add to Home Screen"</span>
                    </>
                  }
                />
                <Step
                  num={3}
                  text="Open the app from your home screen, then create your wallet"
                />
              </div>
            </div>
          )}

          {/* Android / Desktop (can auto-install) */}
          {canInstall && (
            <button onClick={install} className="btn-primary w-full max-w-sm mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Install to Home Screen
            </button>
          )}

          {/* Skip option (with warning) */}
          <button
            onClick={() => setStep("choose")}
            className="mt-4 text-space-600 text-xs font-mono hover:text-space-600/80 transition-colors"
          >
            Continue in browser (not recommended)
          </button>

          {!isIOS && !canInstall && (
            <div className="mt-4 card-space p-4 max-w-sm">
              <p className="text-space-600 text-xs font-mono leading-relaxed text-center">
                Open this page in <span className="text-crystal-400">Safari</span> (iOS)
                or <span className="text-crystal-400">Chrome</span> (Android) to install.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Choose create or import ──
  return (
    <div className="min-h-screen flex flex-col px-6 pb-10 safe-top">
      <div className="flex-1 flex flex-col items-center">
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2 text-center">
          Set Up Your Wallet
        </h2>
        <p className="text-space-600 text-xs font-mono text-center mb-10">
          Choose how you'd like to get started
        </p>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={onCreateWallet}
            className="w-full card-space p-5 text-left group transition-all active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-crystal-500 to-crystal-700 flex items-center justify-center shrink-0 group-hover:glow-crystal-strong transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-sm font-semibold tracking-wider text-slate-200 mb-1">
                  Create New Wallet
                </p>
                <p className="text-xs font-mono text-space-600 leading-relaxed">
                  Generate a new 24-word recovery phrase and start fresh
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onImportWallet}
            className="w-full card-space p-5 text-left group transition-all active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nebula-500 to-nebula-700 flex items-center justify-center shrink-0 group-hover:glow-nebula transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-sm font-semibold tracking-wider text-slate-200 mb-1">
                  Import Wallet
                </p>
                <p className="text-xs font-mono text-space-600 leading-relaxed">
                  Restore from an existing 24-word recovery phrase
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <p className="text-space-600/40 text-[10px] font-mono text-center mt-8">
        All cryptographic operations happen locally on your device
      </p>
    </div>
  );
}

function Step({ num, text }: { num: number; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-crystal-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-crystal-400 text-xs font-heading font-bold">{num}</span>
      </div>
      <p className="text-sm font-mono text-slate-200/80 leading-relaxed">{text}</p>
    </div>
  );
}
