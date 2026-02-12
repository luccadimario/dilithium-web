'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const DEFAULT_NODE = 'https://api.dilithiumcoin.com';

interface Block {
  Index: number;
  Hash: string;
  PreviousHash: string;
  Timestamp: number;
  Nonce: number;
  difficulty: number;
  transactions: Transaction[];
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  signature: string;
}

interface Stats {
  blockchain: {
    height: number;
    difficulty: number;
    total_txs: number;
    avg_block_time: number;
    hashrate_estimate: number;
  };
  mempool: { size: number };
  peers: { connected: number };
  supply?: {
    circulating?: number;
    circulating_dlt?: string;
    max_supply?: number;
    max_supply_dlt?: string;
  };
  last_block?: {
    index: number;
    hash: string;
    timestamp: number;
    tx_count: number;
  };
}

interface AddressInfo {
  address: string;
  balance_dlt: string;
  total_received_dlt: string;
  total_sent_dlt: string;
  transaction_count: number;
  transactions: {
    signature: string;
    from: string;
    to: string;
    amount_dlt: string;
    timestamp: number;
    block_index: number;
  }[];
}

type Tab = 'overview' | 'blocks' | 'address';

function truncHash(hash: string, len = 12) {
  if (!hash || hash.length <= len * 2) return hash;
  return hash.slice(0, len) + '...' + hash.slice(-len);
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatHashrate(h: number) {
  if (h >= 1e12) return (h / 1e12).toFixed(2) + ' TH/s';
  if (h >= 1e9) return (h / 1e9).toFixed(2) + ' GH/s';
  if (h >= 1e6) return (h / 1e6).toFixed(2) + ' MH/s';
  if (h >= 1e3) return (h / 1e3).toFixed(2) + ' KH/s';
  return h.toFixed(2) + ' H/s';
}

export default function ExplorerPage() {
  const [nodeUrl, setNodeUrl] = useState(DEFAULT_NODE);
  const [nodeInput, setNodeInput] = useState(DEFAULT_NODE);
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  const [addressQuery, setAddressQuery] = useState('');
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [addressError, setAddressError] = useState('');

  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${nodeUrl}/stats`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setConnected(true);
        setError('');
      }
    } catch {
      setConnected(false);
      setError('Cannot connect to node');
    }
  }, [nodeUrl]);

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch(`${nodeUrl}/chain`);
      const json = await res.json();
      if (json.success) {
        setBlocks((json.data.blocks as Block[]).reverse());
      }
    } catch {
      // handled by stats error
    }
  }, [nodeUrl]);

  const fetchAddress = useCallback(async () => {
    if (!addressQuery.trim()) return;
    setAddressError('');
    setAddressInfo(null);
    try {
      const res = await fetch(`${nodeUrl}/explorer/address?addr=${encodeURIComponent(addressQuery.trim())}`);
      const json = await res.json();
      if (json.success) {
        setAddressInfo(json.data);
      } else {
        setAddressError(json.message || 'Address not found');
      }
    } catch {
      setAddressError('Failed to fetch address info');
    }
  }, [nodeUrl, addressQuery]);

  const fetchBlock = useCallback(async (index: number) => {
    try {
      const res = await fetch(`${nodeUrl}/block?index=${index}`);
      const json = await res.json();
      if (json.success) {
        setSelectedBlock(json.data);
      }
    } catch {
      // ignore
    }
  }, [nodeUrl]);

  // Poll stats every 5s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Fetch blocks when tab changes
  useEffect(() => {
    if (tab === 'blocks' || tab === 'overview') {
      fetchBlocks();
    }
  }, [tab, fetchBlocks]);

  const handleConnect = () => {
    setNodeUrl(nodeInput);
    setConnected(false);
    setStats(null);
    setError('');
  };

  const statCards = stats
    ? [
        { label: 'Block Height', value: stats.blockchain.height.toLocaleString() },
        { label: 'Difficulty', value: stats.blockchain.difficulty },
        { label: 'Total TXs', value: stats.blockchain.total_txs.toLocaleString() },
        { label: 'Avg Block Time', value: stats.blockchain.avg_block_time > 0 ? stats.blockchain.avg_block_time.toFixed(1) + 's' : '—' },
        { label: 'Hashrate', value: formatHashrate(stats.blockchain.hashrate_estimate) },
        { label: 'Mempool', value: stats.mempool.size },
        { label: 'Peers', value: stats.peers.connected },
        { label: 'Circulating', value: stats.supply?.circulating_dlt || '—' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-space-950">
      {/* Header */}
      <header className="border-b border-space-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-heading text-xl font-bold tracking-wider text-white hover:text-crystal-400 transition-colors">
              DILITHIUM
            </Link>
            <span className="text-space-600 text-sm">Block Explorer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-space-500">
              {connected
                ? nodeUrl === DEFAULT_NODE ? 'Public seed node' : 'Custom node'
                : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Node connection */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={nodeInput}
            onChange={(e) => setNodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="Node API URL"
            className="flex-1 bg-space-900 border border-space-700 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-crystal-500/50"
          />
          <button
            onClick={handleConnect}
            className="px-4 py-2 rounded-lg bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 transition-colors text-sm font-medium"
          >
            Connect
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error} — Make sure a Dilithium node is running with the API enabled.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-space-800">
          {(['overview', 'blocks', 'address'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedBlock(null); }}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'text-crystal-400 border-b-2 border-crystal-400'
                  : 'text-space-500 hover:text-space-300'
              }`}
            >
              {t === 'address' ? 'Address Lookup' : t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statCards.map((s) => (
                <div key={s.label} className="card-space p-4">
                  <div className="text-xs text-space-500 mb-1">{s.label}</div>
                  <div className="font-heading text-lg font-bold text-white">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Recent blocks */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-space-400 tracking-wider mb-3">RECENT BLOCKS</h3>
              <div className="space-y-2">
                {blocks.slice(0, 10).map((block) => (
                  <button
                    key={block.Index}
                    onClick={() => { setSelectedBlock(block); setTab('blocks'); }}
                    className="w-full card-space p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center font-heading text-sm font-bold text-crystal-400">
                        #{block.Index}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-white">{truncHash(block.Hash)}</div>
                        <div className="text-xs text-space-500">{block.transactions?.length || 0} txs</div>
                      </div>
                    </div>
                    <div className="text-xs text-space-500">{timeAgo(block.Timestamp)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blocks Tab */}
        {tab === 'blocks' && !selectedBlock && (
          <div className="space-y-2">
            {blocks.map((block) => (
              <button
                key={block.Index}
                onClick={() => fetchBlock(block.Index)}
                className="w-full card-space p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center font-heading text-sm font-bold text-crystal-400">
                    #{block.Index}
                  </div>
                  <div>
                    <div className="font-mono text-sm text-white">{truncHash(block.Hash)}</div>
                    <div className="text-xs text-space-500">
                      {block.transactions?.length || 0} txs | Nonce: {block.Nonce?.toLocaleString()} | Difficulty: {block.difficulty}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-space-500">{timeAgo(block.Timestamp)}</div>
              </button>
            ))}
            {blocks.length === 0 && connected && (
              <div className="text-center text-space-500 py-12">No blocks found</div>
            )}
          </div>
        )}

        {/* Block Detail */}
        {tab === 'blocks' && selectedBlock && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedBlock(null)}
              className="text-crystal-400 hover:text-crystal-300 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to blocks
            </button>

            <div className="card-space p-6">
              <h3 className="font-heading text-lg font-bold text-white mb-4">
                Block #{selectedBlock.Index}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-space-500 sm:w-36 shrink-0">Hash</span>
                  <span className="font-mono text-crystal-400 break-all">{selectedBlock.Hash}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-space-500 sm:w-36 shrink-0">Previous Hash</span>
                  <span className="font-mono text-space-300 break-all">{selectedBlock.PreviousHash}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-space-500 sm:w-36 shrink-0">Timestamp</span>
                  <span className="text-white">{new Date(selectedBlock.Timestamp * 1000).toLocaleString()} ({timeAgo(selectedBlock.Timestamp)})</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-space-500 sm:w-36 shrink-0">Nonce</span>
                  <span className="text-white font-mono">{selectedBlock.Nonce?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-space-500 sm:w-36 shrink-0">Difficulty</span>
                  <span className="text-white">{selectedBlock.difficulty}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-space-500 sm:w-36 shrink-0">Transactions</span>
                  <span className="text-white">{selectedBlock.transactions?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Transactions in block */}
            {selectedBlock.transactions && selectedBlock.transactions.length > 0 && (
              <div>
                <h4 className="font-heading text-sm font-semibold text-space-400 tracking-wider mb-3">TRANSACTIONS</h4>
                <div className="space-y-2">
                  {selectedBlock.transactions.map((tx, i) => (
                    <div key={i} className="card-space p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-xs text-space-500">
                            From: <span className="font-mono text-space-300">{tx.from === '' ? 'COINBASE' : truncHash(tx.from, 16)}</span>
                          </div>
                          <div className="text-xs text-space-500">
                            To: <button onClick={() => { setAddressQuery(tx.to); setTab('address'); fetchAddress(); }} className="font-mono text-crystal-400 hover:text-crystal-300">{truncHash(tx.to, 16)}</button>
                          </div>
                        </div>
                        <div className="font-heading font-bold text-white">
                          {(tx.amount / 100000000).toFixed(8)} DLT
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Address Tab */}
        {tab === 'address' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAddress()}
                placeholder="Enter wallet address..."
                className="flex-1 bg-space-900 border border-space-700 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-crystal-500/50"
              />
              <button
                onClick={fetchAddress}
                className="px-4 py-2 rounded-lg bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 transition-colors text-sm font-medium"
              >
                Search
              </button>
            </div>

            {addressError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {addressError}
              </div>
            )}

            {addressInfo && (
              <div className="space-y-4">
                <div className="card-space p-6">
                  <h3 className="font-heading text-sm font-semibold text-space-400 tracking-wider mb-4">ADDRESS</h3>
                  <div className="font-mono text-crystal-400 text-sm break-all mb-4">{addressInfo.address}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-space-500">Balance</div>
                      <div className="font-heading font-bold text-white">{addressInfo.balance_dlt} DLT</div>
                    </div>
                    <div>
                      <div className="text-xs text-space-500">Received</div>
                      <div className="font-heading font-bold text-green-400">{addressInfo.total_received_dlt} DLT</div>
                    </div>
                    <div>
                      <div className="text-xs text-space-500">Sent</div>
                      <div className="font-heading font-bold text-red-400">{addressInfo.total_sent_dlt} DLT</div>
                    </div>
                    <div>
                      <div className="text-xs text-space-500">Transactions</div>
                      <div className="font-heading font-bold text-white">{addressInfo.transaction_count}</div>
                    </div>
                  </div>
                </div>

                {addressInfo.transactions && addressInfo.transactions.length > 0 && (
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-space-400 tracking-wider mb-3">TRANSACTION HISTORY</h4>
                    <div className="space-y-2">
                      {addressInfo.transactions.map((tx, i) => (
                        <div key={i} className="card-space p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="text-xs">
                              {tx.from === addressInfo.address ? (
                                <span className="text-red-400">Sent to </span>
                              ) : (
                                <span className="text-green-400">Received from </span>
                              )}
                              <span className="font-mono text-space-300">
                                {tx.from === addressInfo.address
                                  ? truncHash(tx.to, 16)
                                  : tx.from === '' ? 'COINBASE' : truncHash(tx.from, 16)}
                              </span>
                            </div>
                            <div className="text-xs text-space-500">
                              Block #{tx.block_index} | {timeAgo(tx.timestamp)}
                            </div>
                          </div>
                          <div className={`font-heading font-bold ${tx.from === addressInfo.address ? 'text-red-400' : 'text-green-400'}`}>
                            {tx.from === addressInfo.address ? '-' : '+'}{tx.amount_dlt} DLT
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!addressInfo && !addressError && (
              <div className="text-center text-space-500 py-12">
                Enter a wallet address to view balance and transaction history.
              </div>
            )}
          </div>
        )}

        {/* Not connected placeholder */}
        {!connected && !error && (
          <div className="text-center text-space-500 py-12">
            Connecting to node...
          </div>
        )}
      </div>
    </div>
  );
}
