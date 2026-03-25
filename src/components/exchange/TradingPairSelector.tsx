'use client';

export type TradingPair = 'DLT-ETH' | 'DLT-BTC';

interface Props {
  pair: TradingPair;
  onChange: (pair: TradingPair) => void;
  ticker?: { last_price: number; high_24h: number; low_24h: number };
}

export default function TradingPairSelector({ pair, onChange, ticker }: Props) {
  const pairs: TradingPair[] = ['DLT-ETH', 'DLT-BTC'];

  return (
    <div className="flex items-center gap-4 px-1">
      <div className="flex gap-1 p-1 rounded-lg bg-space-900 border border-space-700">
        {pairs.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-4 py-1.5 rounded-md text-sm font-mono transition-all ${
              pair === p
                ? 'bg-crystal-500/20 border border-crystal-500/30 text-crystal-400'
                : 'text-space-600 hover:text-space-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {ticker && ticker.last_price > 0 && (
        <div className="flex items-center gap-4 text-sm font-mono">
          <span className="text-white">{formatPrice(pair, ticker.last_price)}</span>
          <span className="text-space-600">H: {formatPrice(pair, ticker.high_24h)}</span>
          <span className="text-space-600">L: {formatPrice(pair, ticker.low_24h)}</span>
        </div>
      )}
    </div>
  );
}

function formatPrice(pair: string, baseUnitPrice: number): string {
  if (pair === 'DLT-ETH') {
    // baseUnitPrice = wei per DLT base unit → ETH per DLT = baseUnitPrice / 1e10
    return (baseUnitPrice / 1e10).toFixed(8) + ' ETH';
  }
  // DLT-BTC: sats per DLT base unit → BTC per DLT = baseUnitPrice / 1e8
  return (baseUnitPrice / 1e8).toFixed(8) + ' BTC';
}
