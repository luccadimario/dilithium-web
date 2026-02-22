import { useState } from "react";
import { cn } from "../lib/utils";

interface DisplayProps {
  mnemonic: string;
  onConfirm: () => void;
}

export function MnemonicDisplay({ mnemonic, onConfirm }: DisplayProps) {
  const words = mnemonic.split(" ");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="card-space p-4 relative">
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center
              bg-space-900/95 backdrop-blur-sm rounded-2xl"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-crystal-400 mb-2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-crystal-400 font-heading text-sm tracking-wider uppercase">
              Tap to reveal
            </span>
            <span className="text-space-600 text-xs font-mono mt-1">
              Make sure no one is watching
            </span>
          </button>
        )}
        <div className="grid grid-cols-3 gap-2">
          {words.map((word, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-space-900/60 border border-space-700/30"
            >
              <span className="text-[10px] font-mono text-space-600 w-5 text-right">
                {i + 1}
              </span>
              <span className="text-sm font-mono text-slate-200">{word}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-space p-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0 mt-0.5">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="text-amber-300 text-sm font-heading tracking-wider">
              Write these words down
            </p>
            <p className="text-amber-400/60 text-xs font-mono mt-1">
              This is the ONLY way to recover your wallet. Store it safely
              offline. Never share it with anyone.
            </p>
          </div>
        </div>
      </div>

      {revealed && (
        <button onClick={onConfirm} className="btn-primary w-full">
          I've saved my recovery phrase
        </button>
      )}
    </div>
  );
}

interface InputProps {
  onSubmit: (mnemonic: string) => void;
  error?: string | null;
  loading?: boolean;
}

export function MnemonicInput({ onSubmit, error, loading }: InputProps) {
  const [words, setWords] = useState<string[]>(Array(24).fill(""));
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    // Handle paste of full mnemonic into a single field
    const parts = value.trim().split(/\s+/);
    if (parts.length > 1) {
      for (let i = 0; i < Math.min(parts.length, 24); i++) {
        newWords[i] = parts[i].toLowerCase();
      }
    } else {
      newWords[index] = value.toLowerCase().trim();
    }
    setWords(newWords);
  };

  const handleSubmit = () => {
    if (pasteMode) {
      const cleaned = pasteText.trim().toLowerCase();
      if (cleaned.split(/\s+/).length === 24) {
        onSubmit(cleaned);
      }
    } else {
      const mnemonic = words.join(" ").trim();
      if (mnemonic.split(/\s+/).length === 24) {
        onSubmit(mnemonic);
      }
    }
  };

  const isComplete = pasteMode
    ? pasteText.trim().split(/\s+/).length === 24
    : words.every((w) => w.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setPasteMode(false)}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-heading tracking-wider uppercase transition-all",
            !pasteMode
              ? "bg-crystal-500/20 text-crystal-400 border border-crystal-500/30"
              : "text-space-600 border border-space-700/30"
          )}
        >
          Word by word
        </button>
        <button
          onClick={() => setPasteMode(true)}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-heading tracking-wider uppercase transition-all",
            pasteMode
              ? "bg-crystal-500/20 text-crystal-400 border border-crystal-500/30"
              : "text-space-600 border border-space-700/30"
          )}
        >
          Paste phrase
        </button>
      </div>

      {pasteMode ? (
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your 24-word recovery phrase..."
          className="input-field h-32 resize-none"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {words.map((word, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-space-600 w-5 text-right shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={word}
                onChange={(e) => handleWordChange(i, e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-sm font-mono
                  bg-space-900/60 border border-space-700/30 text-slate-200
                  focus:outline-none focus:border-crystal-500/40
                  placeholder-space-600/40"
                placeholder="..."
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isComplete || loading}
        className="btn-primary w-full"
      >
        {loading ? "Importing..." : "Import Wallet"}
      </button>
    </div>
  );
}
