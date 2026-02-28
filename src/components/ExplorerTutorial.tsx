'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────
interface TutorialProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────
const STEPS = [
  'welcome',
  'what-is-blockchain',
  'inside-a-block',
  'what-miners-do',
  'difficulty',
  'what-makes-blocks-unique',
  'dilithium-specifics',
  'explore',
] as const;

type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  'welcome': 'Welcome',
  'what-is-blockchain': 'What Is a Blockchain?',
  'inside-a-block': 'Inside a Block',
  'what-miners-do': 'The Math Miners Mine',
  'difficulty': 'Difficulty & the Race',
  'what-makes-blocks-unique': 'Why Every Block Is Unique',
  'dilithium-specifics': 'Dilithium\'s Design',
  'explore': 'Start Exploring',
};

// ─── Fake hash animation hook ─────────────────────────────────
function useHashAnimation(running: boolean, difficulty: number) {
  const [hash, setHash] = useState('');
  const [nonce, setNonce] = useState(0);
  const [found, setFound] = useState(false);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const reset = useCallback(() => {
    setHash('');
    setNonce(0);
    setFound(false);
  }, []);

  useEffect(() => {
    if (!running) return;
    setFound(false);
    startRef.current = Date.now();
    let n = 0;
    const prefix = '0'.repeat(difficulty);
    const chars = '0123456789abcdef';

    const tick = () => {
      n++;
      // Generate a fake hash
      let h = '';
      // Small chance of "finding" a valid hash as nonce goes up
      const foundIt = n > 30 + Math.random() * 40 && Math.random() < 0.15;
      if (foundIt) {
        h = prefix;
        for (let i = difficulty; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
        setHash(h);
        setNonce(n);
        setFound(true);
        return; // stop
      }
      // Generate random hash that does NOT start with the prefix
      const firstChar = chars[Math.floor(Math.random() * 15) + 1]; // 1-f, never 0
      h = firstChar;
      for (let i = 1; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
      setHash(h);
      setNonce(n);
      rafRef.current = window.setTimeout(tick, 50);
    };

    rafRef.current = window.setTimeout(tick, 50);
    return () => clearTimeout(rafRef.current);
  }, [running, difficulty]);

  return { hash, nonce, found, reset };
}

// ─── Chain visualization (blocks linked) ──────────────────────
function ChainVisual({ activeBlock }: { activeBlock: number }) {
  const blocks = [
    { index: 0, label: 'Genesis', hash: '0000002835...', prev: '0' },
    { index: 1, label: 'Block 1', hash: '00000068595...', prev: '0000002835...' },
    { index: 2, label: 'Block 2', hash: '000000a19c2...', prev: '00000068595...' },
    { index: 3, label: 'Block 3', hash: '000000f7e41...', prev: '000000a19c2...' },
  ];

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-4 px-2 scrollbar-none">
      {blocks.map((b, i) => (
        <div key={b.index} className="flex items-center shrink-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              borderColor: i <= activeBlock ? 'rgba(0,191,239,0.5)' : 'rgba(30,41,59,0.6)',
            }}
            transition={{ delay: i * 0.2, duration: 0.4 }}
            className="relative w-32 sm:w-40 rounded-lg border bg-space-900/80 p-3"
          >
            <div className="text-[10px] text-space-500 font-mono mb-1">#{b.index}</div>
            <div className="font-heading text-xs font-bold text-white mb-2">{b.label}</div>
            <div className="space-y-1">
              <div className="text-[9px] text-space-500">
                Hash: <span className="text-crystal-400 font-mono">{b.hash}</span>
              </div>
              <div className="text-[9px] text-space-500">
                Prev: <span className="text-space-400 font-mono">{b.prev}</span>
              </div>
            </div>
            {i <= activeBlock && (
              <motion.div
                layoutId="chain-glow"
                className="absolute inset-0 rounded-lg border border-crystal-400/20 pointer-events-none"
                style={{ boxShadow: '0 0 12px rgba(0,191,239,0.15)' }}
              />
            )}
          </motion.div>
          {i < blocks.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: i < activeBlock ? 1 : 0.2,
                scaleX: 1,
              }}
              transition={{ delay: i * 0.2 + 0.3, duration: 0.3 }}
              className="flex items-center mx-1"
            >
              <svg width="32" height="12" viewBox="0 0 32 12" className="text-crystal-500/60">
                <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                <polygon points="24,2 32,6 24,10" fill="currentColor" />
              </svg>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Block anatomy diagram ────────────────────────────────────
function BlockAnatomy() {
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const fields = [
    { key: 'index', label: 'Index', value: '1,337', color: 'text-space-400', desc: 'Block\'s position in the chain — each block is numbered sequentially starting from 0 (genesis).' },
    { key: 'prevHash', label: 'Previous Hash', value: '0000002835112676fb...', color: 'text-amber-400', desc: 'Fingerprint of the block before this one. This is what links blocks together into a chain.' },
    { key: 'timestamp', label: 'Timestamp', value: '1770998706', color: 'text-space-400', desc: 'Unix timestamp of when this block was mined — seconds since January 1, 1970.' },
    { key: 'transactions', label: 'Transactions', value: '[coinbase + user txs]', color: 'text-nebula-400', desc: 'List of transactions: every block includes a coinbase (mining reward) plus any pending user transfers.' },
    { key: 'nonce', label: 'Nonce', value: '15,242,104', color: 'text-crystal-400', desc: 'A number guessed by the miner\'s computer. Mining software starts at 0 and increments by 1, millions of times per second, until it finds a nonce that makes the block\'s hash start with enough zeros. This miner tried 15.2 million guesses before finding it.' },
    { key: 'difficulty', label: 'Difficulty', value: '6 (24 bits)', color: 'text-amber-400', desc: 'How many leading zeros the hash must have. Higher difficulty = more zeros = exponentially harder to find.' },
    { key: 'hash', label: 'Hash', value: '00000068595dd0cba6...', color: 'text-green-400', desc: 'This block\'s fingerprint — a SHA-256 hash of all the above fields combined. Notice the leading zeros!' },
  ];

  const activeField = fields.find(f => f.key === hoveredField);

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        {fields.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setHoveredField(prev => prev === f.key ? null : f.key)}
            className={`flex items-center gap-3 py-2 px-2.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
              hoveredField === f.key
                ? 'bg-space-800/80 border-crystal-500/30'
                : 'bg-space-900/40 border-transparent'
            }`}
          >
            <div className="w-28 sm:w-36 shrink-0">
              <span className="text-[11px] font-mono font-medium text-space-300">{f.label}</span>
            </div>
            <div className={`text-[11px] font-mono ${f.color} truncate flex-1`}>
              {f.value}
            </div>
            <svg className={`w-3.5 h-3.5 shrink-0 transition-colors ${hoveredField === f.key ? 'text-crystal-400' : 'text-space-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Description panel */}
      <AnimatePresence mode="wait">
        {activeField ? (
          <motion.div
            key={activeField.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="p-3 rounded-lg bg-crystal-500/[0.04] border border-crystal-500/15"
          >
            <span className="text-crystal-400 font-mono font-bold text-xs">{activeField.label}: </span>
            <span className="text-[11px] text-space-400 leading-relaxed">{activeField.desc}</span>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="p-3 text-center text-[11px] text-space-600"
          >
            Tap a field to learn more
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mining simulator ─────────────────────────────────────────
function MiningSimulator() {
  const [mining, setMining] = useState(false);
  const [diff, setDiff] = useState(2);
  const { hash, nonce, found, reset } = useHashAnimation(mining, diff);

  const startMining = () => {
    reset();
    setMining(true);
  };

  useEffect(() => {
    if (found) setMining(false);
  }, [found]);

  return (
    <div className="space-y-4">
      <div className="text-xs text-space-400 leading-relaxed">
        Miners take all the block data, combine it with a random number called a <span className="text-crystal-400 font-medium">nonce</span>,
        and run it through a <span className="text-white font-medium">SHA-256 hash function</span>.
        The goal? Find a nonce that produces a hash starting with a certain number of zeros.
      </div>

      {/* Interactive simulator */}
      <div className="rounded-xl border border-space-800/60 bg-space-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-space-500 uppercase tracking-wider font-medium">Live Mining Simulator</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-space-500">Difficulty:</span>
            {[1, 2, 3, 4].map(d => (
              <button
                key={d}
                onClick={() => { if (!mining) setDiff(d); }}
                className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${
                  d === diff
                    ? 'bg-crystal-500/20 border border-crystal-500/50 text-crystal-400'
                    : 'bg-space-800/60 border border-space-700/40 text-space-500 hover:text-space-300'
                } ${mining ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Input data */}
        <div className="mb-3 p-3 rounded-lg bg-space-950/60 border border-space-800/40 font-mono text-[11px]">
          <div className="text-space-500 mb-1">Input data:</div>
          <div className="text-space-300">
            Block #1337 + Prev Hash + Transactions + Nonce: <span className="text-crystal-400">{nonce > 0 ? nonce.toLocaleString() : '???'}</span>
          </div>
        </div>

        {/* Target */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] text-space-500">Target: hash must start with</span>
          <code className="text-crystal-400 font-mono text-xs bg-crystal-500/10 px-2 py-0.5 rounded">
            {'0'.repeat(diff)}{'_'.repeat(Math.max(0, 8 - diff))}
          </code>
        </div>

        {/* Current hash output */}
        <div className={`p-3 rounded-lg border font-mono text-xs break-all transition-colors duration-300 ${
          found
            ? 'bg-green-500/[0.06] border-green-500/30'
            : 'bg-space-950/60 border-space-800/40'
        }`}>
          <div className="text-space-500 text-[10px] mb-1">SHA-256 output:</div>
          {hash ? (
            <div className="flex flex-wrap">
              {hash.split('').map((c, i) => (
                <span
                  key={i}
                  className={`${
                    i < diff
                      ? found ? 'text-green-400 font-bold' : 'text-red-400'
                      : 'text-space-400'
                  } transition-colors`}
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-space-600">Press "Start Mining" to begin...</div>
          )}
        </div>

        {/* Status + Button */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-[11px]">
            {found ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-400 font-medium flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Block found after {nonce.toLocaleString()} attempts!
              </motion.span>
            ) : mining ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-3 h-3 border border-amber-400 border-t-transparent rounded-full"
                />
                Trying nonce {nonce.toLocaleString()}...
              </span>
            ) : (
              <span className="text-space-500">Ready to mine</span>
            )}
          </div>
          <button
            onClick={startMining}
            disabled={mining}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              mining
                ? 'bg-space-800 text-space-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-crystal-500 to-crystal-600 text-white hover:shadow-[0_0_20px_rgba(0,191,239,0.3)]'
            }`}
          >
            {found ? 'Mine Again' : mining ? 'Mining...' : 'Start Mining'}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-space-500 leading-relaxed">
        There is no shortcut — miners can&apos;t reverse-engineer the right nonce. They <span className="text-white">must guess and check</span>,
        millions of times per second. That&apos;s the &quot;work&quot; in proof of work.
      </div>
    </div>
  );
}

// ─── Difficulty visualization ─────────────────────────────────
function DifficultyExplainer() {
  const [selectedDiff, setSelectedDiff] = useState(3);

  const diffs = [
    { bits: 2, label: '2 zeros', combinations: '1 in 256', time: '< 1 sec', color: 'text-green-400' },
    { bits: 4, label: '4 zeros', combinations: '1 in 65,536', time: '~seconds', color: 'text-crystal-400' },
    { bits: 6, label: '6 zeros', combinations: '1 in 16.7M', time: '~minutes', color: 'text-amber-400' },
    { bits: 8, label: '8 zeros (DLT now)', combinations: '1 in 4.29B', time: '~60 sec', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs text-space-400 leading-relaxed">
        Every extra leading zero means <span className="text-white font-medium">256× more work</span>.
        The network adjusts difficulty so blocks take ~60 seconds regardless of how many miners are competing.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {diffs.map((d, i) => (
          <button
            key={d.bits}
            onClick={() => setSelectedDiff(i)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedDiff === i
                ? 'bg-space-800/80 border-crystal-500/40'
                : 'bg-space-900/40 border-space-800/40 hover:border-space-700'
            }`}
          >
            <div className={`font-mono font-bold text-sm ${d.color}`}>{d.label}</div>
            <div className="text-[10px] text-space-500 mt-1">{d.combinations}</div>
            <div className="text-[10px] text-space-600">{d.time}</div>
          </button>
        ))}
      </div>

      {/* Hash target visual */}
      <div className="rounded-lg bg-space-900/50 border border-space-800/40 p-3">
        <div className="text-[10px] text-space-500 uppercase tracking-wider mb-2">Hash must look like:</div>
        <div className="font-mono text-sm flex flex-wrap gap-px">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                color: i < diffs[selectedDiff].bits ? '#22c55e' : undefined,
                opacity: i < diffs[selectedDiff].bits ? 1 : 0.4,
              }}
              className="text-space-600 w-4 text-center"
            >
              {i < diffs[selectedDiff].bits ? '0' : 'x'}
            </motion.span>
          ))}
          <span className="text-space-600 text-xs ml-1">... (64 hex chars total)</span>
        </div>
        <div className="mt-2 text-[10px] text-space-500">
          <span className="text-green-400">{diffs[selectedDiff].bits} locked zeros</span> → only{' '}
          <span className="text-white">{diffs[selectedDiff].combinations}</span> hashes will qualify on average
        </div>
      </div>

      {/* Race explanation */}
      <div className="text-[11px] text-space-500 leading-relaxed">
        <span className="text-crystal-400 font-medium">Why this is fair:</span> Dilithium adjusts difficulty
        after every block. If a powerful miner joins and blocks get faster, difficulty rises immediately —
        not after a long epoch. No one can dominate block production by surprise.
      </div>
    </div>
  );
}

// ─── Block uniqueness comparison ──────────────────────────────
function BlockComparison() {
  const blocks = [
    {
      index: 1337,
      hash: '000000f7e41a9c2...',
      nonce: '8,291,044',
      time: '14:23:06',
      txCount: 3,
      miner: '6f50a0...da27',
      difficulty: 32,
    },
    {
      index: 1338,
      hash: '00000000c2a06f...',
      nonce: '15,242,104',
      time: '14:24:12',
      txCount: 1,
      miner: 'a3b1c9...f821',
      difficulty: 32,
    },
  ];

  const differences = [
    { label: 'Different index', desc: 'Sequential position in chain' },
    { label: 'Different hash', desc: 'Unique fingerprint from unique inputs' },
    { label: 'Different nonce', desc: 'Each miner found their own magic number' },
    { label: 'Different timestamp', desc: 'Mined at different moments in time' },
    { label: 'Different transactions', desc: 'Different payments bundled inside' },
    { label: 'Different miner', desc: 'Whoever solved it first wins' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs text-space-400 leading-relaxed">
        Even though every block follows the same rules, no two are alike. Here&apos;s why — look at two consecutive blocks side by side:
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {blocks.map((b) => (
          <motion.div
            key={b.index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-space-800/60 bg-space-900/60 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading font-bold text-sm text-white">Block #{b.index}</span>
              <span className="text-[10px] text-space-500">{b.time}</span>
            </div>
            <div className="space-y-1.5 font-mono text-[10px]">
              <div><span className="text-space-500">Hash:</span> <span className="text-green-400">{b.hash}</span></div>
              <div><span className="text-space-500">Nonce:</span> <span className="text-crystal-400">{b.nonce}</span></div>
              <div><span className="text-space-500">Txs:</span> <span className="text-nebula-400">{b.txCount}</span></div>
              <div><span className="text-space-500">Miner:</span> <span className="text-amber-400">{b.miner}</span></div>
              <div><span className="text-space-500">Diff bits:</span> <span className="text-space-300">{b.difficulty}</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {differences.map((d, i) => (
          <motion.div
            key={d.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="p-2.5 rounded-lg bg-space-900/40 border border-space-800/40"
          >
            <div className="text-[11px] text-crystal-400 font-medium">{d.label}</div>
            <div className="text-[10px] text-space-500 mt-0.5">{d.desc}</div>
          </motion.div>
        ))}
      </div>

      <div className="text-[11px] text-space-500 leading-relaxed">
        The previous block&apos;s hash is baked into the next block. Change <span className="text-white">any</span> historical block
        and every block after it becomes invalid — that&apos;s what makes the chain tamper-proof.
      </div>
    </div>
  );
}

// ─── Step content renderer ────────────────────────────────────
function StepContent({ step }: { step: Step }) {
  const [chainBlock, setChainBlock] = useState(0);

  // Animate chain blocks sequentially
  useEffect(() => {
    if (step !== 'what-is-blockchain') return;
    setChainBlock(0);
    const timers = [1, 2, 3].map((i) =>
      setTimeout(() => setChainBlock(i), i * 800)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  switch (step) {
    case 'welcome':
      return (
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-crystal-500/20 to-nebula-500/20 border border-crystal-500/30 mb-6"
          >
            <svg width="40" height="54" viewBox="0 0 200 280" fill="none">
              <polygon points="100,10 60,100 100,130 140,100" fill="#00bfef" opacity="0.9" />
              <polygon points="60,100 100,130 140,100 100,270" fill="#0891b2" opacity="0.8" />
            </svg>
          </motion.div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-3">
            Welcome to <span className="text-gradient-crystal">Dilithium</span>
          </h2>
          <p className="text-sm text-space-400 max-w-md mx-auto leading-relaxed mb-6">
            This interactive guide will walk you through how blockchains work, what miners actually do,
            and what makes Dilithium special — no technical background required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'How chains link',
              'What miners compute',
              'Why difficulty matters',
              'Dilithium\'s design',
            ].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="px-3 py-2 rounded-lg bg-space-900/60 border border-space-800/40 text-xs text-space-400"
              >
                {label}
              </motion.div>
            ))}
          </div>
        </div>
      );

    case 'what-is-blockchain':
      return (
        <div className="space-y-4">
          <div className="text-xs text-space-400 leading-relaxed">
            A blockchain is a <span className="text-white font-medium">chain of blocks</span> — each block is a bundle of transactions,
            and each one contains the fingerprint (hash) of the block before it. This creates an unbreakable chain
            going all the way back to the very first block: the <span className="text-crystal-400 font-medium">genesis block</span>.
          </div>
          <ChainVisual activeBlock={chainBlock} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { title: 'Linked by hashes', desc: 'Each block stores the previous block\'s hash, forming the chain.' },
              { title: 'Immutable history', desc: 'Changing one block invalidates every block after it.' },
              { title: 'No central authority', desc: 'Thousands of computers independently verify every block.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="p-3 rounded-lg bg-space-900/40 border border-space-800/40"
              >
                <div className="text-xs text-white font-medium mb-1">{item.title}</div>
                <div className="text-[11px] text-space-500">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case 'inside-a-block':
      return (
        <div className="space-y-2">
          <div className="text-xs text-space-400 leading-relaxed">
            Every block is a data structure with key fields. Hover or tap any field to learn what it does.
          </div>
          <BlockAnatomy />
        </div>
      );

    case 'what-miners-do':
      return <MiningSimulator />;

    case 'difficulty':
      return <DifficultyExplainer />;

    case 'what-makes-blocks-unique':
      return <BlockComparison />;

    case 'dilithium-specifics':
      return (
        <div className="space-y-4">
          <div className="text-xs text-space-400 leading-relaxed">
            Dilithium is built with specific design choices that set it apart:
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-crystal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '60-Second Block Target',
                desc: 'Difficulty adjusts per-block, not per-epoch. The chain responds immediately when miners join or leave — no waiting hundreds of blocks for the next adjustment.',
                color: 'border-crystal-500/20',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'Quantum-Safe by Design',
                desc: 'Named after the CRYSTALS-Dilithium post-quantum signature scheme. Dilithium is built with the future in mind — resistant to quantum computing attacks on digital signatures.',
                color: 'border-green-500/20',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                ),
                title: '50 DLT Block Reward',
                desc: 'Miners earn 50 DLT per block via the coinbase transaction. The reward will eventually halve as the supply approaches the maximum, similar to Bitcoin\'s scarcity model.',
                color: 'border-amber-500/20',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-nebula-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                title: 'SHA-256 Proof of Work',
                desc: 'Uses the battle-tested SHA-256 hashing algorithm. Miners compete to find hashes with enough leading zeros — the same proven consensus mechanism that secures Bitcoin.',
                color: 'border-nebula-500/20',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex gap-4 p-4 rounded-lg bg-space-900/40 border ${item.color}`}
              >
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <div className="text-sm text-white font-medium mb-1">{item.title}</div>
                  <div className="text-[11px] text-space-400 leading-relaxed">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case 'explore':
      return (
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5"
          >
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <h3 className="font-heading text-lg font-bold text-white mb-2">You&apos;re ready to explore!</h3>
          <p className="text-xs text-space-400 max-w-sm mx-auto leading-relaxed mb-5">
            Now you understand how Dilithium works under the hood. Try clicking on blocks,
            transactions, and stat cards in the explorer — everything is interactive.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg mx-auto mb-4">
            {[
              { label: 'Click a block', desc: 'See its hash, nonce, and transactions' },
              { label: 'Click Difficulty', desc: 'See real-time difficulty visualization' },
              { label: 'Search an address', desc: 'View balance and transaction history' },
            ].map((tip, i) => (
              <motion.div
                key={tip.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-3 rounded-lg bg-space-900/40 border border-space-800/40 text-left"
              >
                <div className="text-[11px] text-crystal-400 font-medium">{tip.label}</div>
                <div className="text-[10px] text-space-500 mt-0.5">{tip.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      );
  }
}

// ─── Main Tutorial Component ──────────────────────────────────
export default function ExplorerTutorial({ open, onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  // Reset on open
  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isLast) setCurrentStep(s => s + 1);
      } else if (e.key === 'ArrowLeft') {
        if (!isFirst) setCurrentStep(s => s - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isFirst, isLast, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-space-950/90 backdrop-blur-md" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-space-800/60 bg-space-950 overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(0,191,239,0.08), 0 0 120px rgba(0,191,239,0.03)' }}
          >
            {/* Top bar with step progress */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-space-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-crystal-500/10 border border-crystal-500/20 flex items-center justify-center">
                    <svg width="14" height="18" viewBox="0 0 200 280" fill="none">
                      <polygon points="100,10 60,100 100,130 140,100" fill="#00bfef" opacity="0.9" />
                      <polygon points="60,100 100,130 140,100 100,270" fill="#0891b2" opacity="0.8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading text-xs font-bold text-white tracking-wide">{STEP_TITLES[step]}</h3>
                    <div className="text-[10px] text-space-500">{currentStep + 1} of {STEPS.length}</div>
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

              {/* Step indicators */}
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className="flex-1 h-1 rounded-full transition-all duration-300 cursor-pointer"
                    style={{
                      background: i <= currentStep
                        ? 'linear-gradient(90deg, #00bfef, #0891b2)'
                        : 'rgba(30,41,59,0.6)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 scrollbar-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <StepContent step={step} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom nav */}
            <div className="shrink-0 px-5 py-3 border-t border-space-800/40 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                disabled={isFirst}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isFirst
                    ? 'text-space-700 cursor-not-allowed'
                    : 'text-space-400 hover:text-white hover:bg-space-800'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>

              <div className="text-[10px] text-space-600 hidden sm:block">
                Arrow keys to navigate &middot; Esc to close
              </div>

              {isLast ? (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-gradient-to-r from-crystal-500 to-crystal-600 text-white hover:shadow-[0_0_20px_rgba(0,191,239,0.3)] transition-all"
                >
                  Start Exploring
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(s => s + 1)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-crystal-500/10 border border-crystal-500/30 text-crystal-400 hover:bg-crystal-500/20 transition-all"
                >
                  Next
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
