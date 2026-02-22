import { useEffect, useRef, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { copyToClipboard, vibrate } from "../lib/utils";
import qrcode from "qrcode-generator";

interface Props {
  onBack: () => void;
}

export default function Receive({ onBack }: Props) {
  const { activeWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const address = activeWallet?.checksumAddress ?? "";

  useEffect(() => {
    if (!qrRef.current || !address) return;

    const qr = qrcode(0, "M");
    qr.addData(address);
    qr.make();

    const size = qr.getModuleCount();
    const cellSize = 6;
    const margin = 16;
    const totalSize = size * cellSize + margin * 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
      <rect width="${totalSize}" height="${totalSize}" fill="#0a0f1e" rx="12"/>
      ${Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => {
          if (!qr.isDark(row, col)) return "";
          const x = col * cellSize + margin;
          const y = row * cellSize + margin;
          return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#00bfef"/>`;
        }).join("")
      ).join("")}
    </svg>`;

    qrRef.current.innerHTML = svg;
  }, [address]);

  const handleCopy = async () => {
    await copyToClipboard(address);
    vibrate();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      <div className="px-4 flex flex-col items-center">
        <h2 className="font-heading text-xl font-bold tracking-wider text-slate-200 mb-1">
          Receive DLT
        </h2>
        <p className="text-space-600 text-xs font-mono mb-8">
          Share your address or scan the QR code
        </p>

        {/* QR Code */}
        <div className="card-space p-6 mb-6 inline-block">
          <div ref={qrRef} className="rounded-lg overflow-hidden" />
        </div>

        {/* Address display */}
        <div className="w-full max-w-sm">
          <div className="card-space p-4">
            <label className="text-[10px] font-heading tracking-widest text-space-600 uppercase mb-2 block">
              Your Address
            </label>
            <p className="text-xs font-mono text-crystal-400 break-all leading-relaxed mb-3">
              {address}
            </p>
            <button
              onClick={handleCopy}
              className="btn-secondary w-full text-xs"
            >
              {copied ? (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Address
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 max-w-sm">
          <div className="card-space p-4 border-crystal-500/10">
            <div className="flex gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-crystal-500/60 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-space-600 text-xs font-mono leading-relaxed">
                Only send <span className="text-crystal-400">DLT</span> to this address.
                Sending other cryptocurrencies will result in permanent loss.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
