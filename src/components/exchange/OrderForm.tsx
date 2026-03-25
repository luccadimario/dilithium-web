'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useExchangeAuth, API_BASE, authHeader } from '@/hooks/useExchangeAuth';
import type { TradingPair } from './TradingPairSelector';

interface Props {
  pair: TradingPair;
  prefilledPrice?: number; // from order book click (base units)
}

export default function OrderForm({ pair, prefilledPrice }: Props) {
  const { token, isAuthenticated } = useExchangeAuth();
  const queryClient = useQueryClient();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState(
    prefilledPrice ? humanPriceStr(pair, prefilledPrice) : ''
  );
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const quoteSymbol = pair === 'DLT-ETH' ? 'ETH' : 'BTC';

  const handleSubmit = async () => {
    if (!token || !amount) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const body: Record<string, unknown> = {
        pair,
        side,
        order_type: orderType,
        amount: parseFloat(amount),
      };
      if (orderType === 'limit') {
        if (!price) { setFeedback({ type: 'error', msg: 'Price required for limit orders' }); return; }
        body.price = parseFloat(price);
      }

      const res = await fetch(`${API_BASE}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(token) },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setFeedback({ type: 'error', msg: json.error ?? 'Order failed' });
      } else {
        const trades = json.data?.trades ?? [];
        setFeedback({
          type: 'success',
          msg: trades.length > 0
            ? `Filled ${trades.length} trade(s)!`
            : 'Order placed successfully',
        });
        setAmount('');
        queryClient.invalidateQueries({ queryKey: ['orderbook'] });
        queryClient.invalidateQueries({ queryKey: ['account'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card-space p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-space-600 text-sm text-center">
          Connect your wallet and sign in to place orders.
        </p>
      </div>
    );
  }

  return (
    <div className="card-space p-6">
      {/* Buy / Sell */}
      <div className="flex gap-2 mb-5">
        {(['buy', 'sell'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-heading font-bold tracking-wide transition-all ${
              side === s
                ? s === 'buy'
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                  : 'bg-red-500/20 border border-red-500/40 text-red-400'
                : 'bg-space-800 border border-space-700 text-space-600 hover:text-space-400'
            }`}
          >
            {s === 'buy' ? 'Buy DLT' : 'Sell DLT'}
          </button>
        ))}
      </div>

      {/* Order type */}
      <div className="flex gap-1 mb-5 p-1 bg-space-900 rounded-lg border border-space-800">
        {(['limit', 'market'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-mono transition-all capitalize ${
              orderType === t
                ? 'bg-space-700 text-white'
                : 'text-space-600 hover:text-space-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Price (limit only) */}
        {orderType === 'limit' && (
          <div>
            <label className="text-xs font-mono text-space-600 mb-1 block">
              Price ({quoteSymbol} per DLT)
            </label>
            <input
              type="number"
              placeholder="0.00000000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-space-900 border border-space-700 rounded-lg
                         text-sm font-mono text-white focus:border-crystal-500/50 focus:outline-none transition-colors"
              step="0.00000001"
              min="0"
            />
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-xs font-mono text-space-600 mb-1 block">Amount (DLT)</label>
          <input
            type="number"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-space-900 border border-space-700 rounded-lg
                       text-sm font-mono text-white focus:border-crystal-500/50 focus:outline-none transition-colors"
            step="0.00000001"
            min="0"
          />
        </div>

        {/* Total (limit only) */}
        {orderType === 'limit' && price && amount && (
          <div className="text-xs font-mono text-space-600 text-right">
            Total ≈ {(parseFloat(price) * parseFloat(amount)).toFixed(8)} {quoteSymbol}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`text-xs font-mono px-3 py-2 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount}
          className={`w-full py-3 rounded-lg font-heading font-bold text-sm tracking-wide transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed ${
            side === 'buy'
              ? 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
          }`}
        >
          {isSubmitting ? 'Placing...' : `${side === 'buy' ? 'Buy' : 'Sell'} DLT`}
        </button>
      </div>
    </div>
  );
}

function humanPriceStr(pair: string, baseUnitPrice: number): string {
  if (pair === 'DLT-ETH') return (baseUnitPrice / 1e10).toFixed(8);
  return (baseUnitPrice / 1e8).toFixed(8);
}
