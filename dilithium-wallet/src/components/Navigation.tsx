import { cn } from "../lib/utils";

interface NavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  hasWallet: boolean;
}

const navItems = [
  { id: "dashboard", label: "Wallet", icon: WalletIcon },
  { id: "send", label: "Send", icon: SendIcon },
  { id: "receive", label: "Receive", icon: ReceiveIcon },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Navigation({ currentPage, onNavigate, hasWallet }: NavProps) {
  if (!hasWallet) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-space-900/95 backdrop-blur-xl border-t border-crystal-500/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto max-w-lg">
        <div
          className="flex items-center justify-around px-2 pt-2 pb-1"
        >
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200",
                  active
                    ? "text-crystal-400"
                    : "text-space-600 hover:text-crystal-500/70"
                )}
              >
                <item.icon active={active} />
                <span
                  className={cn(
                    "text-[10px] font-heading tracking-wider uppercase",
                    active && "text-crystal-400"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1.5" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ReceiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      {active && <circle cx="12" cy="12" r="2" fill="currentColor" />}
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
      {active && <circle cx="12" cy="12" r="1.5" fill="currentColor" />}
    </svg>
  );
}
