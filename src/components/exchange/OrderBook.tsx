'use client';

import { useOrderBook } from '@/hooks/useOrderBook';
import type { TradingPair } from './TradingPairSelector';

interface Props {
  pair: TradingPair;
  onPriceClick?: (price: number) => void;
}

export default function OrderBook({ pair, onPriceClick }: Props) {
  const { data, isLoading } = useOrderBook(pair);

  const bids = data?.bids?.slice(0, 12) ?? [];
  const asks = data?.asks?.slice(0, 12) ?? [];

  const quoteSymbol = pair === 'DLT-ETH' ? 'ETH' : 'BTC';

  // Find max volume for depth visualization
  const maxBidVol = bids.reduce((m, b) => Math.max(m, b.amount), 0);
  const maxAskVol = asks.reduce((m, a) => Math.max(m, a.amount), 0);
  const maxVol = Math.max(maxBidVol, maxAskVol, 1);

  const spread = bids.length > 0 && asks.length > 0
    ? Math.abs(asks[0].price - bids[0].price)
    : 0;

  return (
    <div className="card-space p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm font-semibold text-white tracking-wide uppercase">Order Book</h3>
        <span className="text-xs font-mono text-space-600">{pair}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 mb-2 text-xs font-mono text-space-600 uppercase tracking-wider">
        <span>Price ({quoteSymbol})</span>
        <span className="text-right">Amount (DLT)</span>
      </div>

      {isLoading ? (
        <div className="text-space-600 text-xs text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Asks (sells) — reversed so lowest ask is closest to spread */}
          <div className="space-y-0.5 mb-2">
            {[...asks].reverse().map((level, i) => (
              <button
                key={i}
                className="w-full relative flex justify-between text-xs font-mono py-0.5 px-1 rounded hover:bg-space-800 transition-colors"
                onClick={() => onPriceClick?.(level.price)}
              >
                {/* Depth bar */}
                <div
                  className="absolute inset-y-0 right-0 bg-red-500/10 rounded"
                  style={{ width: `${(level.amount / maxVol) * 100}%` }}
                />
                <span className="relative text-red-400">{humanPrice(pair, level.price)}</span>
                <span className="relative text-space-500">{humanDLT(level.amount)}</span>
              </button>
            ))}
          </div>

          {/* Spread */}
          <div className="text-center py-1 border-y border-space-800 mb-2">
            <span className="text-xs font-mono text-space-600">
              Spread: {humanPrice(pair, spread)}
            </span>
          </div>

          {/* Bids (buys) */}
          <div className="space-y-0.5">
            {bids.map((level, i) => (
              <button
                key={i}
                className="w-full relative flex justify-between text-xs font-mono py-0.5 px-1 rounded hover:bg-space-800 transition-colors"
                onClick={() => onPriceClick?.(level.price)}
              >
                <div
                  className="absolute inset-y-0 right-0 bg-green-500/10 rounded"
                  style={{ width: `${(level.amount / maxVol) * 100}%` }}
                />
                <span className="relative text-green-400">{humanPrice(pair, level.price)}</span>
                <span className="relative text-space-500">{humanDLT(level.amount)}</span>
              </button>
            ))}
          </div>

          {bids.length === 0 && asks.length === 0 && (
            <div className="text-space-600 text-xs text-center py-6">No orders yet</div>
          )}
        </>
      )}
    </div>
  );
}

function humanPrice(pair: string, baseUnitPrice: number): string {
  if (baseUnitPrice === 0) return '0';
  if (pair === 'DLT-ETH') return (baseUnitPrice / 1e10).toFixed(8);
  return (baseUnitPrice / 1e8).toFixed(8);
}

function humanDLT(baseUnits: number): string {
  return (baseUnits / 1e8).toFixed(4);
}
