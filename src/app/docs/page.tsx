'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StarfieldBackground from '@/components/StarfieldBackground';
import { useReveal } from '@/components/useReveal';

const RELEASES_URL = 'https://github.com/luccadimario/dilithiumcoin/releases/latest';

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div>
      {label && (
        <div className="text-xs font-mono text-space-500 mb-1">{label}</div>
      )}
      <div className="bg-space-950 border border-space-700 rounded-lg px-4 py-2.5 font-mono text-sm text-crystal-400 overflow-x-auto">
        <span className="text-nebula-500 mr-2">$</span>
        {children}
      </div>
    </div>
  );
}

function SectionCard({ title, children, accent = 'crystal' }: { title: string; children: React.ReactNode; accent?: 'crystal' | 'nebula' }) {
  const borderColor = accent === 'crystal' ? 'border-crystal-500/20' : 'border-nebula-500/20';
  return (
    <div className={`card-space p-6 sm:p-8 ${borderColor}`}>
      <h3 className="font-heading text-xl font-bold text-white mb-4 tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export default function DocsPage() {
  const overview = useReveal();
  const wallet = useReveal();
  const nodes = useReveal();
  const mining = useReveal();
  const gpu = useReveal();
  const pool = useReveal();
  const cli = useReveal();
  const api = useReveal();

  return (
    <>
      <StarfieldBackground />
      <Navigation />

      <main className="relative z-10">
        {/* Hero */}
        <section className="min-h-[50vh] flex items-center justify-center pt-24 pb-16">
          <div
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-crystal-500/30 bg-crystal-500/5 text-crystal-400 text-xs font-mono tracking-widest uppercase mb-8">
              Documentation
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-wider mb-6">
              Run. Mine. <span className="text-gradient-crystal">Build.</span>
            </h1>
            <p className="text-space-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Everything you need to run a Dilithium node, mine DLT, or build with CUDA-accelerated GPU mining.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Download Binaries
              </a>
              <a href="https://github.com/luccadimario/dilithiumcoin" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                View Source
              </a>
            </div>
          </div>
        </section>

        {/* Quick Nav */}
        <section className="pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { label: 'Wallet', href: '#wallet' },
                { label: 'Nodes', href: '#nodes' },
                { label: 'CPU Mining', href: '#mining' },
                { label: 'GPU Mining', href: '#gpu-mining' },
                { label: 'Pool Mining', href: '#pool-mining' },
                { label: 'CLI Reference', href: '#cli' },
                { label: 'API', href: '#api' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg bg-space-800/50 border border-space-700 text-space-500 hover:text-crystal-400 hover:border-crystal-500/30 transition-all text-sm font-mono"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="py-16 sm:py-20">
          <div
            ref={overview.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${overview.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-6">
              <span className="text-gradient-crystal">Overview</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              Dilithium ships as a set of standalone binaries. Download the ones you need for your platform from{' '}
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="text-crystal-400 hover:underline">
                GitHub Releases
              </a>{' '}
              and make them executable.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Binary</th>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Purpose</th>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Requires Node?</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { binary: 'dilithium', purpose: 'Full node — validates blocks, relays transactions, serves the API', node: 'Is the node' },
                    { binary: 'dilithium-cli', purpose: 'Wallet management, send transactions, check balances', node: 'Connects to a node API' },
                    { binary: 'dilithium-miner', purpose: 'CPU miner with multi-threading', node: 'Embeds one automatically' },
                    { binary: 'dilithium-gpu-miner', purpose: 'Rust+CUDA GPU miner (recommended for GPU mining)', node: 'Connects to a node' },
                    { binary: 'dilithium-cpu-gpu-miner', purpose: 'Go hybrid CPU/GPU miner (pre-built runs CPU, build with CUDA for GPU)', node: 'Embeds one automatically' },
                  ].map((row, i) => (
                    <tr key={row.binary} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                      <td className="py-3 px-4 text-sm font-mono text-crystal-400 border-b border-space-800">{row.binary}</td>
                      <td className="py-3 px-4 text-sm text-space-600 border-b border-space-800">{row.purpose}</td>
                      <td className="py-3 px-4 text-sm text-space-600 border-b border-space-800">{row.node}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <CodeBlock label="Make binaries executable (macOS / Linux)">chmod +x dilithium*</CodeBlock>
            </div>
          </div>
        </section>

        {/* Wallet */}
        <section id="wallet" className="py-16 sm:py-20">
          <div
            ref={wallet.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${wallet.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-6">
              Create a <span className="text-gradient-crystal">Wallet</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-6">
              Generate a quantum-safe CRYSTALS-Dilithium keypair with a 24-word recovery phrase. Your address is derived from the public key and used to receive mining rewards and DLT transfers.
            </p>
            <div className="space-y-3">
              <CodeBlock label="Create a new wallet (generates 24-word recovery phrase)">./dilithium-cli init</CodeBlock>
              <CodeBlock label="Restore a wallet from recovery phrase">./dilithium-cli wallet restore</CodeBlock>
              <CodeBlock label="View your address">./dilithium-cli address</CodeBlock>
              <CodeBlock label="Check your balance">./dilithium-cli balance</CodeBlock>
            </div>
            <div className="card-space p-4 mt-6 border-nebula-500/20">
              <p className="text-sm text-space-600">
                <span className="text-nebula-400 font-mono font-bold">Important:</span> When you create a wallet, a <strong className="text-white">24-word recovery phrase</strong> is displayed once. Write it down and store it safely — it is the only way to restore your wallet. You can optionally set a passphrase to encrypt the private key on disk.
              </p>
            </div>
            <div className="card-space p-4 mt-3 border-crystal-500/20">
              <p className="text-sm text-space-600">
                <span className="text-crystal-400 font-mono font-bold">Desktop wallet:</span> The <span className="font-mono text-crystal-400">dilithium-wallet</span> GUI app provides the same seed phrase creation and restore flow with a graphical interface.
              </p>
            </div>
            <div className="card-space p-4 mt-3 border-crystal-500/20">
              <p className="text-sm text-space-600">
                <span className="text-crystal-400 font-mono font-bold">PWA wallet:</span> A progressive web app is also available at <a href="https://wallet.dilithiumcoin.com" className="text-crystal-400 hover:text-crystal-300 transition-colors font-mono">wallet.dilithiumcoin.com</a> — use it from any browser to create wallets, check balances, and send DLT without installing anything.
              </p>
            </div>
          </div>
        </section>

        {/* Running a Node */}
        <section id="nodes" className="py-16 sm:py-20">
          <div
            ref={nodes.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${nodes.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
              Running a <span className="text-gradient-crystal">Node</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              Nodes form the backbone of the Dilithium network. They validate transactions, relay blocks, and serve the REST API. You can run a standalone node or let a miner start an embedded one automatically.
            </p>

            <div className="space-y-6">
              <SectionCard title="Standalone Node">
                <p className="text-space-600 text-sm mb-4">
                  Run a full node to support the network. It connects to seed nodes automatically and syncs the blockchain.
                </p>
                <div className="space-y-3">
                  <CodeBlock label="Start a node">./dilithium --port 1701 --api-port 8001</CodeBlock>
                  <CodeBlock label="Start a node with auto-mining">./dilithium --port 1701 --api-port 8001 --auto-mine --miner YOUR_ADDRESS</CodeBlock>
                  <CodeBlock label="Connect to a specific peer">./dilithium --port 1701 --api-port 8001 --connect 192.168.1.10:1701</CodeBlock>
                </div>
              </SectionCard>

              <SectionCard title="Embedded Node (via Miner)">
                <p className="text-space-600 text-sm mb-4">
                  Both <span className="font-mono text-crystal-400">dilithium-miner</span> and <span className="font-mono text-crystal-400">dilithium-cpu-gpu-miner</span> automatically
                  start an embedded node when you don&apos;t specify <span className="font-mono text-crystal-400">--node</span>. Just place the <span className="font-mono text-crystal-400">dilithium</span> binary
                  in the same directory as the miner.
                </p>
                <CodeBlock>./dilithium-miner --miner YOUR_ADDRESS</CodeBlock>
              </SectionCard>

              <SectionCard title="External Node">
                <p className="text-space-600 text-sm mb-4">
                  Point any miner at an existing node&apos;s API. Useful when you want to run the node and miner separately, or mine against a remote node.
                </p>
                <div className="space-y-3">
                  <CodeBlock label="Miner connecting to local node">./dilithium-miner --node http://localhost:8001 --miner YOUR_ADDRESS</CodeBlock>
                  <CodeBlock label="GPU miner connecting to remote node">./dilithium-gpu-miner --node http://your-node:8001 --address YOUR_ADDRESS</CodeBlock>
                </div>
              </SectionCard>

              <div className="overflow-x-auto">
                <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">Node Flags</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Flag</th>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Default</th>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { flag: '--port', def: '1701', desc: 'P2P port for peer connections' },
                      { flag: '--api-port', def: '8001', desc: 'HTTP API port' },
                      { flag: '--connect', def: '', desc: 'Peer address to connect to (e.g., 192.168.1.10:1701)' },
                      { flag: '--auto-mine', def: 'false', desc: 'Mine blocks automatically' },
                      { flag: '--miner', def: '', desc: 'Wallet address for mining rewards' },
                      { flag: '--data-dir', def: '', desc: 'Data directory path' },
                      { flag: '--no-seeds', def: 'false', desc: 'Don\'t connect to seed nodes (for local testing)' },
                    ].map((row, i) => (
                      <tr key={row.flag} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                        <td className="py-2 px-4 text-sm font-mono text-crystal-400 border-b border-space-800">{row.flag}</td>
                        <td className="py-2 px-4 text-sm font-mono text-space-600 border-b border-space-800">{row.def || '—'}</td>
                        <td className="py-2 px-4 text-sm text-space-600 border-b border-space-800">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CPU Mining */}
        <section id="mining" className="py-16 sm:py-20">
          <div
            ref={mining.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${mining.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
              CPU <span className="text-gradient-crystal">Mining</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              The standard miner uses multi-threaded SHA-256 proof-of-work on your CPU.
              It automatically starts an embedded node unless you point it at an existing one.
            </p>

            <div className="space-y-6">
              <SectionCard title="Quick Start">
                <div className="space-y-3">
                  <CodeBlock label="Solo mine (embedded node, auto-detect wallet)">./dilithium-miner --miner YOUR_ADDRESS</CodeBlock>
                  <CodeBlock label="Multi-threaded (use 8 CPU threads)">./dilithium-miner --miner YOUR_ADDRESS --threads 8</CodeBlock>
                  <CodeBlock label="Mine against an existing node">./dilithium-miner --node http://localhost:8001 --miner YOUR_ADDRESS --no-node</CodeBlock>
                </div>
              </SectionCard>

              <div className="overflow-x-auto">
                <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">Miner Flags</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Flag</th>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Default</th>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { flag: '--miner', def: '', desc: 'Wallet address for mining rewards' },
                      { flag: '--node', def: '(embedded)', desc: 'Node API URL' },
                      { flag: '--no-node', def: 'false', desc: 'Disable embedded node (requires --node)' },
                      { flag: '--threads', def: '1', desc: 'Number of mining threads' },
                      { flag: '--wallet', def: '~/.dilithium/wallet', desc: 'Wallet directory for auto-detection' },
                    ].map((row, i) => (
                      <tr key={row.flag} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                        <td className="py-2 px-4 text-sm font-mono text-crystal-400 border-b border-space-800">{row.flag}</td>
                        <td className="py-2 px-4 text-sm font-mono text-space-600 border-b border-space-800">{row.def || '—'}</td>
                        <td className="py-2 px-4 text-sm text-space-600 border-b border-space-800">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* GPU Mining */}
        <section id="gpu-mining" className="py-16 sm:py-20">
          <div
            ref={gpu.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${gpu.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
              GPU <span className="text-gradient-nebula">Mining</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              GPU mining uses NVIDIA CUDA for massively parallel SHA-256 hashing — up to 100x faster than CPU mining.
              The Rust+CUDA miner is recommended for maximum performance.
            </p>

            <div className="space-y-6">
              <SectionCard title="Rust+CUDA Miner (Recommended)" accent="nebula">
                <p className="text-space-600 text-sm mb-4">
                  The <span className="font-mono text-crystal-400">dilithium-gpu-miner</span> is a dedicated Rust+CUDA GPU miner for maximum hashrate.
                  Requires{' '}
                  <a href="https://www.rust-lang.org/tools/install" target="_blank" rel="noopener noreferrer" className="text-crystal-400 hover:underline">Rust</a>{' '}and the{' '}
                  <a href="https://developer.nvidia.com/cuda-toolkit" target="_blank" rel="noopener noreferrer" className="text-crystal-400 hover:underline">CUDA Toolkit</a>.
                </p>
                <div className="space-y-3">
                  <CodeBlock label="Build from source">cd cmd/dilithium-gpu-miner && cargo build --release</CodeBlock>
                  <CodeBlock label="Run">./dilithium-gpu-miner --address YOUR_ADDRESS --node http://localhost:8001</CodeBlock>
                  <CodeBlock label="Select GPU device and batch size">./dilithium-gpu-miner --address YOUR_ADDRESS --device 0 --batch-size 134217728</CodeBlock>
                </div>
              </SectionCard>

              <SectionCard title="Alternative: Go CPU/GPU Hybrid Miner" accent="nebula">
                <p className="text-space-600 text-sm mb-4">
                  The <span className="font-mono text-crystal-400">dilithium-cpu-gpu-miner</span> runs in optimized CPU mode out of the box.
                  For GPU acceleration, copy <span className="font-mono text-crystal-400">cmd/dilithium-cpu-gpu-miner/</span> to your GPU machine and build with CUDA.
                </p>
                <div className="space-y-3">
                  <CodeBlock label="CPU mode (pre-built binary)">./dilithium-cpu-gpu-miner --address YOUR_ADDRESS</CodeBlock>
                  <CodeBlock label="Build with CUDA">cd cmd/dilithium-cpu-gpu-miner && make gpu SM=86</CodeBlock>
                  <CodeBlock label="Run with GPU acceleration">./dilithium-cpu-gpu-miner --gpu --address YOUR_ADDRESS</CodeBlock>
                </div>
              </SectionCard>

              <div>
                <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">CUDA SM Architecture</h4>
                <p className="text-space-600 text-sm mb-4">
                  Set <span className="font-mono text-crystal-400">SM=</span> to match your GPU generation. Find yours with: <span className="font-mono text-crystal-400">nvidia-smi --query-gpu=compute_cap --format=csv</span>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">SM</th>
                        <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Generation</th>
                        <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Example GPUs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sm: '75', gen: 'Turing', gpus: 'RTX 2060, 2070, 2080' },
                        { sm: '80', gen: 'Ampere', gpus: 'A100, RTX 3090 (desktop)' },
                        { sm: '86', gen: 'Ampere', gpus: 'RTX 3060, 3070, 3080 (laptop)' },
                        { sm: '89', gen: 'Ada Lovelace', gpus: 'RTX 4060, 4070, 4080, 4090' },
                        { sm: '90', gen: 'Hopper', gpus: 'H100, H200' },
                      ].map((row, i) => (
                        <tr key={row.sm} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                          <td className="py-2 px-4 text-sm font-mono text-nebula-400 border-b border-space-800">{row.sm}</td>
                          <td className="py-2 px-4 text-sm text-white border-b border-space-800">{row.gen}</td>
                          <td className="py-2 px-4 text-sm text-space-600 border-b border-space-800">{row.gpus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">Performance</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Hardware</th>
                        <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Mode</th>
                        <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Hashrate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { hw: 'Apple M4 (10 threads)', mode: 'CPU', rate: '~180 MH/s' },
                        { hw: 'Intel i7 (8 threads)', mode: 'CPU', rate: '~80 MH/s' },
                        { hw: 'RTX 3080', mode: 'GPU', rate: '~1,400 MH/s' },
                        { hw: 'RTX 4090', mode: 'GPU', rate: '~5,000 MH/s' },
                      ].map((row, i) => (
                        <tr key={row.hw} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                          <td className="py-2 px-4 text-sm text-white border-b border-space-800">{row.hw}</td>
                          <td className="py-2 px-4 text-sm font-mono text-space-600 border-b border-space-800">{row.mode}</td>
                          <td className="py-2 px-4 text-sm font-mono text-crystal-400 border-b border-space-800">{row.rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-space-600 text-sm mt-3">
                  Run <span className="font-mono text-crystal-400">./dilithium-cpu-gpu-miner --benchmark</span> to measure your CPU hardware.
                </p>
              </div>

              <div className="overflow-x-auto">
                <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">CPU/GPU Miner Flags</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Flag</th>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Default</th>
                      <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { flag: '--address', def: 'auto-detect', desc: 'Mining reward address' },
                      { flag: '--wallet', def: '~/.dilithium/wallet', desc: 'Wallet directory for auto-detection' },
                      { flag: '--node', def: '(embedded)', desc: 'Node API URL' },
                      { flag: '--no-node', def: 'false', desc: 'Disable embedded node (requires --node)' },
                      { flag: '--peer', def: '', desc: 'Seed peer for embedded node' },
                      { flag: '--threads', def: 'all CPUs', desc: 'CPU mining thread count' },
                      { flag: '--gpu', def: 'false', desc: 'Enable NVIDIA GPU mining (requires CUDA build)' },
                      { flag: '--device', def: '0', desc: 'GPU device ID' },
                      { flag: '--batch-size', def: '67108864', desc: 'Nonces per GPU kernel launch' },
                      { flag: '--pool', def: '', desc: 'Pool address (host:port)' },
                      { flag: '--benchmark', def: 'false', desc: 'Run hashrate benchmark and exit' },
                    ].map((row, i) => (
                      <tr key={row.flag} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                        <td className="py-2 px-4 text-sm font-mono text-crystal-400 border-b border-space-800">{row.flag}</td>
                        <td className="py-2 px-4 text-sm font-mono text-space-600 border-b border-space-800">{row.def || '—'}</td>
                        <td className="py-2 px-4 text-sm text-space-600 border-b border-space-800">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-space p-4 border-nebula-500/20">
                <p className="text-sm text-space-600">
                  <span className="text-nebula-400 font-mono font-bold">Troubleshooting:</span>{' '}
                  &ldquo;GPU mining not available&rdquo; means the binary was built without CUDA — rebuild with <span className="font-mono text-crystal-400">make gpu</span>.{' '}
                  &ldquo;No kernel image available&rdquo; means SM architecture mismatch — rebuild with the correct <span className="font-mono text-crystal-400">SM=</span> value.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pool Mining */}
        <section id="pool-mining" className="py-16 sm:py-20">
          <div
            ref={pool.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${pool.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
              Pool <span className="text-gradient-crystal">Mining</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              Pool mining combines hashpower from multiple miners for more consistent rewards. Supported by both the CPU miner and GPU miner.
            </p>

            <div className="space-y-6">
              <SectionCard title="Connect to a Pool">
                <div className="space-y-3">
                  <CodeBlock label="CPU pool mining">./dilithium-cpu-gpu-miner --pool pool.example.com:3333 --address YOUR_ADDRESS</CodeBlock>
                  <CodeBlock label="GPU pool mining">./dilithium-cpu-gpu-miner --pool pool.example.com:3333 --address YOUR_ADDRESS --gpu</CodeBlock>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>

        {/* CLI Reference */}
        <section id="cli" className="py-16 sm:py-20">
          <div
            ref={cli.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${cli.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
              CLI <span className="text-gradient-crystal">Reference</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              The <span className="font-mono text-crystal-400">dilithium-cli</span> tool manages wallets and submits transactions.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Command</th>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cmd: 'init', desc: 'Create a new wallet with 24-word recovery phrase' },
                    { cmd: 'wallet restore', desc: 'Restore wallet from a recovery phrase' },
                    { cmd: 'wallet info', desc: 'Display wallet details' },
                    { cmd: 'wallet export', desc: 'Export wallet private key' },
                    { cmd: 'address', desc: 'Show your wallet address' },
                    { cmd: 'balance', desc: 'Check wallet balance' },
                    { cmd: 'send --to <addr> --amount N', desc: 'Send DLT to an address' },
                    { cmd: 'send --to <addr> --amount N --fee F', desc: 'Send DLT with a custom fee (min: 0.0001 DLT)' },
                    { cmd: 'tx sign [flags]', desc: 'Sign a transaction' },
                    { cmd: 'status', desc: 'Show node status' },
                    { cmd: 'peers', desc: 'List connected peers' },
                    { cmd: 'mempool', desc: 'View pending transactions' },
                  ].map((row, i) => (
                    <tr key={row.cmd} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                      <td className="py-2 px-4 text-sm font-mono text-crystal-400 border-b border-space-800 whitespace-nowrap">dilithium-cli {row.cmd}</td>
                      <td className="py-2 px-4 text-sm text-space-600 border-b border-space-800">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* API */}
        <section id="api" className="py-16 sm:py-20">
          <div
            ref={api.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${api.visible ? 'visible' : ''}`}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
              REST <span className="text-gradient-crystal">API</span>
            </h2>
            <p className="text-space-600 leading-relaxed mb-8">
              Every node exposes an HTTP API for querying the blockchain, submitting transactions, and managing peers.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Method</th>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Endpoint</th>
                    <th className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { method: 'GET', endpoint: '/status', desc: 'Node status, height, difficulty, hashrate' },
                    { method: 'GET', endpoint: '/chain', desc: 'Full blockchain (paginated with ?limit=N&page=P)' },
                    { method: 'GET', endpoint: '/stats', desc: 'Explorer statistics: height, difficulty, hashrate, supply, mempool, peers' },
                    { method: 'GET', endpoint: '/block?index=N', desc: 'Single block details by index' },
                    { method: 'GET', endpoint: '/explorer/address?addr=ADDR', desc: 'Address balance, transaction history' },
                    { method: 'GET', endpoint: '/peers', desc: 'Connected peers' },
                    { method: 'GET', endpoint: '/mempool', desc: 'Pending transactions' },
                    { method: 'POST', endpoint: '/transaction', desc: 'Submit a signed transaction (supports optional fee field)' },
                    { method: 'POST', endpoint: '/mine?miner=ADDR', desc: 'Manually mine a block' },
                    { method: 'POST', endpoint: '/add-peer?address=IP:PORT', desc: 'Connect to a peer' },
                  ].map((row, i) => (
                    <tr key={row.endpoint} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
                      <td className="py-2 px-4 text-sm font-mono text-nebula-400 border-b border-space-800">{row.method}</td>
                      <td className="py-2 px-4 text-sm font-mono text-crystal-400 border-b border-space-800">{row.endpoint}</td>
                      <td className="py-2 px-4 text-sm text-space-600 border-b border-space-800">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-3">
              <CodeBlock label="Check node status">curl http://localhost:8001/status</CodeBlock>
              <CodeBlock label="Explorer stats (hashrate, supply, etc.)">curl http://localhost:8001/stats</CodeBlock>
              <CodeBlock label="Look up an address">{'curl http://localhost:8001/explorer/address?addr=YOUR_ADDRESS'}</CodeBlock>
              <CodeBlock label="Get a specific block">curl http://localhost:8001/block?index=100</CodeBlock>
              <CodeBlock label="Send with fee">{'./dilithium-cli send --to <address> --amount 10 --fee 0.0001'}</CodeBlock>
              <CodeBlock label="View mempool">curl http://localhost:8001/mempool</CodeBlock>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
