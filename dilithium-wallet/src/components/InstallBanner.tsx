import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function InstallBanner() {
  const { canInstall, isInstalled, isIOS, showIOSPrompt, install, dismissIOSPrompt } =
    useInstallPrompt();

  if (isInstalled) return null;

  // iOS Safari prompt
  if (isIOS && showIOSPrompt) {
    return (
      <div className="card-space p-4 mx-4 mb-4 border-crystal-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crystal-500 to-crystal-700 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
              <polygon points="32,6 20,28 32,36 44,28" fill="#fff" opacity="0.95" />
              <polygon points="20,28 32,36 32,58" fill="#fff" opacity="0.7" />
              <polygon points="44,28 32,36 32,58" fill="#fff" opacity="0.5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-heading text-slate-200 tracking-wide">
              Install DLT Wallet
            </p>
            <p className="text-xs font-mono text-space-600 mt-1">
              Tap{" "}
              <span className="inline-flex items-center mx-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-crystal-400">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>{" "}
              then <span className="text-crystal-400">"Add to Home Screen"</span> for
              the best experience
            </p>
          </div>
          <button
            onClick={dismissIOSPrompt}
            className="text-space-600 hover:text-slate-400 p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (canInstall) {
    return (
      <div className="px-4 mb-4">
        <button
          onClick={install}
          className="w-full card-space p-4 flex items-center gap-3 border-crystal-500/20
            hover:border-crystal-500/40 transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crystal-500 to-crystal-700 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-heading text-slate-200 tracking-wide">
              Install App
            </p>
            <p className="text-xs font-mono text-space-600">
              Add to your home screen for quick access
            </p>
          </div>
        </button>
      </div>
    );
  }

  return null;
}
