'use client';

import { useState } from 'react';
import { useTicker } from '@/hooks/useOrderBook';
import ConnectWallet from '@/components/exchange/ConnectWallet';
import TradingPairSelector, { type TradingPair } from '@/components/exchange/TradingPairSelector';
import OrderBook from '@/components/exchange/OrderBook';
import TradeHistory from '@/components/exchange/TradeHistory';
import OrderForm from '@/components/exchange/OrderForm';
import AccountPanel from '@/components/exchange/AccountPanel';
import BalancePanel from '@/components/exchange/BalancePanel';

export default function ExchangePage() {
  const [pair, setPair] = useState<TradingPair>('DLT-ETH');
  const [prefilledPrice, setPrefilledPrice] = useState<number | undefined>(undefined);
  const { data: ticker } = useTicker(pair);

  return (
    <div className="min-h-screen bg-space-950 text-white relative overflow-x-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-space-900/30 to-transparent pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-space-800 bg-space-950/80 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Logo + pair selector */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-crystal-400 tracking-widest uppercase">
                DLT
              </span>
              <span className="text-space-600 text-xs font-mono">Exchange</span>
            </div>
            <TradingPairSelector pair={pair} onChange={setPair} ticker={ticker} />
          </div>

          {/* Wallet */}
          <ConnectWallet />
        </div>
      </header>

      {/* Main grid */}
      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-3 h-full">

          {/* Left column — Order Book + Trade History */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
            <OrderBook pair={pair} onPriceClick={setPrefilledPrice} />
            <TradeHistory pair={pair} />
          </div>

          {/* Center column — Order Form */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-3">
            {/* Price chart placeholder */}
            <div className="card-space p-4 h-48 flex items-center justify-center">
              <span className="text-space-600 text-xs font-mono">
                Price chart coming soon
              </span>
            </div>
            <OrderForm pair={pair} prefilledPrice={prefilledPrice} />
          </div>

          {/* Right column — Account + Balances */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
            <BalancePanel />
            <AccountPanel />
          </div>

        </div>
      </main>
    </div>
  );
}
