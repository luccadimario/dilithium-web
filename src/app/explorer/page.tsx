'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ExplorerTutorial from '@/components/ExplorerTutorial';

const DEFAULT_NODE = 'https://api.dilithiumcoin.com';

interface Block {
  Index: number;
  Hash: string;
  PreviousHash: string;
  Timestamp: number;
  Nonce: number;
  difficulty: number;
  DifficultyBits?: number;
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

interface StatsSnapshot {
  time: number;
  height: number;
  hashrate: number;
  difficulty: number;
  txs: number;
  mempool: number;
  peers: number;
}

type Tab = 'overview' | 'blocks' | 'address' | 'mempool' | 'transaction';

// ─── Utility functions ───────────────────────────────────────

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

function formatDlt(raw: number) {
  return (raw / 100000000).toFixed(8);
}

function truncHash(hash: string, len = 16) {
  if (!hash || hash.length <= len * 2) return hash;
  return hash.slice(0, len) + '...' + hash.slice(-len);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// ─── SVG Icons (inline for zero dependencies) ───────────────

function IconCube({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811V7.189a1 1 0 00-.553-.894l-8-3.556a1 1 0 00-.894 0l-8 3.556A1 1 0 003 7.189v9.622a1 1 0 00.553.894l8 3.556a1 1 0 00.894 0l8-3.556A1 1 0 0021 16.811z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

function IconBolt({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconArrowPath({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
    </svg>
  );
}

function IconSignal({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconClock({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconServer({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconCoins({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function IconInbox({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25m-17.5 0V6.375c0-1.036.84-1.875 1.875-1.875h15.75c1.036 0 1.875.84 1.875 1.875v7.125" />
    </svg>
  );
}

function IconSearch({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function IconCopy({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  );
}

function IconChevronLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

// ─── Animated pulse dot ──────────────────────────────────────

function PulseDot({ color = 'bg-green-400' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

// ─── Copyable hash component ─────────────────────────────────

function CopyableHash({ hash, className = '', truncated = false, maxLen = 16 }: { hash: string; className?: string; truncated?: boolean; maxLen?: number }) {
  const [copied, setCopied] = useState(false);
  const display = truncated ? truncHash(hash, maxLen) : hash;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); copyToClipboard(hash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={`group inline-flex items-center gap-1.5 font-mono break-all text-left hover:text-crystal-400 transition-colors ${className}`}
      title="Click to copy"
    >
      <span>{display}</span>
      <span className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0">
        {copied ? (
          <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <IconCopy className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  );
}

// ─── Sparkline SVG ───────────────────────────────────────────

function Sparkline({ data, color = '#22d3ee', height = 24, width = 64 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-60">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fill area under curve */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
    </svg>
  );
}

// ─── Stat Card with Sparkline ────────────────────────────────

function StatCard({ label, value, icon, accent = 'crystal', onClick, sparkData }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'crystal' | 'nebula' | 'green' | 'amber';
  onClick?: () => void;
  sparkData?: number[];
}) {
  const accentColors = {
    crystal: { border: 'hover:border-crystal-500/40', iconBg: 'bg-crystal-500/10', iconText: 'text-crystal-400', glow: 'hover:shadow-[0_0_30px_rgba(0,191,239,0.08)]', sparkColor: '#22d3ee' },
    nebula:  { border: 'hover:border-nebula-500/40',  iconBg: 'bg-nebula-500/10',  iconText: 'text-nebula-400',  glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]', sparkColor: '#a855f7' },
    green:   { border: 'hover:border-green-500/40',   iconBg: 'bg-green-500/10',   iconText: 'text-green-400',   glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.08)]',  sparkColor: '#22c55e' },
    amber:   { border: 'hover:border-amber-500/40',   iconBg: 'bg-amber-500/10',   iconText: 'text-amber-400',   glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]', sparkColor: '#f59e0b' },
  };
  const a = accentColors[accent];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative overflow-hidden rounded-xl border border-space-700/60 bg-gradient-to-br from-space-900/80 to-space-800/40 backdrop-blur-sm p-4 text-left transition-all duration-300 ${a.border} ${a.glow} ${onClick ? 'cursor-pointer' : 'cursor-default'} group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-1.5">{label}</div>
          <div className="font-heading text-lg font-bold text-white truncate">{value}</div>
        </div>
        <div className={`shrink-0 rounded-lg p-2 ${a.iconBg} ${a.iconText} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      {/* Sparkline in bottom of card */}
      {sparkData && sparkData.length >= 2 && (
        <div className="mt-2 -mb-1">
          <Sparkline data={sparkData} color={a.sparkColor} width={200} height={28} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-crystal-500/0 to-crystal-500/0 group-hover:from-crystal-500/[0.02] group-hover:to-transparent transition-all duration-500 pointer-events-none" />
    </button>
  );
}

// ─── Block Row ───────────────────────────────────────────────

function BlockRow({ block, onClick }: { block: Block; onClick: () => void; index?: number }) {
  return (
    <button
      onClick={onClick}
      className="w-full group rounded-xl border border-space-700/40 bg-gradient-to-r from-space-900/60 to-space-800/30 p-4 flex items-center justify-between text-left transition-all duration-200 hover:border-crystal-500/30 hover:bg-space-800/40"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-11 w-11 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center shrink-0 group-hover:bg-crystal-500/15 transition-colors">
          <IconCube className="w-5 h-5 text-crystal-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-heading text-sm font-bold text-crystal-400">#{block.Index.toLocaleString()}</span>
            <span className="text-[10px] text-space-600 font-mono hidden sm:inline">{truncHash(block.Hash, 12)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-space-500">
            <span className="flex items-center gap-1">
              <IconArrowPath className="w-3 h-3" />
              {block.transactions?.length || 0} txs
            </span>
            {block.DifficultyBits ? (
              <span className="hidden sm:inline">{block.DifficultyBits} bits</span>
            ) : block.difficulty ? (
              <span className="hidden sm:inline">diff {block.difficulty}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-xs text-space-500">{timeAgo(block.Timestamp)}</span>
        <svg className="w-4 h-4 text-space-600 group-hover:text-crystal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─── Transaction Row ─────────────────────────────────────────

function TxRow({ tx, onClick, contextAddress }: { tx: Transaction; onClick: () => void; contextAddress?: string; index?: number }) {
  const isSend = contextAddress && tx.from === contextAddress;
  const isReceive = contextAddress && tx.from !== contextAddress;
  const isCoinbase = tx.from === '' || tx.from === 'SYSTEM';

  return (
    <button
      onClick={onClick}
      className="w-full group rounded-xl border border-space-700/40 bg-gradient-to-r from-space-900/60 to-space-800/30 p-4 text-left transition-all duration-200 hover:border-crystal-500/30 hover:bg-space-800/40"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1.5 min-w-0 flex-1">
          {contextAddress ? (
            <div className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isSend ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {isSend ? 'SENT' : isCoinbase ? 'MINED' : 'RECV'}
              </span>
              <span className="font-mono text-space-400 truncate">
                {isSend ? tx.to : (isCoinbase ? 'Block Reward' : tx.from)}
              </span>
            </div>
          ) : (
            <>
              <div className="text-xs text-space-500 truncate">
                From: <span className="font-mono text-space-300">{isCoinbase ? 'COINBASE' : tx.from}</span>
              </div>
              <div className="text-xs text-space-500 truncate">
                To: <span className="font-mono text-crystal-400">{tx.to}</span>
              </div>
            </>
          )}
          {tx.data && (
            <div className="text-[11px] text-space-500 truncate">
              Memo: <span className="text-amber-400/80">{tx.data}</span>
            </div>
          )}
          {tx.block_index !== undefined && (
            <div className="text-[11px] text-space-600">Block #{tx.block_index} &middot; {timeAgo(tx.timestamp)}</div>
          )}
        </div>
        <div className={`font-heading font-bold shrink-0 text-base ${
          isSend ? 'text-red-400' : isReceive ? 'text-green-400' : 'text-white'
        }`}>
          {isSend ? '-' : isReceive ? '+' : ''}{tx.amount_dlt || formatDlt(tx.amount)} DLT
        </div>
      </div>
    </button>
  );
}

// ─── Supply Progress Bar ─────────────────────────────────────

function SupplyBar({ stats }: { stats: Stats }) {
  const pct = stats.supply?.percent_mined ?? 0;
  const supply = stats.supply?.total_supply ? parseFloat(stats.supply.total_supply).toLocaleString() : '—';
  const maxSupply = stats.supply?.max_supply ? parseFloat(stats.supply.max_supply).toLocaleString() : '—';
  const reward = stats.supply?.current_block_reward ?? '—';

  return (
    <div
      className="rounded-xl border border-space-700/60 bg-gradient-to-br from-space-900/80 to-space-800/40 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-space-400">Supply Distribution</h4>
        <span className="text-xs text-crystal-400 font-heading font-bold">{pct.toFixed(2)}% mined</span>
      </div>
      <div className="h-3 rounded-full bg-space-800 overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-crystal-600 via-crystal-400 to-nebula-400 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-space-500 mb-0.5">Circulating</div>
          <div className="text-white font-medium">{supply} DLT</div>
        </div>
        <div>
          <div className="text-space-500 mb-0.5">Max Supply</div>
          <div className="text-white font-medium">{maxSupply} DLT</div>
        </div>
        <div>
          <div className="text-space-500 mb-0.5">Block Reward</div>
          <div className="text-white font-medium">{reward} DLT</div>
        </div>
      </div>
    </div>
  );
}


// ─── Difficulty Visualization Panel ──────────────────────────

function AreaChart({ data, height = 120, color = '#f59e0b', colorEnd, targetLine }: {
  data: { time: number; value: number }[];
  height?: number;
  color?: string;
  colorEnd?: string;
  targetLine?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cWidth, setCWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setCWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (data.length < 2) return <div ref={containerRef} />;

  const width = Math.max(cWidth, 100);
  const values = data.map(d => d.value);
  const cEnd = colorEnd || color;
  const min = targetLine !== undefined ? Math.min(Math.min(...values), targetLine * 0.5) : Math.min(...values);
  const max = targetLine !== undefined ? Math.max(Math.max(...values), targetLine * 1.5) : Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const uid = color.replace(/[^a-z0-9]/gi, '');

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  // Target line Y position (percentage for HTML overlay)
  const targetY = targetLine !== undefined
    ? height - pad - ((targetLine - min) / range) * (height - pad * 2)
    : null;
  const targetPct = targetY !== null ? (targetY / height) * 100 : null;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {cWidth > 0 && (
        <>
          <svg width={width} height={height} className="block overflow-visible">
            <defs>
              <linearGradient id={`areaGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`lineGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={cEnd} />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map(pct => (
              <line key={pct} x1="0" y1={height * pct} x2={width} y2={height * pct} stroke="rgba(132,148,167,0.08)" strokeWidth="1" />
            ))}
            {/* Target dashed line */}
            {targetY !== null && (
              <line x1="0" y1={targetY} x2={width} y2={targetY} stroke="rgba(34,197,94,0.35)" strokeWidth="1" strokeDasharray="6 4" />
            )}
            <path d={areaPath} fill={`url(#areaGrad-${uid})`} />
            <path d={linePath} fill="none" stroke={`url(#lineGrad-${uid})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.length > 0 && (
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={cEnd} stroke="#030712" strokeWidth="2">
                <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>
          {/* Target label as HTML so it doesn't stretch */}
          {targetPct !== null && (
            <div
              className="absolute right-0 pointer-events-none"
              style={{ top: `${targetPct}%`, transform: 'translateY(-100%)' }}
            >
              <span className="text-[10px] font-mono text-green-400/60 bg-space-900/80 px-1.5 py-0.5 rounded">
                {targetLine}s target
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DifficultyPanel({ stats, statsHistory, blocks, onClose }: {
  stats: Stats;
  statsHistory: StatsSnapshot[];
  blocks: Block[];
  onClose: () => void;
}) {
  const diffBits = stats.blockchain.difficulty_bits;
  const diffRaw = stats.blockchain.difficulty;
  const hashrate = stats.blockchain.hashrate_estimate;
  const avgBlockTime = stats.blockchain.avg_block_time;

  // Difficulty history from polling
  const diffHistory = useMemo(() =>
    statsHistory.map(s => ({ time: s.time, value: s.difficulty })),
    [statsHistory]
  );

  // Per-block difficulty from loaded blocks (shows difficulty at each block)
  const blockDiffData = useMemo(() =>
    [...blocks].reverse().map(b => ({
      time: b.Timestamp,
      value: b.DifficultyBits ?? b.difficulty ?? 0,
    })),
    [blocks]
  );

  // Use block data if we have it, otherwise polling data
  const chartData = blockDiffData.length >= 2 ? blockDiffData : diffHistory;

  // Visual: difficulty as leading zeros
  const targetBits = diffBits || Math.ceil(Math.log2(diffRaw || 1));
  const totalBits = 256;
  const zeroPct = (targetBits / totalBits) * 100;

  // Estimate time to find block at current hashrate
  const diffValue = diffRaw || Math.pow(2, diffBits || 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-space-900/80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <IconBolt className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-white">Mining Difficulty</h3>
              <div className="text-xs text-space-500">Network difficulty analysis</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-space-800 transition-colors text-space-500 hover:text-space-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-space-900/60 border border-space-800/60">
            <div className="text-[10px] text-space-500 uppercase tracking-wider mb-1">Current Difficulty</div>
            <div className="font-heading font-bold text-amber-400 text-lg">{diffBits ? `${diffBits} bits` : diffRaw}</div>
          </div>
          <div className="p-3 rounded-lg bg-space-900/60 border border-space-800/60">
            <div className="text-[10px] text-space-500 uppercase tracking-wider mb-1">Network Hashrate</div>
            <div className="font-heading font-bold text-crystal-400 text-lg">{formatHashrate(hashrate)}</div>
          </div>
          <div className="p-3 rounded-lg bg-space-900/60 border border-space-800/60">
            <div className="text-[10px] text-space-500 uppercase tracking-wider mb-1">Avg Block Time</div>
            <div className="font-heading font-bold text-green-400 text-lg">{avgBlockTime > 0 ? `${avgBlockTime.toFixed(1)}s` : '—'}</div>
          </div>
          <div className="p-3 rounded-lg bg-space-900/60 border border-space-800/60">
            <div className="text-[10px] text-space-500 uppercase tracking-wider mb-1">Block Height</div>
            <div className="font-heading font-bold text-white text-lg">{stats.blockchain.height.toLocaleString()}</div>
          </div>
        </div>

        {/* Difficulty chart */}
        {chartData.length >= 2 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-space-500 uppercase tracking-wider font-medium">
                Difficulty Trend{blockDiffData.length >= 2 ? ' (per block)' : ' (live polling)'}
              </span>
              <span className="text-[10px] text-space-600 font-mono">
                {chartData.length} data points
              </span>
            </div>
            <div className="rounded-lg bg-space-900/50 border border-space-800/60 p-3">
              <AreaChart data={chartData} height={120} color="#f59e0b" colorEnd="#fbbf24" />
            </div>
          </div>
        )}

        {/* Hash target visualization */}
        <div className="mb-5">
          <div className="text-[10px] text-space-500 uppercase tracking-wider font-medium mb-2">
            Hash Target — Required Leading Zero Bits
          </div>
          <div className="rounded-lg bg-space-900/50 border border-space-800/60 p-4">
            {/* Bit strip */}
            <div className="flex gap-[1px] mb-3 overflow-hidden rounded">
              {Array.from({ length: 64 }).map((_, i) => {
                const bitPosition = i * 4; // each cell = 4 bits
                const isZero = bitPosition < targetBits;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.008 }}
                    className="flex-1 h-6 rounded-[1px]"
                    style={{
                      backgroundColor: isZero
                        ? `rgba(245, 158, 11, ${0.3 + (i / 64) * 0.5})`
                        : 'rgba(30, 41, 59, 0.6)',
                    }}
                    title={`Bits ${bitPosition}-${bitPosition + 3}: ${isZero ? 'must be zero' : 'any value'}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-[2px] bg-amber-500/50" />
                <span className="text-space-400">Required zeros ({targetBits} bits)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-[2px] bg-space-700/60" />
                <span className="text-space-500">Free bits ({totalBits - targetBits})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg bg-space-900/30 border border-space-800/40 p-4 text-xs text-space-400 leading-relaxed">
          <span className="text-amber-400 font-medium">How it works:</span> Miners must find a hash with at least <span className="font-mono text-amber-400">{targetBits}</span> leading zero bits. Higher difficulty means more zeros required, making valid hashes exponentially rarer. The network adjusts difficulty to maintain consistent block times.
        </div>
      </div>
    </motion.div>
  );
}

// ─── Block Time Panel ────────────────────────────────────────

function BlockTimePanel({ stats, blocks, onClose }: {
  stats: Stats;
  blocks: Block[];
  onClose: () => void;
}) {
  const TARGET_TIME = 60; // seconds
  const avgBlockTime = stats.blockchain.avg_block_time;

  // Calculate per-block times from loaded blocks
  const blockTimes = useMemo(() => {
    const sorted = [...blocks].sort((a, b) => a.Index - b.Index);
    const times: { time: number; value: number; index: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const dt = sorted[i].Timestamp - sorted[i - 1].Timestamp;
      if (dt >= 0 && dt < 3600) { // skip obviously bad data
        times.push({ time: sorted[i].Timestamp, value: dt, index: sorted[i].Index });
      }
    }
    return times;
  }, [blocks]);

  // Stats about block times
  const btStats = useMemo(() => {
    if (blockTimes.length === 0) return null;
    const vals = blockTimes.map(b => b.value);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const onTarget = vals.filter(v => v >= TARGET_TIME * 0.5 && v <= TARGET_TIME * 1.5).length;
    const fast = vals.filter(v => v < TARGET_TIME * 0.5).length;
    const slow = vals.filter(v => v > TARGET_TIME * 1.5).length;
    return { avg, min, max, onTarget, fast, slow, total: vals.length };
  }, [blockTimes]);

  // Deviation from target
  const deviation = avgBlockTime > 0 ? ((avgBlockTime - TARGET_TIME) / TARGET_TIME * 100) : 0;
  const isClose = Math.abs(deviation) < 10;
  const isFast = deviation < -10;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.03] to-space-900/80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <IconClock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-white">Block Time & Difficulty Adjustment</h3>
              <div className="text-xs text-space-500">Targeting {TARGET_TIME}s blocks for network fairness</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-space-800 transition-colors text-space-500 hover:text-space-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Target gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 mb-5">
          <div className="p-4 rounded-lg bg-space-900/60 border border-space-800/60">
            <div className="text-[10px] text-space-500 uppercase tracking-wider mb-3">Current vs Target</div>
            <div className="flex items-end gap-4">
              <div>
                <div className={`font-heading font-bold text-3xl ${isClose ? 'text-green-400' : isFast ? 'text-crystal-400' : 'text-amber-400'}`}>
                  {avgBlockTime > 0 ? `${avgBlockTime.toFixed(1)}s` : '—'}
                </div>
                <div className="text-xs text-space-500 mt-1">average block time</div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <svg className="w-5 h-5 text-space-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <div>
                  <div className="font-heading font-bold text-xl text-green-400/60">{TARGET_TIME}s</div>
                  <div className="text-[10px] text-space-600">target</div>
                </div>
              </div>
            </div>
            {/* Deviation bar */}
            {avgBlockTime > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-space-500 mb-1.5">
                  <span>Fast</span>
                  <span className={`font-mono font-bold ${isClose ? 'text-green-400' : isFast ? 'text-crystal-400' : 'text-amber-400'}`}>
                    {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}% from target
                  </span>
                  <span>Slow</span>
                </div>
                <div className="h-2 rounded-full bg-space-800 relative overflow-hidden">
                  {/* Center marker = target */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-400/40 z-10" />
                  {/* Fill showing current position */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full relative"
                  >
                    <motion.div
                      initial={{ left: '50%' }}
                      animate={{ left: `${Math.max(5, Math.min(95, 50 + deviation * 0.5))}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${isClose ? 'bg-green-400' : isFast ? 'bg-crystal-400' : 'bg-amber-400'}`}
                      style={{ boxShadow: `0 0 8px ${isClose ? 'rgba(34,197,94,0.5)' : isFast ? 'rgba(0,191,239,0.5)' : 'rgba(245,158,11,0.5)'}` }}
                    />
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          {/* Block time distribution */}
          {btStats && (
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 sm:w-32">
              <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-800/60 text-center">
                <div className="text-[10px] text-space-500 mb-0.5">On Target</div>
                <div className="font-heading font-bold text-green-400">{btStats.onTarget}<span className="text-[10px] text-space-600">/{btStats.total}</span></div>
              </div>
              <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-800/60 text-center">
                <div className="text-[10px] text-space-500 mb-0.5">Too Fast</div>
                <div className="font-heading font-bold text-crystal-400">{btStats.fast}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-800/60 text-center">
                <div className="text-[10px] text-space-500 mb-0.5">Too Slow</div>
                <div className="font-heading font-bold text-amber-400">{btStats.slow}</div>
              </div>
            </div>
          )}
        </div>

        {/* Block time chart with target line */}
        {blockTimes.length >= 2 && (
          <div className="mb-5">
            <div className="mb-2">
              <span className="text-[10px] text-space-500 uppercase tracking-wider font-medium">
                Time Between Blocks (recent {blockTimes.length} blocks)
              </span>
            </div>
            <div className="rounded-lg bg-space-900/50 border border-space-800/60 p-3">
              <AreaChart data={blockTimes} height={120} color="#22c55e" colorEnd="#4ade80" targetLine={TARGET_TIME} />
            </div>
          </div>
        )}

        {/* How difficulty adjustment works */}
        <div className="rounded-lg bg-space-900/30 border border-space-800/40 p-4">
          <div className="text-xs text-space-400 leading-relaxed space-y-3">
            <div>
              <span className="text-green-400 font-heading font-bold text-sm">How Dilithium Maintains 60-Second Blocks</span>
            </div>
            <div>
              The Dilithium network targets a <span className="text-white font-medium">60-second block time</span> to balance speed and security. After each block, the network evaluates how long the last block took and adjusts difficulty accordingly.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-crystal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                  <span className="text-white font-medium text-xs">Blocks too fast?</span>
                </div>
                <div className="text-[11px] text-space-400">Difficulty <span className="text-amber-400">increases</span> — miners need more leading zeros in the hash, making valid blocks harder to find. This slows block production back toward 60s.</div>
              </div>
              <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                  </svg>
                  <span className="text-white font-medium text-xs">Blocks too slow?</span>
                </div>
                <div className="text-[11px] text-space-400">Difficulty <span className="text-green-400">decreases</span> — fewer leading zeros are required, making valid hashes easier to find. This speeds block production back toward 60s.</div>
              </div>
            </div>
            <div>
              <span className="text-green-400 font-medium">Why this matters for miners:</span> Per-block adjustment means new miners joining the network don&apos;t have to wait for a long epoch to see difficulty respond. If a large miner joins and blocks speed up, difficulty ramps immediately — keeping rewards fair and preventing any single miner from dominating block production during an adjustment window.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Live Block Ticker ───────────────────────────────────────

function LiveBlockTicker({ blocks, onClickBlock }: { blocks: Block[]; onClickBlock: (block: Block) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-space-700/60 bg-gradient-to-r from-space-900/80 to-space-800/40 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-space-800/60">
        <PulseDot color="bg-crystal-400" />
        <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-space-400">Live Blocks</span>
      </div>
      <div className="flex overflow-x-auto scrollbar-none">
        <AnimatePresence initial={false}>
          {blocks.slice(0, 12).map((block, i) => (
            <motion.button
              key={block.Index}
              initial={{ opacity: 0, x: -40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ duration: 0.4, delay: i * 0.02 }}
              onClick={() => onClickBlock(block)}
              className="shrink-0 p-3 border-r border-space-800/40 hover:bg-space-800/30 transition-colors group min-w-[120px]"
            >
              <div className="font-heading text-xs font-bold text-crystal-400 group-hover:text-crystal-300 transition-colors">
                #{block.Index.toLocaleString()}
              </div>
              <div className="text-[10px] text-space-500 mt-1 flex items-center gap-1.5">
                <span>{block.transactions?.length || 0} tx{(block.transactions?.length || 0) !== 1 ? 's' : ''}</span>
                <span className="text-space-700">&middot;</span>
                <span>{timeAgo(block.Timestamp)}</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Universal Search Bar ────────────────────────────────────

function SearchBar({ onSearchBlock, onSearchTx, onSearchAddress }: {
  onSearchBlock: (index: number) => void;
  onSearchTx: (sig: string) => void;
  onSearchAddress: (addr: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    if (/^\d+$/.test(q)) {
      onSearchBlock(parseInt(q));
    } else if (q.length > 80) {
      onSearchTx(q);
    } else {
      onSearchAddress(q);
    }
  };

  return (
    <div
      className={`relative flex items-center rounded-xl border transition-all duration-300 ${
        focused
          ? 'border-crystal-500/50 shadow-[0_0_20px_rgba(0,191,239,0.1)] bg-space-900'
          : 'border-space-700/60 bg-space-900/80'
      }`}
    >
      <div className="pl-4 text-space-500">
        <IconSearch className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search by block number, transaction signature, or address..."
        className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white font-mono focus:outline-none placeholder:text-space-600"
      />
      <button
        onClick={handleSearch}
        className="mr-2 px-4 py-2 rounded-lg bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 transition-all text-xs font-heading font-bold uppercase tracking-wider"
      >
        Search
      </button>
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────

function TabButton({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? 'text-crystal-400'
          : 'text-space-500 hover:text-space-300'
      }`}
    >
      <span className="flex items-center gap-2">
        {label}
        {count !== undefined && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            active ? 'bg-crystal-500/15 text-crystal-400' : 'bg-space-800 text-space-500'
          }`}>
            {count}
          </span>
        )}
      </span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-crystal-400 to-nebula-400"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
    </button>
  );
}


// ═══════════════════════════════════════════════════════════════
// MAIN EXPLORER (inner, reads search params)
// ═══════════════════════════════════════════════════════════════

function ExplorerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [addrTxPage, setAddrTxPage] = useState(0);
  const ADDR_TX_PER_PAGE = 20;

  const [error, setError] = useState('');

  const [blocksPage, setBlocksPage] = useState(0);
  const [blocksTotalPages, setBlocksTotalPages] = useState(0);
  const BLOCKS_PER_PAGE = 20;

  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showDifficultyPanel, setShowDifficultyPanel] = useState(false);
  const [showBlockTimePanel, setShowBlockTimePanel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Sparkline history: accumulate stats snapshots over time
  const [statsHistory, setStatsHistory] = useState<StatsSnapshot[]>([]);
  const MAX_HISTORY = 60; // ~5 minutes of 5s polls


  // Deep link handling: track if we've processed initial params
  const deepLinkProcessedRef = useRef(false);

  // ─── Deep link: update URL when state changes ─────────────

  const updateUrl = useCallback((params: Record<string, string | undefined>) => {
    const url = new URL(window.location.href);
    // Clear all explorer params
    url.searchParams.delete('tab');
    url.searchParams.delete('block');
    url.searchParams.delete('tx');
    url.searchParams.delete('addr');
    // Set new params
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // ─── Data fetching ────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${nodeUrl}/stats`);
      const json = await res.json();
      if (json.success) {
        const data = json.data as Stats;
        setStats(data);
        setConnected(true);
        setError('');
        // Record snapshot for sparklines
        setStatsHistory(prev => {
          const snapshot: StatsSnapshot = {
            time: Date.now(),
            height: data.blockchain.height,
            hashrate: data.blockchain.hashrate_estimate,
            difficulty: data.blockchain.difficulty,
            txs: data.blockchain.total_txs,
            mempool: data.mempool.size,
            peers: data.peers.connected,
          };
          const next = [...prev, snapshot];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      }
    } catch {
      setConnected(false);
      setError('Cannot connect to node');
    }
  }, [nodeUrl]);

  const fetchBlocks = useCallback(async (uiPage: number = 0) => {
    try {
      const metaRes = await fetch(`${nodeUrl}/chain?limit=${BLOCKS_PER_PAGE}`);
      const metaJson = await metaRes.json();
      if (!metaJson.success) return;

      const totalApiPages = metaJson.data.total_pages || 1;
      setBlocksTotalPages(totalApiPages);

      const apiPage = Math.max(0, totalApiPages - 1 - uiPage);

      if (apiPage === 0 && totalApiPages <= 1) {
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
    setAddrTxPage(0);
    try {
      const res = await fetch(`${nodeUrl}/explorer/address?addr=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        const data = json.data as AddressInfo;
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

  // ─── Deep link: read URL params on mount ──────────────────

  useEffect(() => {
    if (deepLinkProcessedRef.current) return;
    deepLinkProcessedRef.current = true;

    const paramTab = searchParams.get('tab') as Tab | null;
    const paramBlock = searchParams.get('block');
    const paramTx = searchParams.get('tx');
    const paramAddr = searchParams.get('addr');

    if (paramBlock) {
      setTab('blocks');
      fetchBlock(parseInt(paramBlock));
    } else if (paramTx) {
      fetchTransaction(paramTx);
    } else if (paramAddr) {
      setTab('address');
      setAddressQuery(paramAddr);
      fetchAddress(paramAddr);
    } else if (paramTab) {
      setTab(paramTab);
    }
  }, [searchParams, fetchBlock, fetchTransaction, fetchAddress]);

  const handleConnect = () => {
    setNodeUrl(nodeInput);
    setConnected(false);
    setStats(null);
    setError('');
    setStatsHistory([]);
  };

  // Tab change with URL update
  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setSelectedBlock(null);
    setSelectedTransaction(null);
    if (newTab === 'overview') {
      updateUrl({});
    } else if (newTab !== 'transaction') {
      updateUrl({ tab: newTab });
    }
  };

  // Search handlers with deep linking
  const handleSearchBlock = (index: number) => {
    fetchBlock(index);
    setTab('blocks');
    updateUrl({ block: String(index) });
  };
  const handleSearchTx = (sig: string) => {
    fetchTransaction(sig);
    updateUrl({ tx: sig });
  };
  const handleSearchAddress = (addr: string) => {
    setAddressQuery(addr);
    setTab('address');
    fetchAddress(addr);
    updateUrl({ addr });
  };

  // Click block with deep linking
  const handleClickBlock = (block: Block) => {
    setSelectedBlock(block);
    setTab('blocks');
    updateUrl({ block: String(block.Index) });
  };

  const handleFetchBlock = (index: number) => {
    fetchBlock(index);
    setTab('blocks');
    updateUrl({ block: String(index) });
  };

  // Click transaction with deep linking
  const handleClickTx = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setTab('transaction');
    if (tx.signature) {
      updateUrl({ tx: tx.signature });
    }
  };

  // ─── Sparkline data extraction ────────────────────────────

  const sparklines = useMemo(() => ({
    height: statsHistory.map(s => s.height),
    hashrate: statsHistory.map(s => s.hashrate),
    difficulty: statsHistory.map(s => s.difficulty),
    txs: statsHistory.map(s => s.txs),
    mempool: statsHistory.map(s => s.mempool),
    peers: statsHistory.map(s => s.peers),
  }), [statsHistory]);

  // ─── Stat card configs ────────────────────────────────────

  const statCards = stats
    ? [
        { label: 'Block Height', value: stats.blockchain.height.toLocaleString(), icon: <IconCube />, accent: 'crystal' as const, onClick: () => changeTab('blocks'), sparkData: sparklines.height },
        { label: 'Difficulty', value: stats.blockchain.difficulty_bits ? `${stats.blockchain.difficulty_bits} bits` : `${stats.blockchain.difficulty}`, icon: <IconBolt />, accent: 'amber' as const, sparkData: sparklines.difficulty, onClick: () => setShowDifficultyPanel(prev => !prev) },
        { label: 'Total Transactions', value: stats.blockchain.total_txs.toLocaleString(), icon: <IconArrowPath />, accent: 'nebula' as const, sparkData: sparklines.txs },
        { label: 'Avg Block Time', value: stats.blockchain.avg_block_time > 0 ? stats.blockchain.avg_block_time.toFixed(1) + 's' : '—', icon: <IconClock />, accent: 'green' as const, onClick: () => setShowBlockTimePanel(prev => !prev) },
        { label: 'Hashrate', value: formatHashrate(stats.blockchain.hashrate_estimate), icon: <IconServer />, accent: 'crystal' as const, sparkData: sparklines.hashrate },
        { label: 'Mempool', value: `${stats.mempool.size} pending`, icon: <IconInbox />, accent: 'amber' as const, onClick: () => changeTab('mempool'), sparkData: sparklines.mempool },
        { label: 'Peers', value: `${stats.peers.connected} connected`, icon: <IconSignal />, accent: 'green' as const, sparkData: sparklines.peers },
        { label: 'Circulating', value: stats.supply?.total_supply ? `${parseFloat(stats.supply.total_supply).toLocaleString()} DLT` : '—', icon: <IconCoins />, accent: 'nebula' as const },
      ]
    : [];

  // ─── RENDER ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-space-950">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-crystal-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-nebula-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-space-800/60 backdrop-blur-xl bg-space-950/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <svg width="24" height="32" viewBox="0 0 200 280" fill="none" className="opacity-90 group-hover:opacity-100 transition-opacity">
                  <polygon points="100,10 60,100 100,130 140,100" fill="#00bfef" opacity="0.9" />
                  <polygon points="60,100 100,130 140,100 100,270" fill="#0891b2" opacity="0.8" />
                </svg>
                <div>
                  <span className="font-heading text-lg font-bold tracking-wider text-white group-hover:text-crystal-400 transition-colors">DILITHIUM</span>
                  <span className="hidden sm:inline text-space-600 text-xs ml-2 font-mono">Explorer</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-nebula-500/30 bg-nebula-500/[0.06] hover:bg-nebula-500/[0.12] hover:border-nebula-500/50 transition-all text-xs group"
              >
                <span className="text-nebula-400 font-medium">New Here?</span>
              </button>
              <button
                onClick={() => setShowNodeConfig(!showNodeConfig)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-space-700/60 hover:border-space-600 transition-colors text-xs"
              >
                <PulseDot color={connected ? 'bg-green-400' : 'bg-red-400'} />
                <span className="text-space-400 hidden sm:inline">
                  {connected
                    ? nodeUrl === DEFAULT_NODE ? 'Public Node' : 'Custom Node'
                    : 'Disconnected'}
                </span>
              </button>

              <Link href="/" className="text-space-500 hover:text-crystal-400 transition-colors text-xs font-mono hidden sm:inline">
                dilithiumcoin.com
              </Link>
            </div>
          </div>

          <AnimatePresence>
            {showNodeConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pt-4">
                  <input
                    type="text"
                    value={nodeInput}
                    onChange={(e) => setNodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    placeholder="Node API URL"
                    className="flex-1 bg-space-900 border border-space-700 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-crystal-500/50 transition-colors"
                  />
                  <button
                    onClick={() => { handleConnect(); setShowNodeConfig(false); }}
                    className="px-4 py-2 rounded-lg bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 transition-all text-sm font-medium"
                  >
                    Connect
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Connection failed</div>
                <div className="text-red-400/70 text-xs mt-0.5">Make sure a Dilithium node is running with the API enabled.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Universal Search */}
        <SearchBar
          onSearchBlock={handleSearchBlock}
          onSearchTx={handleSearchTx}
          onSearchAddress={handleSearchAddress}
        />

        {/* Live Block Ticker */}
        {connected && blocks.length > 0 && (
          <LiveBlockTicker
            blocks={blocks}
            onClickBlock={handleClickBlock}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-space-800/60 overflow-x-auto scrollbar-none">
          <TabButton label="Overview" active={tab === 'overview'} onClick={() => changeTab('overview')} />
          <TabButton label="Blocks" active={tab === 'blocks'} onClick={() => changeTab('blocks')} />
          <TabButton label="Mempool" active={tab === 'mempool'} onClick={() => changeTab('mempool')} count={stats?.mempool.size} />
          <TabButton label="Address Lookup" active={tab === 'address'} onClick={() => changeTab('address')} />
        </div>

        {/* ────────────────────────── TAB CONTENT ────────────────────────── */}

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {tab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Network stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((s, i) => (
                  <StatCard
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    icon={s.icon}
                    accent={s.accent}
                    onClick={s.onClick}
                    sparkData={s.sparkData}
                  />
                ))}
              </div>

              {/* Difficulty visualization panel */}
              <AnimatePresence>
                {showDifficultyPanel && (
                  <DifficultyPanel
                    stats={stats}
                    statsHistory={statsHistory}
                    blocks={blocks}
                    onClose={() => setShowDifficultyPanel(false)}
                  />
                )}
              </AnimatePresence>

              {/* Block time panel */}
              <AnimatePresence>
                {showBlockTimePanel && (
                  <BlockTimePanel
                    stats={stats}
                    blocks={blocks}
                    onClose={() => setShowBlockTimePanel(false)}
                  />
                )}
              </AnimatePresence>

              {/* Supply bar */}
              {stats.supply && <SupplyBar stats={stats} />}

              {/* Recent Blocks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-space-400 flex items-center gap-2">
                    <PulseDot color="bg-crystal-400" />
                    Latest Blocks
                  </h3>
                  <button
                    onClick={() => changeTab('blocks')}
                    className="text-xs text-crystal-400/70 hover:text-crystal-400 transition-colors font-mono"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="space-y-2">
                  {blocks.slice(0, 8).map((block, i) => (
                    <BlockRow
                      key={block.Index}
                      block={block}
                      onClick={() => handleClickBlock(block)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* BLOCKS TAB — list */}
          {tab === 'blocks' && !selectedBlock && (
            <motion.div
              key="blocks-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {blocks.map((block, i) => (
                <BlockRow
                  key={block.Index}
                  block={block}
                  onClick={() => handleFetchBlock(block.Index)}
                  index={i}
                />
              ))}

              {blocksTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => { const p = blocksPage - 1; setBlocksPage(p); fetchBlocks(p); }}
                    disabled={blocksPage === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-space-800/80 border border-space-700/60 text-sm text-space-400 hover:text-crystal-400 hover:border-crystal-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IconChevronLeft className="w-4 h-4" /> Newer
                  </button>
                  <span className="text-xs text-space-500 font-mono">
                    Page {blocksPage + 1} / {blocksTotalPages}
                  </span>
                  <button
                    onClick={() => { const p = blocksPage + 1; setBlocksPage(p); fetchBlocks(p); }}
                    disabled={blocksPage >= blocksTotalPages - 1}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-space-800/80 border border-space-700/60 text-sm text-space-400 hover:text-crystal-400 hover:border-crystal-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Older <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}

              {blocks.length === 0 && connected && (
                <div className="text-center text-space-500 py-16 text-sm">No blocks found</div>
              )}
            </motion.div>
          )}

          {/* BLOCKS TAB — detail */}
          {tab === 'blocks' && selectedBlock && (
            <motion.div
              key={`block-${selectedBlock.Index}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <button
                onClick={() => { setSelectedBlock(null); updateUrl({ tab: 'blocks' }); }}
                className="text-crystal-400 hover:text-crystal-300 text-sm flex items-center gap-1.5 transition-colors"
              >
                <IconChevronLeft className="w-4 h-4" />
                Back to blocks
              </button>

              {/* Block header card */}
              <div className="rounded-xl border border-crystal-500/20 bg-gradient-to-br from-crystal-500/[0.05] to-space-900/80 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-14 w-14 rounded-xl bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center shrink-0">
                    <IconCube className="w-7 h-7 text-crystal-400" />
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-white">Block #{selectedBlock.Index.toLocaleString()}</h3>
                    <div className="text-sm text-space-500 mt-1">
                      {new Date(selectedBlock.Timestamp * 1000).toLocaleString()} ({timeAgo(selectedBlock.Timestamp)})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Hash', value: selectedBlock.Hash, mono: true, crystal: true },
                    { label: 'Previous Hash', value: selectedBlock.PreviousHash, mono: true },
                    { label: 'Nonce', value: selectedBlock.Nonce?.toLocaleString(), mono: true },
                    { label: 'Difficulty', value: selectedBlock.DifficultyBits ? `${selectedBlock.DifficultyBits} bits` : `${selectedBlock.difficulty}` },
                    { label: 'Transactions', value: `${selectedBlock.transactions?.length || 0}` },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-1.5 p-3 rounded-lg bg-space-900/50 border border-space-800/60">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-space-500">{item.label}</span>
                      {item.mono ? (
                        <CopyableHash
                          hash={item.value || ''}
                          className={item.crystal ? 'text-crystal-400 text-sm' : 'text-space-300 text-sm'}
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedBlock.transactions && selectedBlock.transactions.length > 0 && (
                <div>
                  <h4 className="font-heading text-xs font-semibold text-space-400 tracking-wider mb-3 uppercase">
                    Transactions ({selectedBlock.transactions.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedBlock.transactions.map((tx, i) => (
                      <TxRow
                        key={i}
                        tx={tx}
                        onClick={() => handleClickTx(tx)}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MEMPOOL TAB */}
          {tab === 'mempool' && (
            <motion.div
              key="mempool"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-semibold text-space-400 tracking-wider uppercase flex items-center gap-2">
                  <PulseDot color="bg-amber-400" />
                  Pending Transactions
                </h3>
                <button
                  onClick={fetchMempool}
                  className="text-xs text-space-500 hover:text-crystal-400 transition-colors flex items-center gap-1"
                >
                  <IconArrowPath className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="space-y-2">
                {mempoolTxs.map((tx, i) => (
                  <TxRow
                    key={i}
                    tx={tx}
                    onClick={() => handleClickTx(tx)}
                    index={i}
                  />
                ))}
                {mempoolTxs.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 rounded-xl border border-space-700/40 bg-space-900/30"
                  >
                    <IconInbox className="w-10 h-10 text-space-700 mx-auto mb-3" />
                    <div className="text-space-500 text-sm">Mempool is empty</div>
                    <div className="text-space-600 text-xs mt-1">No pending transactions</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* TRANSACTION DETAIL */}
          {tab === 'transaction' && selectedTransaction && (
            <motion.div
              key="tx-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  if (selectedBlock) { setTab('blocks'); updateUrl({ block: String(selectedBlock.Index) }); }
                  else if (addressInfo) { setTab('address'); updateUrl({ addr: addressInfo.address }); }
                  else { setTab('overview'); updateUrl({}); }
                }}
                className="text-crystal-400 hover:text-crystal-300 text-sm flex items-center gap-1.5 transition-colors"
              >
                <IconChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="rounded-xl border border-nebula-500/20 bg-gradient-to-br from-nebula-500/[0.03] to-space-900/80 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-14 w-14 rounded-xl bg-nebula-500/10 border border-nebula-500/20 flex items-center justify-center shrink-0">
                    <IconArrowPath className="w-7 h-7 text-nebula-400" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Transaction Details</h3>
                    <div className="text-sm text-space-500 mt-1">
                      {new Date(selectedTransaction.timestamp * 1000).toLocaleString()} ({timeAgo(selectedTransaction.timestamp)})
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/60 mb-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-1.5">Signature (TXID)</div>
                  <CopyableHash hash={selectedTransaction.signature} className="text-crystal-400 text-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4">
                  <div className="p-4 rounded-lg bg-space-900/50 border border-space-800/60">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-2">From</div>
                    <button
                      onClick={() => {
                        if (selectedTransaction.from) {
                          setSelectedTransaction(null);
                          handleSearchAddress(selectedTransaction.from);
                        }
                      }}
                      className="font-mono text-sm text-white break-all text-left hover:text-crystal-400 transition-colors"
                    >
                      {selectedTransaction.from === '' ? 'COINBASE (Block Reward)' : selectedTransaction.from}
                    </button>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="flex items-center gap-1 text-crystal-400">
                      <div className="w-8 h-px bg-crystal-400/30" />
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="w-8 h-px bg-crystal-400/30" />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-space-900/50 border border-space-800/60">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-2">To</div>
                    <button
                      onClick={() => {
                        setSelectedTransaction(null);
                        handleSearchAddress(selectedTransaction.to);
                      }}
                      className="font-mono text-sm text-crystal-400 break-all text-left hover:text-crystal-300 transition-colors"
                    >
                      {selectedTransaction.to}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-space-900/50 border border-space-800/60">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-1.5">Amount</div>
                    <div className="font-heading font-bold text-white text-2xl">
                      {selectedTransaction.amount_dlt || formatDlt(selectedTransaction.amount)} <span className="text-sm text-crystal-400">DLT</span>
                    </div>
                  </div>
                  {selectedTransaction.block_index !== undefined && (
                    <div className="p-4 rounded-lg bg-space-900/50 border border-space-800/60">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-1.5">Included in Block</div>
                      <button
                        onClick={() => { setSelectedTransaction(null); handleFetchBlock(selectedTransaction.block_index!); }}
                        className="font-heading font-bold text-crystal-400 text-2xl hover:text-crystal-300 transition-colors"
                      >
                        #{selectedTransaction.block_index.toLocaleString()}
                      </button>
                    </div>
                  )}
                  {selectedTransaction.data && (
                    <div className="p-4 rounded-lg bg-space-900/50 border border-space-800/60 sm:col-span-2">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-1.5">Memo</div>
                      <div className="text-amber-400 text-sm">{selectedTransaction.data}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ADDRESS TAB */}
          {tab === 'address' && (
            <motion.div
              key="address"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress(addressQuery)}
                  placeholder="Enter wallet address..."
                  className="flex-1 bg-space-900 border border-space-700/60 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-crystal-500/50 transition-colors"
                />
                <button
                  onClick={() => handleSearchAddress(addressQuery)}
                  className="px-5 py-3 rounded-xl bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 transition-all text-sm font-heading font-bold uppercase tracking-wider"
                >
                  Lookup
                </button>
              </div>

              {addressError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {addressError}
                </motion.div>
              )}

              {addressInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.03] to-space-900/80 p-6">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-space-500 mb-2">Wallet Address</div>
                    <CopyableHash hash={addressInfo.address} className="text-crystal-400 text-sm mb-5" />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/60">
                        <div className="text-[10px] text-space-500 mb-1">Balance</div>
                        <div className="font-heading font-bold text-white text-lg">{addressInfo.balance_dlt} <span className="text-xs text-space-500">DLT</span></div>
                      </div>
                      <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/60">
                        <div className="text-[10px] text-space-500 mb-1">Received</div>
                        <div className="font-heading font-bold text-green-400">{addressInfo.total_received_dlt} <span className="text-xs text-green-400/50">DLT</span></div>
                      </div>
                      <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/60">
                        <div className="text-[10px] text-space-500 mb-1">Sent</div>
                        <div className="font-heading font-bold text-red-400">{addressInfo.total_sent_dlt} <span className="text-xs text-red-400/50">DLT</span></div>
                      </div>
                      <div className="p-3 rounded-lg bg-space-900/50 border border-space-800/60">
                        <div className="text-[10px] text-space-500 mb-1">Transactions</div>
                        <div className="font-heading font-bold text-white text-lg">{addressInfo.transaction_count}</div>
                      </div>
                    </div>
                  </div>

                  {addressInfo.transactions && addressInfo.transactions.length > 0 && (() => {
                    const totalTxs = addressInfo.transactions.length;
                    const totalPages = Math.ceil(totalTxs / ADDR_TX_PER_PAGE);
                    const start = addrTxPage * ADDR_TX_PER_PAGE;
                    const pageTxs = addressInfo.transactions.slice(start, start + ADDR_TX_PER_PAGE);

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-heading text-xs font-semibold text-space-400 tracking-wider uppercase">
                            Transaction History ({totalTxs})
                          </h4>
                          {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setAddrTxPage(p => Math.max(0, p - 1))}
                                disabled={addrTxPage === 0}
                                className="p-1.5 rounded-lg border border-space-700/60 hover:border-space-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <IconChevronLeft className="w-3.5 h-3.5 text-space-400" />
                              </button>
                              <span className="text-xs text-space-500 font-mono min-w-[4rem] text-center">
                                {addrTxPage + 1} / {totalPages}
                              </span>
                              <button
                                onClick={() => setAddrTxPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={addrTxPage >= totalPages - 1}
                                className="p-1.5 rounded-lg border border-space-700/60 hover:border-space-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <IconChevronLeft className="w-3.5 h-3.5 text-space-400 rotate-180" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {pageTxs.map((tx, i) => (
                            <TxRow
                              key={start + i}
                              tx={tx}
                              onClick={() => handleClickTx(tx)}
                              contextAddress={addressInfo.address}
                              index={start + i}
                            />
                          ))}
                        </div>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-space-800/40">
                            <span className="text-[11px] text-space-600">
                              Showing {start + 1}–{Math.min(start + ADDR_TX_PER_PAGE, totalTxs)} of {totalTxs}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setAddrTxPage(0)}
                                disabled={addrTxPage === 0}
                                className="px-2 py-1 rounded text-[10px] text-space-500 hover:text-white hover:bg-space-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                First
                              </button>
                              <button
                                onClick={() => setAddrTxPage(totalPages - 1)}
                                disabled={addrTxPage >= totalPages - 1}
                                className="px-2 py-1 rounded text-[10px] text-space-500 hover:text-white hover:bg-space-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                Last
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {!addressInfo && !addressError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 rounded-xl border border-space-700/40 bg-space-900/30"
                >
                  <IconSearch className="w-10 h-10 text-space-700 mx-auto mb-3" />
                  <div className="text-space-500 text-sm">Enter a wallet address</div>
                  <div className="text-space-600 text-xs mt-1">View balance and transaction history</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connecting placeholder */}
        {!connected && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center gap-3 text-space-500">
              <svg className="animate-spin w-5 h-5 text-crystal-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting to node...
            </div>
          </motion.div>
        )}
      </div>

      {/* Interactive tutorial */}
      <ExplorerTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: Wrap in Suspense for useSearchParams
// ═══════════════════════════════════════════════════════════════

export default function ExplorerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-space-950 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-space-500">
          <svg className="animate-spin w-5 h-5 text-crystal-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading explorer...
        </div>
      </div>
    }>
      <ExplorerInner />
    </Suspense>
  );
}
