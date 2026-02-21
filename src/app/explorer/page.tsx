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
  amount_dlt?: string;
  fee?: number;
  data?: string;
  timestamp: number;
  signature: string;
  block_index?: number;
}

interface Stats {
  blockchain: {
    height: number;
    difficulty: number;
    difficulty_bits: number;
    total_txs: number;
    avg_block_time: number;
    hashrate_estimate: number;
  };
  mempool: { size: number };
  peers: { connected: number };
  supply?: {
    total_supply?: string;
    total_supply_raw?: number;
    max_supply?: string;
    max_supply_raw?: number;
    current_block_reward?: string;
    percent_mined?: number;
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
  transactions: Transaction[];
}

type Tab = 'overview' | 'blocks' | 'address' | 'mempool' | 'transaction';

function truncHash(hash: string, len = 12) {
  if (!hash) return hash;
  return hash; // Disable truncation as requested
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [mempoolTxs, setMempoolTxs] = useState<Transaction[]>([]);

  const [addressQuery, setAddressQuery] = useState('');
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [addressError, setAddressError] = useState('');

  const [error, setError] = useState('');

  const [blocksPage, setBlocksPage] = useState(0);
  const [blocksTotalPages, setBlocksTotalPages] = useState(0);
  const BLOCKS_PER_PAGE = 20;

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

  const fetchBlocks = useCallback(async (uiPage: number = 0) => {
    try {
      // Get total pages from a lightweight request
      const metaRes = await fetch(`${nodeUrl}/chain?limit=${BLOCKS_PER_PAGE}`);
      const metaJson = await metaRes.json();
      if (!metaJson.success) return;

      const totalApiPages = metaJson.data.total_pages || 1;
      setBlocksTotalPages(totalApiPages);

      // UI page 0 = newest blocks = last API page
      const apiPage = Math.max(0, totalApiPages - 1 - uiPage);

      if (apiPage === 0 && totalApiPages <= 1) {
        // Only one page total, use the data we already fetched
        setBlocks((metaJson.data.blocks as Block[]).reverse());
        return;
      }

      const pageRes = await fetch(`${nodeUrl}/chain?limit=${BLOCKS_PER_PAGE}&page=${apiPage}`);
      const pageJson = await pageRes.json();
      if (pageJson.success) {
        setBlocks((pageJson.data.blocks as Block[]).reverse());
      }
    } catch {
      // handled by stats error
    }
  }, [nodeUrl]);

  const fetchMempool = useCallback(async () => {
    try {
      const res = await fetch(`${nodeUrl}/mempool`);
      const json = await res.json();
      if (json.success) {
        setMempoolTxs(json.data.transactions || []);
      }
    } catch {
      // ignore
    }
  }, [nodeUrl]);

  const fetchAddress = useCallback(async (addr?: string) => {
    const query = (addr ?? addressQuery).trim();
    if (!query) return;
    setAddressError('');
    setAddressInfo(null);
    try {
      const res = await fetch(`${nodeUrl}/explorer/address?addr=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        const data = json.data as AddressInfo;
        // Sort transactions by most recent first
        if (data.transactions) {
          data.transactions.sort((a, b) => (b.block_index || 0) - (a.block_index || 0) || b.timestamp - a.timestamp);
        }
        setAddressInfo(data);
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

  const fetchTransaction = useCallback(async (sig: string) => {
    try {
      const res = await fetch(`${nodeUrl}/transaction?sig=${encodeURIComponent(sig)}`);
      const json = await res.json();
      if (json.success) {
        setSelectedTransaction(json.data);
        setTab('transaction');
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
      setBlocksPage(0);
      fetchBlocks(0);
    } else if (tab === 'mempool') {
      fetchMempool();
    }
  }, [tab, fetchBlocks, fetchMempool]);

  const handleConnect = () => {
    setNodeUrl(nodeInput);
    setConnected(false);
    setStats(null);
    setError('');
  };

  const statCards = stats
    ? [
        { label: 'Block Height', value: stats.blockchain.height.toLocaleString(), action: () => { setTab('blocks'); setSelectedBlock(null); } },
        { label: 'Difficulty', value: stats.blockchain.difficulty_bits ? `${stats.blockchain.difficulty_bits} bits` : stats.blockchain.difficulty },
        { label: 'Total TXs', value: stats.blockchain.total_txs.toLocaleString() },
        { label: 'Avg Block Time', value: stats.blockchain.avg_block_time > 0 ? stats.blockchain.avg_block_time.toFixed(1) + 's' : '—' },
        { label: 'Hashrate', value: formatHashrate(stats.blockchain.hashrate_estimate) },
        { label: 'Mempool', value: stats.mempool.size, action: () => { setTab('mempool'); fetchMempool(); } },
        { label: 'Peers', value: stats.peers.connected },
        { label: 'Circulating', value: stats.supply?.total_supply ? `${parseFloat(stats.supply.total_supply).toLocaleString()} DLT` : '—' },
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
          {(['overview', 'blocks', 'mempool', 'address'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedBlock(null); setSelectedTransaction(null); }}
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
                <button
                  key={s.label}
                  onClick={s.action}
                  disabled={!s.action}
                  className={`card-space p-4 text-left transition-all ${s.action ? 'hover:border-crystal-500/50 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="text-xs text-space-500 mb-1">{s.label}</div>
                  <div className="font-heading text-lg font-bold text-white truncate">{s.value}</div>
                </button>
              ))}
            </div>

            {/* Recent blocks */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-space-400 tracking-wider mb-3">RECENT BLOCKS</h3>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <button
                    key={block.Index}
                    onClick={() => { setSelectedBlock(block); setTab('blocks'); }}
                    className="w-full card-space p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 px-3 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center font-heading text-xs font-bold text-crystal-400 shrink-0">
                        #{block.Index.toLocaleString()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm text-white break-all">{truncHash(block.Hash)}</div>
                        <div className="text-xs text-space-500">{block.transactions?.length || 0} txs</div>
                      </div>
                    </div>
                    <div className="text-xs text-space-500 shrink-0 ml-2">{timeAgo(block.Timestamp)}</div>
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
                  <div className="h-10 px-3 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center font-heading text-xs font-bold text-crystal-400 shrink-0">
                    #{block.Index.toLocaleString()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm text-white break-all">{truncHash(block.Hash)}</div>
                    <div className="text-xs text-space-500">
                      {block.transactions?.length || 0} txs | Nonce: {block.Nonce?.toLocaleString()} | Difficulty: {(block as any).DifficultyBits ? `${(block as any).DifficultyBits} bits` : block.difficulty}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-space-500 shrink-0 ml-2">{timeAgo(block.Timestamp)}</div>
              </button>
            ))}
            {blocksTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => { const p = blocksPage - 1; setBlocksPage(p); fetchBlocks(p); }}
                  disabled={blocksPage === 0}
                  className="px-4 py-2 rounded-lg bg-space-800 border border-space-700 text-sm text-space-400 hover:text-crystal-400 hover:border-crystal-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Newer
                </button>
                <span className="text-xs text-space-500">
                  Page {blocksPage + 1} of {blocksTotalPages}
                </span>
                <button
                  onClick={() => { const p = blocksPage + 1; setBlocksPage(p); fetchBlocks(p); }}
                  disabled={blocksPage >= blocksTotalPages - 1}
                  className="px-4 py-2 rounded-lg bg-space-800 border border-space-700 text-sm text-space-400 hover:text-crystal-400 hover:border-crystal-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Older →
                </button>
              </div>
            )}
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
                  <span className="text-white">{(selectedBlock as any).DifficultyBits ? `${(selectedBlock as any).DifficultyBits} bits` : selectedBlock.difficulty}</span>
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
                    <button
                      key={i}
                      onClick={() => { setSelectedTransaction(tx); setTab('transaction'); }}
                      className="w-full card-space p-4 text-left hover:border-crystal-500/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="text-xs text-space-500 truncate">
                            From: <span className="font-mono text-space-300">{tx.from === '' ? 'COINBASE' : tx.from}</span>
                          </div>
                          <div className="text-xs text-space-500 truncate">
                            To: <span className="font-mono text-crystal-400">{tx.to}</span>
                          </div>
                          {tx.data && (
                            <div className="text-xs text-space-500 truncate">
                              Memo: <span className="text-amber-400/80">{tx.data}</span>
                            </div>
                          )}
                        </div>
                        <div className="font-heading font-bold text-white shrink-0">
                          {(tx.amount / 100000000).toFixed(8)} DLT
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mempool Tab */}
        {tab === 'mempool' && (
          <div className="space-y-4">
            <h3 className="font-heading text-sm font-semibold text-space-400 tracking-wider mb-3 uppercase">Mempool Transactions ({mempoolTxs.length})</h3>
            <div className="space-y-2">
              {mempoolTxs.map((tx, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedTransaction(tx); setTab('transaction'); }}
                  className="w-full card-space p-4 text-left hover:border-crystal-500/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs text-space-500 truncate">
                        From: <span className="font-mono text-space-300">{tx.from === '' ? 'COINBASE' : tx.from}</span>
                      </div>
                      <div className="text-xs text-space-500 truncate">
                        To: <span className="font-mono text-crystal-400">{tx.to}</span>
                      </div>
                    </div>
                    <div className="font-heading font-bold text-white shrink-0">
                      {tx.amount_dlt || (tx.amount / 100000000).toFixed(8)} DLT
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-space-600 font-mono truncate">{tx.signature}</div>
                </button>
              ))}
              {mempoolTxs.length === 0 && (
                <div className="text-center text-space-500 py-12 card-space">
                  No transactions in mempool
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction Detail */}
        {tab === 'transaction' && selectedTransaction && (
          <div className="space-y-4">
            <button
              onClick={() => {
                if (selectedBlock) setTab('blocks');
                else if (addressInfo) setTab('address');
                else setTab('overview');
                setSelectedTransaction(null);
              }}
              className="text-crystal-400 hover:text-crystal-300 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="card-space p-6">
              <h3 className="font-heading text-lg font-bold text-white mb-4">
                Transaction Details
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-space-500">Signature (TXID)</span>
                  <span className="font-mono text-crystal-400 break-all bg-space-900/50 p-3 rounded border border-space-800">{selectedTransaction.signature}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-space-500">From</span>
                      <button
                        onClick={() => { if (selectedTransaction.from) { setAddressQuery(selectedTransaction.from); setTab('address'); fetchAddress(selectedTransaction.from); setSelectedTransaction(null); } }}
                        className="font-mono text-white text-left break-all hover:text-crystal-400 transition-colors"
                      >
                        {selectedTransaction.from === '' ? 'COINBASE' : selectedTransaction.from}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-space-500">To</span>
                      <button
                        onClick={() => { setAddressQuery(selectedTransaction.to); setTab('address'); fetchAddress(selectedTransaction.to); setSelectedTransaction(null); }}
                        className="font-mono text-crystal-400 text-left break-all hover:text-crystal-300 transition-colors"
                      >
                        {selectedTransaction.to}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-space-500">Amount</span>
                      <span className="font-heading font-bold text-white text-xl">
                        {selectedTransaction.amount_dlt || (selectedTransaction.amount / 100000000).toFixed(8)} DLT
                      </span>
                    </div>
                    {selectedTransaction.data && (
                      <div className="flex flex-col gap-1">
                        <span className="text-space-500">Memo</span>
                        <span className="text-amber-400 bg-space-900/50 p-3 rounded border border-space-800">{selectedTransaction.data}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-space-500">Timestamp</span>
                      <span className="text-white">{new Date(selectedTransaction.timestamp * 1000).toLocaleString()} ({timeAgo(selectedTransaction.timestamp)})</span>
                    </div>
                    {selectedTransaction.block_index !== undefined && (
                      <div className="flex flex-col gap-1">
                        <span className="text-space-500">Included in Block</span>
                        <button
                          onClick={() => { fetchBlock(selectedTransaction.block_index!); setTab('blocks'); setSelectedTransaction(null); }}
                          className="font-heading font-bold text-crystal-400 text-left hover:text-crystal-300 transition-colors"
                        >
                          #{selectedTransaction.block_index}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
                onClick={() => fetchAddress()}
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
                        <button
                          key={i}
                          onClick={() => { setSelectedTransaction(tx); setTab('transaction'); }}
                          className="w-full card-space p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:border-crystal-500/50 transition-colors"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-xs truncate">
                              {tx.from === addressInfo.address ? (
                                <span className="text-red-400">Sent to </span>
                              ) : (
                                <span className="text-green-400">Received from </span>
                              )}
                              <span className="font-mono text-space-300">
                                {tx.from === addressInfo.address
                                  ? tx.to
                                  : (tx.from === 'SYSTEM' || tx.from === '') ? 'COINBASE' : tx.from}
                              </span>
                            </div>
                            <div className="text-xs text-space-500">
                              Block #{tx.block_index} | {timeAgo(tx.timestamp)}
                            </div>
                            {tx.data && (
                              <div className="text-xs text-space-500 truncate">
                                Memo: <span className="text-amber-400/80">{tx.data}</span>
                              </div>
                            )}
                          </div>
                          <div className={`font-heading font-bold shrink-0 ${tx.from === addressInfo.address ? 'text-red-400' : 'text-green-400'}`}>
                            {tx.from === addressInfo.address ? '-' : '+'}{tx.amount_dlt} DLT
                          </div>
                        </button>
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
