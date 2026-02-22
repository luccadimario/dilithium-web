import { useState, useCallback } from "react";
import { useWallet, WalletProvider } from "./hooks/useWallet";
import { BalanceProvider } from "./hooks/useBalanceContext";
import StarfieldBackground from "./components/StarfieldBackground";
import Navigation from "./components/Navigation";
import LoadingScreen from "./components/LoadingScreen";
import PinLock from "./components/PinLock";
import Onboarding from "./pages/Onboarding";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import BackupMnemonic from "./pages/BackupMnemonic";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import History from "./pages/History";
import TransactionDetail from "./pages/TransactionDetail";
import Settings from "./pages/Settings";
import type { NodeTransaction } from "./lib/api/types";

type Page =
  | "onboarding"
  | "create"
  | "import"
  | "backup-mnemonic"
  | "dashboard"
  | "send"
  | "receive"
  | "history"
  | "tx-detail"
  | "settings";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

function AppContent() {
  const { loading, wasmReady, wallets, activeWallet, unlocked, unlock } = useWallet();
  const [page, setPage] = useState<Page>("onboarding");
  const [selectedTx, setSelectedTx] = useState<NodeTransaction | null>(null);
  // Holds the mnemonic between wallet creation and the mandatory backup screen
  const [pendingMnemonic, setPendingMnemonic] = useState<string | null>(null);

  const navigate = useCallback((p: string) => setPage(p as Page), []);

  const handleSelectTx = useCallback((tx: NodeTransaction) => {
    setSelectedTx(tx);
    setPage("tx-detail");
  }, []);

  const handleWalletCreated = useCallback((mnemonic: string) => {
    setPendingMnemonic(mnemonic);
    setPage("backup-mnemonic");
  }, []);

  const handleBackupConfirmed = useCallback(() => {
    setPendingMnemonic(null);
    setPage("dashboard");
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="relative z-10">
        <LoadingScreen />
      </div>
    );
  }

  // ── WASM failed ──
  if (!wasmReady) {
    return (
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="font-heading text-lg font-bold tracking-wider text-slate-200 mb-2">
          Crypto Module Failed
        </h2>
        <p className="text-space-600 text-xs font-mono max-w-xs">
          The quantum-safe cryptography module could not be loaded.
          Please ensure WebAssembly is supported in your browser.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-6"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Mandatory mnemonic backup (blocks everything until confirmed) ──
  if (pendingMnemonic) {
    return (
      <div className="relative z-10 max-w-lg mx-auto">
        <BackupMnemonic
          mnemonic={pendingMnemonic}
          onConfirmed={handleBackupConfirmed}
        />
      </div>
    );
  }

  // ── No wallet — onboarding ──
  if (wallets.length === 0) {
    const onboardingContent = (() => {
      switch (page) {
        case "create":
          return (
            <CreateWallet
              onComplete={handleWalletCreated}
              onBack={() => setPage("onboarding")}
            />
          );
        case "import":
          return (
            <ImportWallet
              onComplete={() => setPage("dashboard")}
              onBack={() => setPage("onboarding")}
            />
          );
        default:
          return (
            <Onboarding
              onCreateWallet={() => setPage("create")}
              onImportWallet={() => setPage("import")}
            />
          );
      }
    })();

    return (
      <div className="relative z-10 max-w-lg mx-auto">
        {onboardingContent}
      </div>
    );
  }

  // ── Locked ──
  if (!unlocked) {
    return (
      <div className="relative z-10 max-w-lg mx-auto">
        <PinLock
          onUnlock={unlock}
          walletLabel={activeWallet?.checksumAddress}
        />
      </div>
    );
  }

  // ── Unlocked — main app ──
  const renderPage = () => {
    switch (page) {
      case "send":
        return <Send onBack={() => setPage("dashboard")} />;
      case "receive":
        return <Receive onBack={() => setPage("dashboard")} />;
      case "history":
        return <History onBack={() => setPage("dashboard")} onSelectTx={handleSelectTx} />;
      case "tx-detail":
        return selectedTx ? (
          <TransactionDetail
            tx={selectedTx}
            myAddress={activeWallet?.address ?? ""}
            onBack={() => setPage("history")}
          />
        ) : (
          <Dashboard onNavigate={navigate} onSelectTx={handleSelectTx} />
        );
      case "settings":
        return <Settings onBack={() => setPage("dashboard")} />;
      default:
        return <Dashboard onNavigate={navigate} onSelectTx={handleSelectTx} />;
    }
  };

  return (
    <>
      <div className="relative z-10 max-w-lg mx-auto">{renderPage()}</div>
      <Navigation
        currentPage={page}
        onNavigate={navigate}
        hasWallet={wallets.length > 0 && unlocked}
      />
    </>
  );
}

function AppWithBalance() {
  const { activeWallet } = useWallet();
  return (
    <BalanceProvider address={activeWallet?.address ?? null}>
      <AppContent />
    </BalanceProvider>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <StarfieldBackground />
      <AppWithBalance />
    </WalletProvider>
  );
}
