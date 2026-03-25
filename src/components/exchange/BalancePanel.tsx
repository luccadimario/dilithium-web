'use client';

import { useState } from 'react';
import { useExchangeAuth, API_BASE, authHeader } from '@/hooks/useExchangeAuth';
import { useExchangeAccount, useDepositAddress } from '@/hooks/useExchangeAccount';
import { useQueryClient } from '@tanstack/react-query';

export default function BalancePanel() {
  const { token, isAuthenticated } = useExchangeAuth();
  const { data: account } = useExchangeAccount(token);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'balances' | 'deposit' | 'withdraw'>('balances');
  const [depositCurrency, setDepositCurrency] = useState<'eth' | 'btc' | 'dlt'>('eth');
  const [withdrawCurrency, setWithdrawCurrency] = useState<'ETH' | 'BTC' | 'DLT'>('ETH');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { data: depositInfo } = useDepositAddress(token, depositCurrency);

  if (!isAuthenticated) {
    return (
      <div className="card-space p-4">
        <h3 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-3">
          Balances
        </h3>
        <p className="text-space-600 text-xs">Sign in to view balances.</p>
      </div>
    );
  }

  const balances = account?.balances ?? {};

  const handleWithdraw = async () => {
    if (!token || !withdrawAmount || !withdrawDest) return;
    setIsSending(true);
    setWithdrawStatus(null);
    try {
      const res = await fetch(`${API_BASE}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(token) },
        body: JSON.stringify({
          currency: withdrawCurrency,
          amount: parseFloat(withdrawAmount),
          destination: withdrawDest,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setWithdrawStatus(`Error: ${json.error ?? 'Withdrawal failed'}`);
      } else {
        setWithdrawStatus(`Withdrawal #${json.data.withdrawal_id} queued!`);
        setWithdrawAmount('');
        setWithdrawDest('');
        queryClient.invalidateQueries({ queryKey: ['account'] });
      }
    } catch {
      setWithdrawStatus('Network error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card-space p-4">
      <h3 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-3">
        Wallet
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-space-900 rounded-lg border border-space-800 mb-4">
        {(['balances', 'deposit', 'withdraw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1 rounded-md text-xs font-mono capitalize transition-all ${
              activeTab === tab ? 'bg-space-700 text-white' : 'text-space-600 hover:text-space-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Balances */}
      {activeTab === 'balances' && (
        <div className="space-y-2">
          {(['ETH', 'BTC', 'DLT'] as const).map((cur) => {
            const b = balances[cur];
            const avail = b?.available ?? '0';
            const locked = b?.locked ?? '0';
            return (
              <div key={cur} className="flex justify-between items-center py-2 border-b border-space-800 last:border-0">
                <span className="text-sm font-mono font-bold text-white">{cur}</span>
                <div className="text-right">
                  <div className="text-sm font-mono text-crystal-400">{formatBalance(avail)}</div>
                  {locked !== '0.00000000' && locked !== '0.000000000000000000' && (
                    <div className="text-xs font-mono text-space-600">locked: {formatBalance(locked)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit */}
      {activeTab === 'deposit' && (
        <div className="space-y-3">
          <div className="flex gap-1">
            {(['eth', 'btc', 'dlt'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setDepositCurrency(c)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                  depositCurrency === c
                    ? 'bg-crystal-500/20 border border-crystal-500/30 text-crystal-400'
                    : 'bg-space-900 border border-space-800 text-space-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {depositInfo ? (
            <div className="space-y-2">
              <div className="text-xs font-mono text-space-600">Deposit Address</div>
              <div
                className="bg-space-900 border border-space-700 rounded-lg p-3 font-mono text-xs text-crystal-400 break-all cursor-pointer hover:border-crystal-500/40 transition-colors"
                onClick={() => navigator.clipboard.writeText(depositInfo.address)}
                title="Click to copy"
              >
                {depositInfo.address}
              </div>
              <div className="text-xs text-space-600">{depositInfo.note}</div>
              {depositInfo.from_address && (
                <div className="text-xs text-nebula-400 bg-nebula-500/10 border border-nebula-500/20 rounded p-2">
                  ⚠ Send from your linked address: {depositInfo.from_address.slice(0, 12)}...
                </div>
              )}
            </div>
          ) : (
            <div className="text-space-600 text-xs">Loading deposit address...</div>
          )}
        </div>
      )}

      {/* Withdraw */}
      {activeTab === 'withdraw' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-space-600 mb-1 block">Currency</label>
            <select
              value={withdrawCurrency}
              onChange={(e) => setWithdrawCurrency(e.target.value as 'ETH' | 'BTC' | 'DLT')}
              className="w-full px-3 py-2 bg-space-900 border border-space-700 rounded-lg
                         text-sm font-mono text-white focus:outline-none"
            >
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
              <option value="DLT">DLT</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-space-600 mb-1 block">Amount</label>
            <input
              type="number"
              placeholder="0.0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-3 py-2 bg-space-900 border border-space-700 rounded-lg
                         text-sm font-mono text-white focus:border-crystal-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-space-600 mb-1 block">Destination Address</label>
            <input
              type="text"
              placeholder={withdrawCurrency === 'ETH' ? '0x...' : withdrawCurrency === 'BTC' ? 'bc1...' : 'abc123...'}
              value={withdrawDest}
              onChange={(e) => setWithdrawDest(e.target.value)}
              className="w-full px-3 py-2 bg-space-900 border border-space-700 rounded-lg
                         text-sm font-mono text-white focus:border-crystal-500/50 focus:outline-none"
            />
          </div>

          {withdrawStatus && (
            <div className={`text-xs font-mono px-3 py-2 rounded-lg ${
              withdrawStatus.startsWith('Error')
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}>
              {withdrawStatus}
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={isSending || !withdrawAmount || !withdrawDest}
            className="w-full py-2.5 rounded-lg bg-crystal-500/20 border border-crystal-500/30
                       text-crystal-400 text-sm font-heading font-bold tracking-wide
                       hover:bg-crystal-500/30 transition-all disabled:opacity-50"
          >
            {isSending ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      )}
    </div>
  );
}

function formatBalance(val: string): string {
  if (!val) return '0';
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  if (n === 0) return '0';
  return n.toFixed(6).replace(/\.?0+$/, '') || '0';
}
