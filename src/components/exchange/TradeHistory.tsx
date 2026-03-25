'use client';

import { useTrades } from '@/hooks/useOrderBook';
import type { TradingPair } from './TradingPairSelector';

interface Props { pair: TradingPair }

export default function TradeHistory({ pair }: Props) {
  const { data: trades } = useTrades(pair);

  return (
    <div className="card-space p-4">
      <h3 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-3">
        Trade History
      </h3>

      <div className="grid grid-cols-3 gap-1 mb-2 text-xs font-mono text-space-600 uppercase tracking-wider">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {!trades || trades.length === 0 ? (
          <div className="text-space-600 text-xs text-center py-4">No trades yet</div>
        ) : (
          trades.map((trade: {id: number; side: string; price: number; amount: number; executed_at: number}) => (
            <div key={trade.id} className="grid grid-cols-3 gap-1 text-xs font-mono py-0.5">
              <span className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                {humanPrice(pair, trade.price)}
              </span>
              <span className="text-right text-space-500">{humanDLT(trade.amount)}</span>
              <span className="text-right text-space-600">{formatTime(trade.executed_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function humanPrice(pair: string, p: number): string {
  if (pair === 'DLT-ETH') return (p / 1e10).toFixed(6);
  return (p / 1e8).toFixed(6);
}

function humanDLT(baseUnits: number): string {
  return (baseUnits / 1e8).toFixed(2);
}

function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
