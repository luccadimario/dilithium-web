import { useState } from "react";

interface Props {
  mnemonic: string;
  onConfirmed: () => void;
}

export default function BackupMnemonic({ mnemonic, onConfirmed }: Props) {
  const words = mnemonic.split(" ");
  const [revealed, setRevealed] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  // Pick 3 random word indices for verification
  const [verifyIndices] = useState(() => {
    const indices: number[] = [];
    while (indices.length < 3) {
      const i = Math.floor(Math.random() * 24);
      if (!indices.includes(i)) indices.push(i);
    }
    return indices.sort((a, b) => a - b);
  });
  const [verifyInputs, setVerifyInputs] = useState(["", "", ""]);
  const [verifyError, setVerifyError] = useState(false);

  const handleVerify = () => {
    const correct = verifyIndices.every(
      (wordIdx, i) =>
        verifyInputs[i].trim().toLowerCase() === words[wordIdx].toLowerCase()
    );
    if (correct) {
      onConfirmed();
    } else {
      setVerifyError(true);
      setTimeout(() => setVerifyError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pb-10 safe-top">
      {!confirmStep ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200">
                Back Up Now
              </h2>
              <p className="text-amber-400/80 text-xs font-mono">
                This cannot be viewed again
              </p>
            </div>
          </div>

          {/* Critical warning */}
          <div className="card-space p-4 mb-6 border-red-500/30 bg-red-500/5">
            <p className="text-red-300 text-sm font-mono leading-relaxed">
              Your <span className="text-red-200 font-bold">24-word recovery phrase</span> is
              the ONLY way to recover your wallet. If you lose it, your funds are
              gone forever. No one can help you — not even us.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-red-400/70 text-xs font-mono">
                Write it on paper. Never store it digitally. Never share it.
              </p>
            </div>
          </div>

          {/* Mnemonic grid — hidden until revealed */}
          <div className="relative mb-6">
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center
                  bg-space-900/95 backdrop-blur-sm rounded-2xl border border-space-700/30"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-crystal-400 mb-3">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-crystal-400 font-heading text-sm tracking-wider uppercase">
                  Tap to reveal
                </span>
                <span className="text-space-600 text-xs font-mono mt-1">
                  Make sure no one is watching your screen
                </span>
              </button>
            )}
            <div className="card-space p-4">
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg bg-space-900/60 border border-space-700/30"
                  >
                    <span className="text-[10px] font-mono text-space-600 w-5 text-right">
                      {i + 1}
                    </span>
                    <span className="text-sm font-mono text-slate-200">
                      {revealed ? word : "••••"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {revealed && (
            <button
              onClick={() => setConfirmStep(true)}
              className="btn-primary w-full"
            >
              I've written it down
            </button>
          )}
        </>
      ) : (
        <>
          <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-2">
            Verify Backup
          </h2>
          <p className="text-space-600 text-xs font-mono mb-6">
            Enter the following words from your recovery phrase to confirm you saved it
          </p>

          <div className="space-y-4 mb-6">
            {verifyIndices.map((wordIdx, i) => (
              <div key={wordIdx}>
                <label className="text-xs font-heading tracking-wider text-space-600 uppercase mb-1.5 block">
                  Word #{wordIdx + 1}
                </label>
                <input
                  type="text"
                  value={verifyInputs[i]}
                  onChange={(e) => {
                    const next = [...verifyInputs];
                    next[i] = e.target.value;
                    setVerifyInputs(next);
                    setVerifyError(false);
                  }}
                  className="input-field"
                  placeholder={`Enter word #${wordIdx + 1}`}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="off"
                />
              </div>
            ))}
          </div>

          {verifyError && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <p className="text-red-400 text-xs font-mono">
                Incorrect. Go back and check your written backup.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={verifyInputs.some((v) => !v.trim())}
              className="btn-primary w-full"
            >
              Verify & Continue
            </button>
            <button
              onClick={() => {
                setConfirmStep(false);
                setVerifyInputs(["", "", ""]);
                setVerifyError(false);
              }}
              className="btn-secondary w-full"
            >
              Show Phrase Again
            </button>
          </div>
        </>
      )}
    </div>
  );
}
